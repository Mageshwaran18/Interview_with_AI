from fastapi import APIRouter, HTTPException
from app.schemas.event_schema import EventCreate, EventResponse, EventListResponse
from app.services.event_service import log_event, get_session_events


# ─── Event Routes ───
# These endpoints are the gateway to the Interaction Trace Φ.
#
# 📚 What you'll learn:
# - POST endpoint for creating data
# - GET endpoint with path parameters
# - Query parameters for filtering
# - How the frontend instruments user actions
#
# Flow:
#   Frontend detects an action (code edit, test run, etc.)
#     ↓ POST /api/events { session_id, event_type, payload }
#   event_routes.py (this file) ← validates the event
#     ↓
#   event_service.py ← appends to MongoDB (Φ)


router = APIRouter(prefix="/api", tags=["Events"])


@router.post("/events", response_model=EventResponse)
async def create_event(event: EventCreate):
    """
    Log a new event to the Interaction Trace Φ.
    
    This endpoint is called by the frontend whenever something
    significant happens: code changes, test runs, session events.
    """
    try:
        result = await log_event(
            session_id=event.session_id,
            event_type=event.event_type,
            payload=event.payload,
        )
        return EventResponse(
            success=True,
            event_id=result["event_id"],
            message=f"{event.event_type} event logged successfully",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log event: {str(e)}")


@router.get("/events/{session_id}")
async def get_events(session_id: str, event_type: str = None):
    """
    Retrieve all events for a session, optionally filtered by type.
    
    Used by:
    - Evaluation Engine (Phase 3)
    - Results Dashboard (Phase 4)
    - Debugging during development
    
    Query params:
      ?event_type=PROMPT  → only prompt events
      ?event_type=CODE_SAVE → only code save events
    """
    try:
        events = await get_session_events(session_id, event_type)
        return EventListResponse(
            session_id=session_id,
            total_events=len(events),
            events=events,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve events: {str(e)}")
