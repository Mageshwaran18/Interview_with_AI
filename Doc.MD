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
#### SubModule 1.2 = JWT + Authorization + Protected Route

**Goal :**
Generate JWT token , Return token to client , Client sends token in header, Backend verifies token, Allow access to protected route

Architecture Update :-
```
app/
│
├──routes/
│   └── auth_routes.py ← Updated    
|
├── utils/
│   ├── hash_utils.py
│   ├── jwt_utils.py   ← NEW
│  
├── services/
│   └── auth_service.py ← Updated
|
├── schemas/
│   └── user_schema.py ← Updated    
|
├── dependencies/
│   └── auth_dependency.py  ← NEW
```

### Request Flow Architecture (SubModule 1.2)

```
Client Request (Login)
    ↓
auth_routes.py (POST /auth/signin)
    ↓
auth_service.py (authenticate_user)
    ↓
jwt_utils.py (create_access_token)
    ↓
Response back to client with JWT

---

Client Request (Protected Route: /auth/me)
    ↓
auth_dependency.py (Extracts Token → verify_access_token)
    ↓
auth_routes.py (GET /auth/me)
    ↓
Response back to client
```

### Component Responsibilities

#### 1. routes/auth_routes.py
- Updated `POST /auth/signin` to return a `TokenResponse` containing the JWT token.
- Added `GET /auth/me` as a protected route that requires a valid JWT to access.
- Uses `Depends(get_current_user)` to enforce authorization on the protected route.

#### 2. schemas/user_schema.py
- Added `TokenResponse` model (`email`, `message`, `access_token`, `token_type`).
- Separates login response structure from the standard signup response to include the token string.

#### 3. services/auth_service.py
- Updated `authenticate_user()` to generate a JWT token (`access_token`) upon successful password verification.
- Returns the complete token structure to the routing layer.

#### 4. utils/jwt_utils.py
- `create_access_token()`: Generates a JWT token containing the user's email (`sub`) and an expiration time (`exp`), securely signed with the configured secret key.
- `verify_access_token()`: Decodes the JWT, verifies its cryptographic signature and expiration, and retrieves the embedded user identity.

#### 5. dependencies/auth_dependency.py
- Initializes `HTTPBearer` security scheme.
- Contains the reusable `get_current_user()` dependency that extracts the Bearer token from the incoming `Authorization` header, verifies it via `jwt_utils`, and returns the attached user's email.
- Raises `401 Unauthorized` if no valid token is provided.
-------------------------------------------------------------------------------------------------------------------

#### SubModule 1.3 = Adding Frontend to the Application

**Goal :**
Integrate a React frontend built with Vite to interact with the FastAPI backend.

**Theory Stuffs:**

🧠 1️⃣ What is React?

React is a JavaScript library used to build User Interfaces (UI).

In simple words:
React builds what the user sees in the browser.

Example:
- Login form
- Signup form
- Dashboard
- Buttons
- Inputs

Traditional Website (Old Way)
HTML page → Reload page → New page loads
Slow. Not dynamic.

React Website (Modern Way)
React updates only the part that changes.
Example: Click login → Only login section updates, without a full page reload.

This is called:
Single Page Application (SPA)

React Concept
Everything is a Component

Example:
```jsx
function Signup() {
  return <h1>Signup Page</h1>
}
```
That is a React component. You combine components to build a full app.

🚀 2️⃣ What is Vite?

Vite (pronounced “veet”) is a frontend build tool.

It helps you:
- Create React project
- Run development server
- Bundle code for production
- Hot reload instantly

Think of it like:
A fast engine that runs your React app.

Why Not Just Use React Alone?
React is just a library. You need a tool to:
- Compile JSX
- Convert modern JS to browser-compatible code
- Start dev server
Vite does that.

The below command is used to create the react project with vite as engine:
`npx create-vite@latest interview_with_ai_frontend`

📡 3️⃣ What is Axios?

Axios is a JavaScript library used to:
Send HTTP requests from frontend to backend.

Example:
```javascript
axios.post("http://localhost:8000/auth/signin", {
  email: "user@gmail.com",
  password: "123456"
})
```
That sends a request to your FastAPI backend.

Why Not Use fetch()?
Browser already has `fetch()`, but Axios:
- Automatically handles JSON
- Cleaner syntax
- Better error handling
- Easier to attach headers (JWT token)

Professional projects mostly use Axios.

-------------------------------------------------------------------------------------------------------------------

### Implementation & Architecture (SubModule 1.3)

**What we built:**
A structured React SPA (Single Page Application) that connects to the FastAPI backend. 

#### Frontend Request Flow Architecture (How Code Executes)

When an action occurs (like a user logging in), the frontend code executes in a specific sequence, passing data between layers before reaching the backend:

```text
1. User interacts with UI (e.g., clicks "Signin" button)
    ↓
2. React Component (pages/Signin.jsx) 
   - Captures email & password from state
   - Calls the API function
    ↓
3. API Service (services/api.jsx)
   - Prepares the HTTP request using Axios
   - Attaches the backend URL (http://127.0.0.1:8000)
    ↓
4. FastAPI Backend (app/routes/auth_routes.py → database.py)
   - Processes request & verifies credentials
   - Returns JSON response (JWT Token)
    ↓
5. React Component (pages/Signin.jsx) again
   - Receives the JWT token
   - Saves token to localStorage
   - Triggers React Router to navigate to "/dashboard"
    ↓
6. React Component (pages/Dashboard.jsx) loads
   - useEffect runs immediately on mount
   - Retrieves token from localStorage
   - Calls API Service (services/api.jsx) for `getCurrentUser`
    ↓
7. API Service (services/api.jsx)
   - Attaches "Authorization: Bearer <token>" to the headers
   - Sends request to backend
    ↓
8. FastAPI Backend (app/dependencies/auth_dependency.py)
   - Validates the token
   - Returns user details
    ↓
9. React Component (pages/Dashboard.jsx) again
   - Receives user details (email)
   - Updates state and displays the UI
```

#### 1. React Routing (`react-router-dom`)
**What:** We used `BrowserRouter`, `Routes`, and `Route` in `main.jsx` and `App.jsx`.
**Why:** To enable client-side routing. This allows users to navigate between routes like `/` (Signin), `/signup`, and `/dashboard` without fully reloading the page. It makes the application fast and feel like a modern, native app.

#### 2. Centralized API Service (`services/api.jsx`)
**What:** Created an Axios instance (`axios.create`) configured with the backend API URL (`http://127.0.0.1:8000`).
**Why:**
- **Reusability**: We don't have to define `http://127.0.0.1:8000` inside every component when making an API call.
- **Maintainability**: If the backend URL changes (e.g., when deploying to a cloud server like AWS), we only need to update it in one central location.
- Encapsulating the API calls (`signinUser`, `getCurrentUser`) makes the frontend components cleaner and easier to read.

#### 3. CORS Configuration (Backend)
**What:** Added `CORSMiddleware` in `app/main.py` to allow HTTP requests from the React frontend (`http://localhost:5173`).
**Why:** 
Browsers enforce a security feature called the **Same-Origin Policy**, which blocks frontend web code (running on port 5173) from requesting data from a backend hosted on a different origin or port (8000) by default. By configuring CORS (Cross-Origin Resource Sharing) in FastAPI, we explicitly inform the browser that it is completely safe to allow the Vite React frontend to communicate with the API.

#### 4. Authentication Flow (Frontend to Backend)

**Signin Flow (`pages/Signin.jsx`):**
1. User enters their email and password.
2. Form submission sends a request to the backend using the `signinUser` API function.
3. FastAPI backend verifies the credentials and responds with a JWT token if successful.
4. The JWT token is saved securely in the browser's `localStorage` to persist the logged-in state even if the user refreshes the page.
5. Upon successful login, the user is redirected (`useNavigate` from `react-router-dom`) to the `/dashboard`.

**Dashboard Verification (`pages/Dashboard.jsx`):**
1. The dashboard is considered a protected route.
2. We use React's `useEffect` hook to read the JWT token from `localStorage` as soon as the page loads.
3. If no token exists, the user is redirected immediately back to the login page `/`.
4. If a token exists, the frontend calls the backend API endpoint (`/auth/me`), attaching the string via the `Authorization: Bearer <token>` header.
5. If the backend correctly verifies the token signature, it responds with the user properties (like email). If the token is invalid, tampered with, or expired, the frontend removes the invalid token from `localStorage` and redirects the user back to the login page for them to re-authenticate.