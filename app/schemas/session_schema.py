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
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    invite_link: str  # Full URL candidate can click
    # Group session fields (None for individually-created sessions)
    group_id: Optional[str] = None
    group_name: Optional[str] = None
    project_template: Optional[str] = None
    start_at: Optional[datetime] = None   # Window open (Asia/Kolkata stored as ISO)
    end_at: Optional[datetime] = None     # Window close
    candidate_email: Optional[str] = None

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


# ─── Group / Bulk Session Schemas ───

class BulkCandidateRow(BaseModel):
    """One row in the CSV: a single candidate to invite"""
    name: str = Field(..., min_length=2, max_length=100)
    Gmail: str  # validated as email in service layer


class BulkSessionCreateRequest(BaseModel):
    """Request body for POST /api/sessions/bulk-create"""
    group_name: str = Field(..., min_length=2, max_length=120)
    time_limit_minutes: int = Field(default=60, ge=15, le=180)
    project_template: str = Field(..., min_length=2, max_length=120)
    start_at: datetime          # ISO string, assumed Asia/Kolkata
    end_at: datetime            # Must be > start_at and in the future
    candidates: List[BulkCandidateRow]
    dry_run: bool = False       # True = validate only, no DB/email


class PerCandidateResult(BaseModel):
    """Result for a single candidate in a bulk-create response"""
    name: str
    email: str
    status: str          # 'created', 'email_failed', 'invalid', 'duplicate'
    session_id: Optional[str] = None
    invite_link: Optional[str] = None
    error: Optional[str] = None


class BulkSessionCreateResponse(BaseModel):
    """Response for POST /api/sessions/bulk-create"""
    group_id: Optional[str] = None   # None on dry_run
    dry_run: bool
    results: List[PerCandidateResult]
    total: int
    valid: int
    failed: int


class SessionGroupSummary(BaseModel):
    """Summary of a bulk-created group (from session_groups collection)"""
    group_id: str
    group_name: str
    project_template: str
    created_at: datetime
    session_count: int
    creator_email: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
