"""
Phase 3: Evaluation Service
Orchestrator that runs all 5 pillar pipelines and computes the composite GUIDE score.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from app.database import events_collection, evaluations_collection
from app.schemas.evaluation_schema import EvaluationResult, PillarScore, SubMetricScore
from app.evaluation.pillar_g import compute_g_score
from app.evaluation.pillar_u import compute_u_score
from app.evaluation.pillar_i import compute_i_score
from app.evaluation.pillar_d import compute_d_score
from app.evaluation.pillar_e import compute_e_score

logger = logging.getLogger(__name__)

# Composite Q score weights
WEIGHTS = {
    "G": 0.20,  # Goal Decomposition
    "U": 0.25,  # Usage Efficiency
    "I": 0.20,  # Iteration & Refinement
    "D": 0.15,  # Detection & Validation
    "E": 0.20,  # End Result Quality
}


async def run_evaluation(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Run the complete 5-pillar evaluation pipeline for a session.
    
    Args:
        session_id: The session to evaluate
        
    Returns:
        Complete evaluation result dict, or None if evaluation fails
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
        
        logger.info(f"Computing pillar scores for session {session_id}")
        
        # Compute all 5 pillars in parallel (conceptually - we run sequentially for now)
        pillar_g = await compute_g_score(session_id)
        pillar_u = await compute_u_score(session_id)
        pillar_i = await compute_i_score(session_id)
        pillar_d = await compute_d_score(session_id)
        pillar_e = await compute_e_score(session_id)
        
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
            
            return PillarScore(
                pillar_id=pillar_id,
                pillar_name=pillar_name,
                score=pillar_dict.get("score", 50.0),
                weight=weight,
                sub_metrics=sub_metrics
            )
        
        # Create PillarScore objects
        g_score = make_pillar_score(pillar_g, "G", "Goal Decomposition", WEIGHTS["G"])
        u_score = make_pillar_score(pillar_u, "U", "Usage Efficiency", WEIGHTS["U"])
        i_score = make_pillar_score(pillar_i, "I", "Iteration & Refinement", WEIGHTS["I"])
        d_score = make_pillar_score(pillar_d, "D", "Detection & Validation", WEIGHTS["D"])
        e_score = make_pillar_score(pillar_e, "E", "End Result Quality", WEIGHTS["E"])
        
        # Compute composite Q score
        # Q = 0.20×G + 0.25×U + 0.20×I + 0.15×D + 0.20×E
        composite_q = (
            WEIGHTS["G"] * g_score.score +
            WEIGHTS["U"] * u_score.score +
            WEIGHTS["I"] * i_score.score +
            WEIGHTS["D"] * d_score.score +
            WEIGHTS["E"] * e_score.score
        )
        
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
