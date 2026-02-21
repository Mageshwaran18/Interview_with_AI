from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import settings


# -----------------------------
# Create Access Token
# -----------------------------
def create_access_token(data: dict):
    """
    Generates JWT token.
    
    data: dictionary containing user information
    Example:
        {"sub": "user@gmail.com"}
    """

    to_encode = data.copy()

    # Set token expiry time
    expire = datetime.utcnow() + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Add expiry into token payload
    to_encode.update({"exp": expire})

    # Generate JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


# -----------------------------
# Verify & Decode Token
# -----------------------------
def verify_access_token(token: str):
    """
    Decodes JWT and verifies it.
    Returns email if valid.
    Raises error if invalid.
    """

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise JWTError

        return email

    except JWTError:
        raise JWTError("Invalid or expired token")


# -----------------------------
# JWT Flow:
# -----------------------------
# Login → create_access_token()
# Client stores token
# Client sends token in Authorization header
# Backend → verify_access_token()
#
# Payload Structure Example:
# {
#   "sub": "user@gmail.com",
#   "exp": 1710000000
# }
#
# sub = subject (user identity)
# exp = expiry timestamp
#
# SECRET_KEY:
# Used to sign the token.
# If changed → all tokens become invalid.