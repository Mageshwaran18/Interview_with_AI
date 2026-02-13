from fastapi import APIRouter
from app.schemas.user_schema import SignupRequest, SigninRequest, UserResponse
from app.services.auth_service import create_user, authenticate_user


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
@router.post("/signin", response_model=UserResponse)
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
