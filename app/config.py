import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URL = os.getenv("MONGO_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    def __init__(self):
        # Validate critical environment variables
        required_vars = {
            "MONGO_URL": self.MONGO_URL,
            "DATABASE_NAME": self.DATABASE_NAME,
            "SECRET_KEY": self.SECRET_KEY,
            "GEMINI_API_KEY": self.GEMINI_API_KEY,
        }
        
        missing_vars = [name for name, value in required_vars.items() if not value]
        
        if missing_vars:
            raise ValueError(
                f"❌ Missing required environment variables: {', '.join(missing_vars)}\n"
                f"Please create a .env file with these variables. See README for setup instructions."
            )

settings = Settings()

# Configuration flow:
# .env file → load_dotenv() → Settings class → Import anywhere
#
# Usage:
#   from app.config import settings
#   print(settings.MONGO_URL)
#
# Benefits: Centralized, clean, professional configuration management
