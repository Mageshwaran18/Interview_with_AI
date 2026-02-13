from passlib.context import CryptContext


# -----------------------------
# Create Password Hashing Context
# -----------------------------
# bcrypt is a strong hashing algorithm
# "deprecated=auto" handles old hashing schemes automatically
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -----------------------------
# Function to Hash Password
# -----------------------------
def hash_password(password: str) -> str:
    """
    Converts plain password into secure hashed password.
    
    Example:
    Input  : "mypassword123"
    Output : "$2b$12$kjsdhfksjdfhksdfhksdhfksdf..."
    
    We store only the hashed version in database.
    """
    return pwd_context.hash(password)


# -----------------------------
# Function to Verify Password
# -----------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compares user entered password with stored hashed password.
    
    Returns:
        True  → if password matches
        False → if password does not match
    """
    return pwd_context.verify(plain_password, hashed_password)


# -----------------------------
# Hashing Flow Explanation:
# -----------------------------
# Signup Flow:
#   User sends password → hash_password() → Store hashed value in DB
#
# Signin Flow:
#   User sends password → verify_password()
#       → Compare with stored hashed password
#
# Important:
# - We NEVER decrypt passwords.
# - Hashing is one-way.
# - Even if database is leaked, raw passwords are safe.
#
# Why bcrypt?
# - Industry standard
# - Slow hashing (good for security)
# - Protects against brute force attacks
#
# Usage Example:
#   hashed = hash_password("123456")
#   verify_password("123456", hashed) → True
#
# Security Benefit:
#   Even if two users use same password,
#   their hashed values will be different.Because bcrypt adds a random salt.
