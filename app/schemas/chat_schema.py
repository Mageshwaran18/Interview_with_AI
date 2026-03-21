from pydantic import BaseModel


# ─── Request Schema ───
# What the frontend sends when the user types a message in the chat panel
class ChatRequest(BaseModel):
    session_id: str    # Unique session identifier
    prompt: str        # The user's message to send to the AI


# ─── Response Schema ───
# What the backend returns after getting the AI's response
class ChatResponse(BaseModel):
    session_id: str    # Same session ID echoed back
    response: str      # The AI's text response
