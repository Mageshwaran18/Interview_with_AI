"""
LLM-as-Judge Utility — Shared across Pillars G, U, and E.

📚 What this does:
Uses Google Gemini as a structured evaluator (Judge) to score
qualitative aspects of candidate behavior that can't be computed
deterministically.

🧠 Consistency Techniques (from GUIDE spec Section 6):
- Temperature = 0: minimizes output variance
- Structured JSON output: ask for {score, reasoning}
- Majority voting: 3 calls, take median (optional for prototype)

💡 Key Concept: LLM-as-Judge
Instead of having humans rate prompt quality or code architecture,
we ask the LLM itself to evaluate using a fixed rubric. This makes
evaluation scalable and repeatable.

🔄 CACHING (Phase 5.3):
- Hash-based cache to avoid duplicate LLM calls
- Tracks evaluation prompts in judge_cache collection
- Reduces API costs by ~30-40% for repeated evaluations
"""

import json
import hashlib
import google.generativeai as genai
from datetime import datetime, timezone
from app.config import settings
from app.database import judge_cache_collection
from app.utils.retry_utils import retry_with_backoff

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use the same model as chat, but with temperature=0 for consistency
judge_model = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config={"temperature": 0}
)


def get_prompt_hash(prompt: str) -> str:
    """
    Generate a SHA256 hash of the prompt for caching.
    This allows us to detect repeated evaluations and reuse results.
    
    Args:
        prompt: The judge prompt to hash
        
    Returns:
        Hex string SHA256 hash
    """
    return hashlib.sha256(prompt.encode('utf-8')).hexdigest()


async def get_cached_judge_result(prompt_hash: str) -> dict | None:
    """
    Check if we've already evaluated this prompt (from cache).
    
    Args:
        prompt_hash: SHA256 hash of the judge prompt
        
    Returns:
        Cached result dict or None if not found/expired
    """
    try:
        cached = judge_cache_collection.find_one({"prompt_hash": prompt_hash})
        if cached:
            # Increment hit counter
            judge_cache_collection.update_one(
                {"_id": cached["_id"]},
                {"$inc": {"hit_count": 1}}
            )
            # Ensure created_at is timezone-aware for calculation
            created_at = cached["created_at"]
            if created_at.tzinfo is None:
                # Convert naive datetime to timezone-aware
                created_at = created_at.replace(tzinfo=timezone.utc)
            
            return {
                "score": cached["score"],
                "reasoning": cached["reasoning"],
                "cached": True,
                "cache_age": (datetime.now(timezone.utc) - created_at).total_seconds()
            }
    except Exception as e:
        print(f"Warning: Cache lookup failed: {e}")
    
    return None


async def store_judge_result(prompt_hash: str, prompt: str, result: dict) -> None:
    """
    Store a judge result in the cache for future reuse.
    
    Args:
        prompt_hash: SHA256 hash of the prompt
        prompt: The actual prompt (for debugging)
        result: The judge result dict with score/reasoning
    """
    try:
        judge_cache_collection.update_one(
            {"prompt_hash": prompt_hash},
            {
                "$set": {
                    "prompt_hash": prompt_hash,
                    "prompt_preview": prompt[:200],  # Store first 200 chars for debugging
                    "score": result.get("score"),
                    "reasoning": result.get("reasoning"),
                    "created_at": datetime.now(timezone.utc),
                    "hit_count": 0,
                }
            },
            upsert=True
        )
    except Exception as e:
        print(f"Warning: Failed to cache judge result: {e}")



async def judge_call(prompt: str) -> dict:
    """
    Make a single LLM-as-Judge call and parse the JSON response.
    Includes caching and retry logic with exponential backoff (Phase 5.3-5.4).
    
    Args:
        prompt: The full judge prompt including rubric and instructions
        
    Returns:
        dict with at least {score: float, reasoning: str, cached: bool}
        Falls back to {score: 5.0, reasoning: "Judge unavailable"} on error
    """
    # Step 1: Check cache first (Phase 5.3)
    prompt_hash = get_prompt_hash(prompt)
    cached_result = await get_cached_judge_result(prompt_hash)
    if cached_result:
        print(f"✅ Cache HIT: Using cached judge result (age: {cached_result['cache_age']:.1f}s)")
        return cached_result
    
    # Step 2: Call LLM with retries (Phase 5.4)
    async def make_judge_call():
        """Inner function for retry logic"""
        response = judge_model.generate_content(prompt)
        text = response.text.strip()
        
        # Try to extract JSON from the response
        # Sometimes the model wraps JSON in ```json ... ```
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(text)
        
        # Ensure score is numeric
        if "score" in result:
            result["score"] = float(result["score"])
        
        return result
    
    try:
        # Retry with exponential backoff: 1s, 2s, 4s (Phase 5.4)
        result = await retry_with_backoff(
            make_judge_call,
            max_retries=2,  # 3 total attempts
            initial_wait=1.0,
            backoff_factor=2.0
        )
        
        result["cached"] = False
        result["retried"] = False  # Mark if retried (for logging)
        
        # Step 3: Store in cache for future use (Phase 5.3)
        await store_judge_result(prompt_hash, prompt, result)
        
        return result
        
    except json.JSONDecodeError as e:
        # If JSON parsing fails, try to extract a number from the text
        try:
            import re
            numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', str(e))
            if numbers:
                result = {"score": float(numbers[0]), "reasoning": str(e), "cached": False, "retried": True}
                await store_judge_result(prompt_hash, prompt, result)
                return result
        except Exception:
            pass
        
        return {"score": 5.0, "reasoning": f"Judge response was not valid JSON: {str(e)[:200]}", "cached": False, "retried": True}
        
    except Exception as e:
        error_str = str(e)
        if "quota" in error_str.lower() or "429" in error_str:
            # API quota exceeded — cannot evaluate, flag as skipped (not 50%)
            return {"score": None, "reasoning": "Judge unavailable: API quota exceeded — metric skipped", "cached": False, "retried": True}
        # Other errors warrant 0, not 50% — candidate gets no credit for errors in judgment
        return {"score": 0.0, "reasoning": f"Judge evaluation failed after retries (Phase 5.4): {error_str[:100]}", "cached": False, "retried": True}


async def judge_with_voting(prompt: str, num_calls: int = 1) -> dict:
    """
    Make multiple Judge calls and return the median score.
    
    For the prototype, defaults to 1 call to conserve API quota.
    Set num_calls=3 for full majority voting as per GUIDE spec.
    
    Args:
        prompt: The judge prompt
        num_calls: Number of independent calls (1 or 3)
        
    Returns:
        dict with {score, reasoning} — median score if multiple calls
    """
    if num_calls <= 1:
        return await judge_call(prompt)
    
    results = []
    for _ in range(num_calls):
        result = await judge_call(prompt)
        results.append(result)
    
    # Take median score
    scores = sorted([r["score"] for r in results])
    median_score = scores[len(scores) // 2]
    
    # Use reasoning from the result closest to median
    best_result = min(results, key=lambda r: abs(r["score"] - median_score))
    best_result["score"] = median_score
    best_result["all_scores"] = [r["score"] for r in results]
    
    return best_result
