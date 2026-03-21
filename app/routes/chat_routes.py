from fastapi import APIRouter, HTTPException
from app.schemas.chat_schema import ChatRequest, ChatResponse
from app.services.chat_service import chat_with_ai


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
        result = await chat_with_ai(
            session_id=request.session_id,
            prompt=request.prompt
        )
        return result
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
