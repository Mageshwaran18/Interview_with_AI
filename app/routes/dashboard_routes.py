"""
Phase 4: Dashboard Routes — API endpoints for the Results Dashboard.

Endpoints:
- GET /api/dashboard/stats — Aggregate statistics
- GET /api/dashboard/rankings — Ranked sessions
- GET /api/dashboard/session/{session_id} — Session detail
- GET /api/dashboard/trends — Score trend data
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.dashboard_service import (
    get_dashboard_stats,
    get_session_rankings,
    get_session_detail,
    get_score_trends,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def dashboard_stats(
    group_id: Optional[str] = Query(None, description="Filter by group_id for bulk sessions"),
):
    """
    Get aggregate statistics across all evaluated sessions.
    Optionally filter by group_id.
    """
    try:
        stats = await get_dashboard_stats(group_id=group_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Dashboard stats failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/rankings")
async def dashboard_rankings(
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("composite_q_score", description="Sort field: composite_q_score, G, U, I, D, E"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    group_id: Optional[str] = Query(None, description="Filter by group_id"),
):
    """
    Get ranked sessions sorted by the specified field.
    Optionally filter by group_id.
    """
    try:
        rankings = await get_session_rankings(limit=limit, sort_by=sort_by, order=order, group_id=group_id)
        return {"success": True, "count": len(rankings), "rankings": rankings}
    except Exception as e:
        logger.error(f"Dashboard rankings failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch rankings: {str(e)}")


@router.get("/session/{session_id}")
async def dashboard_session_detail(session_id: str):
    """
    Get full evaluation detail for a single session.
    Includes all 5 pillar breakdowns with sub-metrics.
    If evaluation pending, returns session info with pending message.
    """
    try:
        detail = await get_session_detail(session_id)
        
        # If no evaluation found, check if session exists and is completed
        if not detail:
            from app.services.session_service import SessionService
            session = SessionService.get_session(session_id)
            
            if session and session.state in ["COMPLETED", "EVALUATED"]:
                # Return placeholder evaluation pending message
                return {
                    "success": True,
                    "session": {
                        "session_id": session_id,
                        "state": session.state,
                        "candidate_name": session.candidate_name,
                        "composite_q_score": 0,
                        "total_events": 0,
                        "duration_minutes": session.time_limit_minutes,
                        "evaluation_status": "PENDING",
                        "evaluation_message": f"⏳ Evaluation for {session.candidate_name or 'this session'} is pending. The interview was completed at {session.submitted_at or 'an unknown time'}.",
                        "pillars": [],
                    }
                }
            
            raise HTTPException(
                status_code=404,
                detail=f"No evaluation or completed session found for {session_id}"
            )
        
        return {"success": True, "session": detail}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session detail failed for {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch session: {str(e)}")


@router.get("/trends")
async def dashboard_trends(
    limit: int = Query(20, ge=1, le=100),
    group_id: Optional[str] = Query(None, description="Filter by group_id"),
):
    """
    Get chronological score data for trend visualization.
    Returns oldest-first for proper chart rendering.
    Optionally filter by group_id.
    """
    try:
        trends = await get_score_trends(limit=limit, group_id=group_id)
        return {"success": True, "count": len(trends), "trends": trends}
    except Exception as e:
        logger.error(f"Dashboard trends failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {str(e)}")
