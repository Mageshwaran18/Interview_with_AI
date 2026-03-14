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
        return {"score": 50.0, "minutes": 0, "reasoning": "No SESSION_START event found"}

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
    Bug Detection Rate: Analyze CODE_SAVE diffs for patterns
    that indicate bug fixes (error corrections, condition fixes,
    return value changes, etc.).

    For the prototype, this uses heuristic detection:
    - Look for diff patterns that suggest corrections
      (e.g., removing wrong logic, fixing conditions)
    - Score based on proportion of saves that include fixes

    ⚠️ Full implementation in Phase 5 will use seeded bugs in
    the starter code and check if they were specifically fixed.
    """
    code_saves = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "CODE_SAVE"}
        ).sort("timestamp", 1)
    )

    if not code_saves:
        return {
            "score": 50.0,
            "bugs_detected": 0,
            "total_saves": 0,
            "reasoning": "No code saves found — using neutral score"
        }

    # Heuristic: look for correction patterns in diffs
    bug_fix_indicators = [
        "fix", "bug", "error", "correct", "wrong", "typo",
        "was", "should be", "instead of",
    ]

    # Also look for structural corrections in diff text
    correction_patterns = [
        "-    ",   # Lines removed (potential fix)
        "+    if ", # Adding guard conditions
        "+    raise", # Adding error handling
        "+    return", # Adding missing returns
        "+    except", # Adding exception handling
    ]

    saves_with_fixes = 0

    for save in code_saves:
        payload = save.get("payload", {})
        diff_text = payload.get("diff_text", "").lower()

        if not diff_text:
            continue

        is_fix = False

        # Check for bug-fix keywords in diff
        for indicator in bug_fix_indicators:
            if indicator in diff_text:
                is_fix = True
                break

        # Check for structural correction patterns
        if not is_fix:
            for pattern in correction_patterns:
                if pattern.lower() in diff_text:
                    is_fix = True
                    break

        if is_fix:
            saves_with_fixes += 1

    total_saves = len(code_saves)

    if total_saves == 0:
        return {
            "score": 50.0,
            "bugs_detected": 0,
            "total_saves": 0,
            "reasoning": "No code saves to analyze"
        }

    # A moderate fix rate is good — too many fixes might mean messy code
    # Score via sweet spot: 10-30% of saves being fixes → 100
    fix_rate = saves_with_fixes / total_saves

    if 0.10 <= fix_rate <= 0.30:
        score = 100.0
    elif fix_rate < 0.10:
        # Few fixes detected — could mean no bugs found or not fixing
        score = max(30.0, 50.0 + fix_rate * 500)
    else:
        # Too many fixes — diminishing returns
        score = max(40.0, 100.0 - (fix_rate - 0.30) * 100)

    return {
        "score": round(score, 1),
        "bugs_detected": saves_with_fixes,
        "total_saves": total_saves,
        "fix_rate": round(fix_rate, 4),
        "reasoning": "Heuristic detection — Phase 5 will use seeded bugs",
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
            "score": 50.0,
            "rollbacks_detected": 0,
            "total_save_pairs": 0,
            "reasoning": "Not enough code saves for hallucination detection — using neutral score"
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
