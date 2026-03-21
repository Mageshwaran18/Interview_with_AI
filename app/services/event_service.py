from datetime import datetime, timezone
from bson import ObjectId
from app.database import events_collection


# ─── Event Service ───
# This module handles all writes and reads to the Interaction Trace Φ.
#
# 📚 What you'll learn:
# - Append-only log pattern (events are NEVER updated after writing)
# - MongoDB document insertion and querying
# - ObjectId to string conversion for JSON serialization
#
# 💡 Key Concept: Append-Only
# Φ is designed as an append-only log. Once an event is written,
# it is NEVER updated. This ensures:
#   1. Evaluation integrity — no retroactive changes
#   2. Re-runnability — the Evaluation Engine can re-run on the same Φ


async def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    """
    Appends a single event to the Interaction Trace Φ.
    
    This is the CORE function of the instrumentation layer.
    Every significant action during a session flows through here.
    
    Args:
        session_id: Which session this event belongs to
        event_type: PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END
        payload: Event-specific data (differs per event type)
    
    Returns:
        dict with the event_id (MongoDB ObjectId as string)
    """
    event_doc = {
        "session_id": session_id,
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc),
        "payload": payload,
    }
    
    result = events_collection.insert_one(event_doc)
    
    return {
        "event_id": str(result.inserted_id),
        "event_type": event_type,
        "timestamp": event_doc["timestamp"].isoformat(),
    }


async def get_session_events(session_id: str, event_type: str = None) -> list:
    """
    Retrieves all events for a given session, optionally filtered by type.
    Events are returned in chronological order (oldest first).
    
    This is used by:
    - The Evaluation Engine (Phase 3) to compute metrics
    - The Results Dashboard (Phase 4) for session timeline
    - Debugging during development
    
    Args:
        session_id: Which session to query
        event_type: Optional filter (e.g., "PROMPT" to get only prompts)
    
    Returns:
        List of event documents
    """
    query = {"session_id": session_id}
    if event_type:
        query["event_type"] = event_type
    
    events = list(
        events_collection.find(query).sort("timestamp", 1)
    )
    
    # Convert ObjectId to string for JSON serialization
    for event in events:
        event["_id"] = str(event["_id"])
    
    return events
