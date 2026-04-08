from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.test_service import run_tests


# ─── Test Execution Routes ───
# Provides the endpoint for candidates to run tests on their code.
#
# 📚 What you'll learn:
# - Inline Pydantic models for simple schemas
# - How the "Run Tests" button connects to the backend


router = APIRouter(tags=["Tests"])


class TestCodeRequest(BaseModel):
    """Request body for running the calculator test suite."""
    session_id: str
    code: str


class TestCodeResponse(BaseModel):
    """Structured response used by frontend and evaluation pipeline."""
    session_id: str
    total: int
    passed: int
    failed: int
    fc_score: float
    results: list
    error: str | None = None
    tests_total: int
    tests_passed: int
    tests_failed: int
    output_log: str


@router.post("/api/test-code", response_model=TestCodeResponse)
async def test_code(request: TestCodeRequest):
    """
    Execute the 20-case Simple Calculator test suite.
    Called by the editor's "Run Tests" action.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    try:
        result = run_tests(code=request.code, session_id=request.session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test execution failed: {str(e)}")


@router.post("/api/run-tests", response_model=TestCodeResponse)
async def run_tests_endpoint(request: TestCodeRequest):
    """Backward-compatible alias for older frontend clients."""
    return await test_code(request)
