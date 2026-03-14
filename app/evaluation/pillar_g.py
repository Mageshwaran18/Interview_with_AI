"""
Pillar G: Goal Decomposition Pipeline

📚 What this measures:
How well the candidate planned, decomposed the task, and covered
requirements before diving into implementation.

Metrics:
- PPR (Pre-Planning Ratio): Time before first prompt / total duration
- RC (Requirement Coverage): tests_passed / total_tests
- SOS (Subtask Ordering Score): Feature implementation order vs reference DAG
- DDS (Decomposition Depth Score): LLM-as-Judge on first prompts

Aggregate: G = 0.30×DDS + 0.20×PPR + 0.35×RC + 0.15×SOS
"""

from datetime import datetime, timezone
from app.database import events_collection
from app.evaluation.llm_judge import judge_with_voting


# ─── Reference DAG ───
# The ideal subtask dependency order from GUIDE spec (Section 7.3)
# Each tuple is (dependency, dependent) — dependency must come first
REFERENCE_DAG_NODES = [
    "define_schema",
    "implement_book_crud",
    "implement_member_crud",
    "implement_loan_crud",
    "implement_search",
    "implement_overdue_check",
    "implement_borrow_limit",
    "add_error_handling",
]

REFERENCE_EDGES = [
    ("define_schema", "implement_book_crud"),
    ("define_schema", "implement_member_crud"),
    ("implement_book_crud", "implement_loan_crud"),
    ("implement_member_crud", "implement_loan_crud"),
    ("implement_loan_crud", "implement_search"),
    ("implement_loan_crud", "implement_overdue_check"),
    ("implement_loan_crud", "implement_borrow_limit"),
    ("implement_search", "add_error_handling"),
    ("implement_overdue_check", "add_error_handling"),
    ("implement_borrow_limit", "add_error_handling"),
]

# Keywords that map code changes to reference DAG nodes
FEATURE_KEYWORDS = {
    "define_schema": ["__init__", "self.books", "self.members", "self.loans"],
    "implement_book_crud": ["add_book", "delete_book", "update_book", "list_books"],
    "implement_member_crud": ["register_member", "remove_member", "update_member"],
    "implement_loan_crud": ["checkout_book", "return_book", "checkout", "return_book"],
    "implement_search": ["search_by_title", "search_by_author", "search"],
    "implement_overdue_check": ["overdue", "get_overdue", "list_overdue"],
    "implement_borrow_limit": ["borrow_limit", "max_books", ">= 3", "> 3", "len("],
    "add_error_handling": ["raise ", "ValueError", "KeyError", "Exception", "if not"],
}


async def compute_ppr(session_id: str) -> dict:
    """
    Pre-Planning Ratio: How long the candidate waited before
    sending their first prompt to the AI.
    
    PPR = (first_prompt_time - session_start) / total_duration
    Sweet spot: 10-20% → score 100. Outside: penalty.
    """
    # Get SESSION_START
    start_event = events_collection.find_one(
        {"session_id": session_id, "event_type": "SESSION_START"},
        sort=[("timestamp", 1)]
    )
    if not start_event:
        return {"score": 50.0, "ppr_ratio": 0, "reasoning": "No SESSION_START event found"}
    
    # Get first PROMPT event
    first_prompt = events_collection.find_one(
        {"session_id": session_id, "event_type": "PROMPT"},
        sort=[("timestamp", 1)]
    )
    if not first_prompt:
        return {"score": 50.0, "ppr_ratio": 0, "reasoning": "No PROMPT events found"}
    
    # Get SESSION_END or last event
    end_event = events_collection.find_one(
        {"session_id": session_id, "event_type": "SESSION_END"},
        sort=[("timestamp", -1)]
    )
    
    start_time = start_event["timestamp"]
    prompt_time = first_prompt["timestamp"]
    
    if end_event:
        end_time = end_event["timestamp"]
    else:
        # Use last event as proxy
        last_event = events_collection.find_one(
            {"session_id": session_id},
            sort=[("timestamp", -1)]
        )
        end_time = last_event["timestamp"] if last_event else prompt_time
    
    total_duration = (end_time - start_time).total_seconds()
    if total_duration <= 0:
        return {"score": 50.0, "ppr_ratio": 0, "reasoning": "Session too short"}
    
    pre_planning_time = (prompt_time - start_time).total_seconds()
    ppr_ratio = pre_planning_time / total_duration
    
    # Score against sweet spot 10-20%
    # 10-20% → 100, 0% → 40, >30% → decreasing
    if 0.10 <= ppr_ratio <= 0.20:
        score = 100.0
    elif ppr_ratio < 0.10:
        score = max(40.0, 100.0 - (0.10 - ppr_ratio) * 600)
    else:
        score = max(20.0, 100.0 - (ppr_ratio - 0.20) * 200)
    
    return {
        "score": round(score, 1),
        "ppr_ratio": round(ppr_ratio, 4),
        "pre_planning_seconds": round(pre_planning_time, 1),
        "total_duration_seconds": round(total_duration, 1),
    }


async def compute_rc(session_id: str) -> dict:
    """
    Requirement Coverage: tests_passed / total_tests
    from the last TEST_RUN event in the session.
    """
    last_test_run = events_collection.find_one(
        {"session_id": session_id, "event_type": "TEST_RUN"},
        sort=[("timestamp", -1)]
    )
    
    if not last_test_run:
        return {"score": 0.0, "tests_passed": 0, "tests_total": 0, "reasoning": "No test runs found"}
    
    payload = last_test_run.get("payload", {})
    total = payload.get("tests_total", 0)
    passed = payload.get("tests_passed", 0)
    
    if total == 0:
        return {"score": 0.0, "tests_passed": 0, "tests_total": 0, "reasoning": "No tests executed"}
    
    rc = (passed / total) * 100
    
    return {
        "score": round(rc, 1),
        "tests_passed": passed,
        "tests_total": total,
        "tests_failed": payload.get("tests_failed", 0),
    }


async def compute_sos(session_id: str) -> dict:
    """
    Subtask Ordering Score: Check if features were implemented
    in the right dependency order based on the reference DAG.
    
    Start at 100, -10 for each dependency violation.
    """
    code_saves = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "CODE_SAVE"}
        ).sort("timestamp", 1)
    )
    
    if not code_saves:
        return {"score": 50.0, "violations": 0, "reasoning": "No code saves found"}
    
    # Detect which features appeared in which order
    feature_order = []
    seen_features = set()
    
    for save in code_saves:
        payload = save.get("payload", {})
        diff_text = payload.get("diff_text", "")
        full_code = payload.get("full_snapshot", "")
        text_to_check = diff_text + " " + full_code
        
        for feature, keywords in FEATURE_KEYWORDS.items():
            if feature not in seen_features:
                for keyword in keywords:
                    if keyword in text_to_check:
                        feature_order.append(feature)
                        seen_features.add(feature)
                        break
    
    # Check for violations: a dependent feature appearing before its dependency
    violations = 0
    violation_details = []
    
    for dep, dependent in REFERENCE_EDGES:
        if dep in feature_order and dependent in feature_order:
            dep_idx = feature_order.index(dep)
            dependent_idx = feature_order.index(dependent)
            if dependent_idx < dep_idx:
                violations += 1
                violation_details.append(f"{dependent} before {dep}")
    
    score = max(0.0, 100.0 - violations * 10)
    
    return {
        "score": round(score, 1),
        "violations": violations,
        "violation_details": violation_details,
        "features_detected": feature_order,
    }


async def compute_dds(session_id: str) -> dict:
    """
    Decomposition Depth Score: Use LLM-as-Judge to analyze
    the candidate's first 3 prompts and check if they decomposed
    the task into subtasks matching the reference DAG.
    
    DDS = overlapping_nodes / total_reference_nodes
    """
    # Get first 3 PROMPT events
    prompts = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "PROMPT"}
        ).sort("timestamp", 1).limit(3)
    )
    
    if not prompts:
        return {"score": 0.0, "nodes_found": 0, "total_nodes": len(REFERENCE_DAG_NODES),
                "reasoning": "No prompts found"}
    
    prompt_texts = [p.get("payload", {}).get("prompt_text", "") for p in prompts]
    combined = "\n---\n".join(prompt_texts)
    
    judge_prompt = f"""You are an evaluation judge for a coding assessment. The candidate was given a task to build a Library Management System with these subtasks:

Reference subtasks: {', '.join(REFERENCE_DAG_NODES)}

The candidate sent these first prompts to the AI assistant:

{combined}

Analyze the prompts and identify which reference subtasks the candidate is addressing or planning for. 

Return ONLY a JSON object:
{{
    "score": <number from 1-10 representing how well they decomposed the task>,
    "nodes_identified": [<list of matching reference subtask names>],
    "reasoning": "<brief explanation>"
}}"""
    
    result = await judge_with_voting(judge_prompt)
    
    # Compute DDS from identified nodes
    nodes_found = len(result.get("nodes_identified", []))
    dds = (nodes_found / len(REFERENCE_DAG_NODES)) * 100
    
    # Also factor in the judge's qualitative score
    judge_score = result.get("score", 5.0)
    # Blend: 60% node overlap + 40% judge qualitative
    final_score = (dds * 0.6) + (judge_score * 10 * 0.4)
    
    return {
        "score": round(min(100.0, final_score), 1),
        "nodes_found": nodes_found,
        "total_nodes": len(REFERENCE_DAG_NODES),
        "nodes_identified": result.get("nodes_identified", []),
        "judge_score": judge_score,
        "reasoning": result.get("reasoning", ""),
    }


async def compute_g_score(session_id: str) -> dict:
    """
    Aggregate Pillar G score.
    G = 0.30×DDS + 0.20×PPR + 0.35×RC + 0.15×SOS
    """
    ppr = await compute_ppr(session_id)
    rc = await compute_rc(session_id)
    sos = await compute_sos(session_id)
    dds = await compute_dds(session_id)
    
    g_score = (
        0.30 * dds["score"] +
        0.20 * ppr["score"] +
        0.35 * rc["score"] +
        0.15 * sos["score"]
    )
    
    return {
        "pillar": "G",
        "name": "Goal Decomposition",
        "score": round(g_score, 1),
        "sub_metrics": {
            "PPR": ppr,
            "RC": rc,
            "SOS": sos,
            "DDS": dds,
        }
    }
