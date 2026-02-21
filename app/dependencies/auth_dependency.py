from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from app.utils.jwt_utils import verify_access_token


# -----------------------------
# Create HTTP Bearer Security Scheme
# -----------------------------
# This tells FastAPI:
# "Expect Authorization: Bearer <token>"
security = HTTPBearer()


# -----------------------------
# Dependency Function
# -----------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Extracts and verifies JWT token from Authorization header.
    
    Header format expected:
        Authorization: Bearer <access_token>
    """

    token = credentials.credentials  # Extract token string

    try:
        # Verify and decode token
        email = verify_access_token(token)

        return email  # Return user identity

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


# -----------------------------
# Authorization Flow:
# -----------------------------
# Client sends:
#   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#
# FastAPI:
#   HTTPBearer extracts token
#
# get_current_user():
#   → verify_access_token()
#   → decode payload
#   → extract "sub" (email)
#
# If valid:
#   return email
#
# If invalid:
#   401 Unauthorized
#
# Why Dependency?
# - Reusable across multiple routes
# - Clean separation of authentication logic
# - Professional architecture