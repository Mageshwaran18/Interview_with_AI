# 📚 Interview With AI - Comprehensive Project Documentation

**Last Updated:** April 5, 2026  
**Project Status:** Phase 5 Complete (Session Management & Group Sessions)  
**Documentation Version:** 2.0

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Design](#database-design)
6. [Phase-by-Phase Overview](#phase-by-phase-overview)
7. [Authentication System](#authentication-system)
8. [Chat System (Phase 1)](#chat-system-phase-1)
9. [Interaction Trace (Phase 2)](#interaction-trace--phase-2)
10. [Evaluation Engine (Phase 3)](#evaluation-engine--phase-3)
11. [Dashboard System (Phase 4)](#dashboard-system--phase-4)
12. [Session Management (Phase 5)](#session-management--phase-5)
13. [API Endpoints](#api-endpoints)
14. [Frontend Architecture](#frontend-architecture)
15. [How the System Works - Complete Flow](#how-the-system-works--complete-flow)
16. [Running and Testing](#running-and-testing)

---

## Project Overview

### What is "Interview With AI"?

**Interview With AI** is a comprehensive platform that evaluates software engineers based on their ability to collaborate effectively with AI models. The system simulates a real-world coding challenge where candidates solve problems while interacting with an AI assistant.

### Key Goals

- **Collaborative Problem Solving:** Evaluate how candidates use AI effectively to solve problems
- **Real-time Evaluation:** Assess code quality, problem decomposition, iteration capability
- **Feedback-Driven:** Provide detailed feedback using 5-pillar GUIDE scoring system
- **Bulk Session Management:** Support hiring teams with group session creation and administration
- **Comprehensive Analytics:** Dashboard for tracking candidate performance across multiple dimensions

### Target Users

- **Candidates:** Engineers solving coding challenges with AI assistance
- **Hiring Managers:** Teams creating and managing interview sessions
- **Evaluators:** Professionals reviewing and analyzing candidate performance

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
│                                                                 │
│  ┌─────────────────────┐     ┌──────────────────────────────┐ │
│  │  Candidate Pages    │     │  Hiring Manager Pages        │ │
│  ├─────────────────────┤     ├──────────────────────────────┤ │
│  │ • GuidePage         │     │ • HiringManagerDashboard     │ │
│  │ • CodeEditor        │     │ • GroupSessionsPage          │ │
│  │ • ChatPanel         │     │ • DashboardPage              │ │
│  │ • SignUp/SignIn     │     │ • ResultsDashboard           │ │
│  │ • Onboarding        │     │                              │ │
│  └─────────────────────┘     └──────────────────────────────┘ │
└────────────────┬───────────────────────────────────┬───────────┘
                 │ HTTP/REST                        │
                 │ (Axios)                         │
    ┌────────────▼────────────────────────────────▼────────────┐
    │              FastAPI Backend Server                      │
    │  (Port: 8000 - uvicorn)                                 │
    │                                                         │
    │  ┌─────────────────────────────────────────────────┐  │
    │  │           Route Layer (APIRouter)               │  │
    │  │  • auth_routes.py → /auth/*                    │  │
    │  │  • chat_routes.py → /api/chat                  │  │
    │  │  • event_routes.py → /api/events               │  │
    │  │  • evaluation_routes.py → /api/evaluate        │  │
    │  │  • dashboard_routes.py → /api/dashboard        │  │
    │  │  • session_routes.py → /api/sessions           │  │
    │  │  • test_routes.py → /api/test-code             │  │
    │  └────────────┬────────────────────────────────────┘  │
    │              │                                         │
    │  ┌───────────▼──────────────────────────────────────┐ │
    │  │         Service Layer (Business Logic)           │ │
    │  │  • auth_service.py → User signup/signin         │ │
    │  │  • chat_service.py → Gemini AI integration      │ │
    │  │  • session_service.py → Session lifecycle mgmt  │ │
    │  │  • evaluation_service.py → GUIDE scoring        │ │
    │  │  • dashboard_service.py → Analytics & stats     │ │
    │  │  • email_service.py → Notifications             │ │
    │  │  • event_service.py → Event logging             │ │
    │  └────────────┬────────────────────────────────────┘ │
    │              │                                         │
    │  ┌───────────▼──────────────────────────────────────┐ │
    │  │        Database Layer (MongoDB)                  │ │
    │  │  • users_collection                             │ │
    │  │  • sessions_collection                          │ │
    │  │  • chat_logs_collection                         │ │
    │  │  • events_collection                            │ │
    │  │  • evaluations_collection                       │ │
    │  │  • judge_cache_collection                       │ │
    │  │  • token_budgets_collection                     │ │
    │  └────────────────────────────────────────────────┘ │
    └─────────────────┬──────────────────────────────────────┘
                      │
    ┌─────────────────▼──────────────────────────────────┐
    │        External Services                           │
    │  • MongoDB Database                               │
    │  • Google Gemini AI API (Chat)                   │
    │  • Google Generative AI (Judge - Evaluation)     │
    │  • SMTP Email Service                            │
    └─────────────────────────────────────────────────────┘
```

### Request/Response Flow

```
User Action (Frontend)
  ↓
HTTP Request (with JWT token)
  ↓
FastAPI Route Handler
  ↓
Authentication Check (JWT validation)
  ↓
Service Layer (Business Logic)
  ↓
Database Operation (MongoDB)
  ↓
Response Formation
  ↓
HTTP Response (JSON)
  ↓
Frontend State Update & Render
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.129.0 | REST API framework with async support |
| **Server** | Uvicorn | 0.40.0 | ASGI server for running FastAPI |
| **Database** | MongoDB | 4.x | NoSQL document database |
| **Driver** | PyMongo | 4.16.0 | Python MongoDB driver |
| **Auth** | python-jose | 3.5.0 | JWT token generation & validation |
| **Password** | bcrypt + passlib | 4.0.1, 1.7.4 | Password hashing & verification |
| **AI/LLM** | google-generativeai | 0.8.6 | Gemini API integration |
| **Validation** | Pydantic | 2.12.5 | Data validation & serialization |
| **Testing** | pytest | 9.0.2 | Unit & integration testing |
| **Configuration** | python-dotenv | 1.2.1 | Environment variable management |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 19.2.0 | UI framework |
| **Build Tool** | Vite | 7.3.1 | Fast bundler |
| **Styling** | Tailwind CSS | 4.2.1 | Utility-first CSS |
| **Editor** | Monaco Editor | 4.7.0 | Code editor (same as VS Code) |
| **Routing** | React Router | 7.13.0 | Page routing |
| **HTTP Client** | Axios | 1.13.5 | HTTP requests |
| **Animation** | GSAP | 3.14.2 | Smooth animations |
| **3D Graphics** | Three.js | 0.170.0 | 3D visualization |
| **Linting** | ESLint | 9.39.1 | Code quality |

### Infrastructure

- **OS:** Windows/Linux compatible
- **Python:** 3.9+ required
- **Node.js:** 16+ for frontend build
- **Port Configuration:**
  - Backend: `8000` (uvicorn)
  - Frontend: `5173` (Vite dev server)
- **CORS:** Configured for localhost development

---

## Project Structure

### Directory Layout

```
Interview_with_AI/
│
├── 📄 Main Configuration Files
│   ├── .env                          # Environment variables (SECRET!)
│   ├── requirements.txt               # Python dependencies
│   ├── pyrightconfig.json            # Pylance configuration
│   ├── pytest.ini                    # Testing configuration
│   ├── Doc.MD                        # Basic documentation
│   ├── GUIDE.MD                      # Phase documentation
│   └── System_and_File.md            # System overview
│
├── 📁 app/                           # Backend Python application
│   ├── __init__.py
│   ├── main.py                       # FastAPI app entry point ⭐
│   ├── config.py                     # Settings & environment config
│   ├── database.py                   # MongoDB connection & collections
│   │
│   ├── 📁 models/                    # Data models (MongoDB schemas)
│   │   └── user_model.py             # User data structure
│   │
│   ├── 📁 schemas/                   # Pydantic validation schemas
│   │   ├── user_schema.py            # Auth request/response
│   │   ├── chat_schema.py            # Chat request/response
│   │   ├── session_schema.py         # Session lifecycle schemas
│   │   ├── event_schema.py           # Event logging schemas
│   │   ├── evaluation_schema.py      # Evaluation result schemas
│   │   └── dashboard_schema.py       # Dashboard data schemas
│   │
│   ├── 📁 routes/                    # API endpoint definitions ⭐
│   │   ├── auth_routes.py            # /auth/* endpoints
│   │   ├── chat_routes.py            # /api/chat endpoint
│   │   ├── session_routes.py         # /api/sessions/* endpoints
│   │   ├── event_routes.py           # /api/events/* endpoints
│   │   ├── evaluation_routes.py      # /api/evaluate/* endpoints
│   │   ├── dashboard_routes.py       # /api/dashboard/* endpoints
│   │   └── test_routes.py            # /api/test-code endpoint
│   │
│   ├── 📁 services/                  # Business logic layer ⭐
│   │   ├── auth_service.py           # User signup/signin logic
│   │   ├── chat_service.py           # Gemini API integration
│   │   ├── session_service.py        # Session lifecycle management
│   │   ├── evaluation_service.py     # GUIDE scoring logic
│   │   ├── dashboard_service.py      # Analytics & statistics
│   │   ├── email_service.py          # SMTP email notifications
│   │   ├── event_service.py          # Event logging
│   │   └── test_service.py           # Code execution testing
│   │
│   ├── 📁 evaluation/                # 5-Pillar evaluation system
│   │   ├── __init__.py
│   │   ├── conftest.py               # Pytest configuration
│   │   ├── llm_judge.py              # LLM judge prompting
│   │   ├── minimum_effort_validator.py  # Minimum effort checks
│   │   ├── pillar_g.py               # Goal Decomposition
│   │   ├── pillar_u.py               # Usage Efficiency
│   │   ├── pillar_i.py               # Iteration & Refinement
│   │   ├── pillar_d.py               # Detection & Validation
│   │   ├── pillar_e.py               # End Result Quality
│   │   └── test_evaluation_pipeline.py # Evaluation tests
│   │
│   ├── 📁 dependencies/              # Dependency injection
│   │   └── auth_dependency.py        # JWT validation & user extraction
│   │
│   ├── 📁 utils/                     # Utility functions
│   │   ├── retry_utils.py            # Exponential backoff retry logic
│   │   └── (other utilities)
│   │
│   └── 📁 tests/                     # Unit tests
│       └── (test files)
│
├── 📁 interview_with_ai_frontend/    # React Frontend Application ⭐
│   ├── package.json                  # npm dependencies
│   ├── vite.config.js                # Vite build configuration
│   ├── index.html                    # HTML entry point
│   ├── eslint.config.js              # ESLint rules
│   │
│   ├── 📁 src/
│   │   ├── main.jsx                  # Frontend entry point
│   │   ├── App.jsx                   # Root component & routing
│   │   ├── App.css                   # Root styling
│   │   │
│   │   ├── 📁 pages/                 # Page components ⭐
│   │   │   ├── Signin.jsx            # Login page
│   │   │   ├── Signup.jsx            # Registration page
│   │   │   ├── GuidePage.jsx         # Coding interview interface
│   │   │   ├── CandidateOnboarding.jsx # Candidate orientation
│   │   │   ├── HiringManagerDashboard.jsx # Manager interface
│   │   │   ├── GroupSessionsPage.jsx # Bulk session creation
│   │   │   ├── ResultsDashboard.jsx  # Evaluation results view
│   │   │   ├── Dashboard.jsx         # Analytics dashboard
│   │   │   └── ShapeDemo.jsx         # 3D demo component
│   │   │
│   │   ├── 📁 components/            # Reusable UI components
│   │   │   ├── TaskSidebar.jsx       # Requirements checklist
│   │   │   ├── CodeEditor.jsx        # Monaco editor wrapper
│   │   │   ├── ChatPanel.jsx         # AI chat UI
│   │   │   └── (other components)
│   │   │
│   │   ├── 📁 services/              # Frontend API consumers
│   │   │   ├── authService.js        # Auth API calls
│   │   │   ├── chatService.js        # Chat API calls
│   │   │   ├── sessionService.js     # Session API calls
│   │   │   ├── evaluationService.js  # Evaluation API calls
│   │   │   └── (other services)
│   │   │
│   │   └── 📁 utils/                 # Frontend utilities
│   │       ├── tokenUtils.js         # JWT token management
│   │       └── (other utilities)
│   │
│   ├── 📁 public/                    # Static assets
│   │
│   └── 📁 assets/                    # Images & resources
│
├── 📁 Doc_Dumps/                     # Documentation & notes
│   ├── IMPLEMENTATION_CHECKLIST.md
│   ├── PHASE_4_COMPLETION_REPORT.md
│   ├── ERRORS_FIXED_SUMMARY.md
│   └── (various reference docs)
│
├── 📁 README's/                      # Phase-specific documentation
│   ├── PHASE_1_IMPLEMENTATION_SUMMARY.md
│   ├── PHASE_2_COMPLETION_REPORT.md
│   ├── PHASE_3_FINAL_STATUS.md
│   └── (other phase docs)
│
├── 📁 Tasks_Action_plans/            # Development planning
│   ├── implementation_plan_1
│   ├── implementation_plan_2
│   └── (other plans)
│
├── 📁 IAI/                           # Python virtual environment
│   ├── pyvenv.cfg
│   ├── Scripts/                      # Virtual env executables
│   └── Lib/                          # Installed packages
│
└── 📄 README.md                      # Main project README
```

### Key Files Explained

| File | Purpose | Type |
|------|---------|------|
| `app/main.py` | FastAPI app initialization, route mounting, CORS setup, MongoDB connection check | Entry Point |
| `app/config.py` | Environment variable loading, settings validation | Configuration |
| `app/database.py` | MongoDB connection, collection initialization | Database |
| `app/routes/*` | HTTP endpoint handlers | Routes |
| `app/services/*` | Business logic, external API calls, data processing | Services |
| `interview_with_ai_frontend/src/App.jsx` | Frontend routing, page layout | Frontend |
| `.env` | Secrets: API keys, DB URL, JWT secret | Secrets |
| `requirements.txt` | Python package dependencies | Dependencies |

---

## Database Design

### MongoDB Collections

#### 1. **users_collection**
Stores user account information.

```javascript
{
  _id: ObjectId,
  email: "candidate@example.com",        // Unique identifier
  password_hash: "$2b$12$...",           // Bcrypt hash
  created_at: ISODate("2026-04-05T..."), // Registration timestamp
  last_login: ISODate("2026-04-05T..."), // Last login time
  profile: {
    name: "John Doe",                    // User's full name
    experience_level: "mid",             // junior|mid|senior
  },
  role: "candidate"                      // candidate|hiring_manager
}
```

#### 2. **sessions_collection**
Stores interview session metadata and state.

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",          // Unique session ID
  candidate_id: "user_123",              // Reference to user
  group_id: "group_456",                 // For bulk sessions
  state: "IN_PROGRESS",                  // IN_PROGRESS|COMPLETED|EVALUATED
  problem: "Library Management System",  // Problem description
  candidate_name: "John Doe",
  time_limit_minutes: 60,
  start_time: ISODate("2026-04-05T..."),
  submitted_at: ISODate("2026-04-05T..."),
  invitation_window: {
    start: ISODate("2026-04-05T..."),    // Window start (Asia/Kolkata)
    end: ISODate("2026-04-05T..."),      // Window end
    timezone: "Asia/Kolkata"
  },
  final_code: "def solve():\n...",       // Submitted code
  composite_q_score: 78.5,               // Evaluation composite score
  token_budget: {
    total: 50000,
    used: 32450,
    remaining: 17550
  }
}
```

#### 3. **chat_logs_collection**
Stores individual chat interactions (prompt-response pairs).

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",
  timestamp: ISODate("2026-04-05T..."),
  interaction_number: 1,
  prompt: "How do I store data in Python?",
  response: "You can use...",
  source: "gemini",                      // gemini|mock
  token_count: {
    prompt_tokens: 45,
    response_tokens: 128,
    total_tokens: 173
  }
}
```

#### 4. **events_collection** (Interaction Trace Φ)
Append-only log of all actions during a session.

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",
  timestamp: ISODate("2026-04-05T..."),
  event_type: "CHAT_MESSAGE|CODE_SAVE|TEST_RUN|SESSION_START|...",
  actor: "candidate",
  details: {
    // Event-specific details vary by type
    prompt: "...",
    response: "...",
    code_lines_changed: 15,
    test_output: "...",
    error_fixed: true
  }
}
```

#### 5. **evaluations_collection**
Stores computed GUIDE scores and evaluation results.

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",
  evaluated_at: ISODate("2026-04-05T..."),
  composite_q_score: 78.5,               // Overall score (0-100)
  pillars: {
    G: {                                 // Goal Decomposition
      score: 75,
      sub_metrics: [
        { name: "Problem Breakdown", score: 78 },
        { name: "Requirement Understanding", score: 72 }
      ]
    },
    U: {                                 // Usage Efficiency
      score: 82,
      sub_metrics: [...]
    },
    I: {                                 // Iteration & Refinement
      score: 68,
      sub_metrics: [...]
    },
    D: {                                 // Detection & Validation
      score: 79,
      sub_metrics: [...]
    },
    E: {                                 // End Result Quality
      score: 80,
      sub_metrics: [...]
    }
  },
  minimum_effort_status: "PASSED",       // PASSED|FAILED|WARNING
  reasoning: "Detailed evaluation explanation..."
}
```

#### 6. **judge_cache_collection**
LLM judge result cache to reduce API costs.

```javascript
{
  _id: ObjectId,
  prompt_hash: "sha256_hash_of_prompt",  // Deduplication key
  metric_id: "metric_goal_clarity",
  score: 75,
  reasoning: "...",
  created_at: ISODate("2026-04-05T..."),
  hit_count: 3                           // How many times used
}
```

#### 7. **token_budgets_collection**
Tracks AI API token usage per session.

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",
  tokens: {
    total: 50000,                        // Token budget
    used: 32450,                         // Consumed so far
    remaining: 17550,
    usage_percentage: 64.9
  },
  updated_at: ISODate("2026-04-05T..."),
  warning_triggered: false
}
```

### Indexes (for performance)

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })

// Sessions (for quick lookup and filtering)
db.sessions.createIndex({ session_id: 1 }, { unique: true })
db.sessions.createIndex({ candidate_id: 1 })
db.sessions.createIndex({ group_id: 1 })
db.sessions.createIndex({ state: 1 })

// Chat logs (for chronological retrieval)
db.chat_logs.createIndex({ session_id: 1, timestamp: 1 })

// Events (core query pattern)
db.events.createIndex({ session_id: 1, timestamp: 1 })

// Evaluations
db.evaluations.createIndex({ session_id: 1 }, { unique: true })

// Judge cache (deduplication)
db.judge_cache.createIndex({ prompt_hash: 1, metric_id: 1 }, { unique: true })
```

---

## Phase-by-Phase Overview

### Phase 1: LLM Proxy & Code Interface ✅
**Status:** Complete  
**Date:** March 2026

**Features:**
- User authentication (signup/signin with JWT)
- Code editor (Monaco Editor, Python syntax)
- AI chat interface (Gemini API integration)
- Real-time token counting
- Mock response fallback

**Key Files:**
- `app/services/chat_service.py` - Gemini API wrapper
- `app/routes/chat_routes.py` - Chat endpoint
- `interview_with_ai_frontend/src/pages/GuidePage.jsx` - Main UI

**Schema:**
- `chat_logs_collection`
- `token_budgets_collection`

---

### Phase 2: Instrumentation & Event Logging ✅
**Status:** Complete

**Features:**
- Event logging system (all user actions)
- Interaction trace (append-only log)
- Event correlation by session
- Multiple event types

**Event Types:**
```
SESSION_START       → User starts interview
CHAT_MESSAGE        → User sends prompt, AI responds
CODE_SAVE           → Code changes submitted
CODE_EXECUTE        → Code execution initiated
TEST_RUN            → Unit tests executed
TEST_PASSED         → Test passes
TEST_FAILED         → Test fails with error
ERROR_ENCOUNTERED   → Runtime/syntax error
ERROR_FIXED         → Error resolved
SESSION_END         → Session completed
EVALUATION_STARTED  → Evaluation begins
EVALUATION_PASSED   → Evaluation succeeded
```

**Key Files:**
- `app/services/event_service.py` - Event logging (SYNCHRONOUS entry point for all event logging)
- `app/routes/event_routes.py` - Event API
- `app/schemas/event_schema.py` - Event schemas

**Schema:**
- `events_collection` (Interaction Trace Φ - append-only log of all session events)

**Implementation Notes (April 5, 2026 Update):**
- `log_event()` function changed from `async def` to `def` (synchronous)
- MongoDB via PyMongo is inherently blocking, so synchronous approach is appropriate
- Removed complex `asyncio.get_event_loop()` logic from callers
- All event logging calls throughout the system now use simple synchronous pattern: `log_event(...)`
- This fixed critical error: "There is no current event loop in thread 'AnyIO worker thread'"

---

### Phase 3: Evaluation Engine - 5-Pillar GUIDE ✅
**Status:** Complete

**Features:**
- 5-pillar evaluation system
- LLM Judge for metric scoring
- Judge cache for cost reduction
- Minimum effort validator
- Composite Q score calculation

**The 5 Pillars:**

1. **G (Goal Decomposition)** - 20% weight
   - Problem Breakdown
   - Requirement Understanding
   - Scope Definition
   - Specification Clarity

2. **U (Usage Efficiency)** - 25% weight
   - Prompt Quality
   - Context Relevance
   - Question Specificity
   - Effective Utilization

3. **I (Iteration & Refinement)** - 20% weight
   - Problem-Solving Dynamics
   - Feedback Integration
   - Error Recovery
   - Adaptive Strategies

4. **D (Detection & Validation)** - 15% weight
   - Error Awareness
   - Code Quality Testing
   - Edge Case Coverage
   - Solution Verification

5. **E (End Result Quality)** - 20% weight
   - Functionality
   - Code Readability
   - Performance
   - Maintainability

**Key Files:**
- `app/services/evaluation_service.py` - Orchestrator
- `app/evaluation/pillar_*.py` - Individual pillar logic
- `app/evaluation/llm_judge.py` - LLM prompting
- `app/evaluation/minimum_effort_validator.py` - Effort checks

**Schema:**
- `evaluations_collection`
- `judge_cache_collection`

---

### Phase 4: Interactive Dashboard & Results ✅
**Status:** Complete

**Features:**
- Results dashboard with detailed metrics
- Rankings and statistics
- Pillar breakdowns with sub-metrics
- Group filtering for bulk sessions
- Responsive design

**Key Pages:**
- `ResultsDashboard.jsx` - Evaluation detail view
- `Dashboard.jsx` - Analytics overview
- `HiringManagerDashboard.jsx` - Manager tools

**Key Files:**
- `app/services/dashboard_service.py` - Analytics logic
- `app/routes/dashboard_routes.py` - Dashboard APIs

---

### Phase 5: Session Management & Group Sessions ✅
**Status:** Complete

**Features:**
- Single session lifecycle management
- Bulk session creation for hiring teams
- CSV bulk processing
- Time window enforcement (invitation + completion)
- Automated email notifications
- Dry-run validation before sending
- Session group tracking

**Key Flows:**

**Single Session (Candidate)**
```
1. Hiring Manager creates session → invitation link generated
2. Candidate receives email with link + window info
3. Candidate onboards, accepts terms
4. Session starts (window check)
5. Candidate works within time limit
6. Candidate submits code (end session)
7. Evaluation triggered automatically
8. Results available on dashboard
```

**Bulk Session (Group)**
```
1. Manager uploads CSV (Name, Email)
2. Input validation (max 20 candidates)
3. Auto-generate session details (problem, duration, template)
4. Dry-run execution (validation, email preview)
5. Manager reviews & confirms
6. Bulk email dispatch (with session links & windows)
7. Dashboard shows group metrics
8. Manager tracks participation status
```

**Key Constraints:**
- Current time must be within invitation window to start
- Session must be submitted before window expires
- 60 minute default duration
- Time zone: Asia/Kolkata for bulk sessions
- Maximum 20 candidates per bulk creation
- CSV format: Name, Email

**Key Files:**
- `app/services/session_service.py` - Session lifecycle
- `app/routes/session_routes.py` - Session endpoints
- `interview_with_ai_frontend/src/pages/GroupSessionsPage.jsx` - Bulk UI (April 5, 2026 Update)
- `app/services/email_service.py` - Notifications

**UI/UX Improvements (April 5, 2026):**
- Date selection: Dropdown picker showing next 31 days (formatted dates)
- Time selection: Text input with "HH:MM AM/PM" format template
- Separate date and time fields for better usability
- Real-time format validation and conversion
- Default times automatically set to current + 2 hours

**New Schemas:**
- `BulkSessionCreateRequest` - CSV + metadata
- `BulkSessionCreateResponse` - Result summary
- `SessionGroupSummary` - Group tracking

---

## Authentication System

### How Authentication Works

```
┌─────────────────────────────────────────────────────────┐
│              Authentication Flow Diagram                │
└─────────────────────────────────────────────────────────┘

SIGNUP:
User Email + Password
    ↓
Route: POST /auth/signup
    ↓
auth_service.create_user()
    ├─ Check if email exists
    ├─ Hash password (bcrypt)
    ├─ Insert user into MongoDB
    └─ Return user ID
    ↓
Frontend stores user ID

SIGNIN:
User Email + Password
    ↓
Route: POST /auth/signin
    ↓
auth_service.authenticate_user()
    ├─ Find user in DB
    ├─ Verify password (bcrypt)
    ├─ Generate JWT token
    │  - Payload: email, expiry
    │  - Secret: SECRET_KEY from .env
    │  - Algorithm: HS256
    └─ Return token
    ↓
Frontend stores token in localStorage
    token = "eyJhbGc..."

PROTECTED REQUESTS:
Frontend makes request with token
    ↓
Route: GET /api/me
    Header: Authorization: Bearer <token>
    ↓
Dependency: get_current_user()
    ├─ Extract token from header
    ├─ Decode JWT
    ├─ Validate signature
    ├─ Check expiry
    └─ Return email (or Error 401)
    ↓
Handler can use email from dependency
    ↓
Response


┌─────────────────────────────────────────────────────────┐
│              JWT Token Structure                        │
└─────────────────────────────────────────────────────────┘

Token = Base64(Header).Base64(Payload).Base64(Signature)

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "email": "user@example.com",
  "exp": 1649000000  // Expiry: current time + 60 minutes
}

Signature:
HMACSHA256(Base64(Header).Base64(Payload), SECRET_KEY)
```

### Implementation Files

| File | Purpose |
|------|---------|
| `app/services/auth_service.py` | Password hashing, user creation, authentication logic |
| `app/routes/auth_routes.py` | `/auth/signup`, `/auth/signin`, `/auth/me` endpoints |
| `app/dependencies/auth_dependency.py` | JWT extraction and validation |
| `app/utils/hash_utils.py` | Bcrypt password operations |
| `app/schemas/user_schema.py` | Request/response validation |

### Token Lifecycle

1. **Generation** (signin)
   - User provides email + password
   - System verifies credentials
   - JWT generated with 60-minute expiry
   - Token sent to frontend

2. **Storage** (frontend)
   - Token stored in `localStorage`
   - Key: typically `auth_token`
   - Retrieved on page load

3. **Usage** (authenticated requests)
   - Token added to `Authorization: Bearer <token>` header
   - Server extracts and validates
   - User email available to handler

4. **Expiry**
   - After 60 minutes, token becomes invalid
   - Frontend detects 401 error
   - User redirected to signin

---

## Chat System (Phase 1)

### Chat Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│           Chat Interaction Flow                        │
└─────────────────────────────────────────────────────────┘

Frontend (ChatPanel.jsx)
    │
    ├─ User types message
    ├─ User clicks "Send"
    │
    ↓
HTTP POST /api/chat
    ├─ Body: { session_id, prompt }
    ├─ Header: Authorization: Bearer <token>
    │
    ↓
Backend Route Handler (chat_routes.py)
    ├─ Extract session_id, prompt
    ├─ Validate JWT
    │
    ↓
Service: chat_with_ai() (chat_service.py)
    │
    ├─ Try: Call Gemini API with retry logic
    │  ├─ Attempt 1: Wait 1s, retry on timeout
    │  ├─ Attempt 2: Wait 2s, retry on timeout
    │  ├─ Attempt 3: Wait 4s, retry on timeout
    │  └─ If all fail: Use mock response
    │
    ├─ If Gemini quota exceeded:
    │  └─ Use intelligent mock response (keyword-based)
    │
    ├─ Extract response text
    ├─ Count tokens (prompt + response)
    │
    ↓
Logging:
    ├─ Insert chat interaction → chat_logs_collection
    ├─ Update token budget → token_budgets_collection
    ├─ Log event → events_collection (EVENT.TYPE: CHAT_MESSAGE)
    │
    ↓
Response:
    ├─ Return { response, session_id, source, token_count }
    │
    ↓
Frontend (ChatPanel.jsx)
    ├─ Append AI response to chat history
    ├─ Update token usage counter
    ├─ Scroll to latest message
    └─ Re-enable send button


┌─────────────────────────────────────────────────────────┐
│           Chat Data Model                             │
└─────────────────────────────────────────────────────────┘

Single Chat Interaction:
{
  id: "chat_001",
  session_id: "session_xyz",
  timestamp: "2026-04-05T10:30:00Z",
  
  prompt: {
    text: "How should I implement error handling?",
    tokens: 10
  },
  
  response: {
    text: "Use try-except blocks...",
    tokens: 156,
    source: "gemini"  // or "mock"
  },
  
  total_tokens: 166,
  duration_ms: 1250  // API response time
}
```

### Gemini API Integration

```python
# Configuration
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

# API Call
response = model.generate_content(prompt)
response_text = response.text
token_count = {
    'prompt_tokens': response.usage_metadata.prompt_token_count,
    'response_tokens': response.usage_metadata.candidates_token_count,
    'total_tokens': response.usage_metadata.total_token_count
}
```

### Key Features

1. **Exponential Backoff Retry** (Phase 5.4)
   - 3 attempts: 1s, 2s, 4s wait times
   - Handles temporary API timeouts
   - Improves reliability

2. **Mock Response Fallback**
   - When API quota exhausted
   - Keyword-based intelligent responses
   - Maintains teaching value

3. **Token Tracking**
   - Per-interaction token counting
   - Budget enforcement (50,000 tokens/session)
   - Warning at 70% usage

4. **Event Logging**
   - Every chat logged to `events_collection`
   - Enables interaction analysis
   - Seed data for evaluation

---

## Interaction Trace (Phase 2)

### Event Types & Structure

**Event Collection Schema:**

```javascript
{
  _id: ObjectId,
  session_id: "session_xyz123",
  timestamp: ISODate("2026-04-05T10:30:00Z"),
  event_type: "CHAT_MESSAGE",
  actor: "candidate",   // Who triggered event
  details: {
    // Event-specific data
    message_id: "msg_001",
    prompt: "How to...",
    response_length: 156,  // tokens
  },
  metadata: {
    duration_ms: 1250,
    api_calls: 1,
    success: true
  }
}
```

**Event Type Taxonomy:**

| Event Type | Trigger | Details |
|-----------|---------|---------|
| `SESSION_START` | User joins | Window validation, session initialized |
| `CHAT_MESSAGE` | User sends/receives chat | Prompt/response tokens, source |
| `CODE_SAVE` | User saves code | Code content, lines changed |
| `CODE_EXECUTE` | User runs code | Estimated execution time |
| `TEST_RUN` | User runs tests | Test count, assertions |
| `ERROR_ENCOUNTERED` | Runtime/syntax error | Error type, line number, message |
| `ERROR_FIXED` | Error resolved | Fix type, time to fix |
| `SESSION_END` | User submits | Final code, time spent |
| `EVALUATION_STARTED` | Eval triggered | Session snapshot |
| `EVALUATION_DONE` | Eval complete | Scores, pillars |

### How Event Logging Works

```python
# In any service, log events like this:
from app.services.event_service import log_event

# NOTE: log_event is SYNCHRONOUS (no await needed)
log_event(
    session_id="session_xyz",
    event_type="CHAT_MESSAGE",
    actor="candidate",
    details={
        "prompt": "...",
        "response_length": 156,
        "tokens": 166
    },
    metadata={
        "duration_ms": 1250,
        "api_calls": 1
    }
)
```

**IMPORTANT FIX (April 5, 2026):** 
- `log_event()` was changed from `async def` to `def` (synchronous function)
- This fixed critical error: "There is no current event loop in thread 'AnyIO worker thread'"
- MongoDB via PyMongo is inherently blocking, so synchronous is the correct approach
- All callers updated: no more `await log_event(...)` - use direct function call

### Event Flow During Session

```
Session Timeline:
─────────────────────────────────────────────────────────────→ Time

EVENT 1: SESSION_START
└─ Candidate opens interview
   - Window validated
   - Timer started
   
EVENT 2: CHAT_MESSAGE
└─ User: "What's a function?"
   - AI Response logged
   - Tokens counted
   
EVENT 3: CODE_SAVE
└─ Candidate writes code
   - Code version recorded
   
EVENT 4: TEST_RUN
└─ User runs 2 tests
   - Results recorded
   
EVENT 5: ERROR_ENCOUNTERED
└─ KeyError in line 15
   - Error details logged
   
EVENT 6: CHAT_MESSAGE
└─ User asks for help fixing
   
EVENT 7: ERROR_FIXED
└─ Code corrected
   - Time to fix: 3 minutes
   
EVENT 8: SESSION_END
└─ Candidate submits
   - Final code captured
   - Total time: 45 minutes

EVALUATION PHASE (automated):
EVENT 9: EVALUATION_STARTED
└─ Five pillars evaluated
   
EVENT 10: EVALUATION_DONE
└─ Results computed
   - Score: 78.5
```

---

## Evaluation Engine (Phase 3)

### 5-Pillar GUIDE Scoring System

The GUIDE framework evaluates software engineers on 5 key dimensions of AI collaboration:

```
GUIDE Score (Q) = 0.20*G + 0.25*U + 0.20*I + 0.15*D + 0.20*E
                = Composite Quality Score (0-100)
```

### Pillar Details

#### **G: Goal Decomposition (20%)**
How well candidate understands and breaks down the problem.

**Sub-Metrics:**
- Problem Breakdown (20%)
- Requirement Understanding (25%)
- Scope Definition (25%)
- Specification Clarity (30%)

**Questions LLM Judge Asks:**
- "How thoroughly did the candidate decompose the problem?"
- "Did they clarify ambiguities with the AI?"
- "Were requirements well understood before coding?"

**Score Levels:**
- 90-100: Excellent breakdown, all requirements clear
- 70-89: Good understanding, minor gaps
- 50-69: Basic breakdown, some confusion
- < 50: Poor decomposition

---

#### **U: Usage Efficiency (25%)**
How effectively candidate leverages AI for problem-solving.

**Sub-Metrics:**
- Prompt Quality (25%)
- Context Relevance (25%)
- Question Specificity (25%)
- Effective Utilization (25%)

**Evaluation Criteria:**
- Do prompts contain necessary context?
- Are questions specific and actionable?
- Does candidate reference previous responses?
- Are follow-ups strategic?

---

#### **I: Iteration & Refinement (20%)**
Ability to improve solution through feedback loops.

**Sub-Metrics:**
- Problem-Solving Dynamics (25%)
- Feedback Integration (25%)
- Error Recovery (25%)
- Adaptive Strategies (25%)

**Demonstrates:**
- Testing iteratively
- Fixing bugs based on feedback
- Trying different approaches
- Improving code quality over time

---

#### **D: Detection & Validation (15%)**
How thoroughly candidate tests and validates solution.

**Sub-Metrics:**
- Error Awareness (25%)
- Code Quality Testing (25%)
- Edge Case Coverage (25%)
- Solution Verification (25%)

**Examples:**
- Error handling for edge cases
- Comprehensive test coverage
- Boundary condition testing
- Input validation

---

#### **E: End Result Quality (20%)**
Final code quality and functionality.

**Sub-Metrics:**
- Functionality (30%)
- Code Readability (25%)
- Performance (25%)
- Maintainability (20%)

**Assessed By:**
- Does code solve the problem?
- Is it clean and understandable?
- Is it efficient?
- Could it be extended easily?

---

### Evaluation Pipeline

```python
async def run_evaluation(session_id):
    """
    Complete evaluation workflow
    """
    
    # Step 1: Fetch session events
    events = db.events.find({"session_id": session_id})
    
    # Step 2: Validate minimum effort
    if not meets_minimum_effort(events):
        return {
            "status": "FAILED_MINIMUM_EFFORT",
            "reason": "Insufficient engagement"
        }
    
    # Step 3: Compute each pillar
    scores = {
        "G": await compute_g_score(events),      # Goal Decomposition
        "U": await compute_u_score(events),      # Usage Efficiency
        "I": await compute_i_score(events),      # Iteration & Refinement
        "D": await compute_d_score(events),      # Detection & Validation
        "E": await compute_e_score(events),      # End Result Quality
    }
    
    # Step 4: Handle partial evaluations
    available_pillars = {p: scores[p] is not None for p in scores}
    weights = reweight_pillars(available_pillars)
    
    # Step 5: Compute composite Q score
    composite_q = sum(
        scores[p] * weights[p] 
        for p in scores 
        if scores[p] is not None
    )
    
    # Step 6: Store results
    db.evaluations.insert_one({
        "session_id": session_id,
        "evaluated_at": datetime.now(),
        "composite_q_score": composite_q,
        "pillars": scores,
        "weights": weights
    })
    
    return result
```

### LLM Judge System

The LLM Judge is the core evaluation engine that scores individual metrics.

**Judge Prompting Pattern:**

```python
prompt = f"""
You are an expert software engineering evaluator assessing AI collaboration.

Session Events: {events_summary}

Metric: Goal Decomposition
Definition: How well the candidate understood and broke down the problem.

Score the candidate on a scale of 0-100:
- 90-100: Excellent. Clear problem breakdown, all requirements understood.
- 70-89: Good. Problem understood well, minor gaps.
- 50-69: Fair. Basic understanding, some confusion.
- 30-49: Poor. Significant misunderstandings.
- 0-29: Very Poor. Problem fundamentally misunderstood.

Provide:
1. Score: [0-100]
2. Reasoning: [2-3 sentences]

Be consistent, fair, and evidence-based.
"""

response = judge_model.generate_content(prompt)
score = extract_score(response)
reasoning = extract_reasoning(response)
```

### Judge Cache

To reduce API costs, identical prompts are cached:

```javascript
// First evaluation of same metric
{
  prompt_hash: "sha256_abc123...",
  metric_id: "metric_goal_clarity",
  score: 75,
  reasoning: "...",
  created_at: ISODate("2026-04-05T..."),
  hit_count: 1
}

// Second similar evaluation
→ Judge checks cache
→ Found! No API call needed
→ hit_count incremented to 2
→ Saves ~$0.01 per cache hit
```

**Estimated Cost Savings:** 30-40% reduction in judge API calls for repeated candidates.

---

## Dashboard System (Phase 4)

### Dashboard Features

#### 1. **Statistics Dashboard**

Aggregate metrics across all sessions:

```json
{
  "total_sessions": 145,
  "evaluated_sessions": 128,
  "average_composite_q": 72.5,
  "average_time_spent": 42,
  "pass_rate": 73.1,
  "by_pillar": {
    "G": { "mean": 75.2, "min": 28, "max": 98 },
    "U": { "mean": 71.8, "min": 15, "max": 95 },
    "I": { "mean": 69.3, "min": 22, "max": 91 },
    "D": { "mean": 74.1, "min": 30, "max": 100 },
    "E": { "mean": 76.9, "min": 25, "max": 99 }
  }
}
```

#### 2. **Rankings**

Sorted list of candidates by performance:

```json
[
  {
    "rank": 1,
    "candidate_name": "Alice",
    "composite_q_score": 92.5,
    "pillars": { "G": 89, "U": 95, "I": 90, "D": 92, "E": 94 },
    "time_spent": 45,
    "session_id": "session_001"
  },
  ...
]
```

**Sort Options:**
- `composite_q_score` (default, descending)
- Individual pillars: `G`, `U`, `I`, `D`, `E`
- `time_spent`
- Direction: `asc` or `desc`

#### 3. **Session Detail**

Comprehensive evaluation breakdown:

```json
{
  "session_id": "session_xyz123",
  "candidate_name": "John Doe",
  "composite_q_score": 78.5,
  "duration_total": 45,
  "pillars": {
    "G": {
      "score": 75,
      "weight": 0.20,
      "weighted_contribution": 15.0,
      "sub_metrics": [
        { "name": "Problem Breakdown", "score": 78, "weight": 0.20 },
        { "name": "Requirement Understanding", "score": 72, "weight": 0.25 },
        { "name": "Scope Definition", "score": 71, "weight": 0.25 },
        { "name": "Specification Clarity", "score": 77, "weight": 0.30 }
      ]
    },
    ...
  },
  "feedback": {
    "strengths": [
      "Excellent error handling",
      "Great iterative approach"
    ],
    "areas_for_improvement": [
      "Could ask more specific questions",
      "Test coverage could be improved"
    ]
  }
}
```

#### 4. **Score Trends**

Historical performance metrics:

```json
{
  "data_points": [
    { "date": "2026-04-01", "avg_q": 70.2, "pass_rate": 68 },
    { "date": "2026-04-02", "avg_q": 71.5, "pass_rate": 71 },
    { "date": "2026-04-03", "avg_q": 72.1, "pass_rate": 73 }
  ],
  "trend": "upward",
  "insights": "Performance improving over time"
}
```

### Group Filtering

For bulk sessions, filter by `group_id`:

```
GET /api/dashboard/rankings?group_id=group_abc123&limit=50
```

Shows only candidates from that bulk session group.

### Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| Results Dashboard | `ResultsDashboard.jsx` | Detailed evaluation view |
| Dashboard | `Dashboard.jsx` | Overview statistics |
| Rankings Table | (in Dashboard) | Sorted candidate list |
| Score Chart | (in Dashboard) | Visualization of pillars |
| Trend Chart | (in Dashboard) | Performance over time |

---

## Session Management (Phase 5)

### Session Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│          Session Lifecycle State Machine               │
└─────────────────────────────────────────────────────────┘

CREATED
   └─ Session initialized in DB
   └─ Invitation email sent
   └─ Status: NOT_STARTED
   
   │
   ├─ Window check: Current time within [start, end]?
   │             YES
   │
READY_FOR_ONBOARDING
   └─ Candidate can access link
   └─ Onboarding page shown
   
   │
   ├─ Candidate completes onboarding
   │
STARTED
   └─ Timer begins (60 minutes default)
   └─ Code editor unlocked
   └─ Chat enabled
   └─ Events logged
   
   │
   ├─ Candidate works on problem...
   │
IN_PROGRESS
   └─ Max time: 60 minutes
   └─ Token budget: 50,000
   
   │
   ├─ Candidate submits code OR time expires
   │
COMPLETED
   └─ Final code saved
   └─ Time recorded
   
   │
   ├─ Automatic evaluation triggered
   │
EVALUATED
   └─ All pillar scores computed
   └─ Results available on dashboard


┌─────────────────────────────────────────────────────────┐
│          Session Status (Window Enforcement)           │
└─────────────────────────────────────────────────────────┘

WINDOW NOT YET STARTED
   ❌ Cannot start session
   Message: "Your interview window hasn't started yet."
   
WINDOW ACTIVE
   ✅ Can start and participate
   
WINDOW EXPIRED
   ❌ Cannot start if not already started
   ⚠️ If already started: Auto-submit at window end
```

### Bulk Session Creation (Group Sessions)

**Frontend Date/Time Input (April 5, 2026 Update):**

The GroupSessionsPage.jsx form collects:
- **Date:** Dropdown picker (YYYY-MM-DD format)
- **Time:** Text input in "HH:MM AM/PM" format (e.g., "02:30 PM", "10:00 AM")

These are automatically converted to ISO 8601 format before sending to the API:
```javascript
// Frontend helper function: dateTimeToISO(date, time)
// Input:  date = "2026-04-05", time = "10:00 AM"
// Output: "2026-04-05T10:00:00.000Z" (ISO format)
```

**Request Format:**

```json
POST /api/sessions/bulk-create

{
  "group_name": "Q1 2026 Engineering Hiring",
  "project_template": "Library Management System",
  "time_limit_minutes": 60,
  "start_at": "2026-04-05T10:00:00Z",
  "end_at": "2026-04-05T12:00:00Z",
  "candidates": [
    { "name": "Alice", "Gmail": "alice@example.com" },
    { "name": "Bob", "Gmail": "bob@example.com" }
  ],
  "dry_run": false
}
```

**Note:** The frontend collects user-friendly date/time inputs and converts them to ISO format (with timezone handling) before API submission.

**Dry-Run Mode:**

```
GET /api/sessions/bulk-create?dry_run=true

→ Validates input
→ Previews emails
→ Checks for duplicates
→ Estimates token usage
→ Does NOT send emails or create sessions
```

**Response:**

```json
{
  "status": "success",
  "group_id": "group_abc123",
  "sessions_created": 2,
  "sessions": [
    {
      "session_id": "session_001",
      "candidate_name": "Alice",
      "email": "alice@example.com",
      "invitation_link": "https://app.com/session/session_001?token=xyz",
      "window_start": "2026-04-05T10:00:00Z",
      "window_end": "2026-04-05T12:00:00Z"
    },
    ...
  ],
  "email_sent": true,
  "timestamp": "2026-04-05T09:30:00Z"
}
```

### Email Notifications

**Invitation Email (sent at group creation):**

```
Subject: Your Interview with AI - [Company Name]

Dear [Candidate Name],

You're invited to participate in our AI Collaboration Assessment.

📅 Interview Window:
   Start: April 5, 2026, 10:00 AM (Asia/Kolkata)
   End: April 5, 2026, 11:00 AM (Asia/Kolkata)

⏱️ Duration: 60 minutes

🎯 Problem: Library Management System

Your unique session link:
[https://app.com/session/session_xyz?token=abc123]

This link is valid only during your interview window.

📋 What to expect:
- Code editor with Python support
- AI assistant for questions
- Real-time feedback
- Comprehensive evaluation

Good luck!
```

### Session Constraints

| Constraint | Value | Description |
|-----------|-------|-------------|
| Duration | 60 min | Time allowed for interview |
| Token Budget | 50,000 | Total AI API tokens |
| Max Bulk | 20 | Max candidates per group |
| Window Duration | Flexible | Invitation time window |
| Timezone | Asia/Kolkata | For bulk sessions |

---

## API Endpoints

### Authentication

```
POST /auth/signup
  Body: { email, password }
  Response: { user_id, email, created_at }
  
POST /auth/signin
  Body: { email, password }
  Response: { access_token, token_type, user_id }
  
GET /auth/me
  Headers: Authorization: Bearer <token>
  Response: { email, message }
```

### Chat (Phase 1)

```
POST /api/chat
  Headers: Authorization: Bearer <token>
  Body: { session_id, prompt }
  Response: {
    response: "AI response text",
    session_id,
    source: "gemini" | "mock",
    token_count: { prompt_tokens, response_tokens, total_tokens }
  }
```

### Events (Phase 2)

```
POST /api/events
  Body: { session_id, event_type, details }
  Response: { event_id, created_at }
  
GET /api/events/{session_id}
  Response: [ { event_type, timestamp, details }, ... ]
```

### Evaluation (Phase 3)

```
POST /api/evaluate/{session_id}
  Response: {
    success: true,
    session_id,
    evaluation: {
      composite_q_score: 78.5,
      pillars: { G: 75, U: 82, I: 68, D: 79, E: 80 }
    }
  }
  
GET /api/evaluate/{session_id}
  Response: { evaluation result }
  
GET /api/evaluations
  Response: [ { session_id, score, pillars }, ... ]
```

### Dashboard (Phase 4)

```
GET /api/dashboard/stats?group_id=optional
  Response: {
    total_sessions: 145,
    average_composite_q: 72.5,
    by_pillar: { G: { mean: 75.2 }, ... }
  }
  
GET /api/dashboard/rankings?limit=50&sort_by=composite_q_score&order=desc&group_id=optional
  Response: [ { rank, candidate_name, composite_q_score, pillars }, ... ]
  
GET /api/dashboard/session/{session_id}
  Response: { session_id, candidate_name, composite_q_score, pillars, feedback }
  
GET /api/dashboard/trends
  Response: { data_points: [ { date, avg_q }, ... ], trend }
```

### Sessions (Phase 5)

```
POST /api/sessions/create
  Body: { candidate_name, email, problem, time_limit_minutes }
  Response: { session_id, invitation_link, window }
  
POST /api/sessions/bulk-create?dry_run=false
  Body: { group_name, candidates_csv, problem, timezone, invitation_window }
  Response: { group_id, sessions_created, sessions }
  
GET /api/sessions/{session_id}
  Response: { session_id, state, problem, time_limit, final_code, composite_q_score }
  
POST /api/sessions/{session_id}/start
  Response: { session_id, state: "IN_PROGRESS", timer_seconds }
  
POST /api/sessions/{session_id}/end
  Body: { final_code }
  Response: { session_id, state: "COMPLETED" }
  
GET /api/sessions
  Response: [ { session_id, state, candidate_name }, ... ]
  
GET /api/session-groups
  Response: [ { group_id, group_name, created_at, sessions_count }, ... ]
```

---

## Frontend Architecture

### Technology Stack

- **Framework:** React 19.2.0 (latest)
- **Build Tool:** Vite 7.3.1 (fast bundler)
- **Styling:** Tailwind CSS 4.2.1
- **Code Editor:** Monaco Editor 4.7.0
- **Routing:** React Router 7.13.0
- **HTTP Client:** Axios 1.13.5

### Project Structure

```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Root component, routes
├── index.css                 # Global styles
│
├── pages/                    # Full-page components
│   ├── Signin.jsx           # Login page
│   ├── Signup.jsx           # Registration page
│   ├── GuidePage.jsx        # Main coding interface
│   ├── CandidateOnboarding.jsx # Session onboarding
│   ├── HiringManagerDashboard.jsx # Manager interface
│   ├── GroupSessionsPage.jsx # Bulk session creation
│   ├── ResultsDashboard.jsx # Evaluation results
│   ├── Dashboard.jsx        # Analytics overview
│   └── ShapeDemo.jsx        # 3D demo
│
├── components/              # Reusable components
│   ├── CodeEditor.jsx      # Monaco editor wrapper
│   ├── ChatPanel.jsx       # Chat UI
│   ├── TaskSidebar.jsx     # Requirements list
│   └── ...
│
├── services/               # API integration
│   ├── authService.js      # Auth API calls
│   ├── chatService.js      # Chat API calls
│   ├── sessionService.js   # Session API calls
│   ├── evaluationService.js # Evaluation API calls
│   └── ...
│
└── utils/                  # Helper functions
    ├── tokenUtils.js       # JWT management
    └── ...
```

### Key Pages

#### **GuidePage.jsx** (Main Interview Interface)

This is the core page where candidates solve problems with AI assistance.

```jsx
// Layout:
├─ TaskSidebar (left)
│  └─ Requirements checklist
│
├─ CodeEditor (center)
│  └─ Monaco editor with Python syntax
│
└─ ChatPanel (right)
   └─ AI chat interface
```

**Components:**
- Problem description
- Progress tracker
- Code editor
- Chat interface
- Token counter
- Submit button

#### **ResultsDashboard.jsx**

Displays detailed evaluation results.

**Features:**
- Composite Q score (large display)
- 5 pillar scores with breakdown
- Sub-metric details
- Feedback (strengths/improvements)
- Time statistics

#### **GroupSessionsPage.jsx**

Interface for hiring managers to create bulk sessions.

**Form Fields:**
- **Group Name** - Text input for batch identification
- **Duration** - Dropdown (30, 45, 60, 90, 120 minutes)
- **Project Template** - Dropdown (Library Management System, Hotel Booking System)
- **Window Opens:**
  - 📅 **Date** - Dropdown showing dates for next 31 days (formatted: "Mon, 7 Apr 2026")
  - ⏰ **Time** - Text input with template "HH:MM AM/PM" (e.g., "10:00 AM")
- **Window Closes:**
  - 📅 **Date** - Dropdown showing dates for next 31 days
  - ⏰ **Time** - Text input with template "HH:MM AM/PM" (e.g., "12:00 PM")

**Features:**
- CSV upload (drag & drop or click to browse)
  - Required columns: Name, Gmail
  - Max 20 rows per group
  - CSV preview table before submission
- Group details form
- Dry-run validation (click "✅ Validate" button)
  - Shows per-row validation results
  - Prevents submission if errors exist
- Summary preview after dry-run passes
- Bulk send (click "🚀 Confirm & Send" button)
- Download results CSV with session links

**Date/Time Implementation:**
- Date picker uses dropdown for consistency and usability
- Time format: "HH:MM AM/PM" (e.g., "02:30 PM", "11:45 AM")
- Automatic 12/24-hour conversion backend-side
- Default: Current date/time for start, +2 hours for end
- Validation: Start time must be before end time

#### **Dashboard.jsx**

Analytics and overview dashboard.

**Displays:**
- Statistics (total sessions, avg score)
- Rankings (sortable table)
- Pillar distribution charts
- Trends visualization

#### **HiringManagerDashboard.jsx**

Manager tools for session administration.

**Features:**
- Create single sessions
- Monitor bulk groups
- Track candidate status
- Access evaluations

### State Management

Frontend uses React's built-in state:

```jsx
// Example: GuidePage.jsx
const [code, setCode] = useState("");
const [chatHistory, setChatHistory] = useState([]);
const [sessionState, setSessionState] = useState("NOT_STARTED");
const [tokenUsage, setTokenUsage] = useState(0);
```

Key state pieces:
- `code` - Current code in editor
- `chatHistory` - Chat messages array
- `sessionState` - Session lifecycle state
- `tokenUsage` - API token counter
- `currentUser` - Authenticated user (from localStorage)

### Authentication Flow (Frontend)

```jsx
// 1. User signs in
→ POST /auth/signin
→ Receive token
→ localStorage.setItem("auth_token", token)

// 2. On subsequent requests
→ Every API call includes Authorization header
→ Header: { Authorization: `Bearer ${token}` }

// 3. 401 Response
→ Token expired
→ Redirect to /signin
→ localStorage clear

// 4. Protected Route Wrapper
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem("auth_token");
  if (!token) return <Navigate to="/signin" />;
  return children;
}
```

### API Calls Pattern

```jsx
// services/chatService.js
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export async function sendMessage(sessionId, prompt) {
  const token = localStorage.getItem('auth_token');
  
  const response = await axios.post(
    `${API_BASE}/api/chat`,
    { session_id: sessionId, prompt },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data;
}
```

---

## How the System Works - Complete Flow

### Complete End-to-End Flow

```
┌──────────────────────────────────────────────────────────┐
│         COMPLETE CANDIDATE INTERVIEW FLOW                 │
└──────────────────────────────────────────────────────────┘

PHASE 1: SIGN UP & SECURITY
────────────────────────────

1. New user visits app.com
   ↓
2. Clicks "Sign Up"
   ↓
3. Enters email + password
   ↓
4. Frontend: POST /auth/signup
   Backend:
   ├─ Check email not exists (users_collection)
   ├─ Hash password: bcrypt (10 rounds)
   ├─ Insert user document
   └─ Return user_id
   ↓
5. Redirect to signin page
   ↓

PHASE 2: SIGN IN & TOKEN
─────────────────────────

1. User enters credentials
   ↓
2. Frontend: POST /auth/signin
   Backend:
   ├─ Find user in users_collection
   ├─ Verify password against hash
   ├─ Generate JWT token
   │  - Payload: { email, exp: now+60min }
   │  - Secret: SECRET_KEY from .env
   │  - Algorithm: HS256
   └─ Return token
   ↓
3. Frontend: localStorage.setItem("auth_token", token)
   ↓
4. Redirect to dashboard OR session link (if in email)
   ↓

PHASE 3: RECEIVE SESSION LINK (via email)
──────────────────────────────────────────

1. Hiring manager creates session
   Backend: POST /api/sessions/bulk-create
   └─ Generates session_id
   └─ Email sent to candidate
   
2. Email contains:
   Subject: "Your Interview with AI"
   Body: Link + Window info
   
   Link: https://app.com/session/session_xyz123?token=abc
   
3. Candidate clicks link at time within window
   ↓

PHASE 4: ONBOARDING
───────────────────

1. Candidate at /session/session_xyz
   ↓
2. Window check:
   ├─ Current time after window start? ✓
   ├─ Current time before window end? ✓
   └─ Proceed
   ↓
3. Onboarding page shown:
   ├─ Problem description
   ├─ Requirements
   ├─ Time limit (60 min)
   ├─ Terms & conditions
   └─ "Accept & Start Interview" button
   ↓
4. Candidate clicks "Start"
   ↓
5. Backend: POST /api/sessions/{id}/start
   ├─ Set session state = "IN_PROGRESS"
   ├─ Log event: SESSION_START (synchronous event logging)
   └─ Timer begins
   
   **Event Logging (SESSION_START):**
   ```python
   # In session_service.py
   log_event(  # Synchronous - no await
       session_id=request.session_id,
       event_type="SESSION_START",
       payload={...}
   )
   ```
   ↓

PHASE 5: CODING & AI ASSISTANCE
────────────────────────────────

Timer: 60 minutes → 59:59 → ... → 0:00

1. Candidate sees:
   ├─ Code editor (Monaco, Python)
   ├─ Problem requirements (sidebar)
   └─ AI Chat (right panel)
   ↓
2. Loop (iterative):
   
   a) Candidate reads problem
      EVENT: (implicit understanding)
   
   b) Candidate types code in editor
      Frontend: Saves to local state (no backend call)
      But on "Save" button click:
      ├─ Backend: POST /api/events
      ├─ Event: CODE_SAVE
      └─ Details: code, lines_changed
   
   c) Candidate has question
      Candidate types in chat: "How do I handle errors?"
      Frontend: POST /api/chat
      Backend:
      ├─ Validate JWT
      ├─ Check token budget (50k tokens)
      ├─ Call Gemini API
      │  - If fails: Use mock response
      │  - If succeeds: Get AI response
      ├─ Count tokens
      ├─ Insert to chat_logs_collection
      ├─ Log event: CHAT_MESSAGE (synchronous)
      │  └─ Via: log_event(session_id, "CHAT_MESSAGE", {...})
      └─ Return response
      Frontend: Display AI response in chat
      
   d) Candidate runs code
      Frontend: POST /api/test-code
      Backend:
      ├─ Execute Python code in sandbox
      ├─ Capture output/errors
      ├─ Log event: CODE_EXECUTE
      └─ Return results
      Frontend: Show execution results
   
   e) Error occurs (e.g., KeyError)
      ├─ Log event: ERROR_ENCOUNTERED (synchronous log_event call)
      ├─ Event details: error type, line, message
      └─ Track in database
      
      Candidate fixes code:
      ├─ Asks AI for help
      ├─ Modifies code
      ├─ Runs again → SUCCESS
      ├─ Log event: ERROR_FIXED (synchronous log_event call)
      ├─ Event details: time_to_fix = 3 minutes
      └─ Continue
   
   [Repeat steps a-e multiple times]
   ↓
3. Time updates in real-time
   ├─ 10 min remaining: Yellow warning
   ├─ 5 min remaining: Red warning
   ├─ 0 min: Auto-submit
   ↓

PHASE 6: SESSION SUBMISSION
────────────────────────────

Option A: Candidate submits before time expires
   1. Clicks "Submit Solution"
   2. Frontend: POST /api/sessions/{id}/end
      Body: { final_code }
   3. Backend:
      ├─ Save final_code
      ├─ Set session state = "COMPLETED"
      ├─ Record submitted_at timestamp
      └─ Log event: SESSION_END (synchronous log_event call)
      
      **Event Logging (SESSION_END):**
      ```python
      # In session_service.py
      log_event(  # Synchronous - no await
          session_id=request.session_id,
          event_type="SESSION_END",
          payload={...}
      )
      ```

Option B: Time expires (automatic)
   1. Timer reaches 0:00
   2. Frontend: Auto-submit
   3. Same as Option A

Result: Session moved to COMPLETED state
   ├─ No more edits allowed
   ├─ Chat disabled
   └─ Evaluation triggered
   ↓

PHASE 7: AUTOMATIC EVALUATION (Backend)
─────────────────────────────────────────

1. Backend detects: session.state == "COMPLETED"
   ↓
2. Trigger evaluation job
   Backend: run_evaluation(session_id)
   ├─ Fetch all events for session
   ├─ Fetch session code & metadata
   ├─ Validate minimum effort
   │  └─ Fail if < 3 chat messages OR < 1 code save
   │
   ├─ If minimum effort PASSED:
   │  └─ Evaluate 5 pillars:
   │     
   │     Pillar G (Goal Decomposition):
   │     ├─ LLM Judge prompt: "Rate goal decomposition 0-100"
   │     ├─ Judge checks cache (prompt_hash)
   │     ├─ If found: Use cached score
   │     ├─ If not found: Call Gemini judge
   │     ├─ Cache result
   │     └─ Score G = XX
   │
   │     [Repeat for U, I, D, E]
   │
   │  └─ Compute composite Q score:
   │     Q = 0.20*G + 0.25*U + 0.20*I + 0.15*D + 0.20*E
   │
   │  └─ Handle partial evaluations:
   │     If any pillar failed (judge API errors):
   │     ├─ Mark pillar unavailable
   │     ├─ Reweight remaining pillars
   │     └─ Compute composite from available pillars
   │
   │  └─ Generate feedback:
   │     Use judge to identify:
   │     ├─ Strengths
   │     └─ Areas for improvement
   │
   │  └─ Store results:
   │     ├─ evaluations_collection
   │     ├─ Update sessions_collection with Q score
   │     └─ Set session.state = "EVALUATED"
   │
   └─ If minimum effort FAILED:
      ├─ Mark session: minimum_effort_failed = true
      ├─ Log reason (not enough engagement)
      └─ Do NOT compute pillars
   ↓

PHASE 8: RESULTS VIEWING
───────────────────────

1. Candidate (or manager) visits results
   ↓
2. Frontend: GET /api/dashboard/session/{session_id}
   Backend:
   ├─ Fetch from evaluations_collection
   ├─ Return all pillar scores
   └─ Include feedback
   ↓
3. Results displayed:
   ├─ Composite Q score (78.5)
   ├─ 5 pillar breakdown:
   │  ├─ G: 75 [sub-scores]
   │  ├─ U: 82 [sub-scores]
   │  ├─ I: 68 [sub-scores]
   │  ├─ D: 79 [sub-scores]
   │  └─ E: 80 [sub-scores]
   ├─ Strengths listed
   ├─ Areas for improvement
   └─ Time spent: 45 min
   ↓

PHASE 9: HIRING MANAGER VIEW
─────────────────────────────

1. Manager goes to /dashboard/rankings
   ↓
2. Frontend: GET /api/dashboard/rankings?sort_by=composite_q_score
   ↓
3. Displays table:
   Rank | Name    | Q Score | G  | U  | I  | D  | E
   ────┼─────────┼─────────┼────┼────┼────┼────┼────
   1   | Alice   | 92.5    | 89 | 95 | 90 | 92 | 94
   2   | Bob     | 78.5    | 75 | 82 | 68 | 79 | 80
   3   | Charlie | 71.2    | 68 | 74 | 65 | 71 | 75
   ↓

END: Manager makes hiring decisions based on scores
```

---

## Running and Testing

### Prerequisites

- **Python 3.9+**
- **Node.js 16+**
- **MongoDB** (local or cloud)
- **Gemini API Key** (free tier at ai.google.com)

### Environment Setup

**1. Create .env file:**

```bash
cd Interview_with_AI
touch .env
```

**2. Add environment variables:**

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=interview_with_ai

# Authentication
SECRET_KEY=your-secret-key-here-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend
FRONTEND_BASE_URL=http://localhost:5173
```

### Starting MongoDB

**Windows (with MongoDB installed):**

```bash
# Create data directory
mkdir %USERPROFILE%\MongoDB\data

# Start MongoDB
mongod --dbpath %USERPROFILE%\MongoDB\data
```

**Or use Docker:**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Starting Backend

```bash
# Navigate to project
cd Interview_with_AI

# Activate virtual environment
# Windows:
.\IAI\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     ✅ MongoDB connection successful!
```

### Starting Frontend

```bash
# In new terminal
cd Interview_with_AI/interview_with_ai_frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**You should see:**
```
VITE v7.3.1 ready in 234 ms

➜ Local:   http://localhost:5173/
```

### Testing Backend

```bash
# Run all tests
pytest

# Run specific test file
pytest app/evaluation/test_evaluation_pipeline.py

# Run with verbose output
pytest -v

# Run specific test function
pytest app/evaluation/test_evaluation_pipeline.py::test_pillar_g -v
```

### Testing Frontend

```bash
cd interview_with_ai_frontend

# Lint code
npm run lint

# Build for production
npm run build
```

### Manual Testing Checklist

**Authentication:**
- [ ] Sign up with new email
- [ ] Sign in with correct password
- [ ] Sign in fails with wrong password
- [ ] JWT token stored in localStorage
- [ ] Protected routes blocked without token

**Chat:**
- [ ] Send message to AI
- [ ] Receive response
- [ ] Token count updates
- [ ] Chat history persists
- [ ] Mock response works (if quota exhausted)

**Evaluation:**
- [ ] Create session
- [ ] Submit code
- [ ] Evaluation triggers automatically
- [ ] 5 pillar scores computed
- [ ] Results visible on dashboard

**Group Sessions:**
- [ ] Create bulk session with CSV
- [ ] Dry-run validation works
- [ ] Emails sent to candidates
- [ ] Candidates can start within window
- [ ] Candidates blocked outside window

### Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Ensure MongoDB is running, check MONGO_URL in .env |
| Gemini API error | Verify API key, check rate limits, use mock fallback |
| CORS errors | Ensure origins in main.py include frontend URL |
| Token expired | Token automatically refreshed on new signin, or clear localStorage |
| Chat timeout | Exponential backoff will retry automatically |

---

## Summary

This comprehensive system implements a sophisticated AI collaboration assessment platform with:

✅ **Phase 1:** Real-time chat with Gemini API and code editing  
✅ **Phase 2:** Complete event logging for interaction analysis  
✅ **Phase 3:** 5-pillar GUIDE evaluation engine with LLM judge  
✅ **Phase 4:** Interactive dashboard with detailed feedback  
✅ **Phase 5:** Session management and bulk group session creation  

**Key Technologies:**
- FastAPI (backend framework)
- React (frontend)
- MongoDB (NoSQL database)
- Gemini AI (LLM integration)
- Tailwind CSS (styling)
- JWT (authentication)

**Database:** 7 collections for users, sessions, chat logs, events, evaluations, caches, and budgets

**API:** 20+ endpoints covering auth, chat, events, evaluation, dashboard, and sessions

The system is production-ready, well-architected, and fully documented for future development and maintenance.

---

**Project Repository:** `/Interview_with_AI/`  
**Documentation Updated:** April 5, 2026  
**Status:** ✅ Phase 5 Complete & Documented
