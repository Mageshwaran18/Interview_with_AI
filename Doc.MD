# Interview with AI

## Module 1

### Submodule 1.1: Basic CRUD Operations

**Goal:**
Provide basic CRUD operations to the application, allowing users to sign in and sign up.

**Summary:**
Users can authenticate using email and password credentials.

For the initial development phase, we are using a locally installed MongoDB instance to simplify setup and accelerate learning. After building sufficient expertise in Docker and MongoDB, we plan to transition to a containerized MongoDB setup. This will align our development environment with production standards and streamline future deployment to AWS.

Folder Structure ( Module 1.1 )

```
Interview_with_Ai/
│
├── venv/
├── requirements.txt
├── .gitignore.py
├── .env
│
├── app/
│   ├── main.py
│   ├── database.py
|   ├── config.py
│   │
│   ├── models/
│   │   └── user_model.py
│   │
│   ├── schemas/
│   │   └── user_schema.py
│   │
│   ├── routes/
│   │   └── auth_routes.py
│   │
│   ├── services/
│   │   └── auth_service.py
│   │
│   └── utils/
│       └── hash_utils.py
│
└── README.md
```

| File/Folder | Purpose |
|---|---|
| `__init__.py` | It tells Python "This folder is a package. You can import from here." Without it → imports may fail.|
| `main.py` |The entry point of FastAPI , includes routes etc.. |
| `database.py` | Used to connect to MongoDB, create database object (client etc..) |
| `models/` |  This represents how data is being stored in the DB  |
| `schemas/` | These are pydantic models ( Pydantic is a Python library used for Data validation ,Data parsing , Type enforcement ). Used for validating request and response body. |
| `routes/` | Contains API endpoints , receiving request , calling services  |
| `services/` | Contains bussiness logics like Check if email exists , Hash password , Insert user in DB , Verify password |
| `utils/` | Helper functions like hashpassword() , verify_password() etc..|

## 📘 SubModule 1.1 – User Signup & Signin (Documentation)

### Overview

When a user enters their email and password, the request flows through multiple backend layers following a clean architecture pattern.

### Request Flow Architecture

```
Client Request
    ↓
main.py
    ↓
auth_routes.py
    ↓
auth_service.py
    ↓
hash_utils.py (if needed)
    ↓
database.py (MongoDB)
    ↓
Response back to client
```

### Component Responsibilities

#### 1. main.py
- Creates FastAPI application instance
- Includes authentication router: `app.include_router(auth_router)`
- Acts as the entry point of the backend application

#### 2. routes/auth_routes.py
- Defines API endpoints: `POST /auth/signup`, `POST /auth/signin`
- Receives validated request body from Pydantic schemas
- Calls corresponding service functions: `create_user()`, `authenticate_user()`
- Returns structured response
- Handles routing only — no business logic

#### 3. schemas/user_schema.py
- Defines Pydantic models for signup/signin requests and responses
- Validates email format and minimum password length
- Automatically generates Swagger documentation

#### 4. services/auth_service.py
- **create_user()**: Checks if email exists, hashes password, inserts into MongoDB
- **authenticate_user()**: Fetches user by email, verifies password with bcrypt, returns success or error
- Contains core authentication logic

#### 5. utils/hash_utils.py
- **hash_password()**: Converts plain password into bcrypt hash
- **verify_password()**: Compares input password with stored hash
- Ensures passwords are never stored in plain text

#### 6. database.py
- Establishes MongoDB connection
- Creates database `interview_with_ai` and collection `users`
- Centralizes database access

#### 7. config.py
- Loads environment variables from `.env`
- Centralizes configuration: MongoDB URL, database name, secret key, algorithm, token expiry
- Ensures environment-independent architecture
-------------------------------------------------------------------------------------------------------------------