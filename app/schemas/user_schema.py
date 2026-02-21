# This is the validation layer between user input and backend logic.

from pydantic import BaseModel, EmailStr, Field


# -----------------------------
# Request Schema for Signup
# -----------------------------
class SignupRequest(BaseModel):
    email: EmailStr  # Ensures valid email format automatically
    password: str = Field(min_length=6)  
    # Password must be at least 6 characters


# -----------------------------
# Request Schema for Signin
# -----------------------------
class SigninRequest(BaseModel):
    email: EmailStr  # Validates proper email format
    password: str


# -----------------------------
# Response Schema (What we return to client)
# -----------------------------
class UserResponse(BaseModel):
    email: EmailStr
    message: str


# -----------------------------
# Schema Flow Explanation:
# -----------------------------
# Client sends JSON → FastAPI → Pydantic Schema
#
# Example Signup Request:
# {
#   "email": "test@gmail.com",
#   "password": "123456"
# }
#
# Pydantic automatically:
# - Checks if email exists
# - Validates correct email format
# - Ensures password length >= 6
# - Returns 422 error if validation fails
#
# Why separate Request & Response models?
# - Never expose sensitive fields (like hashed_password)
# - Clean API design
# - Professional backend structure
#
# Usage in routes:
#   @router.post("/signup")
#   def signup(data: SignupRequest):
#       print(data.email)
#
# Benefits:
# - Automatic validation
# - Swagger auto-documentation
# - Strong typing
# - Cleaner and safer code


# -----------------------------
# Login Response With Token
# -----------------------------
class TokenResponse(BaseModel):
    email: EmailStr
    message: str
    access_token: str
    token_type: str


# Why separate TokenResponse?
# Because login returns extra fields (token)
# while signup does not.