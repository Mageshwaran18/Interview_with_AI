"""
Minimum Effort Validator — Professional-Grade Standards

This module enforces minimum effort thresholds to prevent 
passing grades without real work. If effort is insufficient,
affected pillar scores default to 0.

MINIMUM THRESHOLDS (Professional Standards):
- G (Goal): At least 1 prompt required (shows engagement)
- U (Usage): At least 5 prompts required (shows multi-turn thinking)
- I (Iteration): At least 2 test runs required (shows refinement attempts)
- D (Detection): At least 1 test run required (validation is mandatory)
- E (End Result): Evaluated only after other checks pass

These are NOT suggestions — they are enforcement gates.
"""

from app.database import events_collection


def count_events_by_type(session_id: str, event_type: str) -> int:
    """Count occurrences of an event type in a session."""
    return events_collection.count_documents({
        "session_id": session_id,
        "event_type": event_type
    })


def count_unique_attempts(session_id: str, event_type: str, field_path: str = None) -> int:
    """
    Count unique attempts for an metric.
    E.g., unique function tests, unique prompts by content, etc.
    """
    events = list(events_collection.find({
        "session_id": session_id,
        "event_type": event_type
    }))
    
    if field_path:
        seen = set()
        for event in events:
            try:
                payload = event.get("payload", {})
                value = payload.get(field_path, "")
                if value:
                    seen.add(str(value)[:200])  # Truncate for hashing
            except Exception:
                pass
        return len(seen)
    
    return len(events)


async def validate_minimum_effort(session_id: str) -> dict:
    """
    Validate that session meets minimum effort thresholds.
    
    Returns:
        {
            "passes_validation": bool,
            "violations": [list of threshold violations],
            "penalties": {pillar: penalty_config}
        }
    """
    violations = []
    penalties = {}
    
    # --- PILLAR G: At least 1 prompt needed ---
    prompt_count = count_events_by_type(session_id, "PROMPT")
    if prompt_count < 1:
        violations.append("G: No prompts sent (minimum 1 required)")
        penalties["G"] = {"zero_score": True, "reason": "No engagement with AI"}
    
    # --- PILLAR U: At least 5 prompts for usage efficiency evaluation ---
    if prompt_count < 5:
        violations.append(f"U: Only {prompt_count} prompts (minimum 5 required for usage analysis)")
        penalties["U"] = {"zero_score": True, "reason": "Insufficient multi-turn interaction"}
    
    # --- PILLAR I: At least 2 test runs for iteration assessment ---
    test_count = count_events_by_type(session_id, "TEST_RUN")
    if test_count < 2:
        violations.append(f"I: Only {test_count} test run(s) (minimum 2 required)")
        penalties["I"] = {"zero_score": True, "reason": "No iterative refinement demonstrated"}
    
    # --- PILLAR D: At least 1 test run for detection/validation ---
    if test_count < 1:
        violations.append("D: No test runs (validation is mandatory)")
        penalties["D"] = {"zero_score": True, "reason": "No validation attempts"}
    
    # --- PILLAR E: At least 1 code save required ---
    code_save_count = count_events_by_type(session_id, "CODE_SAVE")
    if code_save_count < 1:
        violations.append("E: No code implementation")
        penalties["E"] = {"zero_score": True, "reason": "No code submitted"}
    
    # --- SESSION VALIDITY: Minimum 30 seconds of engagement ---
    session_start = events_collection.find_one({
        "session_id": session_id,
        "event_type": "SESSION_START"
    }, sort=[("timestamp", 1)])
    
    last_event = events_collection.find_one({
        "session_id": session_id
    }, sort=[("timestamp", -1)])
    
    if session_start and last_event:
        duration_seconds = (last_event["timestamp"] - session_start["timestamp"]).total_seconds()
        if duration_seconds < 30:
            violations.append(f"Session too brief ({duration_seconds:.0f}s, minimum 30s)")
            # Mark all pillars for penalty
            penalties["all"] = {"zero_score": True, "reason": "Insufficient engagement"}
    
    passes_validation = len(violations) == 0
    
    return {
        "passes_validation": passes_validation,
        "violation_count": len(violations),
        "violations": violations,
        "penalties": penalties,
        "prompt_count": prompt_count,
        "test_count": test_count,
        "code_save_count": code_save_count,
    }


async def apply_minimum_effort_penalties(pillar_scores: dict, penalties: dict) -> dict:
    """
    Apply penalties to pillar scores based on minimum effort validation.
    
    Args:
        pillar_scores: {pillar_id: score} dict
        penalties: penalties dict from validate_minimum_effort()
        
    Returns:
        Modified pillar_scores dict with penalties applied
    """
    modified_scores = pillar_scores.copy()
    
    # Check for blanket penalties
    if "all" in penalties and penalties["all"].get("zero_score"):
        for pillar in ["G", "U", "I", "D", "E"]:
            modified_scores[pillar] = 0.0
        return modified_scores
    
    # Apply individual pillar penalties
    for pillar, penalty_config in penalties.items():
        if penalty_config.get("zero_score") and pillar in modified_scores:
            modified_scores[pillar] = 0.0
    
    return modified_scores


def get_minimum_effort_report(session_id: str, validation_result: dict) -> dict:
    """
    Generate a human-readable report explaining why minimum effort was not met.
    """
    report = {
        "status": "PASS" if validation_result["passes_validation"] else "FAIL",
        "violations": validation_result["violations"],
        "metrics": {
            "prompts_sent": validation_result["prompt_count"],
            "prompts_required": 5,
            "test_runs": validation_result["test_count"],
            "test_runs_required": 2,
            "code_saves": validation_result["code_save_count"],
            "code_saves_required": 1,
        },
        "interpretation": ""
    }
    
    if validation_result["passes_validation"]:
        report["interpretation"] = "Session meets all minimum effort requirements. Evaluation proceeds normally."
    else:
        penalties = validation_result["penalties"]
        affected_pillars = list(penalties.keys())
        report["interpretation"] = f"Session fails minimum effort thresholds. Pillars {affected_pillars} will receive 0 scores. Violations: {'; '.join(validation_result['violations'])}"
    
    return report
