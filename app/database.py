from pymongo import MongoClient
from app.config import settings

# Create MongoDB client using URL from .env
# This connects our FastAPI application to MongoDB server
client = MongoClient(settings.MONGO_URL)

# Access (or automatically create) the database
# If "interview_with_ai" does not exist, MongoDB will create it
db = client[settings.DATABASE_NAME]

# Access (or automatically create) the "users" collection
# Collection is like a table in SQL
users_collection = db["users"]

# Access (or automatically create) the "sessions" collection
# This stores every AI chat interaction (prompt, response, tokens)
# This is the seed of the Interaction Trace Φ (Phase 2 will expand this)
sessions_collection = db["sessions"]

# ─── Phase 2: Interaction Trace Φ ───
# The events collection is the CORE of the instrumentation layer.
# Every action (prompt, code save, test run, session events) is logged here.
# This is an APPEND-ONLY log — events are never updated after writing.
events_collection = db["events"]

# ─── Phase 3: Evaluation Results ───
# Stores the computed GUIDE scores for each session.
# Each document contains all 5 pillar scores + composite Q score.
evaluations_collection = db["evaluations"]


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
