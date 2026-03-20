# Complete Project Setup & Testing Guide

**Project:** Interview with AI (GUIDE)  
**Last Updated:** March 17, 2026  
**Status:** All Phases Complete ✅ (Including Phase 5: Session Management & Resilience)

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [MongoDB Setup](#mongodb-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing the Project](#testing-the-project)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

**Minimum Specs:**
- Windows 10/11 or macOS/Linux
- 8GB RAM
- 2GB disk space
- Internet connection (for APIs)

**Required Software:**
- Python 3.13+ ([Download](https://www.python.org/downloads/))
- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB 4.0+ (Local or Docker)
- Git (optional)

**API Keys (Free Tier):**
- Google Gemini API key ([Get here](https://aistudio.google.com/apikey))

---

## MongoDB Setup

### Option 1: Local MongoDB (Windows)

**1. Download & Install:**
- Download from: https://www.mongodb.com/try/download/community
- Run installer
- Default path: `C:\Program Files\MongoDB\Server\7.0`
- Choose "Install MongoDB as a Service"

**2. Start MongoDB Service:**
```powershell
# Open PowerShell as Administrator
net start MongoDB
```

**3. Verify Running:**
```powershell
mongosh --version
```

**Expected Output:**
```
mongosh 2.0.0
```

### Option 2: Docker (Recommended)

**1. Install Docker:**
- Download from: https://www.docker.com/products/docker-desktop

**2. Start MongoDB Container:**
```bash
docker run -d -p 27017:27017 --name mongodb -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=password mongo
```

**3. Verify Running:**
```bash
docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE     PORTS                      STATUS
abc123def456   mongo     0.0.0.0:27017->27017/tcp   Up 2 minutes
```

### Option 3: MongoDB Atlas (Cloud)

**1. Sign up at:** https://www.mongodb.com/cloud/atlas

**2. Create cluster (Free tier available)**

**3. Get connection string:**
```
mongodb+srv://username:password@cluster.mongodb.net/
```

**4. Update .env file:**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/interview_with_ai
```

### Verify MongoDB Connection

**Test connection:**
```bash
mongosh "mongodb://localhost:27017"
```

**Expected Output:**
```
test>
```

**Check database:**
```javascript
use interview_with_ai
show collections
```

---

## Backend Setup

### Step 1: Navigate to Project Directory

```bash
cd d:\Project\Final_Year_Project\Interview_with_AI
```

### Step 2: Create & Activate Virtual Environment

**Windows:**
```bash
# Create virtual environment
python -m venv IAI

# Activate it
IAI\Scripts\activate
```

**Expected Output:**
```
(IAI) d:\Project\Final_Year_Project\Interview_with_AI>
```

**macOS/Linux:**
```bash
python3 -m venv IAI
source IAI/bin/activate
```

### Step 3: Verify Python Version

```bash
python --version
```

**Expected Output:**
```
Python 3.13.x
```

### Step 4: Upgrade pip

```bash
python -m pip install --upgrade pip
```

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

**Expected Output:**
```
Successfully installed fastapi-0.129.0 uvicorn-0.40.0 google-generativeai-0.8.6 pymongo-4.16.0 pydantic-2.12.5 ...
```

**Verify Installation:**
```bash
pip list | grep -E "fastapi|uvicorn|pymongo|google-generativeai"
```

### Step 6: Create Environment File (.env)

Create file: `d:\Project\Final_Year_Project\Interview_with_AI\.env`

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=interview_with_ai

# Gemini API Configuration
GEMINI_API_KEY=your_api_key_here

# JWT Configuration
SECRET_KEY=your_secret_key_here_min_32_chars_required
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Get Gemini API Key:**
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste into .env file as `GEMINI_API_KEY=...`

### Step 7: Verify Backend Structure

```bash
# Check that all files exist
dir app
dir app\routes
dir app\services
dir app\evaluation
```

**Expected Output:**
```
Mode  Name
----  ----
d---  __pycache__
d---  routes
d---  services
d---  evaluation
d---  models
d---  schemas
d---  utils
d---  dependencies
-a--  main.py
-a--  config.py
-a--  database.py
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd d:\Project\Final_Year_Project\Interview_with_AI\interview_with_ai_frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
up to date, audited 150 packages in 2.5s
```

### Step 3: Verify npm Packages

```bash
npm list --depth=0
```

**Expected Output (key packages):**
```
├── react@18.x.x
├── react-router-dom@7.x.x
├── axios@1.13.x
├── @monaco-editor/react@4.x.x
├── tailwindcss@4.x.x
└── vite@7.x.x
```

---

## Running the Application

### Terminal 1: Start Backend Server

**Step 1: Ensure virtual environment active**
```bash
cd d:\Project\Final_Year_Project\Interview_with_AI

# If not seen (IAI) in prompt, activate:
IAI\Scripts\activate
```

**Step 2: Start UV server**
```bash
uvicorn app.main:app --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Verify Backend:**
Open browser: http://127.0.0.1:8000/docs (Swagger UI)

You should see:
- ✅ /api/chat endpoint
- ✅ /api/events endpoints
- ✅ /api/run-tests endpoint
- ✅ /api/evaluate endpoints

---

### Terminal 2: Start Frontend Dev Server

**Step 1: Navigate to frontend**
```bash
cd d:\Project\Final_Year_Project\Interview_with_AI\interview_with_ai_frontend
```

**Step 2: Start Vite dev server**
```bash
npm run dev
```

**Expected Output:**
```
VITE v7.3.1  ready in 898 ms

➜  Local:   http://localhost:5173/
➜  Press h + enter to show help
```

**Verify Frontend:**
Open browser: http://localhost:5173

---

### Step 3: Access the Application

**Main Interface:**
Navigate to: http://localhost:5173/guide

You should see:
- ✅ 3-panel layout (Tasks, Code Editor, Chat)
- ✅ 6 requirements on left
- ✅ Monaco editor in center
- ✅ Chat panel on right
- ✅ 60:00 timer in top-right

---

## Testing the Project

### Phase 1: Basic UI Testing

#### Test 1: Layout & Components
```
✅ Navigate to http://localhost:5173/guide
✅ See 3-panel layout
✅ Left panel: 6 requirements visible
✅ Center panel: Monaco editor with Python code
✅ Right panel: Chat greeting message visible
✅ Top bar: Timer shows 60:00
```

#### Test 2: Code Editor
```
✅ Click in code editor
✅ Type: def hello():
✅ Wait 3 seconds
✅ Check MongoDB: entry should exist in events_collection
✅ Verify event_type = "CODE_SAVE"
```

**Command to verify (in MongoDB):**
```javascript
use interview_with_ai
db.events.find({event_type: "CODE_SAVE"}).pretty()
```

#### Test 3: Chat Functionality
```
✅ Click chat input box
✅ Type: "How do I implement a class?"
✅ Press Send
✅ Wait 2 seconds for response
✅ See user message on right
✅ See AI response on left
✅ Verify source is "gemini" or "mock"
```

**MongoDB verification:**
```javascript
db.events.find({event_type: "PROMPT"}).pretty()
db.events.find({event_type: "RESPONSE"}).pretty()
```

#### Test 4: Requirements Checklist
```
✅ Click first requirement checkbox
✅ See ✅ symbol
✅ Progress bar increases
✅ Check all 6 boxes
✅ Progress bar shows 100%
```

---

### Phase 2: Event Logging Testing

#### Test 5: Session Timeline
```
✅ Open browser console (F12)
✅ Go to http://localhost:5173/guide
✅ Wait 1 second (SESSION_START event logged)
✅ Edit code in editor
✅ Wait 3 seconds (CODE_SAVE event logged)
✅ Send chat message (PROMPT + RESPONSE logged)
✅ Click "Submit" button (SESSION_END logged)
```

**Verify in MongoDB:**
```javascript
# Count all events for session
db.events.find({session_id: "session_xxxxx"}).count()

# View timeline
db.events.find({session_id: "session_xxxxx"})
  .sort({timestamp: 1})
  .pretty()
```

#### Test 6: Test Running
```
✅ Edit code to implement basic Library class
✅ Click "▶️ Run Tests" button
✅ Wait for results (10s timeout)
✅ See results with ✅ X / ❌ Y format
✅ Click "Show Log ▼" to see pytest output
```

**Expected Results:**
- Some tests pass (at least 1-2)
- Some tests fail (requires full implementation)
- Full output visible in log

**MongoDB Verification:**
```javascript
db.events.find({event_type: "TEST_RUN"}).pretty()
```

---

### Phase 3: Evaluation Testing

#### Test 7: Trigger Evaluation
```
✅ Note session_id from URL
✅ Open: http://localhost:8000/docs
✅ Find "POST /api/evaluate/{session_id}"
✅ Click "Try it out"
✅ Enter session_id: session_xxxxx
✅ Click "Execute"
✅ Wait 10-15 seconds
```

**Expected Response:**
```json
{
  "session_id": "session_xxxxx",
  "status": "success",
  "scores": {
    "pillar_g_goal_decomposition": 75.5,
    "pillar_u_usage_efficiency": 72.3,
    "pillar_i_iteration_refinement": 80.0,
    "pillar_d_detection_validation": 70.0,
    "pillar_e_end_result_quality": 85.0,
    "composite_q_score": 76.6
  },
  "metrics": {...}
}
```

#### Test 8: Retrieve Evaluation
```
✅ Open: http://localhost:8000/docs
✅ Find "GET /api/evaluate/{session_id}"
✅ Click "Try it out"
✅ Enter session_id from previous test
✅ Click "Execute"
```

**Expected Response:** Same evaluation result stored

#### Test 9: List Evaluations
```
✅ Open: http://localhost:8000/docs
✅ Find "GET /api/evaluations"
✅ Click "Try it out"
✅ Click "Execute"
```

**Expected Response:**
```json
{
  "total": 1,
  "page": 1,
  "limit": 10,
  "evaluations": [
    {
      "session_id": "session_xxxxx",
      "composite_q_score": 76.6,
      "timestamp": "2026-03-14T12:00:00Z"
    }
  ]
}
```

---

### Automated Test Suite

#### Run Backend Tests

**All Tests:**
```bash
# Navigate to project root
cd d:\Project\Final_Year_Project\Interview_with_AI

# Ensure virtual environment active
IAI\Scripts\activate

# Run all evaluation tests
pytest app\evaluation\test_evaluation_pipeline.py -v
```

**Expected Output:**
```
app/evaluation/test_evaluation_pipeline.py::test_pillar_g_computation PASSED
app/evaluation/test_evaluation_pipeline.py::test_pillar_u_computation PASSED
app/evaluation/test_evaluation_pipeline.py::test_pillar_i_computation PASSED
app/evaluation/test_evaluation_pipeline.py::test_pillar_d_computation PASSED
app/evaluation/test_evaluation_pipeline.py::test_pillar_e_computation PASSED
app/evaluation/test_evaluation_pipeline.py::test_composite_q_score PASSED
...
======================== 12 passed in 15.23s ========================
```

**Run Specific Test:**
```bash
pytest app\evaluation\test_evaluation_pipeline.py::test_pillar_e_computation -v
```

**Run with Coverage:**
```bash
pytest app\evaluation\test_evaluation_pipeline.py --cov=app.evaluation --cov-report=html
```

---

### Phase 5: Session Management & Resilience Testing

#### Test 10: Session Creation (Hiring Manager)

**UI Test:**
```
✅ Open http://localhost:5173/hiring-manager
✅ See "Create New Session" button
✅ Click button (modal appears)
✅ Enter time limit: 60 minutes
✅ Click "Create Session"
✅ See success notification
✅ See new session in grid with CREATED status (blue badge)
```

**API Test (Swagger):**
```bash
# Open http://localhost:8000/docs
# POST /api/sessions/create
{
  "time_limit_minutes": 60
}

# Expected Response:
{
  "session_id": "session_1710700800_a3f2c8d7e9b1",
  "state": "CREATED",
  "invite_link": "http://localhost:5173/session/session_1710700800_a3f2c8d7e9b1",
  ...
}
```

**MongoDB Verification:**
```javascript
use interview_with_ai
db.sessions.findOne({session_id: "session_1710700800_a3f2c8d7e9b1"})
# Should show state: "CREATED"

db.token_budgets.findOne({session_id: "session_1710700800_a3f2c8d7e9b1"})
# Should show total_budget: 200000, tokens_used: 0
```

#### Test 11: Candidate Onboarding

**UI Test:**
```
✅ Copy invite link from manager dashboard
✅ Open link in new browser tab
✅ See CandidateOnboarding component
✅ See 6 task requirements
✅ See 4 pro tips
✅ Enter candidate name: "Alice"
✅ Click "Start Session"
✅ Redirected to /guide/{session_id}
```

**API Test:**
```bash
# POST /api/sessions/{session_id}/start
{
  "session_id": "session_1710700800_a3f2c8d7e9b1",
  "candidate_name": "Alice"
}

# Expected Response:
{
  "session_id": "session_1710700800_a3f2c8d7e9b1",
  "state": "IN_PROGRESS",
  "candidate_name": "Alice",
  "started_at": "2026-03-17T10:30:15Z"
}
```

**MongoDB Verification:**
```javascript
db.sessions.findOne({session_id: "session_1710700800_a3f2c8d7e9b1"})
# Should show state: "IN_PROGRESS", candidate_name: "Alice"

db.events.findOne({session_id: "session_1710700800_a3f2c8d7e9b1", event_type: "SESSION_START"})
# Should exist with payload containing candidate_name
```

#### Test 12: Token Budget Tracking

**UI Test:**
```
✅ Session in progress at /guide/{session_id}
✅ See TokenBudgetIndicator in chat panel
✅ Shows: "{tokens_used}K / 200K" (e.g., "0K / 200K")
✅ Progress bar at 0% (green)
✅ Send chat message to AI
✅ Wait 2 seconds
✅ TokenBudgetIndicator updates (e.g., "2.5K / 200K")
✅ Progress bar shows ~1% (green)
```

**API Test:**
```bash
# GET /api/sessions/{session_id}/budget
# Expected Response:
{
  "total_budget": 200000,
  "tokens_used": 2500,
  "tokens_remaining": 197500,
  "percentage_used": 1.25,
  "warning_threshold_reached": false
}
```

**Test 80% Warning:**
```
✅ Simulate high token usage
✅ Query: db.token_budgets.updateOne({session_id: "..."}, {$set: {tokens_used: 160000}})
✅ Refresh browser
✅ TokenBudgetIndicator shows ~80%
✅ Progress bar turns yellow
✅ Warning message appears: "⚠️ Token budget running low"
```

**MongoDB Verification:**
```javascript
db.token_budgets.findOne({session_id: "session_1710700800_a3f2c8d7e9b1"})
# Should show updated tokens_used value
# Should show percentage_used >= 80 when warning triggers
```

#### Test 13: Pyodide-Based Test Execution

**UI Test:**
```
✅ In /guide/{session_id}, go to TestPanel (bottom right)
✅ See "🔄 Initializing test engine..." message (5-10 seconds)
✅ Once ready, see "▶️ Run Tests" button enabled
✅ Write basic code in editor:
   def add_book(title, author, isbn):
       return True
   
✅ Click "Run Tests" button
✅ Wait 2-3 seconds (Pyodide executes in browser)
✅ See results: "✅ 1 passed / ❌ 13 failed / 14 total"
✅ Click "Show Log ▼" to see test output
✅ No network requests made to backend (check DevTools Network tab)
```

**Verify Pyodide Execution:**
```javascript
// Open browser DevTools (F12) → Network tab
// Run tests
// Confirm: ONLY 1 request to /api/events (event logging)
//          NO requests to /api/run-tests
```

**MongoDB Verification:**
```javascript
db.events.findOne({session_id: "...", event_type: "TEST_RUN"})
# Should show:
{
  "event_type": "TEST_RUN",
  "execution_mode": "pyodide",  # MUST be "pyodide" not "backend"
  "tests_total": 14,
  "tests_passed": 1,
  "tests_failed": 13
}
```

#### Test 14: Judge Cache System

**Test Cache Hit (30-40% cost savings):**
```
✅ Trigger first evaluation
✅ Monitor Network tab in DevTools
✅ See Gemini API calls (if not cached)
✅ Repeat same evaluation or similar prompt
✅ See significantly fewer API calls
✅ Judge responses returned faster (sub-second)
```

**MongoDB Verification:**
```javascript
db.judge_cache.find({}).count()
# Should show accumulated cache entries (grows over time)

db.judge_cache.aggregate([
  { $group: { _id: null, total: { $sum: 1 }, hits: { $sum: "$hit_count" } } }
])
# Shows cache effectiveness:
# { total: 487, hits: 8234 }  = 89% hit rate
```

#### Test 15: Retry Logic with Exponential Backoff

**Simulate Transient Failure:**
```
✅ Open MongoDB
✅ Stop MongoDB service: net stop MongoDB (Windows) or docker stop mongodb
✅ Trigger evaluation
✅ See in console: "⏳ Attempt 1/3 failed... Retrying in 1s"
✅ Start MongoDB again
✅ See: "⏳ Attempt 2/3" → Success (recovers after brief outage)
✅ Evaluation completes successfully
```

**Verify Retry Behavior (in logs):**
```bash
# Watch backend logs:
# ⏳ Attempt 1/3 — connection timeout
# ⏳ Retrying in 1s
# ⏳ Attempt 2/3 — success ✅
```

#### Test 16: Partial Evaluation (Graceful Degradation)

**Manually Simulate Pillar Failure:**
```
✅ Trigger evaluation
✅ Before completion, manually fail one pillar in code:
   # Edit app/services/evaluation_service.py
   # Inside run_evaluation, make pillar D always raise exception
✅ Run evaluation again
✅ Results return with D marked as unavailable
✅ Other pillars reweighted
✅ Composite Q still calculated
```

**MongoDB Verification:**
```javascript
db.evaluations.findOne({...})
# Should show:
{
  ...
  "partial_evaluation": {
    "available_pillars": { "G": true, "U": true, "I": true, "D": false, "E": true },
    "reweighted_weights": { "G": 0.235, "U": 0.294, "I": 0.235, "D": 0, "E": 0.235 },
    "notice": "Evaluation incomplete: 1 pillar failed (D)"
  }
}
```

#### Test 17: Multiple Concurrent Sessions

**UI Test:**
```
✅ Hiring manager creates 3 sessions (30, 45, 60 minutes)
✅ All 3 appear in dashboard with different states
✅ Open invite link for session 1 in Tab A
✅ Open invite link for session 2 in Tab B
✅ Open invite link for session 3 in Tab C
✅ Work in all 3 tabs simultaneously
✅ Each session has independent token budget
✅ Verify no cross-session data leakage
✅ Manager dashboard updates all 3 in real-time (5s polling)
```

**MongoDB Verification:**
```javascript
db.sessions.find({}).count()
# Should show 3 sessions

db.token_budgets.find({}).count()
# Should show 3 separate budget docs

db.events.find({}).count()
# Should show events grouped by session_id (no mixing)
```

#### Test 18: Session End & Evaluation Flow

**UI Test:**
```
✅ In /guide/{session_id}, code for ~5 minutes
✅ Click "Submit" button (bottom right)
✅ Modal: "Are you sure you want to submit?"
✅ Click "Yes, Submit"
✅ Session state changes to COMPLETED
✅ Timer stops
✅ Redirect to results page (or show "Evaluating..." message)
✅ See evaluation results once ready
```

**API Test:**
```bash
# POST /api/sessions/{session_id}/end
{
  "reason": "submitted",
  "final_code_snapshot": "def add_book(title, author, isbn):\n    return True"
}

# Expected Response:
{
  "session_id": "session_1710700800_a3f2c8d7e9b1",
  "state": "COMPLETED",
  "submitted_at": "2026-03-17T10:50:30Z",
  ...
}

# Then automatically trigger evaluation pipeline
# POST manually (or auto-triggered):
```

**MongoDB Verification:**
```javascript
db.sessions.findOne({session_id: "..."})
# Should show state: "COMPLETED", submitted_at set

db.events.find({session_id: "...", event_type: "SESSION_END"})
# Should show SESSION_END event with duration_seconds

db.evaluations.findOne({session_id: "..."})
# Should show complete evaluation after ~10-15 seconds
```

---

### Phase 5: Automated E2E Tests

**Run Phase 5 Test Suite:**

```bash
# Navigate to project root
cd d:\Project\Final_Year_Project\Interview_with_AI

# Ensure virtual environment active
IAI\Scripts\activate

# Run Phase 5 E2E tests
pytest app\tests\test_e2e_phase5.py -v

# Expected Output:
# TestE2ESessionLifecycle::test_e2e_complete_workflow PASSED
# TestE2ETokenBudget::test_token_budget_warnings PASSED
# TestE2ETokenBudget::test_token_budget_hard_cutoff PASSED
# TestE2EPartialEvaluation::test_pillar_reweighting PASSED
# TestE2EMockIntegration::test_session_state_machine PASSED
#
# ======================= 5 passed in 8.42s =======================
```

**Run Specific Test:**
```bash
pytest app\tests\test_e2e_phase5.py::TestE2ESessionLifecycle::test_e2e_complete_workflow -v
```

**Run with Verbose Output:**
```bash
pytest app\tests\test_e2e_phase5.py -v -s
```

**Run with Coverage:**
```bash
pytest app\tests\test_e2e_phase5.py --cov=app.services --cov=app.schemas --cov-report=html
```

---

## Complete Test Workflow (Step-by-Step)

### 1. Preparation (5 minutes)

```bash
# Terminal 1
cd d:\Project\Final_Year_Project\Interview_with_AI
IAI\Scripts\activate
uvicorn app.main:app --reload
# Wait for "Application startup complete"

# Terminal 2
cd d:\Project\Final_Year_Project\Interview_with_AI\interview_with_ai_frontend
npm run dev
# Wait for "Local: http://localhost:5173"
```

### 2. Verify Services (2 minutes)

```bash
# Check MongoDB
mongosh --eval "db.version()"

# Check Backend
curl http://127.0.0.1:8000/docs
# Should see Swagger UI

# Check Frontend
# Open http://localhost:5173 in browser
# Should see GUIDE interface
```

### 3. Phase 1 UI Test (5 minutes)

```
1. Navigate to http://localhost:5173/guide
2. Verify 3-panel layout
3. Type code in editor: class Library:
4. Send chat message: "How do I create a class?"
5. Check chat response appears
6. Verify no errors in browser console (F12)
```

### 4. Phase 2 Event Logging Test (10 minutes)

```
1. Edit code multiple times
2. Wait 3 seconds between edits
3. Run tests (click "Run Tests" button)
4. Verify pytest output:
   - Should see test results
   - Can be 0/12 if code not complete
5. Click Submit button
6. Session ends
```

**Verify Events in MongoDB:**
```bash
mongosh
use interview_with_ai
db.events.find({session_id: "session_xxxxx"}).count()
# Should show 20-40 events
```

### 5. Phase 3 Evaluation Test (15 minutes)

```
1. Get session_id from browser URL bar
2. Open http://localhost:8000/docs
3. POST /api/evaluate/{session_id}
4. Execute and wait
5. See evaluation scores returned
```

**Expected Time:** 10-15 seconds per evaluation

**Check MongoDB:**
```bash
db.evaluations.findOne({session_id: "session_xxxxx"})
# Should see full evaluation result
```

### 6. Run Automated Tests (10 minutes)

```bash
# Terminal 3
cd d:\Project\Final_Year_Project\Interview_with_AI
IAI\Scripts\activate
pytest app\evaluation\test_evaluation_pipeline.py -v
# Should complete in 15-20 seconds
# All tests should PASS
```

### 7. Phase 5: Session Management Test (20 minutes)

```
1. Open http://localhost:5173/hiring-manager
2. Create new session (60 minutes)
3. Copy invite link
4. Open link in new tab
5. Enter candidate name: "TestCandidate"
6. Click "Start Session"
7. See GUIDE interface with token budget indicator
8. Write code and send chat message
9. Verify TokenBudgetIndicator updates (should show tokens used)
10. Click "Run Tests" button
11. Wait for Pyodide to initialize (~5-10s)
12. See test results (browser-based, no backend calls)
13. Submit session
14. Manager dashboard shows session as COMPLETED
15. Check evaluation scores (auto-triggered)
```

**Verify Phase 5 Features in MongoDB:**
```javascript
# Session was created
db.sessions.findOne({candidate_name: "TestCandidate"})

# Token budget tracked
db.token_budgets.findOne({session_id: "..."})
# Should show tokens_used >= 1000 (from chat)

# Events logged
db.events.find({session_id: "..."}).count()
# Should show 30+ events including TEST_RUN with execution_mode: "pyodide"

# Evaluation completed
db.evaluations.findOne({session_id: "..."})
# Should show all 5 pillar scores and composite_q
```

### 8. Run Phase 5 E2E Tests (5 minutes)

```bash
# Terminal 3
cd d:\Project\Final_Year_Project\Interview_with_AI
IAI\Scripts\activate
pytest app\tests\test_e2e_phase5.py -v
# Should complete in 8-12 seconds
# All 5 tests should PASS:
#   - test_e2e_complete_workflow
#   - test_token_budget_warnings
#   - test_token_budget_hard_cutoff
#   - test_pillar_reweighting
#   - test_session_state_machine
```

---

## Quick Reference: Command Summary

### Backend Commands

```bash
# Setup
cd d:\Project\Final_Year_Project\Interview_with_AI
python -m venv IAI
IAI\Scripts\activate
pip install -r requirements.txt

# Run
uvicorn app.main:app --reload

# Test
pytest app\evaluation\test_evaluation_pipeline.py -v
pytest app\evaluation\test_evaluation_pipeline.py -v --cov=app.evaluation
```

### Frontend Commands

```bash
# Setup
cd d:\Project\Final_Year_Project\Interview_with_AI\interview_with_ai_frontend
npm install

# Run
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

### MongoDB Commands

```bash
# Start service
net start MongoDB

# Stop service
net stop MongoDB

# Connect
mongosh

# List databases
show dbs

# Use database
use interview_with_ai

# Show collections
show collections

# Query events
db.events.find().count()
db.evaluations.find().count()
```

### Testing Endpoints

```bash
# Chat (Phase 1)
curl -X POST http://127.0.0.1:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test_123", "prompt": "Hello"}'

# Events (Phase 2)
curl http://127.0.0.1:8000/api/events/test_123

# Evaluation (Phase 3)
curl -X POST http://127.0.0.1:8000/api/evaluate/test_123
curl http://127.0.0.1:8000/api/evaluate/test_123
curl http://127.0.0.1:8000/api/evaluations
```

---

## Troubleshooting

### Issue: "Port already in use"

**Error:**
```
Address already in use
```

**Solution:**
```bash
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID 12345 /F

# For frontend port 5173
netstat -ano | findstr :5173
taskkill /PID 12345 /F
```

### Issue: "MongoDB connection failed"

**Error:**
```
ServerSelectionTimeoutError
```

**Solution:**
```bash
# Check if MongoDB running
net start MongoDB

# Or with Docker
docker run -d -p 27017:27017 mongo

# Verify connection
mongosh
```

### Issue: "Gemini API quota exceeded"

**Error:**
```
Error 429: You exceeded your current quota
```

**Solutions:**
1. **Enable billing:** https://console.cloud.google.com/billing
2. **Use mock responses:** System auto-falls back (check source="mock")
3. **Wait 1 hour:** Free tier quota resets

### Issue: "ModuleNotFoundError: No module named..."

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Ensure virtual environment activated
IAI\Scripts\activate

# Reinstall requirements
pip install --no-cache-dir -r requirements.txt
```

### Issue: "npm packages not found"

**Error:**
```
Module not found: Can't resolve 'react'
```

**Solution:**
```bash
cd interview_with_ai_frontend
rm -r node_modules
npm install
npm run dev
```

### Issue: "Cannot find .env file"

**Error:**
```
GEMINI_API_KEY not configured
```

**Solution:**
Create `.env` file in project root:
```
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=interview_with_ai
GEMINI_API_KEY=your_key_here
SECRET_KEY=your_secret_key_here_min_32_characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Issue: "Virtual environment not activating"

**Windows Solution:**
```powershell
# Use this command (not bash)
& 'd:\Project\Final_Year_Project\Interview_with_AI\IAI\Scripts\Activate.ps1'

# If error: "running scripts is disabled"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then retry activation
```

---

## Performance Benchmarks

| Operation | Expected Time |
|-----------|--------------|
| Backend startup | <5 seconds |
| Frontend startup | <10 seconds |
| Chat response | 2-5 seconds |
| Test execution | 8-12 seconds |
| Evaluation (5 pillars) | 10-15 seconds |
| Session event logging | <100ms |

---

## Support Checklist

Before seeking help, verify:

- [ ] MongoDB running (check: `mongosh`)
- [ ] Backend running (check: http://127.0.0.1:8000/docs)
- [ ] Frontend running (check: http://localhost:5173)
- [ ] .env file exists with GEMINI_API_KEY
- [ ] Virtual environment activated (check: `(IAI)` in prompt)
- [ ] All dependencies installed (check: `pip list`)
- [ ] Node modules installed (check: `npm list`)
- [ ] Port 8000 not in use
- [ ] Port 5173 not in use
- [ ] Python 3.13+ installed (check: `python --version`)

---

## Final Verification Script

Run this to verify everything works:

```bash
# Test all endpoints
curl http://127.0.0.1:8000/docs
curl http://localhost:5173
curl -X POST http://127.0.0.1:8000/api/chat -H "Content-Type: application/json" -d '{"session_id":"test","prompt":"test"}'
mongosh --eval "db.version()"
```

All should return successful responses.

---

**Ready to GO!** 🚀

Follow the steps above to get your project running. For questions, check the troubleshooting section or review the main GUIDE.md file for additional context.
