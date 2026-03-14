"""
Phase 4: Dashboard Routes — API endpoints for the Results Dashboard.

Endpoints:
- GET /api/dashboard/stats — Aggregate statistics
- GET /api/dashboard/rankings — Ranked sessions
- GET /api/dashboard/session/{session_id} — Session detail
- GET /api/dashboard/trends — Score trend data
"""

import logging
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
async def dashboard_stats():
    """
    Get aggregate statistics across all evaluated sessions.
    Returns total sessions, average/max/min Q scores, pillar averages,
    and score distribution histogram.
    """
    try:
        stats = await get_dashboard_stats()
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Dashboard stats failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/rankings")
async def dashboard_rankings(
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("composite_q_score", description="Sort field: composite_q_score, G, U, I, D, E"),
    order: str = Query("desc", description="Sort order: asc or desc"),
):
    """
    Get ranked sessions sorted by the specified field.
    Supports sorting by composite Q score or individual pillar scores.
    """
    try:
        rankings = await get_session_rankings(limit=limit, sort_by=sort_by, order=order)
        return {"success": True, "count": len(rankings), "rankings": rankings}
    except Exception as e:
        logger.error(f"Dashboard rankings failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch rankings: {str(e)}")


@router.get("/session/{session_id}")
async def dashboard_session_detail(session_id: str):
    """
    Get full evaluation detail for a single session.
    Includes all 5 pillar breakdowns with sub-metrics.
    """
    try:
        detail = await get_session_detail(session_id)
        if not detail:
            raise HTTPException(
                status_code=404,
                detail=f"No evaluation found for session {session_id}"
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
):
    """
    Get chronological score data for trend visualization.
    Returns oldest-first for proper chart rendering.
    """
    try:
        trends = await get_score_trends(limit=limit)
        return {"success": True, "count": len(trends), "trends": trends}
    except Exception as e:
        logger.error(f"Dashboard trends failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch trends: {str(e)}")
