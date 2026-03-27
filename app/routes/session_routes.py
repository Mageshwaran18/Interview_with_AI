"""
═════════════════════════════════════════════════════════════════
Session Routes — Phase 5 + Group Session API Endpoints
═════════════════════════════════════════════════════════════════

Endpoints:
- POST   /api/sessions/bulk-create       → Bulk session creation (dry_run supported)
- GET    /api/session-groups             → List recent session groups
- POST   /api/sessions/create           → Create new single session (hiring manager)
- GET    /api/sessions/{id}             → Fetch session details (window enforced)
- POST   /api/sessions/{id}/start       → Start session (window enforced)
- POST   /api/sessions/{id}/end         → End session
- GET    /api/sessions                  → List all sessions
- GET    /api/sessions/{id}/budget      → Check token budget
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
    BulkSessionCreateRequest,
    BulkSessionCreateResponse,
    SessionGroupSummary,
)
from app.services.session_service import (
    SessionService,
    WindowNotStartedError,
    WindowExpiredError,
)

logger = logging.getLogger(__name__)


# ─── Pydantic Models for Request Bodies ───
class EndSessionRequest(BaseModel):
    final_code: Optional[str] = None


# Create router for session endpoints
router = APIRouter(tags=["sessions"])


# ─────────────────────────────────────────────────────────────────────────
# Group Session Endpoints
# ─────────────────────────────────────────────────────────────────────────

@router.post("/api/sessions/bulk-create", response_model=BulkSessionCreateResponse)
def bulk_create_sessions(
    request: BulkSessionCreateRequest,
    dry_run: bool = Query(False, description="If true, validates only — no DB writes or emails"),
):
    """
    Bulk-create sessions for multiple candidates (hiring manager).

    Accepts a group name, duration, project template, start/end window
    (Asia/Kolkata assumed), and a list of up to 20 candidates (name + email).

    With dry_run=true: validates all rows and returns per-row results without
    creating any sessions or sending any emails.

    With dry_run=false: creates individual sessions, sends invite emails,
    and persists a group summary.
    """
    # Allow dry_run from either query param or body
    effective_request = request.copy(update={"dry_run": request.dry_run or dry_run})
    try:
        response = SessionService.create_sessions_bulk(effective_request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Bulk create failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/session-groups", response_model=list)
def get_session_groups(limit: int = Query(20, ge=1, le=100)):
    """
    List recent bulk session groups for the results dashboard filter.
    Returns a list of SessionGroupSummary objects.
    """
    try:
        groups = SessionService.get_session_groups(limit=limit)
        return [g.model_dump() for g in groups]
    except Exception as e:
        logger.error("Failed to fetch session groups: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────
# Single Session Endpoints
# ─────────────────────────────────────────────────────────────────────────

router_sessions = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router_sessions.post("/create", response_model=SessionResponse)
def create_session(request: SessionCreateRequest):
    """
    Hiring manager creates a new single session for a candidate.
    Returns a unique session ID and invite link.
    """
    try:
        session = SessionService.create_session(request)
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_sessions.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str):
    """
    Fetch details of a specific session.
    Returns 403 if outside the session validity window.
    """
    try:
        session = SessionService.get_session(session_id)
    except WindowNotStartedError as e:
        raise HTTPException(
            status_code=403,
            detail={
                "reason": "not_started",
                "message": "This session has not started yet.",
                "start_at": e.start_at.isoformat(),
            },
        )
    except WindowExpiredError as e:
        raise HTTPException(
            status_code=403,
            detail={
                "reason": "expired",
                "message": "This session has expired.",
                "end_at": e.end_at.isoformat(),
            },
        )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


@router_sessions.post("/{session_id}/start", response_model=SessionResponse)
def start_session(session_id: str, request: SessionOnboardingRequest):
    """
    Candidate enters their name and starts the session.
    Transitions: CREATED → IN_PROGRESS
    Returns 403 if outside the session validity window.
    """
    try:
        session = SessionService.start_session(request)
        return session
    except WindowNotStartedError as e:
        raise HTTPException(
            status_code=403,
            detail={
                "reason": "not_started",
                "message": "This session has not started yet.",
                "start_at": e.start_at.isoformat(),
            },
        )
    except WindowExpiredError as e:
        raise HTTPException(
            status_code=403,
            detail={
                "reason": "expired",
                "message": "This session has expired.",
                "end_at": e.end_at.isoformat(),
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_sessions.post("/{session_id}/end", response_model=SessionResponse)
async def end_session(
    session_id: str,
    request_body: Optional[EndSessionRequest] = None,
    reason: str = Query("submitted", description="'submitted', 'timer_expired', or 'terminated_by_manager'"),
):
    """
    End a session. Automatically triggers evaluation pipeline.
    """
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

        from app.services.evaluation_service import run_evaluation
        import asyncio
        asyncio.create_task(run_evaluation(session_id))

        return session
    except ValueError as e:
        logger.error(f"Validation error ending session {session_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router_sessions.get("", response_model=SessionListResponse)
def list_sessions(
    state: Optional[str] = Query(None, description="Filter by state"),
):
    """List all sessions for the hiring manager dashboard."""
    try:
        sessions = SessionService.list_sessions(state=state)
        return SessionListResponse(total=len(sessions), sessions=sessions)
    except Exception as e:
        logger.error(f"Error listing sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router_sessions.get("/{session_id}/budget", response_model=TokenBudgetInfo)
def get_token_budget(session_id: str):
    """Check the token budget usage for a session."""
    try:
        return SessionService.get_token_budget(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router_sessions.post("/{session_id}/mark-evaluated", response_model=SessionResponse)
def mark_evaluated(session_id: str):
    """Mark session as EVALUATED after evaluation pipeline completes."""
    try:
        return SessionService.mark_evaluated(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
