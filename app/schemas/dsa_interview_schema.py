from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict


PhaseType = Literal[
    "intuition",
    "algorithm",
    "complexity",
    "coding",
    "followup",
    "completed",
]

ProblemSourceType = Literal["selected", "uploaded"]


class StartDSASessionRequest(BaseModel):
    problem_source: ProblemSourceType
    problem_title: str = Field(min_length=2)
    problem_statement: str = Field(min_length=10)
    difficulty: Optional[str] = "unknown"
    problem_constraints: Optional[str] = Field(
        default="No explicit constraints provided.",
        max_length=2000
    )
    difficulty: Optional[str] = Field(default="unknown", max_length=50)


class StartDSASessionResponse(BaseModel):
    session_id: str
    problem_title: str
    current_phase: PhaseType
    message: str


class PhaseAnswerRequest(BaseModel):
    answer: str = Field(min_length=1)


class HelpRequest(BaseModel):
    user_message: str = Field(min_length=1)


class PhaseEvaluationResponse(BaseModel):
    session_id: str
    current_phase: PhaseType
    phase_passed: bool
    feedback: str
    next_phase: Optional[PhaseType] = None
    attempts_used: int


class SessionDetailResponse(BaseModel):
    session_id: str
    user_email: str
    problem_title: str
    problem_statement: str
    problem_constraints: str
    current_phase: PhaseType
    phase_status: Dict[str, str]
    attempts: Dict[str, int]
    feedback_log: List[Dict]