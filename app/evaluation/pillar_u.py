"""
Pillar U: Usage Efficiency Pipeline

📚 What this measures:
How effectively the candidate uses the AI assistant — prompt quality,
context awareness, and efficiency of the AI collaboration.

Metrics:
- PSS (Prompt Specificity Score): LLM-as-Judge on prompt quality
- PPF (Prompts-per-Feature): efficiency of prompts vs features built
- CIR (Context Injection Rate): do prompts reference own code?
- RP (Redundancy Penalty): penalize repetitive prompts
- TER (Token Efficiency Ratio): useful output / total input tokens
"""

from difflib import SequenceMatcher
from app.database import events_collection
from app.evaluation.llm_judge import judge_with_voting


async def compute_pss(session_id: str) -> dict:
    """
    Prompt Specificity Score: LLM-as-Judge rates each prompt
    on clarity, context richness, and actionability (1-10 each).
    
    For efficiency, samples up to 5 prompts instead of all.
    """
    prompts = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "PROMPT"}
        ).sort("timestamp", 1)
    )
    
    if not prompts:
        return {"score": 0.0, "avg_score": 0, "prompts_evaluated": 0,
                "reasoning": "No prompts found"}
    
    # Sample up to 5 prompts for efficiency
    sample_size = min(5, len(prompts))
    step = max(1, len(prompts) // sample_size)
    sampled = [prompts[i] for i in range(0, len(prompts), step)][:sample_size]
    
    total_score = 0.0
    evaluations = []
    
    for p in sampled:
        prompt_text = p.get("payload", {}).get("prompt_text", "")
        if not prompt_text:
            continue
            
        judge_prompt = f"""You are evaluating the quality of a prompt sent by a software engineer to an AI coding assistant during a Library Management System coding task.

Prompt: "{prompt_text}"

Rate this prompt from 1-10 on each dimension:
(a) Constraint clarity — Does it specify what the output should look like?
(b) Context richness — Does it provide relevant background or code context?
(c) Actionability — Is it clear what the AI should do?

Examples:
- Score 3: "how do I do this?" (vague, no context)
- Score 5: "how do I search books?" (some intent, missing details)  
- Score 7: "implement search_by_title that takes a query string and returns books where query matches title case-insensitively" (clear, specific)
- Score 9: "I have a Library class with self.books dict. Implement search_by_author(self, query) that returns list of books where query.lower() is in author.lower()" (constraints, context, actionable)

Return ONLY a JSON object:
{{"score_a": <1-10>, "score_b": <1-10>, "score_c": <1-10>, "score": <average of a,b,c>, "reasoning": "<brief>"}}"""
        
        result = await judge_with_voting(judge_prompt)
        avg = result.get("score", 5.0)
        total_score += avg
        evaluations.append({"prompt": prompt_text[:100], "score": avg})
    
    if not evaluations:
        return {"score": 50.0, "avg_score": 5.0, "prompts_evaluated": 0,
                "reasoning": "No prompts could be evaluated"}
    
    avg_score = total_score / len(evaluations)
    normalized = (avg_score / 10.0) * 100  # Convert 1-10 to 0-100
    
    return {
        "score": round(min(100.0, normalized), 1),
        "avg_score": round(avg_score, 2),
        "prompts_evaluated": len(evaluations),
        "total_prompts": len(prompts),
        "evaluations": evaluations,
    }


async def compute_ppf(session_id: str) -> dict:
    """
    Prompts-per-Feature: total prompts / features implemented.
    Compare to benchmark range 1.5-2.5 (sweet spot).
    """
    total_prompts = events_collection.count_documents(
        {"session_id": session_id, "event_type": "PROMPT"}
    )
    
    # Determine features implemented from last test run
    last_test = events_collection.find_one(
        {"session_id": session_id, "event_type": "TEST_RUN"},
        sort=[("timestamp", -1)]
    )
    
    # Estimate features from test results (6 requirement categories)
    if last_test:
        payload = last_test.get("payload", {})
        tests_passed = payload.get("tests_passed", 0)
        total_tests = payload.get("tests_total", 13)
        # Each feature has ~2 tests, so features ≈ tests_passed / 2
        features = max(1, round(tests_passed / 2))
    else:
        features = 1
    
    if total_prompts == 0:
        return {"score": 50.0, "ppf_ratio": 0, "reasoning": "No prompts found"}
    
    ppf = total_prompts / features
    
    # Score against benchmark 1.5-2.5
    if 1.5 <= ppf <= 2.5:
        score = 100.0
    elif ppf < 1.5:
        # Too few prompts per feature — might not be using AI effectively
        score = max(40.0, 100.0 - (1.5 - ppf) * 40)
    else:
        # Too many prompts — inefficient
        score = max(20.0, 100.0 - (ppf - 2.5) * 15)
    
    return {
        "score": round(score, 1),
        "ppf_ratio": round(ppf, 2),
        "total_prompts": total_prompts,
        "features_implemented": features,
    }


async def compute_cir(session_id: str) -> dict:
    """
    Context Injection Rate: How often the candidate references
    their own code (class names, function names, variables)
    in their prompts. Target > 70%.
    """
    prompts = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "PROMPT"}
        ).sort("timestamp", 1)
    )
    
    if not prompts:
        return {"score": 0.0, "ppf_ratio": 0, "reasoning": "No prompts sent"}
    
    # Get the latest code snapshot for reference identifiers
    last_code_save = events_collection.find_one(
        {"session_id": session_id, "event_type": "CODE_SAVE"},
        sort=[("timestamp", -1)]
    )
    
    # Extract code identifiers from the code
    code_identifiers = set()
    if last_code_save:
        code = last_code_save.get("payload", {}).get("full_snapshot", "")
        # Extract class names, function names, variable names
        import re
        code_identifiers.update(re.findall(r'class\s+(\w+)', code))
        code_identifiers.update(re.findall(r'def\s+(\w+)', code))
        code_identifiers.update(re.findall(r'self\.(\w+)', code))
    
    # Common Library Management terms that show context awareness
    domain_terms = {
        "library", "book", "member", "loan", "checkout", "return",
        "isbn", "overdue", "search", "borrow", "quantity", "title",
        "author", "add_book", "register_member", "self.books",
    }
    code_identifiers.update(domain_terms)
    
    # Discard trivially short identifiers
    code_identifiers = {id for id in code_identifiers if len(id) > 2}
    
    prompts_with_context = 0
    total = len(prompts)
    
    for p in prompts:
        prompt_text = p.get("payload", {}).get("prompt_text", "").lower()
        if any(identifier.lower() in prompt_text for identifier in code_identifiers):
            prompts_with_context += 1
    
    cir = prompts_with_context / total if total > 0 else 0
    
    # Score: target > 70%
    if cir >= 0.70:
        score = 100.0
    else:
        score = (cir / 0.70) * 100.0
    
    return {
        "score": round(score, 1),
        "cir_ratio": round(cir, 4),
        "prompts_with_context": prompts_with_context,
        "total_prompts": total,
    }


async def compute_rp(session_id: str) -> dict:
    """
    Redundancy Penalty: Check consecutive prompt pairs for high
    similarity. If > 0.85 SequenceMatcher ratio, flag as redundant.
    RP = 1 - (redundant_count / total_prompts)
    
    Uses difflib.SequenceMatcher instead of sentence-transformers
    to avoid heavy ML dependencies.
    """
    prompts = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "PROMPT"}
        ).sort("timestamp", 1)
    )
    
    if len(prompts) < 2:
        return {"score": 100.0, "redundant_count": 0, "total_prompts": len(prompts),
                "reasoning": "Not enough prompts for redundancy check"}
    
    redundant_count = 0
    redundant_pairs = []
    
    for i in range(1, len(prompts)):
        prev_text = prompts[i-1].get("payload", {}).get("prompt_text", "")
        curr_text = prompts[i].get("payload", {}).get("prompt_text", "")
        
        similarity = SequenceMatcher(None, prev_text.lower(), curr_text.lower()).ratio()
        
        if similarity > 0.85:
            redundant_count += 1
            redundant_pairs.append({
                "pair_index": i,
                "similarity": round(similarity, 3),
                "prompt_a": prev_text[:60],
                "prompt_b": curr_text[:60],
            })
    
    rp = 1 - (redundant_count / len(prompts)) if len(prompts) > 0 else 1
    score = rp * 100
    
    return {
        "score": round(score, 1),
        "rp_ratio": round(rp, 4),
        "redundant_count": redundant_count,
        "total_prompts": len(prompts),
        "redundant_pairs": redundant_pairs[:5],  # Limit detail output
    }


async def compute_ter(session_id: str) -> dict:
    """
    Token Efficiency Ratio: useful output tokens / total input tokens.
    Higher means the AI generated more useful output per token spent.
    """
    prompts = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "PROMPT"}
        ).sort("timestamp", 1)
    )
    responses = list(
        events_collection.find(
            {"session_id": session_id, "event_type": "RESPONSE"}
        ).sort("timestamp", 1)
    )
    
    total_input_tokens = 0
    total_output_tokens = 0
    
    for p in prompts:
        payload = p.get("payload", {})
        total_input_tokens += payload.get("token_in", 0)
    
    for r in responses:
        payload = r.get("payload", {})
        total_output_tokens += payload.get("token_out", 0)
    
    if total_input_tokens == 0:
        return {"score": 50.0, "ter_ratio": 0, "reasoning": "No token data"}
    
    ter = total_output_tokens / total_input_tokens
    
    # Normalize: TER of 2.0+ is excellent, 0.5 is poor
    # Score: TER=2.0 → 100, TER=1.0 → 70, TER=0.5 → 40
    if ter >= 2.0:
        score = 100.0
    elif ter >= 1.0:
        score = 70.0 + (ter - 1.0) * 30.0
    elif ter >= 0.5:
        score = 40.0 + (ter - 0.5) * 60.0
    else:
        score = max(10.0, ter * 80.0)
    
    return {
        "score": round(score, 1),
        "ter_ratio": round(ter, 4),
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
    }


async def compute_u_score(session_id: str) -> dict:
    """
    Aggregate Pillar U score.
    Equal weighting: each metric contributes 20%.
    """
    pss = await compute_pss(session_id)
    ppf = await compute_ppf(session_id)
    cir = await compute_cir(session_id)
    rp = await compute_rp(session_id)
    ter = await compute_ter(session_id)
    
    u_score = (
        0.25 * pss["score"] +
        0.20 * ppf["score"] +
        0.20 * cir["score"] +
        0.20 * rp["score"] +
        0.15 * ter["score"]
    )
    
    return {
        "pillar": "U",
        "name": "Usage Efficiency",
        "score": round(u_score, 1),
        "sub_metrics": {
            "PSS": pss,
            "PPF": ppf,
            "CIR": cir,
            "RP": rp,
            "TER": ter,
        }
    }
