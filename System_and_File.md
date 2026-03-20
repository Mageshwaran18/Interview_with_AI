# 📋 GUIDE — System Architecture & File Structure Documentation

**Project Name:** Interview with AI (GUIDE)  
**Version:** Phase 4 Complete (with Phase 5 partial features)  
**Last Updated:** March 20, 2026  
**Document Purpose:** Comprehensive reference for understanding system architecture, file organization, and component interactions

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Backend File Structure](#backend-file-structure)
6. [Frontend File Structure](#frontend-file-structure)
7. [Features by Phase](#features-by-phase)
8. [API Reference](#api-reference)
9. [Data Flow & Lifecycle](#data-flow--lifecycle)
10. [Complete Directory Tree](#complete-directory-tree)

---

## Project Overview

### What is GUIDE?

**GUIDE** (Goal Understanding Integrated Development Evaluation) is a comprehensive platform for evaluating software engineers based on their ability to collaborate effectively with AI models.

#### Core Concept

```
┌─────────────────────────────────────────────┐
│      Candidate's Development Environment    │
├──────────────┬───────────────┬──────────────┤
│   📋 Tasks   │  💻 Code      │  🤖 AI Chat  │
│  (Requirements)  (Monaco     │              │
│              │   Editor)     │ (Google      │
│              │               │  Gemini)     │
├──────────────┴───────────────┴──────────────┤
│        Interaction Trace Φ                   │
│     (Every keystroke logged)                 │
├──────────────────────────────────────────────┤
│      Evaluation Engine (5 Pillars)           │
│   G=Goal Decomposition, U=AI Utilization     │
│   I=Implementation, D=Detection & Validation │
│   E=Execution Quality                        │
├──────────────────────────────────────────────┤
│   📊 Results Dashboard (Hiring Managers)     │
└──────────────────────────────────────────────┘
```

### Key Features

- **Real-time Code Editing:** Monaco editor with Python syntax highlighting
- **AI Chat Interface:** Direct integration with Google Gemini AI
- **Comprehensive Logging:** Every action captured in Interaction Trace Φ  
- **5-Pillar Evaluation:** Goal decomposition, AI utilization, implementation, detection, execution quality
- **Results Dashboard:** Visualization of evaluation metrics and feedback
- **Session Management:** Track candidates through the entire interview process
- **Security Monitoring:** Detect and track security vulnerabilities

---

## High-Level Architecture

### 4-Layer Architecture Pattern

```
┌────────────────────────────────────────────┐
│ LAYER 4: FRONTEND (React + Vite)           │
│ - Pages: Signin, Signup, GUIDE, Dashboard  │
│ - Components: Editor, Chat, Tasks, Results │
│ - Services: API client, state management   │
└────────────────┬─────────────────────────┘
                 │ HTTP/REST
┌────────────────▼─────────────────────────┐
│ LAYER 3: ROUTES (FastAPI routers)        │
│ - /auth - Authentication                  │
│ - /api/chat - LLM proxy                   │
│ - /api/events - Interaction logging       │
│ - /api/evaluate - Evaluation trigger      │
│ - /api/dashboard - Results display        │
│ - /api/sessions - Session management      │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│ LAYER 2: SERVICES (Business Logic)       │
│ - auth_service - User authentication      │
│ - chat_service - LLM integration          │
│ - event_service - Event logging           │
│ - evaluation_service - Score computation  │
│ - dashboard_service - Metrics aggregation │
└────────────────┬─────────────────────────┘
                 │
┌────────────────▼─────────────────────────┐
│ LAYER 1: DATABASE (MongoDB)               │
│ - users - User accounts                   │
│ - sessions - Coding sessions              │
│ - events - Interaction Trace Φ            │
│ - evaluations - Computed scores           │
│ - judge_cache - LLM Judge cache           │
│ - token_budgets - API usage tracking      │
└────────────────────────────────────────────┘
```

### Request-Response Flow Example

```
User opens /guide/session_123
         ↓
Frontend (GuidePage.jsx)
  - Fetches session details from /api/sessions/session_123
  - Renders three panels: tasks, editor, chat
         ↓
User types prompt in ChatPanel
  - Call sendChatMessage()
         ↓
POST /api/chat
  { session_id: "session_123", prompt: "How do I...?" }
         ↓
chat_routes.py → chat_service.py (chat_with_ai)
  - Calls Google Gemini API
  - Logs event to events_collection
  - Returns response
         ↓
Response sent back to frontend
  - ChatPanel displays AI response
  - Message saved to localStorage
```

---

## Technology Stack

### Backend
- **Framework:** FastAPI 0.129.0
- **Server:** Uvicorn 0.40.0
- **Database:** MongoDB (pymongo 4.16.0)
- **AI Integration:** Google Generative AI (gemini-2.5-flash)
- **Authentication:** JWT (python-jose), Bcrypt password hashing
- **Validation:** Pydantic 2.12.5
- **Testing:** pytest 9.0.2, pytest-asyncio 1.3.0

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.3.1
- **Routing:** React Router DOM 7.13.0
- **HTTP Client:** Axios 1.13.5
- **Code Editor:** Monaco Editor 4.7.0
- **Styling:** Tailwind CSS 4.2.1
- **UI Elements:** Custom CSS + React components

### Infrastructure
- **Database:** MongoDB (cloud or local)
- **API Server:** Python FastAPI (http://localhost:8000)
- **Frontend Dev Server:** Vite (http://localhost:5173)

---

## Database Schema

### Collections Overview

MongoDB is used as the primary data store. All collections are created automatically when first data is inserted.

#### 1. **users** Collection
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "hashed_password": "$2b$12$...",  // bcrypt hashed
  "created_at": Date
}
```
**Purpose:** Store user account information  
**Accessed By:** auth_service.py, auth_routes.py

---

#### 2. **sessions** Collection
```javascript
{
  "_id": ObjectId,
  "session_id": "session_12345",
  "user_email": "candidate@example.com",
  "candidate_name": "John Doe",
  "status": "CREATED|IN_PROGRESS|COMPLETED",
  "created_at": Date,
  "started_at": Date,        // When candidate began coding
  "completed_at": Date,      // When session ended
  "time_limit_minutes": 60,
  "code_final": "# Python code here...",
  "task_requirements": [
    "Book Management",
    "Member Registration",
    "Loan Tracking",
    "Search",
    "Overdue Detection",
    "Error Handling"
  ]
}
```
**Purpose:** Track coding sessions and their metadata  
**Accessed By:** session_routes.py, session_service.py, GuidePage.jsx

---

#### 3. **events** Collection (Interaction Trace Φ)
**APPEND-ONLY LOG** — Events are never updated after insertion
```javascript
{
  "_id": ObjectId,
  "session_id": "session_12345",
  "event_type": "PROMPT|RESPONSE|CODE_SAVE|TEST_RUN|SESSION_START|SESSION_END",
  "timestamp": ISODate("2026-03-20T10:30:00Z"),
  "payload": {
    // Event-specific data varies by type
    "prompt": "How do I create a class?",                    // for PROMPT
    "response": "A class is...",                             // for RESPONSE
    "code_delta": "diff...",                                 // for CODE_SAVE
    "test_name": "test_checkout()",                          // for TEST_RUN
    "test_passed": true,
    "error_message": null
  }
}
```
**Purpose:** Complete audit trail of all session interactions  
**Accessed By:** event_service.py, evaluation_service.py, dashboard_service.py  
**Key Characteristic:** Append-only; ensures evaluation integrity

---

#### 4. **evaluations** Collection
```javascript
{
  "_id": ObjectId,
  "session_id": "session_12345",
  "computed_at": ISODate("2026-03-20T11:00:00Z"),
  "scores": {
    "G": { "PPR": 75, "RC": 90, "SOS": 85, "DDS": 80, "aggregate": 82.5 },
    "U": { "PSS": 88, "PPF": 92, "CIR": 85, "RP": 75, "TER": 80, "aggregate": 84 },
    "I": { "ERS": 70, "AR": 85, "RR": 90, "aggregate": 81.7 },
    "D": { "TFR": 60, "BDR": 70, "HCR": 50, "aggregate": 60 },
    "E": { "FC": 95, "SS": 88, "CQS": 90, "DQ": 92, "AC": 87, "aggregate": 90.4 }
  },
  "composite_q_score": 79.5,              // Final overall score
  "feedback": {
    "G": "Good understanding of requirements...",
    "U": "Effective AI utilization...",
    "I": "Minor implementation issues...",
    "D": "Could run tests earlier...",
    "E": "Excellent code quality..."
  },
  "rank": 15,                              // Position among all candidates
  "percentile": 72                         // 72nd percentile
}
```
**Purpose:** Store computed evaluation results  
**Accessed By:** evaluation_service.py, evaluation_routes.py, ResultsDashboard.jsx

---

#### 5. **judge_cache** Collection
```javascript
{
  "_id": ObjectId,
  "prompt_hash": "sha256hash",
  "score": 85,
  "reasoning": "String explaining the score",
  "created_at": ISODate(),
  "hit_count": 5,                         // How many times this was reused
  "cached_at": ISODate()
}
```
**Purpose:** Cache LLM Judge results to reduce API costs  
**Accessed By:** llm_judge.py  
**Benefit:** 30-40% reduction in API calls for repeated evaluations

---

#### 6. **token_budgets** Collection
```javascript
{
  "_id": ObjectId,
  "session_id": "session_12345",
  "tokens_total": 5000,                  // Allocated budget
  "tokens_used": 3421,                   // Tokens consumed
  "usage_percentage": 68.4,
  "warning_triggered": false,            // Alert at 80%
  "error_triggered": false,              // Hard limit at 95%
  "last_updated": ISODate()
}
```
**Purpose:** Track token usage per session for API cost control  
**Accessed By:** token_budgets tracking system

---

## Backend File Structure

### Root-Level Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI application entry point, registers all routers |
| `app/config.py` | Configuration settings loaded from .env |
| `app/database.py` | MongoDB connection and collection definitions |
| `app/__init__.py` | Package initializer |
| `pyrightconfig.json` | Python type checking configuration |
| `requirements.txt` | Python dependencies |

### Route Layer (`app/routes/`)

Routes handle incoming HTTP requests and delegate to services.

#### **auth_routes.py**
**Endpoints:**
- `POST /auth/signup` — Register new user
- `POST /auth/signin` — Login existing user
- `GET /auth/me` — Get current user profile (protected)

**Flow:** Request → validate with schema → call auth_service → return response

---

#### **chat_routes.py**
**Endpoints:**
- `POST /api/chat` — Send message to AI, receive response

**Purpose:** LLM Proxy layer  
**Flow:** 
1. Receive `{ session_id, prompt }`
2. Call `chat_service.chat_with_ai()`
3. Return `{ response: "...", session_id: "..." }`

---

#### **event_routes.py**
**Endpoints:**
- `POST /api/events` — Log an event to Interaction Trace Φ
- `GET /api/events/{session_id}` — Retrieve all events for session
- `GET /api/events/{session_id}/{event_type}` — Filter by event type

**Purpose:** Interaction logging system  
**Events Logged:** PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END

---

#### **test_routes.py**
**Endpoints:**
- `POST /api/test/execute` — Run Python code tests
- `GET /api/test/results/{session_id}` — Get test history

**Purpose:** Code execution and test validation  
**Outcome:** Logs TEST_RUN events to Φ

---

#### **evaluation_routes.py**
**Endpoints:**
- `POST /api/evaluate/{session_id}` — Trigger evaluation pipeline
- `GET /api/evaluate/{session_id}` — Retrieve stored evaluation result
- `GET /api/evaluations` — List all evaluations

**Purpose:** Interface for running and accessing evaluations

---

#### **dashboard_routes.py**
**Endpoints:**
- `GET /api/dashboard/sessions` — List all sessions
- `GET /api/dashboard/rankings` — Get candidate rankings
- `GET /api/dashboard/metrics/{session_id}` — Get detailed metrics

**Purpose:** Results visualization for hiring managers

---

#### **session_routes.py**
**Endpoints:**
- `POST /api/sessions` — Create new session
- `GET /api/sessions/{session_id}` — Get session details
- `PUT /api/sessions/{session_id}` — Update session (state changes)
- `POST /api/sessions/{session_id}/end` — End session and save final code

**Purpose:** Session lifecycle management

---

### Service Layer (`app/services/`)

Services contain business logic and database operations.

#### **auth_service.py**
**Functions:**
- `create_user(email, password)` — Register new user
  - Checks for existing email
  - Hashes password with bcrypt
  - Inserts into users collection
  
- `authenticate_user(email, password)` — Login user
  - Finds user by email
  - Verifies password
  - Creates JWT token

---

#### **chat_service.py**
**Functions:**
- `chat_with_ai(session_id, prompt)` — Send prompt to Gemini, get response
  - Calls Google Gemini API with retry logic
  - Falls back to mock responses if quota exceeded
  - Logs interaction to events collection
  - Tracks token usage
  
- `generate_mock_response(prompt)` — Generate realistic mock response
  - Keyword-based intelligent fallback
  - Used when API quota exhausted

---

#### **event_service.py**
**Functions:**
- `log_event(session_id, event_type, payload)` — Log single event to Φ
  - Timestamp automatically added
  - Returns event_id
  
- `get_session_events(session_id, event_type=None)` — Retrieve events
  - Optional filtering by event type
  - Chronologically sorted
  
- `get_session_timeline(session_id)` — Get events as timeline

---

#### **evaluation_service.py**
**Functions:**
- `run_evaluation(session_id)` — Compute all 5 pillars
  - Calls pillar_g.compute_goal_decomposition()
  - Calls pillar_u.compute_ai_utilization()
  - Calls pillar_i.compute_implementation()
  - Calls pillar_d.compute_detection()
  - Calls pillar_e.compute_execution()
  - Stores results in evaluations collection
  
- `get_evaluation(session_id)` — Retrieve computed evaluation
  
- `list_evaluations()` — Get all evaluations with rankings

---

#### **session_service.py**
**Functions:**
- `create_session(user_email, candidate_name, time_limit_minutes=60)` — Create new session
  
- `get_session(session_id)` — Retrieve session details
  
- `start_session(session_id)` — Mark session as IN_PROGRESS, set started_at
  
- `end_session(session_id, final_code)` — Mark as COMPLETED, save final code
  
- `list_sessions(user_email)` — Get sessions for user

---

#### **dashboard_service.py**
**Functions:**
- `get_all_sessions()` — Retrieve all sessions with metadata
  
- `compute_rankings()` — Rank candidates by composite_q_score
  
- `get_detailed_metrics(session_id)` — Get all metrics for session detail view

---

### Schema Layer (`app/schemas/`)

Pydantic schemas define request/response validation and documentation.

#### **user_schema.py**
```python
SignupRequest       # email, password
SigninRequest       # email, password
UserResponse        # email, message
TokenResponse       # email, message, access_token, token_type
```

---

#### **chat_schema.py**
```python
ChatRequest         # session_id, prompt
ChatResponse        # session_id, response, timestamp, token_count
```

---

#### **event_schema.py**
```python
EventPayload        # Flexible dict based on event_type
EventLog            # session_id, event_type, timestamp, payload
EventQueryResponse  # List of events with pagination
```

---

#### **session_schema.py**
```python
SessionCreate       # user_email, candidate_name, time_limit_minutes
SessionResponse     # session_id, status, created_at, started_at, etc.
SessionUpdate       # status, completed_at, etc.
```

---

#### **evaluation_schema.py**
```python
PillarScore         # aggregate score + component metrics
AllPillars          # G, U, I, D, E scores
EvaluationResult    # session_id, scores, feedback, rank, percentile
EvaluationResponse  # success, message, evaluation data
```

---

#### **dashboard_schema.py**
```python
SessionSummary      # For list view
MetricsDetail       # For detailed view
RankingEntry        # For rankings table
```

---

### Evaluation Pillars (`app/evaluation/`)

The 5-pillar evaluation system measuring different dimensions of developer capability.

#### **pillar_g.py** — Goal Decomposition (20% weight)
**Metrics:**
- **PPR** (Pre-Planning Ratio): Time before first prompt / total time
- **RC** (Requirement Coverage): % of requirements implemented
- **SOS** (Subtask Ordering Score): Quality of execution order
- **DDS** (Decomposition Depth Score): How well task is broken down

**Functions:**
- `compute_ppr(session_id)` → Score 0-100
- `compute_rc(session_id)` → Score 0-100
- `compute_sos(session_id)` → Score 0-100
- `compute_dds(session_id)` → Score 0-100
- `compute_goal_decomposition(session_id)` → Aggregate with weights

**Question Asked:** "How well does the candidate understand and plan before coding?"

---

#### **pillar_u.py** — AI Utilization (20% weight)
**Metrics:**
- **PSS** (Prompt Specificity Score): Quality and clarity of prompts
- **PPF** (Prompts-per-Feature): Efficiency of AI usage
- **CIR** (Context Injection Rate): % of prompts referencing candidate's code
- **RP** (Redundancy Penalty): Penalizes repetitive prompts
- **TER** (Token Efficiency Ratio): Useful output tokens / input tokens

**Functions:**
- `compute_pss(session_id)` → Score 0-100
- `compute_ppf(session_id)` → Score 0-100
- `compute_cir(session_id)` → Score 0-100
- `compute_ai_utilization(session_id)` → Aggregate with weights

**Question Asked:** "How effectively does the candidate use AI to solve problems?"

---

#### **pillar_i.py** — Implementation Quality (20% weight)
**Metrics:**
- **ERS** (Error Recovery Speed): Prompts needed to fix failed tests
- **AR** (Acceptance Rate): % of AI outputs used without modification
- **RR** (Regression Rate): Code stability metric

**Functions:**
- `compute_ers(session_id)` → Score 0-100
- `compute_ar(session_id)` → Score 0-100
- `compute_rr(session_id)` → Score 0-100
- `compute_implementation(session_id)` → Aggregate with weights

**Question Asked:** "How well does the candidate implement solutions?"

---

#### **pillar_d.py** — Detection & Validation (20% weight)
**Metrics:**
- **TFR** (Time-to-First-Run): Minutes until first test execution
  - Score: max(0, 1 - minutes/20) × 100
  - Fast testing (0 min) → 100, Slow testing (20+ min) → 0
  
- **BDR** (Bug Detection Rate): % of seeded bugs found
- **HCR** (Hallucination Catch Rate): % of AI mistakes caught

**Functions:**
- `compute_tfr(session_id)` → Score 0-100
- `compute_bdr(session_id)` → Score 0-100
- `compute_hcr(session_id)` → Score 0-100
- `compute_detection(session_id)` → Aggregate with weights

**Question Asked:** "How quickly does the candidate identify and fix errors?"

---

#### **pillar_e.py** — Execution Quality (20% weight)
**Metrics:**
- **FC** (Functional Completeness): % of features implemented & tested
- **SS** (Security Score): Vulnerability detection
- **CQS** (Code Quality Score): PEP 8 compliance, readability
- **DQ** (Documentation Quality): Comment-to-code ratio (target >15%)
- **AC** (Architectural Coherence): System design quality

**Functions:**
- `compute_fc(session_id)` → Score 0-100
- `compute_ss(session_id)` → Score 0-100
- `compute_cqs(session_id)` → Score 0-100
- `compute_dq(session_id)` → Score 0-100
- `compute_ac(session_id)` → Score 0-100
- `compute_execution_quality(session_id)` → Aggregate with weights

**Question Asked:** "What is the overall quality of the delivered solution?"

---

#### **llm_judge.py** — AI-Powered Scoring
**Functions:**
- `judge_code_quality(code)` → Score using Gemini with caching
- `judge_security(code)` → Security assessment
- `get_cached_judgment(prompt_hash)` → Check cache
- `cache_judgment(prompt_hash, result)` → Store result for reuse

**Key Feature:** Judge cache reduces API costs by 30-40%

---

#### **minimum_effort_validator.py** — Seeded Bug Detection
**Functions:**
- `inject_seeded_bugs(code)` → Add intentional bugs for testing
- `detect_seeded_bugs(final_code)` → Check if bugs were fixed
- `calculate_bdr(detected_count, total_bugs)` → Bug Detection Rate

---

### Dependencies (`app/dependencies/`)

#### **auth_dependency.py**
**Function:**
- `get_current_user(credentials)` — Extract and verify JWT token
  - Used with `Depends()` in protected routes
  - Raises 401 if token invalid or expired

---

### Utilities (`app/utils/`)

#### **hash_utils.py**
**Functions:**
- `hash_password(password)` → Bcrypt hash
- `verify_password(password, hash)` → Check password matches hash

---

#### **jwt_utils.py**
**Functions:**
- `create_access_token(data, expires_delta)` → Generate JWT token
- `verify_access_token(token)` → Decode and validate JWT

---

#### **retry_utils.py**
**Functions:**
- `retry_with_backoff(func, max_retries=3)` → Exponential backoff retry
  - Attempts: 1s, 2s, 4s
  - Used for Gemini API calls

---

## Frontend File Structure

### Root-Level Files

| File | Purpose |
|------|---------|
| `package.json` | Node dependencies (React, Vite, Axios, etc.) |
| `vite.config.js` | Vite build configuration |
| `eslint.config.js` | Linting rules |
| `index.html` | HTML entry point |
| `README.md` | Project instructions |

### Main Application (`src/`)

#### **main.jsx**
Entry point. Renders App component into DOM.

#### **App.jsx**
**Purpose:** Router configuration  
**Routes:**
- `/` → Signin
- `/signup` → Signup
- `/dashboard` → Dashboard
- `/hiring-manager` → Hiring Manager Dashboard
- `/session/:session_id` → CandidateOnboarding
- `/guide/:session_id` → GuidePage (main interface)
- `/results` → ResultsDashboard
- `/results/:sessionId` → Session detail view

---

#### **App.css, index.css**
Global styles and Tailwind imports.

---

### Pages (`src/pages/`)

#### **Signin.jsx**
**Purpose:** User login page  
**Flow:**
1. Input email, password
2. Call `/auth/signin` via auth service
3. Store JWT token in localStorage
4. Navigate to /dashboard or /guide

**Features:**
- Form validation
- Error message display
- Link to signup

---

#### **Signup.jsx**
**Purpose:** User registration page  
**Flow:**
1. Input email, password, confirm password
2. Call `/auth/signup` via auth service
3. Navigate to signin on success

---

#### **Dashboard.jsx**
**Purpose:** Main navigation hub  
**Features:**
- List of available sessions
- Create new session button
- Links to hiring manager dashboard
- User profile info
- Logout button

---

#### **GuidePage.jsx** (Main Coding Interface)
**Purpose:** The core candidate interface during coding session  

**State Management:**
- `sessionId` — From URL params
- `session` — Session details (fetched from backend)
- `code` — Current editor content
- `messages` — Chat history
- `timeRemaining` — Session timer
- `leftPanelOpen/rightPanelOpen` — Panel visibility toggles

**Timer Logic:**
- Fetches session.time_limit_minutes from backend
- Calculates remaining time: total_seconds - elapsed_seconds
- Counts down every second
- Shows warning at 10 minutes remaining
- Ends session automatically when timer reaches 0

**Panel Layout:**
```
┌─────────────────────────────────────┐
│ TaskSidebar | CodeEditor | ChatPanel│
└─────────────────────────────────────┘
```

**Event Logging:**
- `SESSION_START` when GuidePage mounts
- `CODE_SAVE` when code changes occur
- `PROMPT` when user sends chat message
- `RESPONSE` when AI responds
- `TEST_RUN` when running tests
- `SESSION_END` when timer expires or user clicks end

**Key Functions:**
- `handleCodeChange()` — Update code state, log CODE_SAVE
- `handleSendMessage()` → Call ChatPanel.handleSend()
- `handleRunTests()` — Execute tests, log TEST_RUN
- `togglePanel()` — Show/hide left or right panel
- `endSession()` — Save final code, call `/api/sessions/{id}/end`

---

#### **ResultsDashboard.jsx**
**Purpose:** Display evaluation results for a session  

**Features:**
- Composite Q score display (center circle)
- 5-pillar breakdown (radar chart)
- Individual metric details (with explanations)
- Trend chart over time (if multiple sessions)
- PillarDetailModal for deep dives
- Score breakdown table

**Data Flow:**
1. Get `sessionId` from URL or props
2. Call `GET /api/evaluate/{sessionId}`
3. Display results with visualizations

---

#### **HiringManagerDashboard.jsx**
**Purpose:** Admin interface for hiring managers  

**Features:**
- Create new evaluation session
- View all candidate sessions
- Session ranking table
- Detailed metrics per session
- Session status tracking

---

#### **CandidateOnboarding.jsx**
**Purpose:** Pre-session form collection  

**Flow:**
1. Display welcome message
2. Collect candidate name
3. Read task requirements
4. Call `/api/sessions` to create session
5. Redirect to `/guide/{session_id}`

---

### Components (`src/components/`)

#### **TaskSidebar.jsx**
**Purpose:** Left panel showing task requirements  

**Features:**
- Checklist of requirements:
  - Book Management
  - Member Registration
  - Loan Tracking
  - Search Functionality
  - Overdue Detection
  - Error Handling
- Progress indicator (completed items / total)
- Expandable sections
- Styling with Tailwind CSS

**Props:**
- `requirements` (array of requirement strings)

---

#### **CodeEditor.jsx**
**Purpose:** Monaco editor integration  

**Features:**
- Python syntax highlighting
- Dark theme
- Line numbers
- Minimap disabled
- Word wrap enabled
- Format on paste
- Ctrl+S save indicator

**Props:**
- `value` (code content)
- `onChange` (update handler)
- `readOnly` (disable editing)
- `theme` (vs-dark or vs-light)

**State:**
- `editorInstance` — Reference to Monaco editor
- `isSaving` — Indicates save status

---

#### **ChatPanel.jsx**
**Purpose:** Right panel for AI chat  

**Features:**
- Message thread display (user right, AI left)
- Typing indicator while waiting for response
- Token budget indicator (Phase 5.3)
- Auto-scroll to latest message
- localStorage persistence (chat history survives page refresh)
- Clear chat button

**State:**
- `messages` — Array of {role: "user"|"ai", content: "..."}
- `input` — Current text input
- `isLoading` — API call in progress
- `tokenBudget` — Remaining tokens

**Key Functions:**
- `handleSend()` — Send message to backend
  - Call `sendChatMessage(sessionId, prompt)`
  - Add user message to messages
  - Wait for response
  - Add AI message to messages
  - Save to localStorage

**Data Persistence:**
- Auto-saves messages to `localStorage.chat_{sessionId}`
- Loads from localStorage on component mount
- Survives page refresh, tab closure, browser restart

---

#### **TestPanel.jsx**
**Purpose:** Display test results and execution interface  

**Features:**
- Execute button to run tests
- Test results display
- Pass/fail indicators
- Error messages
- Test log output
- Execution time

**Props:**
- `sessionId` — Current session
- `code` — Code to execute
- `readOnly` — Disable if session ended

---

#### **ScoreRadarChart.jsx**
**Purpose:** Visualize 5-pillar scores as radar chart  

**Features:**
- 5-point radar (G, U, I, D, E)
- Click to show pillar details
- Color-coded by score range (red, yellow, green)
- Reference circles (50, 75, 100 scores)

---

#### **ScoreTrendChart.jsx**
**Purpose:** Show evaluation trends over multiple sessions  

**Features:**
- Line chart of Q-score over time
- Individual pillar trends
- Comparative view

---

#### **ScoreBreakdown.jsx**
**Purpose:** Detailed score table  

**Features:**
- All 19 metrics displayed
- Score ranges and meanings
- Strength/weakness identification

---

#### **SessionRankingTable.jsx**
**Purpose:** Candidate ranking display  

**Features:**
- Sortable columns
- Composite score
- Name, email, session status
- Filter by status
- Export to CSV

---

#### **PillarDetailModal.jsx**
**Purpose:** Deep dive into single pillar  

**Features:**
- Pillar definition
- All metrics for that pillar
- Detailed feedback
- Improvement suggestions

---

#### **TokenBudgetIndicator.jsx**
**Purpose:** Display API token usage (Phase 5.3)  

**Features:**
- Progress bar (0-100%)
- Usage percentage
- Warning at 80%
- Error state at 95%
- Tokens used / total budget

---

#### **ElectricBorder.jsx**
**Purpose:** Visual effect component  

**Features:**
- Animated border glow effect
- Customizable colors
- Used on main panels

---

#### **Particles.jsx**
**Purpose:** Background particle animation  

**Features:**
- Floating particle effect
- Customizable count and speed
- Canvas-based rendering

---

#### **ErrorBoundary.jsx**
**Purpose:** Catch React errors and display fallback UI  

**Features:**
- Catches errors in child components
- Error message display
- Reload button

---

### Services (`src/services/`)

#### **api.js**
**Purpose:** Centralized API client using Axios  

**Base URL:** `http://localhost:8000`

**Functions:**
- `signup(email, password)` → POST /auth/signup
- `signin(email, password)` → POST /auth/signin
- `sendChatMessage(sessionId, prompt)` → POST /api/chat
- `sendEvent(sessionId, eventType, payload)` → POST /api/events
- `triggerEvaluation(sessionId)` → POST /api/evaluate/{sessionId}
- `getEvaluation(sessionId)` → GET /api/evaluate/{sessionId}
- `getSessions()` → GET /api/dashboard/sessions
- `getSessionDetails(sessionId)` → GET /api/sessions/{sessionId}
- `createSession(name, timeLimitMinutes)` → POST /api/sessions
- `endSession(sessionId, finalCode)` → POST /api/sessions/{sessionId}/end

**Token Management:**
- Persists JWT in localStorage under key `jwt_token`
- Includes token in Authorization header for all requests
- Automatically appended to requests

---

### Utilities (`src/utils/`)

#### **localStorage.js** (if exists)
**Purpose:** Wrapper for localStorage operations  

**Common Keys:**
- `jwt_token` — Authentication token
- `chat_{sessionId}` — Chat history
- `session_{sessionId}` — Session state

---

## Features by Phase

### Phase 1: Candidate Interface & LLM Proxy
**Status:** ✅ Complete

**Features:**
- Three-panel layout (tasks, editor, chat)
- Monaco editor with Python syntax
- Google Gemini AI integration
- Real-time chat interface
- Basic message persistence

**Files Added:**
- All frontend components and pages
- chat_routes.py, chat_service.py
- chat_schema.py

---

### Phase 2: Interaction Trace Φ (Event Logging)
**Status:** ✅ Complete

**Features:**
- Append-only event log
- Event types: PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END
- Frontend event sending
- Backend event storage and retrieval
- Test execution framework

**Files Added:**
- event_routes.py, event_service.py
- event_schema.py
- events_collection in MongoDB
- test_routes.py, test_service.py

---

### Phase 3: Evaluation Engine (5 Pillars)
**Status:** ✅ Complete

**Features:**
- Pillar G: Goal Decomposition (planning and requirements)
- Pillar U: AI Utilization (prompt quality and efficiency)
- Pillar I: Implementation (code execution and stability)
- Pillar D: Detection & Validation (testing and bug catching)
- Pillar E: Execution Quality (final code quality)
- 19 metrics across all pillars
- Composite Q score (0-100)
- Automatic ranking and percentile calculation

**Files Added:**
- evaluation/ folder with pillar_*.py
- llm_judge.py for AI-powered scoring
- evaluation_routes.py, evaluation_service.py
- evaluation_schema.py
- evaluations_collection

---

### Phase 4: Interactive Feedback & Results Dashboard
**Status:** ✅ Complete

**Features:**
- Results dashboard with visualizations:
  - Radar chart (5 pillars)
  - Trend chart (historical performance)
  - Breakdown table (all 19 metrics)
- Candidate rankings
- Hiring manager dashboard
- Pillar detail modals
- Session ranking table
- Responsive design

**Files Added:**
- ResultsDashboard.jsx, HiringManagerDashboard.jsx
- ScoreRadarChart.jsx, ScoreTrendChart.jsx, ScoreBreakdown.jsx
- SessionRankingTable.jsx, PillarDetailModal.jsx
- dashboard_routes.py, dashboard_service.py
- dashboard_schema.py

---

### Phase 5: Enhanced Session Management & Production Features
**Status:** ⚠️ Partial (Session API complete, cache/budgets in progress)

**Features Implemented:**
- Full session lifecycle (CREATED → IN_PROGRESS → COMPLETED)
- Session state persistence
- Timer integration with backend session times
- Session-specific chat persistence
- Auto-end session on timer expiration
- Final code saving

**Features In Progress:**
- Token budget tracking (tokens_collection)
- Judge cache optimization (judge_cache_collection)
- Retry logic with exponential backoff
- Mock response fallback when API quota exceeded

**Files Added:**
- session_routes.py, session_service.py
- session_schema.py
- sessions_collection enhancements
- token_budgets_collection
- judge_cache_collection
- retry_utils.py, jwt_utils.py

---

## API Reference

### Authentication Endpoints

```
POST /auth/signup
Request:  { "email": "user@example.com", "password": "..." }
Response: { "email": "...", "message": "User registered successfully" }

POST /auth/signin
Request:  { "email": "user@example.com", "password": "..." }
Response: { "email": "...", "access_token": "...", "token_type": "bearer" }

GET /auth/me
Headers:  Authorization: Bearer <token>
Response: { "message": "You are authorized", "email": "..." }
```

### Chat Endpoints

```
POST /api/chat
Request:  { "session_id": "...", "prompt": "..." }
Response: { "session_id": "...", "response": "...", "token_count": {...} }
```

### Event Endpoints

```
POST /api/events
Request:  { "session_id": "...", "event_type": "...", "payload": {...} }
Response: { "event_id": "...", "event_type": "...", "timestamp": "..." }

GET /api/events/{session_id}
Response: [ { "event_type": "...", "timestamp": "...", "payload": {...} }, ... ]

GET /api/events/{session_id}/{event_type}
Response: [ { filtered events } ]
```

### Evaluation Endpoints

```
POST /api/evaluate/{session_id}
Response: { 
  "success": true, 
  "session_id": "...",
  "evaluation": {
    "scores": { "G": {...}, "U": {...}, ... },
    "composite_q_score": 79.5,
    "feedback": { "G": "...", ... }
  }
}

GET /api/evaluate/{session_id}
Response: { evaluation data }

GET /api/evaluations
Response: [ { evaluation 1 }, { evaluation 2 }, ... ]
```

### Session Endpoints

```
POST /api/sessions
Request:  { "user_email": "...", "candidate_name": "...", "time_limit_minutes": 60 }
Response: { "session_id": "...", "status": "CREATED", ... }

GET /api/sessions/{session_id}
Response: { "session_id": "...", "status": "...", "time_limit_minutes": ... }

PUT /api/sessions/{session_id}
Request:  { "status": "IN_PROGRESS" | "COMPLETED", ... }
Response: { updated session }

POST /api/sessions/{session_id}/end
Request:  { "final_code": "..." }
Response: { "message": "Session ended", "session": {...} }
```

### Dashboard Endpoints

```
GET /api/dashboard/sessions
Response: [ { session summary 1 }, { session summary 2 }, ... ]

GET /api/dashboard/rankings
Response: [
  { "rank": 1, "session_id": "...", "composite_q_score": 92.5, ... },
  ...
]

GET /api/dashboard/metrics/{session_id}
Response: { detailed metrics for session }
```

---

## Data Flow & Lifecycle

### Complete Session Lifecycle

```
1️⃣ USER CREATES ACCOUNT
   browser → POST /auth/signup → Database (users)
   ↓
2️⃣ USER LOGS IN
   browser → POST /auth/signin → Server verifies password
   ← JWT token returned, stored in localStorage
   ↓
3️⃣ USER VIEWS DASHBOARD
   GuidePage.jsx fetches GET /api/sessions/
   ↓
4️⃣ HIRING MANAGER CREATES SESSION
   HiringManagerDashboard.jsx → POST /api/sessions
   ← New session_id (status: CREATED)
   ↓
5️⃣ CANDIDATE STARTS SESSION
   CandidateOnboarding.jsx → Input name → Redirect to /guide/{session_id}
   GuidePage.jsx mounts
   ↓
6️⃣ SESSION BEGINS
   GuidePage → POST /api/events (SESSION_START)
   → event_service → events_collection receives { session_id, SESSION_START }
   Timer starts (from session.time_limit_minutes)
   ↓
7️⃣ CANDIDATE CODES & CHATS
   CodeEditor → onChange → Code state updated
   Code change logged: POST /api/events (CODE_SAVE)
   ChatPanel → handleSend() → POST /api/chat
   chat_service → Gemini API → Response logged (PROMPT + RESPONSE events)
   Messages saved to localStorage
   ↓
8️⃣ CANDIDATE RUNS TESTS
   TestPanel → Execute Tests → POST /api/test/execute
   Test results logged: POST /api/events (TEST_RUN)
   ↓
9️⃣ TIMER EXPIRES OR CANDIDATE CLICKS END
   Final session state: POST /api/sessions/{id}/end { final_code }
   → POST /api/events (SESSION_END)
   session.status = COMPLETED
   session.completed_at = now
   ↓
🔟 EVALUATION RUNS
   Backend (or manually) → POST /api/evaluate/{session_id}
   evaluation_service → runs all 5 pillars
   ← scores computed, stored in evaluations_collection
   ↓
1️⃣1️⃣ RESULTS DISPLAYED
   ResultsDashboard.jsx → GET /api/evaluate/{session_id}
   ← Display radar chart, metrics, feedback
   HiringManagerDashboard → GET /api/dashboard/rankings
   ← Display candidate rankings
```

### Chat Message Flow

```
User types "How do I create a class?" in ChatPanel
        ↓
handleSend() called
        ↓
sendChatMessage(sessionId, prompt) via axios
        ↓
POST /api/chat { session_id: "...", prompt: "..." }
        ↓
chat_routes.py → chat_endpoint()
        ↓
chat_service.chat_with_ai()
        ├─→ Try Gemini API with retry logic (1s, 2s, 4s backoff)
        ├─→ If quota exceeded: generate_mock_response()
        ├─→ Log PROMPT event: events_collection.insert_one()
        ├─→ Log RESPONSE event: events_collection.insert_one()
        └─→ Return { response: "...", session_id: "..." }
        ↓
Frontend receives response
        ↓
ChatPanel displays message
        ↓
localStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages))
```

### Evaluation Computation Flow

```
Backend trigger: POST /api/evaluate/{session_id}
        ↓
evaluation_service.run_evaluation(session_id)
        ├─→ Get all events for session: events_collection.find()
        ├─→ Call compute_goal_decomposition() [Pillar G]
        │   ├─→ compute_ppr() - Pre-planning ratio
        │   ├─→ compute_rc() - Requirement coverage
        │   ├─→ compute_sos() - Subtask ordering
        │   └─→ compute_dds() - Decomposition depth
        │
        ├─→ Call compute_ai_utilization() [Pillar U]
        │   ├─→ compute_pss() - Prompt specificity
        │   ├─→ compute_ppf() - Prompts per feature
        │   ├─→ compute_cir() - Context injection rate
        │   └─→ compute_usage_metrics() - Token efficiency
        │
        ├─→ Call compute_implementation() [Pillar I]
        │   ├─→ compute_ers() - Error recovery speed
        │   ├─→ compute_ar() - Acceptance rate
        │   └─→ compute_rr() - Regression rate
        │
        ├─→ Call compute_detection() [Pillar D]
        │   ├─→ compute_tfr() - Time to first test run
        │   ├─→ compute_bdr() - Bug detection rate
        │   └─→ compute_hcr() - Hallucination catch rate
        │
        └─→ Call compute_execution_quality() [Pillar E]
            ├─→ compute_fc() - Functional completeness
            ├─→ judge_code_quality() [with cache]
            ├─→ compute_dq() - Documentation quality
            ├─→ compute_ss() - Security score
            └─→ compute_ac() - Architectural coherence
        ↓
Aggregate scores → Compute composite_q_score
        ↓
Compute ranking (percentile, rank)
        ↓
evaluations_collection.insert_one(result)
        ↓
Return result to frontend
        ↓
ResultsDashboard displays visualization
```

---

## Complete Directory Tree

```
Interview_with_AI/
│
├── 📄 README.md                          # Project overview
├── 📄 GUIDE.MD                           # Complete guide documentation
├── 📄 requirements.txt                   # Python dependencies
├── 📄 pyrightconfig.json                 # Type checking config
├── 📄 pytest.ini                         # Testing configuration
│
├── 🔧 .env                               # Environment variables (NOT in repo)
│                                          # MONGO_URL, DATABASE_NAME, GEMINI_API_KEY, etc
│
├── 📁 app/                               # Backend FastAPI application
│   ├── 📄 __init__.py                    # Package initializer
│   ├── 📄 main.py                        # FastAPI app, router registration
│   ├── 📄 config.py                      # Settings from .env
│   ├── 📄 database.py                    # MongoDB connection & collections
│   │
│   ├── 📁 routes/                        # HTTP endpoint handlers
│   │   ├── 📄 auth_routes.py             # Signup, signin, /me
│   │   ├── 📄 chat_routes.py             # LLM proxy endpoint
│   │   ├── 📄 event_routes.py            # Event logging endpoints
│   │   ├── 📄 test_routes.py             # Test execution endpoints
│   │   ├── 📄 evaluation_routes.py       # Evaluation trigger/retrieve
│   │   ├── 📄 dashboard_routes.py        # Results and rankings
│   │   ├── 📄 session_routes.py          # Session lifecycle
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 services/                      # Business logic layer
│   │   ├── 📄 auth_service.py            # User registration/login logic
│   │   ├── 📄 chat_service.py            # Gemini API integration
│   │   ├── 📄 event_service.py           # Event logging operations
│   │   ├── 📄 test_service.py            # Test execution logic
│   │   ├── 📄 evaluation_service.py      # Orchestrate evaluation pillars
│   │   ├── 📄 session_service.py         # Session CRUD operations
│   │   ├── 📄 dashboard_service.py       # Metrics aggregation
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 schemas/                       # Pydantic validation schemas
│   │   ├── 📄 user_schema.py             # User request/response models
│   │   ├── 📄 chat_schema.py             # Chat request/response models
│   │   ├── 📄 event_schema.py            # Event models
│   │   ├── 📄 session_schema.py          # Session models
│   │   ├── 📄 evaluation_schema.py       # Evaluation result models
│   │   ├── 📄 dashboard_schema.py        # Dashboard display models
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 models/                        # Data model definitions
│   │   ├── 📄 user_model.py              # User document structure
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 evaluation/                    # 5-Pillar evaluation system
│   │   ├── 📄 __init__.py
│   │   ├── 📄 conftest.py                # pytest fixtures
│   │   ├── 📄 pillar_g.py                # Goal Decomposition (planning)
│   │   ├── 📄 pillar_u.py                # AI Utilization (prompt efficiency)
│   │   ├── 📄 pillar_i.py                # Implementation (code execution)
│   │   ├── 📄 pillar_d.py                # Detection & Validation (testing)
│   │   ├── 📄 pillar_e.py                # Execution Quality (final code)
│   │   ├── 📄 llm_judge.py               # AI-powered metric scoring
│   │   ├── 📄 minimum_effort_validator.py # Seeded bug detection
│   │   ├── 📄 test_evaluation_pipeline.py # Evaluation tests
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 dependencies/                  # Dependency injection
│   │   ├── 📄 auth_dependency.py         # JWT token verification
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 utils/                         # Utility functions
│   │   ├── 📄 hash_utils.py              # Password hashing (bcrypt)
│   │   ├── 📄 jwt_utils.py               # JWT token creation/verification
│   │   ├── 📄 retry_utils.py             # Retry logic w/ exponential backoff
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   ├── 📁 tests/                         # Backend test suite
│   │   ├── 📄 test_*.py                  # Various test files
│   │   └── 📄 __pycache__/               # Compiled Python cache
│   │
│   └── 📁 __pycache__/                   # Compiled Python cache
│
├── 📁 interview_with_ai_frontend/        # React frontend application
│   ├── 📄 package.json                   # Node dependencies
│   ├── 📄 vite.config.js                 # Vite build config
│   ├── 📄 eslint.config.js               # Linting rules
│   ├── 📄 index.html                     # HTML entry point
│   ├── 📄 README.md                      # Frontend instructions
│   │
│   ├── 📁 src/                           # Source code
│   │   ├── 📄 main.jsx                   # React entry point
│   │   ├── 📄 App.jsx                    # Router configuration
│   │   ├── 📄 App.css                    # Global styles
│   │   ├── 📄 index.css                  # Tailwind imports
│   │   │
│   │   ├── 📁 pages/                     # Page components
│   │   │   ├── 📄 Signin.jsx             # Login page
│   │   │   ├── 📄 Signup.jsx             # Registration page
│   │   │   ├── 📄 Dashboard.jsx          # Main hub (sessions list)
│   │   │   ├── 📄 GuidePage.jsx          # Core coding interface
│   │   │   ├── 📄 GuidePage.css          # Styling for guide page
│   │   │   ├── 📄 ResultsDashboard.jsx   # Evaluation results display
│   │   │   ├── 📄 ResultsDashboard.css   # Results styling
│   │   │   ├── 📄 HiringManagerDashboard.jsx # Admin interface
│   │   │   ├── 📄 HiringManagerDashboard.css
│   │   │   ├── 📄 CandidateOnboarding.jsx   # Pre-session form
│   │   │   └── 📄 CandidateOnboarding.css   # Onboarding styling
│   │   │
│   │   ├── 📁 components/                # Reusable components
│   │   │   ├── 📄 TaskSidebar.jsx        # Left panel: requirements
│   │   │   ├── 📄 CodeEditor.jsx         # Monaco editor wrapper
│   │   │   ├── 📄 ChatPanel.jsx          # Right panel: AI chat
│   │   │   ├── 📄 TestPanel.jsx          # Test results display
│   │   │   ├── 📄 ScoreRadarChart.jsx    # 5-pillar visualization
│   │   │   ├── 📄 ScoreTrendChart.jsx    # Historical trend chart
│   │   │   ├── 📄 ScoreBreakdown.jsx     # Detailed metrics table
│   │   │   ├── 📄 SessionRankingTable.jsx # Candidate rankings
│   │   │   ├── 📄 PillarDetailModal.jsx  # Deep dive detail view
│   │   │   ├── 📄 PillarDetailModal.css
│   │   │   ├── 📄 TokenBudgetIndicator.jsx # API usage indicator
│   │   │   ├── 📄 ElectricBorder.jsx     # Visual effect component
│   │   │   ├── 📄 ElectricBorder.css
│   │   │   ├── 📄 Particles.jsx          # Background particles
│   │   │   ├── 📄 Particles.css
│   │   │   ├── 📄 ErrorBoundary.jsx      # Error handling
│   │   │   └── 📄 [Component].css        # Individual component styles
│   │   │
│   │   ├── 📁 services/                  # API client & utilities
│   │   │   ├── 📄 api.js                 # Axios API client
│   │   │   └── 📄 [service].js           # Other service files
│   │   │
│   │   ├── 📁 utils/                     # Frontend utilities
│   │   │   └── 📄 [utility].js           # Utility functions
│   │   │
│   │   ├── 📁 assets/                    # Static assets
│   │   │   └── [images, icons, fonts]
│   │   │
│   │   └── 📁 node_modules/              # Installed packages (not in repo)
│   │
│   └── 📁 public/                        # Public static files
│       └── [favicon, manifest, etc]
│
├── 📁 IAI/                               # Python virtual environment
│   ├── 📄 pyvenv.cfg
│   ├── 📁 Scripts/                       # Python executables
│   ├── 📁 Include/                       # C headers
│   └── 📁 Lib/                           # Installed packages
│
├── 📁 README's/                          # Documentation from previous phases
│   ├── 📄 PHASE_1_IMPLEMENTATION_SUMMARY.md
│   ├── 📄 PHASE_1_VERIFICATION_STEPS.md
│   ├── 📄 PHASE_1_TEST_REPORT.md
│   ├── 📄 PHASE_2_COMPLETION_REPORT.md
│   ├── 📄 PHASE_2_IMPLEMENTATION_SUMMARY.md
│   ├── 📄 PHASE_3_IMPLEMENTATION_COMPLETE.md
│   ├── 📄 SECURITY_SCORE_IMPLEMENTATION.md
│   ├── 📄 SEEDED_BUGS_REFERENCE.md
│   └── [other documentation]
│
└── 📁 Tasks_Action_plans/                # Planning documents
    ├── 📄 implementation_plan_1
    ├── 📄 implementation_plan_2
    ├── 📄 implementation_plan_3
    ├── 📄 implementation_plan_4
    ├── 📄 task1, task2, task3, task4
    └── 📄 scratchpad2
```

---

## Quick Reference Guide

### Starting the Project

1. **Backend**
   ```bash
   cd app
   python -m venv IAI          # Create virtual environment
   source IAI/Scripts/activate # Activate (Windows: IAI\Scripts\activate)
   pip install -r requirements.txt
   
   # Create .env file with:
   # MONGO_URL=mongodb://localhost:27017
   # DATABASE_NAME=interview_with_ai
   # GEMINI_API_KEY=your_api_key
   # SECRET_KEY=your_secret_key
   # ALGORITHM=HS256
   # ACCESS_TOKEN_EXPIRE_MINUTES=60
   
   uvicorn app.main:app --reload  # Runs on http://localhost:8000
   ```

2. **Frontend**
   ```bash
   cd interview_with_ai_frontend
   npm install
   npm run dev  # Runs on http://localhost:5173
   ```

3. **Database**
   ```bash
   # Ensure MongoDB is running
   # Local: mongod command
   # Cloud: Connection string in .env
   ```

### Common Operations

**View API Documentation:**
- Navigate to http://localhost:8000/docs (Swagger UI)

**Run Tests:**
```bash
pytest app/evaluation/test_evaluation_pipeline.py
pytest app/tests/
```

**Check Code Quality:**
```bash
python check_errors.py
pylint app/
```

---

## Key Concepts

### Interaction Trace Φ (Phi)
An append-only event log capturing every action during a coding session:
- Immutable once written
- Foundation for evaluation
- Enables audit trail
- Supports session replay

### 5-Pillar Evaluation
- **G (Goal Decomposition):** Planning and requirement understanding
- **U (AI Utilization):** Prompt quality and efficiency
- **I (Implementation):** Code execution and stability
- **D (Detection & Validation):** Testing and error catching
- **E (Execution Quality):** Final code quality

### Composite Q Score
Weighted aggregate of all 5 pillars:
- Q = 0.20×G + 0.20×U + 0.20×I + 0.20×D + 0.20×E
- Range: 0-100
- Used for candidate ranking and hiring decisions

---

## Summary

This document provides a complete reference for understanding the GUIDE platform architecture, file organization, and component interactions. The system follows clean architecture principles with clear separation between routes (HTTP handling), services (business logic), and database operations.

The backend uses FastAPI and MongoDB for robust, scalable API development, while the frontend uses React and Vite for responsive user interfaces. The 5-pillar evaluation system comprehensively assesses developer capabilities in planning, AI collaboration, implementation, testing, and code quality.

**Total Components:**
- **Backend:** 7 route files, 7 service files, 6 schema files, 7 evaluation pillar files
- **Frontend:** 11 page files, 16 component files, 1 service file
- **Database:** 6 collections
- **API Endpoints:** 20+ routes

---

**Document Version:** 1.0  
**Last Updated:** March 20, 2026  
**Author:** Full Stack Analysis  
**Status:** Complete for Phases 1-4, Partial for Phase 5
