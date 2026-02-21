from fastapi import HTTPException, status
from app.database import users_collection
from app.utils.hash_utils import hash_password, verify_password
from app.utils.jwt_utils import create_access_token


# -----------------------------
# Signup Service
# -----------------------------
def create_user(email: str, password: str):
    """
    Handles user registration logic.
    
    Steps:
    1. Check if email already exists.
    2. Hash the password.
    3. Store user in MongoDB.
    """

    # Step 1: Check if user already exists
    existing_user = users_collection.find_one({"email": email})
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Step 2: Hash the password before storing
    hashed_password = hash_password(password)

    # Step 3: Create user document
    user_data = {
        "email": email,
        "hashed_password": hashed_password
    }

    # Step 4: Insert into MongoDB
    users_collection.insert_one(user_data)

    return {
        "email": email,
        "message": "User registered successfully"
    }


# -----------------------------
# Signin Service
# -----------------------------
def authenticate_user(email: str, password: str):
    """
    Handles user login logic.
    
    Steps:
    1. Find user by email.
    2. Verify password.
    3. Return success or error.
    """

    # Step 1: Find user in database
    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No such user with the given email"
        )

    # Step 2: Verify entered password with stored hashed password
    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password for the given email"
        )

    # -----------------------------
    # Create JWT Token
    # -----------------------------
    access_token = create_access_token(
        data={"sub": email}  # "sub" = subject (identity of user)
    )

    return {
        "email": email,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer"
    }





# -----------------------------
# Service Layer Flow:
# -----------------------------
# Route Layer → calls → Service Layer
#
# Signup Flow:
#   Route receives request → create_user()
#       → Check if email exists
#       → Hash password
#       → Store in DB
#
# Signin Flow:
#   Route receives request → authenticate_user()
#       → Fetch user from DB
#       → verify_password()
#       → Return success/failure
#
# Why Service Layer?
# - Keeps route files clean
# - Separates business logic
# - Easier testing
# - Scalable architecture
#
# Important:
# - We never return hashed_password to client
# - We never store plain password
# - We use proper HTTP status codes

# SubModule - 1.2

# -----------------------------
# Updated Login Flow:
# -----------------------------
# 1. Verify email exists
# 2. Verify password
# 3. Generate JWT
# 4. Return token to client
#
# Client will store:
#   access_token
#
# Client must send:
#   Authorization: Bearer <access_token>