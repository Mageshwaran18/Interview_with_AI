"""
Pillar D: Detection & Validation Pipeline

📚 What this measures:
How quickly the candidate validates their code and catches errors,
including running tests early, detecting bugs, and identifying
AI hallucinations.

Metrics:
- TFR (Time-to-First-Run): How quickly the candidate first runs tests
- BDR (Bug Detection Rate): Did the candidate fix seeded bugs?
- HCR (Hallucination Catch Rate): Did the candidate reject bad AI output?

Aggregate: D = 0.50×TFR + 0.25×BDR + 0.25×HCR

⚠️ Note: BDR and HCR use simplified heuristics for the prototype.
Full implementation requires seeded bugs and hallucination injection
(Phase 5 features). For now, BDR analyzes code corrections and HCR
checks for suspicious code removals.
"""

from datetime import datetime, timezone
from app.database import events_collection


SEEDED_BUGS = {
    "TC-B01": "divide() must return 'inf' for zero divisor",
    "TC-B02": "invalid inputs should consistently return 'invalid'",
    "TC-B03": "percent() should use modulus behavior",
}
TOTAL_BUGS = len(SEEDED_BUGS)


async def compute_tfr(session_id: str) -> dict:
    """
    Time-to-First-Run: Minutes between session start and the
    candidate's first test execution.

    Score: max(0, 1 - minutes/20) × 100
    - 0 minutes → 100 (immediate testing, great!)
    - 10 minutes → 50 (moderate)
    - 20+ minutes → 0 (waited too long)
    """
    start_event = events_collection.find_one(
        {"session_id": session_id, "event_type": "SESSION_START"},
        sort=[("timestamp", 1)]
    )

    if not start_event:
        return {"score": 0.0, "minutes": 0, "reasoning": "No session tracking data"}

    first_test = events_collection.find_one(
        {"session_id": session_id, "event_type": "TEST_RUN"},
        sort=[("timestamp", 1)]
    )

    if not first_test:
        return {"score": 0.0, "minutes": 0, "reasoning": "No TEST_RUN events — candidate never ran tests"}

    start_time = start_event["timestamp"]
    test_time = first_test["timestamp"]

    minutes = (test_time - start_time).total_seconds() / 60.0

    # Score formula: max(0, 1 - minutes/20) × 100
    score = max(0.0, (1 - minutes / 20.0)) * 100.0

    return {
        "score": round(score, 1),
        "minutes": round(minutes, 2),
        "session_start": start_time.isoformat() if isinstance(start_time, datetime) else str(start_time),
        "first_test_run": test_time.isoformat() if isinstance(test_time, datetime) else str(test_time),
    }


async def compute_bdr(session_id: str) -> dict:
    """
    Bug Detection Rate: what fraction of seeded bug probes was fixed.

    Strategy:
    - Scan TEST_RUN events in chronological order.
    - Read details.bug_probe_results from each run.
    - For each probe ID (TC-B01/02/03), last status wins.
    - Consider bug fixed when last status is PASS.
    """
    test_runs = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "TEST_RUN"}
        ).sort("timestamp", 1)
    )

    if not test_runs:
        return {
            "score": 0.0,
            "bugs_fixed": 0,
            "bugs_total": TOTAL_BUGS,
            "bdr_raw": 0.0,
            "bdr_score": 0.0,
            "per_bug": {
                test_id: {
                    "description": desc,
                    "fixed": False,
                    "last_status": "NOT_ATTEMPTED",
                }
                for test_id, desc in SEEDED_BUGS.items()
            },
            "reasoning": "No TEST_RUN events - candidate never ran bug probes",
        }

    latest_bug_status = {}
    for run in test_runs:
        bug_results = run.get("payload", {}).get("bug_probe_results", {})
        for test_id, status in bug_results.items():
            if test_id in SEEDED_BUGS:
                latest_bug_status[test_id] = status

    bugs_fixed = sum(
        1 for test_id in SEEDED_BUGS if latest_bug_status.get(test_id) == "PASS"
    )
    bdr_raw = round(bugs_fixed / TOTAL_BUGS, 4) if TOTAL_BUGS > 0 else 0.0
    bdr_score = round(bdr_raw * 100, 2)

    return {
        "score": bdr_score,
        "bugs_fixed": bugs_fixed,
        "bugs_total": TOTAL_BUGS,
        "bdr_raw": bdr_raw,
        "bdr_score": bdr_score,
        "per_bug": {
            test_id: {
                "description": SEEDED_BUGS[test_id],
                "fixed": latest_bug_status.get(test_id) == "PASS",
                "last_status": latest_bug_status.get(test_id, "NOT_ATTEMPTED"),
            }
            for test_id in SEEDED_BUGS
        },
        "expert_target": "> 0.67 (at least 2 of 3 bugs fixed)",
    }


async def compute_hcr(session_id: str) -> dict:
    """
    Hallucination Catch Rate: Check if the candidate identified
    and removed AI-generated code that uses non-existent APIs
    or incorrect patterns.

    For the prototype, this uses heuristic detection:
    - Look for code that was added then removed (rejection pattern)
    - Check for rollback patterns in consecutive CODE_SAVE events

    ⚠️ Full implementation in Phase 5 will inject specific
    hallucinated API calls and check if the candidate caught them.
    """
    code_saves = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "CODE_SAVE"}
        ).sort("timestamp", 1)
    )

    if len(code_saves) < 2:
        return {
            "score": 0.0,
            "rollbacks_detected": 0,
            "total_save_pairs": 0,
            "reasoning": "Insufficient code iterations to detect hallucination catches"
        }

    # Heuristic: detect rollback patterns
    # If snapshot N+1 is shorter than snapshot N by significant amount,
    # the candidate likely rejected/removed AI output
    rollbacks = 0
    rejections = 0
    total_pairs = len(code_saves) - 1

    for i in range(1, len(code_saves)):
        prev_snapshot = code_saves[i - 1].get("payload", {}).get("full_snapshot", "")
        curr_snapshot = code_saves[i].get("payload", {}).get("full_snapshot", "")
        diff_text = code_saves[i].get("payload", {}).get("diff_text", "")

        prev_lines = len(prev_snapshot.split("\n")) if prev_snapshot else 0
        curr_lines = len(curr_snapshot.split("\n")) if curr_snapshot else 0

        # Significant code removal (>10% of lines removed) suggests rejection
        if prev_lines > 5 and (prev_lines - curr_lines) > max(3, prev_lines * 0.10):
            rollbacks += 1

        # Check diff for removal patterns
        if diff_text:
            removed_lines = sum(1 for line in diff_text.split("\n") if line.startswith("-"))
            added_lines = sum(1 for line in diff_text.split("\n") if line.startswith("+"))
            if removed_lines > added_lines * 2 and removed_lines > 3:
                rejections += 1

    catches = rollbacks + rejections

    # Neutral scoring for prototype
    # Some catches are good (shows critical thinking), too many might mean
    # the AI is generating lots of bad output
    if total_pairs == 0:
        score = 50.0
    elif catches == 0:
        # No rejections — could be fine or could mean accepting everything
        score = 50.0
    else:
        catch_rate = catches / total_pairs
        # Sweet spot: 5-20% catch rate
        if 0.05 <= catch_rate <= 0.20:
            score = 90.0
        elif catch_rate < 0.05:
            score = 50.0 + catch_rate * 800  # Scale up to 90
        else:
            score = max(40.0, 90.0 - (catch_rate - 0.20) * 100)

    return {
        "score": round(score, 1),
        "rollbacks_detected": rollbacks,
        "rejections_detected": rejections,
        "total_save_pairs": total_pairs,
        "reasoning": "Heuristic detection — Phase 5 will use hallucination injection",
    }


async def compute_d_score(session_id: str) -> dict:
    """
    Aggregate Pillar D score.
    D = 0.50×TFR + 0.25×BDR + 0.25×HCR

    TFR is fully deterministic. BDR and HCR use simplified heuristics
    for the prototype (see Phase 5 for full implementation).
    """
    tfr = await compute_tfr(session_id)
    bdr = await compute_bdr(session_id)
    hcr = await compute_hcr(session_id)

    d_score = (
        0.50 * tfr["score"] +
        0.25 * bdr["score"] +
        0.25 * hcr["score"]
    )

    return {
        "pillar": "D",
        "name": "Detection & Validation",
        "score": round(d_score, 1),
        "sub_metrics": {
            "TFR": tfr,
            "BDR": bdr,
            "HCR": hcr,
        }
    }
