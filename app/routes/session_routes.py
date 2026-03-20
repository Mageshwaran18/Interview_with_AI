"""
═════════════════════════════════════════════════════════════════
Session Routes — Phase 5 API Endpoints
═════════════════════════════════════════════════════════════════

This module defines FastAPI routes for session lifecycle management.

Endpoints:
- POST   /api/sessions/create       → Create new session (hiring manager)
- GET    /api/sessions/{id}         → Fetch session details
- POST   /api/sessions/{id}/start   → Start session with candidate name
- POST   /api/sessions/{id}/end     → End session (submit or timer expiry)
- GET    /api/sessions              → List all sessions (hiring manager)
- GET    /api/sessions/{id}/budget  → Check token budget
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
import logging
from pydantic import BaseModel

from app.schemas.session_schema import (
    SessionCreateRequest,
    SessionOnboardingRequest,
    SessionResponse,
    SessionListResponse,
    TokenBudgetInfo,
)
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


# ─── Pydantic Models for Request Bodies ─── 
class EndSessionRequest(BaseModel):
    final_code: Optional[str] = None

# Create router for session endpoints
router = APIRouter(prefix="/api/sessions", tags=["sessions"])


# ─── Hiring Manager: Create New Session ───
@router.post("/create", response_model=SessionResponse)
def create_session(request: SessionCreateRequest):
    """
    Hiring manager creates a new session for a candidate.
    Returns a unique session ID and invite link.
    
    Request:
        time_limit_minutes: Duration for the session (15-180, default 60)
    
    Response:
        SessionResponse with invite_link that can be shared with candidate
    """
    try:
        session = SessionService.create_session(request)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Fetch Session Details ───
@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    """
    Fetch details of a specific session.
    Used by: hiring manager dashboard, candidate checking status
    """
    session = SessionService.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session


# ─── Candidate: Start Session (Onboarding) ───
@router.post("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: str, request: SessionOnboardingRequest):
    """
    Candidate enters their name and starts the session.
    Transitions: CREATED → IN_PROGRESS
    
    This kicks off the 60-minute timer on the frontend.
    """
    try:
        session = SessionService.start_session(request)
        return session
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Candidate: End Session ───
@router.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    request_body: Optional[EndSessionRequest] = None,
    reason: str = Query("submitted", description="'submitted', 'timer_expired', or 'terminated_by_manager'"),
):
    """
    End a session (either submitted by candidate, timer expiry, or manager termination).
    Transitions: IN_PROGRESS → COMPLETED
    
    This automatically triggers the evaluation pipeline after ending.
    """
    # Extract final_code from request body if provided
    final_code = None
    if request_body:
        final_code = request_body.final_code
    
    try:
        session = SessionService.end_session(
            session_id=session_id,
            reason=reason,
            final_code_snapshot=final_code,
        )
        
        logger.info(f"Session {session_id} ended with reason: {reason}")
        
        # ✅ Automatically trigger evaluation pipeline after session ends
        # This ensures results are ready when candidate/manager views results
        from app.services.evaluation_service import run_evaluation
        import asyncio
        asyncio.create_task(run_evaluation(session_id))
        
        return session
    except ValueError as e:
        logger.error(f"Validation error ending session {session_id} (reason: {reason}): {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Hiring Manager: List All Sessions ───
@router.get("", response_model=SessionListResponse)
def list_sessions(
    state: Optional[str] = Query(None, description="Filter by state (CREATED, IN_PROGRESS, COMPLETED, EVALUATED)")
):
    """
    List all sessions for the hiring manager dashboard.
    Optionally filter by state.
    """
    try:
        sessions = SessionService.list_sessions(state=state)
        return SessionListResponse(
            total=len(sessions),
            sessions=sessions,
        )
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Token Budget Management ───
@router.get("/{session_id}/budget", response_model=TokenBudgetInfo)
def get_token_budget(session_id: str):
    """
    Check the token budget usage for a session.
    
    Used by:
    - Backend to warn when approaching limit
    - Frontend to display budget status
    """
    try:
        budget = SessionService.get_token_budget(session_id)
        return budget
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Mark Session as Evaluated ───
@router.post("/{session_id}/mark-evaluated", response_model=SessionResponse)
def mark_evaluated(session_id: str):
    """
    After evaluation pipeline completes, mark session as EVALUATED.
    Transitions: COMPLETED → EVALUATED
    """
    try:
        session = SessionService.mark_evaluated(session_id)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
