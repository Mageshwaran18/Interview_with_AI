from fastapi import APIRouter, HTTPException
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import chat_with_ai
from app.services.chat_policy_service import ChatPolicyService, ChatPolicyError
import asyncio


# ─── Create Router ───
# prefix="/api" means all routes here start with /api
# tags=["Chat"] groups these endpoints in Swagger docs
router = APIRouter(prefix="/api", tags=["Chat"])


# ─── POST /api/chat ───
# This is the LLM Proxy endpoint.
# 
# Flow:
#   Frontend sends: { session_id: "abc123", prompt: "How do I create a class?" }
#   Backend forwards the prompt to Google Gemini
#   Backend logs the interaction to MongoDB
#   Backend returns: { session_id: "abc123", response: "Here's how to create a class..." }
#
@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Send a message to the AI and receive a response.
    
    This endpoint acts as a proxy between the frontend chat panel
    and the Google Gemini AI model.
    """
    try:
        try:
            ChatPolicyService.enforce_pre_chat(
                session_id=request.session_id,
                prompt=request.prompt,
            )
        except ChatPolicyError as policy_error:
            detail = policy_error.detail
            if detail.get("terminate_session"):
                ChatPolicyService.terminate_session_for_policy(
                    session_id=request.session_id,
                    reason=detail.get("termination_reason", "policy_violation_limit"),
                )
                from app.services.evaluation_service import run_evaluation
                asyncio.create_task(run_evaluation(request.session_id))

            raise HTTPException(status_code=policy_error.status_code, detail=detail)

        # Cooldown starts when a valid query is accepted, even if downstream AI fails.
        ChatPolicyService.mark_chat_sent(request.session_id)

        result = await chat_with_ai(
            session_id=request.session_id,
            prompt=request.prompt
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        # Standardize the error so FastAPI applies CORS headers properly
        raise HTTPException(
            status_code=500, 
            detail="Error communicating with AI service. You may have exceeded your API quota."
        )


# ─── How This Fits in the Architecture ───
#
# Frontend (ChatPanel.jsx)
#     ↓ POST /api/chat { session_id, prompt }
# chat_routes.py (this file) ← receives & validates request
#     ↓
# chat_service.py ← calls Gemini API + logs to MongoDB
#     ↓
# Response back to frontend
