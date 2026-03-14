from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.test_service import run_tests


# ─── Test Execution Routes ───
# Provides the endpoint for candidates to run tests on their code.
#
# 📚 What you'll learn:
# - Inline Pydantic models for simple schemas
# - How the "Run Tests" button connects to the backend


router = APIRouter(prefix="/api", tags=["Tests"])


class TestRequest(BaseModel):
    """Request body for running tests."""
    session_id: str
    code: str


class TestResponse(BaseModel):
    """Response with test execution results."""
    session_id: str
    tests_total: int
    tests_passed: int
    tests_failed: int
    output_log: str


@router.post("/run-tests", response_model=TestResponse)
async def run_tests_endpoint(request: TestRequest):
    """
    Execute the candidate's code against the pre-written test suite.
    
    The frontend sends the current code from the Monaco editor.
    The backend runs pytest against it and returns the results.
    This is also logged as a TEST_RUN event in the Interaction Trace Φ.
    """
    try:
        result = await run_tests(
            session_id=request.session_id,
            code=request.code,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test execution failed: {str(e)}")
