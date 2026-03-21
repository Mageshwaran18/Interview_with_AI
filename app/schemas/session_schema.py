from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

"""
═════════════════════════════════════════════════════════════════
Session Schema — Phase 5 (Hiring Manager Dashboard & Onboarding)
═════════════════════════════════════════════════════════════════

This module defines Pydantic models for session management.
Sessions represent a single candidate's evaluation session.

Session Lifecycle (State Machine):
CREATED → IN_PROGRESS → COMPLETED → EVALUATED

A session has:
- A unique session_id
- A state (one of the 4 states above)
- A time_limit (in minutes, default 60)
- A candidate_name (entered during onboarding)
- timestamps for creation and submission
- token budget tracking for LLM costs
"""


class SessionState(str, Enum):
    """Session state enumeration"""
    CREATED = "CREATED"              # Session created, waiting for candidate
    IN_PROGRESS = "IN_PROGRESS"      # Candidate is actively working
    COMPLETED = "COMPLETED"          # Session ended (submitted or timer expiry)
    EVALUATED = "EVALUATED"          # Evaluation pipeline finished


class SessionCreateRequest(BaseModel):
    """Used by hiring manager to create a new session"""
    time_limit_minutes: int = Field(default=60, ge=15, le=180)
    # time_limit_minutes must be between 15 and 180 minutes


class SessionOnboardingRequest(BaseModel):
    """Used by candidate to start a session with their name"""
    candidate_name: str = Field(..., min_length=2, max_length=100)
    session_id: str  # The unique session link they received


class SessionResponse(BaseModel):
    """Response when fetching a session"""
    session_id: str
    state: SessionState
    candidate_name: Optional[str]
    time_limit_minutes: int
    created_at: Optional[datetime] = None
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    invite_link: str  # Full URL candidate can click
    
    class Config:
        json_encoders = {
            SessionState: lambda v: v.value
        }


class SessionListResponse(BaseModel):
    """Response for listing all sessions (for hiring manager dashboard)"""
    total: int
    sessions: List[SessionResponse]


class TokenBudgetInfo(BaseModel):
    """Token budget tracking for cost control"""
    total_budget: int = 200000  # 200K tokens per session
    tokens_used: int = 0
    tokens_remaining: int = 200000
    percentage_used: float = 0.0
    warning_threshold_reached: bool = False  # True when > 80% used


class CachedJudgeEvaluation(BaseModel):
    """Cached LLM-as-Judge evaluation to avoid duplicate API calls"""
    prompt_hash: str  # SHA256 hash of the prompt
    metric_name: str  # e.g., "PSS", "DDS", "AC"
    score: float
    reasoning: str
    created_at: Optional[datetime] = None
    call_count: int = 1  # How many times this has been retrieved from cache
