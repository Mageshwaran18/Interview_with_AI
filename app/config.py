import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGO_URL = os.getenv("MONGO_URL")
    DATABASE_NAME = os.getenv("DATABASE_NAME")
    SECRET_KEY = os.getenv("SECRET_KEY")
    ALGORITHM = os.getenv("ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

settings = Settings()

# Configuration flow:
# .env file → load_dotenv() → Settings class → Import anywhere
#
# Usage:
#   from app.config import settings
#   print(settings.MONGO_URL)
#
# Benefits: Centralized, clean, professional configuration management
