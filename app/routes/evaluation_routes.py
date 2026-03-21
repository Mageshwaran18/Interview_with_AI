"""
Phase 3: Evaluation Routes
API endpoints for triggering and retrieving evaluations.

Endpoints:
- POST /api/evaluate/{session_id} — Run evaluation
- GET /api/evaluate/{session_id} — Get evaluation result
- GET /api/evaluations — List evaluations
"""

import logging
from fastapi import APIRouter, HTTPException, Query
from app.schemas.evaluation_schema import EvaluationResponse
from app.services.evaluation_service import run_evaluation, get_evaluation, list_evaluations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["evaluation"])


@router.post("/evaluate/{session_id}")
async def trigger_evaluation(session_id: str) -> EvaluationResponse:
    """
    Trigger evaluation pipeline for a session.
    Computes all 5 pillars and composite Q score.
    
    Args:
        session_id: The session to evaluate
        
    Returns:
        EvaluationResponse with results
    """
    try:
        logger.info(f"Evaluation requested for session {session_id}")
        
        # Run evaluation
        result = await run_evaluation(session_id)
        
        if not result:
            logger.warning(f"Evaluation returned None for session {session_id}")
            raise HTTPException(
                status_code=500,
                detail="Evaluation pipeline failed or session has no events"
            )
        
        return EvaluationResponse(
            success=True,
            session_id=session_id,
            message="Evaluation completed successfully",
            evaluation=result
        )
        
    except Exception as e:
        logger.error(f"Evaluation trigger failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )


@router.get("/evaluate/{session_id}")
async def get_session_evaluation(session_id: str) -> EvaluationResponse:
    """
    Retrieve stored evaluation result for a session.
    
    Args:
        session_id: The session ID
        
    Returns:
        EvaluationResponse with stored result
    """
    try:
        result = await get_evaluation(session_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"No evaluation found for session {session_id}"
            )
        
        return EvaluationResponse(
            success=True,
            session_id=session_id,
            message="Evaluation retrieved successfully",
            evaluation=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve evaluation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluation: {str(e)}"
        )


@router.get("/evaluations")
async def list_all_evaluations(limit: int = Query(50, ge=1, le=100), skip: int = Query(0, ge=0)):
    """
    List recent evaluations with pagination.
    
    Args:
        limit: Number of results (1-100)
        skip: Number to skip for pagination
        
    Returns:
        List of evaluation results
    """
    try:
        results = await list_evaluations(limit=limit, skip=skip)
        return {
            "success": True,
            "count": len(results),
            "evaluations": results
        }
    except Exception as e:
        logger.error(f"Failed to list evaluations: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list evaluations: {str(e)}"
        )
