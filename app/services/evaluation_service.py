"""
Phase 3: Evaluation Service
Orchestrator that runs all 5 pillar pipelines and computes the composite GUIDE score.

Phase 5.4 Enhancement: Partial Evaluation Handling
- Gracefully handles missing/failed pillar evaluations
- Dynamically reweights remaining pillars
- Marks unavailable metrics clearly
- Ensures composite Q score is still meaningful
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from app.database import events_collection, evaluations_collection
from app.schemas.evaluation_schema import EvaluationResult, PillarScore, SubMetricScore
from app.evaluation.pillar_g import compute_g_score
from app.evaluation.pillar_u import compute_u_score
from app.evaluation.pillar_i import compute_i_score
from app.evaluation.pillar_d import compute_d_score
from app.evaluation.pillar_e import compute_e_score
from app.evaluation.minimum_effort_validator import (
    validate_minimum_effort,
    apply_minimum_effort_penalties,
    get_minimum_effort_report
)

logger = logging.getLogger(__name__)

# Composite Q score weights
WEIGHTS = {
    "G": 0.20,  # Goal Decomposition
    "U": 0.25,  # Usage Efficiency
    "I": 0.20,  # Iteration & Refinement
    "D": 0.15,  # Detection & Validation
    "E": 0.20,  # End Result Quality
}


def reweight_pillars(available_pillars: Dict[str, bool]) -> Dict[str, float]:
    """
    Dynamically reweight pillar scores when some are unavailable (Phase 5.4).
    
    When a pillar cannot be evaluated (e.g., judge API fails after retries),
    we exclude it and distribute its weight among available pillars proportionally.
    
    Example: If D (15%) is unavailable, its weight is distributed to G, U, I, E
             G: 0.20/0.85 ≈ 0.235
             U: 0.25/0.85 ≈ 0.294
             I: 0.20/0.85 ≈ 0.235
             D: 0 (skipped)
             E: 0.20/0.85 ≈ 0.235
    
    Args:
        available_pillars: Dict mapping pillar_id -> True/False
        
    Returns:
        Reweighted dict with same structure as WEIGHTS
    """
    # Calculate total available weight
    total_available = sum(WEIGHTS[p] for p in WEIGHTS if available_pillars.get(p, True))
    
    if total_available == 0:
        # Edge case: no pillars available (shouldn't happen)
        logger.warning("⚠️ No pillars available for evaluation - using uniform weights")
        num_available = sum(1 for v in available_pillars.values() if v)
        return {p: 1.0/num_available if available_pillars.get(p, True) else 0 for p in WEIGHTS}
    
    # Distribute weights proportionally
    reweighted = {}
    for pillar_id, base_weight in WEIGHTS.items():
        if available_pillars.get(pillar_id, True):
            reweighted[pillar_id] = base_weight / total_available
        else:
            reweighted[pillar_id] = 0.0
    
    return reweighted


async def run_evaluation(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Run the complete 5-pillar evaluation pipeline for a session.
    Handles partial evaluations gracefully (Phase 5.4).
    
    Args:
        session_id: The session to evaluate
        
    Returns:
        Complete evaluation result dict, or None if evaluation completely fails
    """
    try:
        logger.info(f"Starting evaluation for session {session_id}")
        
        # Get all events for this session
        events = list(events_collection.find({"session_id": session_id}))
        if not events:
            logger.warning(f"No events found for session {session_id}")
            return None
        
        # Compute session duration
        session_start = next((e for e in events if e["event_type"] == "SESSION_START"), None)
        session_end = next((e for e in reversed(events) if e["event_type"] == "SESSION_END"), None)
        
        duration_minutes = 0.0
        if session_start and session_end:
            duration_minutes = (session_end["timestamp"] - session_start["timestamp"]).total_seconds() / 60
        
        # ─── MINIMUM EFFORT VALIDATION (Professional Standards) ───
        logger.info(f"Validating minimum effort thresholds for session {session_id}")
        effort_validation = await validate_minimum_effort(session_id)
        effort_report = get_minimum_effort_report(session_id, effort_validation)
        
        if not effort_validation["passes_validation"]:
            logger.warning(f"Session {session_id} fails minimum effort: {effort_report['interpretation']}")
        
        logger.info(f"Computing pillar scores for session {session_id}")
        
        # ─── COMPUTE PILLARS WITH PARTIAL EVALUATION SUPPORT (Phase 5.4) ───
        # Try to compute each pillar, but continue even if one fails
        pillar_results = {}
        pillar_available = {}
        
        pillar_configs = [
            ("G", "Goal Decomposition", compute_g_score),
            ("U", "Usage Efficiency", compute_u_score),
            ("I", "Iteration & Refinement", compute_i_score),
            ("D", "Detection & Validation", compute_d_score),
            ("E", "End Result Quality", compute_e_score),
        ]
        
        for pillar_id, pillar_name, compute_func in pillar_configs:
            try:
                logger.info(f"Computing pillar {pillar_id} ({pillar_name})")
                result = await compute_func(session_id)
                pillar_results[pillar_id] = result
                pillar_available[pillar_id] = True
                logger.info(f"✅ Pillar {pillar_id} computed successfully")
            except Exception as e:
                logger.warning(f"❌ Pillar {pillar_id} computation failed: {e}")
                pillar_results[pillar_id] = {"score": None, "sub_metrics": {}, "error": str(e)}
                pillar_available[pillar_id] = False
        
        # Check if ALL pillars failed (truly unrecoverable)
        if not any(pillar_available.values()):
            logger.error(f"ALL pillars failed for session {session_id} - cannot evaluate")
            return None
        
        # ─── REWEIGHT AVAILABLE PILLARS (Phase 5.4) ───
        reweighted_weights = reweight_pillars(pillar_available)
        logger.info(f"Reweighted pillar scores for available pillars: {reweighted_weights}")
        
        # Helper function to convert pillar result to PillarScore
        def make_pillar_score(pillar_dict, pillar_id, pillar_name, weight):
            """Convert a pillar computation result dict to a PillarScore object."""
            sub_metrics_raw = pillar_dict.get("sub_metrics", {})
            sub_metrics = []
            
            # Extract numeric scores from sub_metrics
            if isinstance(sub_metrics_raw, dict):
                for metric_name, metric_data in sub_metrics_raw.items():
                    if isinstance(metric_data, dict):
                        score = metric_data.get("score", 50.0)
                        sub_metrics.append(SubMetricScore(
                            name=metric_name,
                            value=score,
                            data=metric_data
                        ))
                    elif isinstance(metric_data, (int, float)):
                        sub_metrics.append(SubMetricScore(
                            name=metric_name,
                            value=metric_data
                        ))
            
            # Mark as unavailable if score is None
            is_available = pillar_dict.get("score") is not None
            
            return PillarScore(
                pillar_id=pillar_id,
                pillar_name=pillar_name,
                score=pillar_dict.get("score", 50.0),
                weight=weight,
                sub_metrics=sub_metrics,
                available=is_available,
                error=pillar_dict.get("error", None)
            )
        
        # Create PillarScore objects with reweighted weights
        g_score = make_pillar_score(pillar_results["G"], "G", "Goal Decomposition", reweighted_weights["G"])
        u_score = make_pillar_score(pillar_results["U"], "U", "Usage Efficiency", reweighted_weights["U"])
        i_score = make_pillar_score(pillar_results["I"], "I", "Iteration & Refinement", reweighted_weights["I"])
        d_score = make_pillar_score(pillar_results["D"], "D", "Detection & Validation", reweighted_weights["D"])
        e_score = make_pillar_score(pillar_results["E"], "E", "End Result Quality", reweighted_weights["E"])
        
        # ─── APPLY MINIMUM EFFORT PENALTIES ───
        if not effort_validation["passes_validation"]:
            raw_scores = {
                "G": g_score.score if pillar_available["G"] else None,
                "U": u_score.score if pillar_available["U"] else None,
                "I": i_score.score if pillar_available["I"] else None,
                "D": d_score.score if pillar_available["D"] else None,
                "E": e_score.score if pillar_available["E"] else None,
            }
            
            penalized_scores = await apply_minimum_effort_penalties(
                raw_scores,
                effort_validation["penalties"]
            )
            
            # Update PillarScore objects with penalized scores
            if pillar_available["G"]:
                g_score.score = penalized_scores.get("G", g_score.score)
            if pillar_available["U"]:
                u_score.score = penalized_scores.get("U", u_score.score)
            if pillar_available["I"]:
                i_score.score = penalized_scores.get("I", i_score.score)
            if pillar_available["D"]:
                d_score.score = penalized_scores.get("D", d_score.score)
            if pillar_available["E"]:
                e_score.score = penalized_scores.get("E", e_score.score)
            
            logger.info(f"Applied minimum effort penalties for session {session_id}")
        
        # ─── COMPUTE COMPOSITE Q SCORE WITH AVAILABLE PILLARS (Phase 5.4) ───
        # Only use available pillars; None values are treated as 0 in weighted sum
        composite_q = 0.0
        for pillar_id, score_obj in [("G", g_score), ("U", u_score), ("I", i_score), ("D", d_score), ("E", e_score)]:
            if pillar_available[pillar_id] and score_obj.score is not None:
                composite_q += reweighted_weights[pillar_id] * score_obj.score
        
        # If no pillars available, set Q to 0
        if composite_q == 0 and not any(pillar_available.values()):
            composite_q = 0.0
        
        logger.info(f"Composite Q score (with reweighting): {composite_q:.2f}")
        
        # Create evaluation result
        evaluation = EvaluationResult(
            session_id=session_id,
            pillar_g=g_score,
            pillar_u=u_score,
            pillar_i=i_score,
            pillar_d=d_score,
            pillar_e=e_score,
            composite_q_score=round(composite_q, 2),
            total_events=len(events),
            session_duration_minutes=round(duration_minutes, 2)
        )
        
        # Store in MongoDB
        eval_dict = evaluation.dict(by_alias=False)
        eval_dict["created_at"] = datetime.utcnow()
        
        # Add minimum effort validation report
        eval_dict["minimum_effort_validation"] = {
            "passes": effort_validation["passes_validation"],
            "report": effort_report,
            "metrics": effort_validation
        }
        
        # Add partial evaluation info (Phase 5.4)
        eval_dict["partial_evaluation"] = {
            "available_pillars": pillar_available,
            "reweighted_weights": reweighted_weights,
            "notice": "Some pillars were unavailable and excluded from scoring" if not all(pillar_available.values()) else None
        }
        
        result = evaluations_collection.insert_one(eval_dict)
        logger.info(f"Evaluation stored with ID {result.inserted_id} for session {session_id}")
        
        # Return the stored dict (MongoDB will add _id)
        eval_dict["_id"] = result.inserted_id
        return eval_dict
        
    except Exception as e:
        logger.error(f"Evaluation failed for session {session_id}: {e}", exc_info=True)
        return None


async def get_evaluation(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a stored evaluation result for a session.
    
    Args:
        session_id: The session ID
        
    Returns:
        Evaluation result dict, or None if not found
    """
    try:
        result = evaluations_collection.find_one(
            {"session_id": session_id},
            sort=[("created_at", -1)]  # Get latest if multiple
        )
        return result
    except Exception as e:
        logger.error(f"Failed to retrieve evaluation for session {session_id}: {e}")
        return None


async def list_evaluations(limit: int = 50, skip: int = 0) -> list:
    """
    List recent evaluations.
    
    Args:
        limit: Number of results
        skip: Number to skip (for pagination)
        
    Returns:
        List of evaluation results
    """
    try:
        results = list(
            evaluations_collection.find()
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return results
    except Exception as e:
        logger.error(f"Failed to list evaluations: {e}")
        return []


async def delete_evaluation(session_id: str) -> bool:
    """Delete an evaluation record."""
    try:
        result = evaluations_collection.delete_many({"session_id": session_id})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Failed to delete evaluation for session {session_id}: {e}")
        return False
