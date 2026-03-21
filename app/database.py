from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create MongoDB client using URL from .env
# This connects our FastAPI application to MongoDB server
try:
    client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=5000)
    # Test the connection immediately
    client.admin.command('ismaster')
    logger.info("✅ MongoDB connection successful")
except (ServerSelectionTimeoutError, ConnectionFailure) as e:
    logger.error(f"❌ MongoDB connection failed: {str(e)}")
    logger.error("Please ensure MongoDB is running and MONGO_URL is correct in .env file")
    raise RuntimeError(
        f"Failed to connect to MongoDB at {settings.MONGO_URL}. "
        "Please check that MongoDB is running and your connection string is correct."
    ) from e
except Exception as e:
    logger.error(f"❌ Unexpected error connecting to MongoDB: {str(e)}")
    raise RuntimeError(f"Unexpected error connecting to MongoDB: {str(e)}") from e

# Access (or automatically create) the database
# If "interview_with_ai" does not exist, MongoDB will create it
db = client[settings.DATABASE_NAME]

# Access (or automatically create) the "users" collection
# Collection is like a table in SQL
users_collection = db["users"]

dsa_sessions_collection = db["dsa_sessions"]


# Access (or automatically create) the "sessions" collection
# This stores every AI chat interaction (prompt, response, tokens)
# This is the seed of the Interaction Trace Φ (Phase 2 will expand this)
sessions_collection = db["sessions"]

# ─── Chat Logs Collection ───
# Stores individual chat interactions separately from session metadata
# Each document represents one prompt-response exchange
# This keeps the sessions collection clean and focused on session state
chat_logs_collection = db["chat_logs"]

# ─── Phase 2: Interaction Trace Φ ───
# The events collection is the CORE of the instrumentation layer.
# Every action (prompt, code save, test run, session events) is logged here.
# This is an APPEND-ONLY log — events are never updated after writing.
events_collection = db["events"]

# ─── Phase 3: Evaluation Results ───
# Stores the computed GUIDE scores for each session.
# Each document contains all 5 pillar scores + composite Q score.
evaluations_collection = db["evaluations"]

# ─── Phase 5.3: Judge Cache ───
# Stores cached LLM Judge results to avoid duplicate API calls.
# Key: prompt_hash (SHA256), Value: {score, reasoning, created_at, hit_count}
# Reduces API costs by 30-40% for repeated evaluations (same prompts).
judge_cache_collection = db["judge_cache"]

# ─── Phase 5.3: Token Budgets ───
# Tracks token usage per session to control API spending.
# Documents: {session_id, tokens_total, tokens_used, usage_percentage, warning_triggered}
token_budgets_collection = db["token_budgets"]



# Database flow:
# .env → config.py → settings → MongoClient → Database → Collection
#
# MONGO_URL = mongodb://localhost:27017
# DATABASE_NAME = interview_with_ai
#
# MongoDB behavior:
# - Database is created automatically when first data is inserted
# - Collection is created automatically when first document is inserted
#
# Usage anywhere in project:
#   from app.database import users_collection
#   users_collection.insert_one({...})
#
# Benefits:
# - Centralized DB connection
# - No repeated MongoClient creation
# - Clean architecture
