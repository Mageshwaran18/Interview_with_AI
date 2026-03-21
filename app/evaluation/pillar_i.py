"""
Pillar I: Iteration & Refinement Pipeline

📚 What this measures:
How well the candidate iterates on feedback — error recovery,
AI output acceptance patterns, and regression avoidance.

Metrics:
- ERS (Error Recovery Speed): turns to fix after failed test
- AR (Acceptance Rate): ratio of AI outputs accepted as-is
- RR (Regression Rate): 1 - regressions/fixes from test sequences
"""

from difflib import SequenceMatcher
from app.database import events_collection


async def compute_ers(session_id: str) -> dict:
    """
    Error Recovery Speed: When a test run fails, how many prompts
    does the candidate need before the next passing test?
    
    ERS = 1 / avg_turns_to_fix, normalized against 3-turn benchmark.
    """
    test_runs = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "TEST_RUN"}
        ).sort("timestamp", 1)
    )
    
    if len(test_runs) < 2:
        return {"score": 50.0, "avg_turns": 0, "recovery_episodes": 0,
                "reasoning": "Not enough test runs to measure recovery"}
    
    # Get all events chronologically for counting prompts between tests
    all_events = list(
        events_collection.find(
            {"session_id": session_id}
        ).sort("timestamp", 1)
    )
    
    # Find recovery episodes: failed test → next improved/passing test
    recovery_turns = []
    
    for i in range(len(test_runs) - 1):
        current = test_runs[i]
        next_run = test_runs[i + 1]
        
        current_failed = current.get("payload", {}).get("tests_failed", 0)
        next_failed = next_run.get("payload", {}).get("tests_failed", 0)
        
        # Only count if current had failures and next improved
        if current_failed > 0 and next_failed < current_failed:
            # Count PROMPT events between these two test runs
            current_time = current["timestamp"]
            next_time = next_run["timestamp"]
            
            prompts_between = sum(
                1 for e in all_events
                if e["event_type"] == "PROMPT"
                and current_time < e["timestamp"] < next_time
            )
            
            recovery_turns.append(prompts_between)
    
    if not recovery_turns:
        return {"score": 50.0, "avg_turns": 0, "recovery_episodes": 0,
                "reasoning": "No recovery episodes detected"}
    
    avg_turns = sum(recovery_turns) / len(recovery_turns)
    
    # Normalize against 3-turn benchmark
    # 1 turn → 100, 3 turns → 70, 6+ turns → low
    if avg_turns <= 1:
        score = 100.0
    elif avg_turns <= 3:
        score = 100.0 - (avg_turns - 1) * 15
    else:
        score = max(10.0, 70.0 - (avg_turns - 3) * 10)
    
    return {
        "score": round(score, 1),
        "avg_turns": round(avg_turns, 2),
        "recovery_episodes": len(recovery_turns),
        "turn_details": recovery_turns,
    }


async def compute_ar(session_id: str) -> dict:
    """
    Acceptance Rate: For each RESPONSE, check if the next CODE_SAVE
    shows < 10% change from the AI-generated code. If so, "accepted."
    
    Score via tent function: peak at 55% (ideal blend of using AI
    but also thinking independently).
    AR < 20%: too independent (not using AI)
    AR > 90%: blind acceptance (red flag)
    AR ≈ 55%: sweet spot
    """
    responses = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "RESPONSE"}
        ).sort("timestamp", 1)
    )
    
    code_saves = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "CODE_SAVE"}
        ).sort("timestamp", 1)
    )
    
    if not responses or not code_saves:
        return {"score": 0.0, "ar_ratio": 0, "accepted": 0, "total": 0,
                "reasoning": "Insufficient engagement to assess iteration quality"}
    
    accepted = 0
    total_evaluated = 0
    
    for resp in responses:
        resp_time = resp["timestamp"]
        resp_text = resp.get("payload", {}).get("response_text", "")
        
        if not resp_text or len(resp_text) < 20:
            continue
        
        # Find the next CODE_SAVE after this response
        next_save = None
        for save in code_saves:
            if save["timestamp"] > resp_time:
                next_save = save
                break
        
        if not next_save:
            continue
        
        total_evaluated += 1
        
        # Check how much of the AI response appears in the saved code
        save_snapshot = next_save.get("payload", {}).get("full_snapshot", "")
        
        # Extract code blocks from AI response
        code_in_response = ""
        if "```" in resp_text:
            parts = resp_text.split("```")
            for i in range(1, len(parts), 2):
                code_block = parts[i]
                # Remove language identifier if present
                if code_block.startswith("python\n"):
                    code_block = code_block[7:]
                elif code_block.startswith("py\n"):
                    code_block = code_block[3:]
                code_in_response += code_block
        
        if not code_in_response:
            # No code block in response — skip
            continue
        
        # Check similarity between AI code and saved code
        similarity = SequenceMatcher(
            None,
            code_in_response.strip().lower(),
            save_snapshot.strip().lower()
        ).ratio()
        
        # If >75% of AI code appears in save → accepted as-is
        # This is a professional threshold that prevents low-quality copies
        if similarity > 0.75:
            accepted += 1
    
    if total_evaluated == 0:
        return {"score": 0.0, "ar_ratio": 0, "accepted": 0, "total": 0,
                "reasoning": "No AI responses found to evaluate acceptance"}
    
    ar = accepted / total_evaluated
    
    # Tent function: peak at 0.55
    # 0.55 → 100, 0.20 → 40, 0.90 → 40
    if ar <= 0.55:
        score = max(20.0, 40.0 + (ar / 0.55) * 60.0)
    else:
        score = max(20.0, 100.0 - ((ar - 0.55) / 0.45) * 60.0)
    
    return {
        "score": round(score, 1),
        "ar_ratio": round(ar, 4),
        "accepted": accepted,
        "total": total_evaluated,
    }


async def compute_rr(session_id: str) -> dict:
    """
    Regression Rate: After a fix (passing tests go up), check if
    the next test run introduces new failures.
    
    RR = 1 - (regressions / fixes)
    """
    test_runs = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "TEST_RUN"}
        ).sort("timestamp", 1)
    )
    
    if len(test_runs) < 3:
        return {"score": 70.0, "rr_ratio": 0.7, "regressions": 0, "fixes": 0,
                "reasoning": "Not enough test runs for regression analysis"}
    
    fixes = 0
    regressions = 0
    
    for i in range(1, len(test_runs) - 1):
        prev = test_runs[i - 1].get("payload", {})
        curr = test_runs[i].get("payload", {})
        next_run = test_runs[i + 1].get("payload", {})
        
        prev_passed = prev.get("tests_passed", 0)
        curr_passed = curr.get("tests_passed", 0)
        next_passed = next_run.get("tests_passed", 0)
        
        # A fix: current run passes more tests than previous
        if curr_passed > prev_passed:
            fixes += 1
            
            # A regression: next run passes fewer tests than current
            if next_passed < curr_passed:
                regressions += 1
    
    if fixes == 0:
        return {"score": 70.0, "rr_ratio": 0.7, "regressions": 0, "fixes": 0,
                "reasoning": "No fix episodes detected"}
    
    rr = 1 - (regressions / fixes)
    score = rr * 100
    
    return {
        "score": round(score, 1),
        "rr_ratio": round(rr, 4),
        "regressions": regressions,
        "fixes": fixes,
    }


async def compute_i_score(session_id: str) -> dict:
    """
    Aggregate Pillar I score.
    I = 0.40×ERS + 0.35×AR + 0.25×RR
    """
    ers = await compute_ers(session_id)
    ar = await compute_ar(session_id)
    rr = await compute_rr(session_id)
    
    i_score = (
        0.40 * ers["score"] +
        0.35 * ar["score"] +
        0.25 * rr["score"]
    )
    
    return {
        "pillar": "I",
        "name": "Iteration & Refinement",
        "score": round(i_score, 1),
        "sub_metrics": {
            "ERS": ers,
            "AR": ar,
            "RR": rr,
        }
    }
