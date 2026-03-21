from fastapi import APIRouter, Depends

from app.dependencies.auth_dependency import get_current_user
from app.schemas.dsa_interview_schema import (
    StartDSASessionRequest,
    StartDSASessionResponse,
    PhaseAnswerRequest,
    HelpRequest,
    PhaseEvaluationResponse,
    SessionDetailResponse,
)
from app.services.dsa_interview_service import (
    start_dsa_session,
    get_session_by_id,
    evaluate_phase_answer,
    request_help_for_phase,
)

router = APIRouter(prefix="/dsa", tags=["DSA Interview"])


@router.post("/session/start", response_model=StartDSASessionResponse)
def create_dsa_session(
    payload: StartDSASessionRequest,
    current_user: str = Depends(get_current_user)
):
    return start_dsa_session(current_user, payload)


@router.get("/session/{session_id}", response_model=SessionDetailResponse)
def get_dsa_session(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    return get_session_by_id(session_id, current_user)


@router.post("/session/{session_id}/answer", response_model=PhaseEvaluationResponse)
def submit_phase_answer(
    session_id: str,
    payload: PhaseAnswerRequest,
    current_user: str = Depends(get_current_user)
):
    return evaluate_phase_answer(session_id, current_user, payload.answer)


@router.post("/session/{session_id}/help", response_model=PhaseEvaluationResponse)
def request_help(
    session_id: str,
    payload: HelpRequest,
    current_user: str = Depends(get_current_user)
):
    return request_help_for_phase(session_id, current_user, payload.user_message)