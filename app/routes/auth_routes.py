from fastapi import APIRouter,Depends
from app.schemas.user_schema import SignupRequest, SigninRequest, UserResponse, TokenResponse
from app.services.auth_service import create_user, authenticate_user
from app.dependencies.auth_dependency import get_current_user



# Create router object
# This helps us group authentication-related APIs together
router = APIRouter(prefix="/auth", tags=["Authentication"])


# -----------------------------
# Signup Endpoint
# -----------------------------
@router.post("/signup", response_model=UserResponse)
def signup(user: SignupRequest):
    """
    API Endpoint: Register a new user
    
    Request Body:
    {
        "email": "test@gmail.com",
        "password": "123456"
    }
    
    Flow:
    Client → Route → Service → DB → Response
    """
    print(f"Received signup request for password: {user.password}")
    return create_user(user.email, user.password)


# -----------------------------
# Signin Endpoint
# -----------------------------
@router.post("/signin", response_model=TokenResponse)
def signin(user: SigninRequest):
    """
    API Endpoint: Login existing user
    
    Request Body:
    {
        "email": "test@gmail.com",
        "password": "123456"
    }
    
    Flow:
    Client → Route → Service → Verify Password → Response
    """

    return authenticate_user(user.email, user.password)

@router.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    """
    Protected route.
    
    Only accessible if valid JWT is sent.
    """

    return {
        "message": "You are authorized",
        "email": current_user
    }


# -----------------------------
# Route Layer Explanation:
# -----------------------------
# APIRouter:
#   Used to organize related endpoints (like auth APIs).
#
# prefix="/auth":
#   All routes will start with /auth
#   Example:
#       POST /auth/signup
#       POST /auth/signin
#
# tags=["Authentication"]:
#   Groups these APIs under "Authentication" section in Swagger UI.
#
# response_model=UserResponse:
#   Ensures response matches defined schema.
#   Automatically hides unwanted fields.
#
# Clean Architecture Flow:
#   Route → Service → Database
#
# Routes should:
#   - Receive request
#   - Call service
#   - Return response
#
# Routes should NOT:
#   - Contain business logic
#   - Handle hashing
#   - Direct DB logic

# -----------------------------
# Protected Route Example
# -----------------------------



# Flow:
# Client → /auth/me
# Must send Authorization header.
#
# FastAPI:
#   Calls get_current_user()
#   If valid → injects email into current_user
#   If invalid → 401 error