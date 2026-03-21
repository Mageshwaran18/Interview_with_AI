from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


# ─── Event Types ───
# Every action in a GUIDE session becomes one of these event types.
# This enum-like list ensures consistency across all logged events.
#
# 📚 What you'll learn:
# - Pydantic models for data validation
# - Literal types for constraining values
# - Optional fields with defaults
#
EVENT_TYPES = [
    "PROMPT",         # User sent a message to the AI
    "RESPONSE",       # AI replied to the user
    "CODE_SAVE",      # Candidate's code changed (diff captured)
    "TEST_RUN",       # Candidate ran the test suite
    "SESSION_START",  # Session began
    "SESSION_END",    # Session ended (submit or timer expired)
]


class EventCreate(BaseModel):
    """
    The uniform envelope for every event in the Interaction Trace Φ.
    
    💡 Key Concept: Uniform Envelope
    Every event — whether it's a prompt, code change, or test run —
    uses this SAME structure. Only the 'payload' differs.
    This makes querying and analysis much easier in Phase 3.
    
    Example:
    {
        "session_id": "session_abc",
        "event_type": "CODE_SAVE",
        "payload": {
            "filename": "main.py",
            "diff_text": "+    def add_book(self)...",
            "lines_added": 5,
            "lines_removed": 0,
            "full_snapshot": "class Library:..."
        }
    }
    """
    session_id: str = Field(..., description="Unique session identifier")
    event_type: str = Field(..., description="One of: PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Event-specific data")


class EventResponse(BaseModel):
    """Response after successfully logging an event."""
    success: bool
    event_id: str
    message: str


class EventListResponse(BaseModel):
    """Response containing a list of events for a session."""
    session_id: str
    total_events: int
    events: list
