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
