# Complete Project Setup & Testing Guide

**Project:** Interview with AI (GUIDE)  
**Last Updated:** March 14, 2026  
**Status:** All Phases Complete ✅

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
