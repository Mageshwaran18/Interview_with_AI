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
"""

import json
import google.generativeai as genai
from app.config import settings

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Use the same model as chat, but with temperature=0 for consistency
judge_model = genai.GenerativeModel(
    "gemini-2.5-flash",
    generation_config={"temperature": 0}
)


async def judge_call(prompt: str) -> dict:
    """
    Make a single LLM-as-Judge call and parse the JSON response.
    
    Args:
        prompt: The full judge prompt including rubric and instructions
        
    Returns:
        dict with at least {score: float, reasoning: str}
        Falls back to {score: 5.0, reasoning: "Judge unavailable"} on error
    """
    try:
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
        
    except json.JSONDecodeError:
        # If JSON parsing fails, try to extract a number from the text
        try:
            import re
            numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', text)
            if numbers:
                return {"score": float(numbers[0]), "reasoning": text}
        except Exception:
            pass
        
        return {"score": 5.0, "reasoning": f"Judge response was not valid JSON: {text[:200]}"}
        
    except Exception as e:
        error_str = str(e)
        if "quota" in error_str.lower() or "429" in error_str:
            return {"score": 5.0, "reasoning": "Judge unavailable: API quota exceeded"}
        return {"score": 5.0, "reasoning": f"Judge error: {error_str[:200]}"}


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
