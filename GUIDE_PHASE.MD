# 🚀 GUIDE Project — Complete Phase Breakdown

---

# 🔷 Phase 1: Candidate Interface & LLM Proxy

## 📋 Phase 1 Overview
**Goal:** Build a browser-based candidate interface that allows code editing and AI chat. No evaluation yet — purely UI and LLM connectivity.

**Duration:** Week 1–2 (Solo dev) | Days 1–10 (Team)

**Key Outcome:** Candidates can write code in Monaco editor and chat with an LLM in real-time.

---

## 🏗️ What We're Building in Phase 1

### Step 1.1 — Scaffold the React Application

**Current State:** No frontend exists

**New State:** Full React + Vite + Tailwind setup with three-panel layout

**Components to Build:**

✅ **React + Vite Project**
- Initialize with `npm create vite@latest guide-client -- --template react-ts`
- Install dependencies: @monaco-editor/react, axios, tailwindcss, react-router-dom
- Configure Vite with HMR for live reloading

✅ **Three-Panel Layout**
- Left Panel: Task Sidebar (requirements checklist)
- Center Panel: Monaco Code Editor
- Right Panel: AI Chat Interface
- Responsive design using CSS Grid (breakpoints for mobile)

✅ **Task Requirements Display**
- Hard-code Library Management System requirements:
  - Book Management (CRUD operations)
  - Member Registration & Management
  - Loan Tracking (checkout/return)
  - Search Functionality (by title, author)
  - Overdue Detection (> 14 days)
  - Error Handling (meaningful messages)
- Display as collapsible checklist with progress tracker

### Step 1.2 — Embed Monaco Editor

**Current State:** No code editor

**New State:** Full Monaco editor with Python syntax support and live state management

**Components to Build:**

✅ **Monaco Editor Integration**
- Mount `<Editor language="python" />` component
- Set defaultValue to starter template (empty Python class/functions structure)
- Configure options:
  - `fontSize: 14`
  - `theme: 'vs-dark'` for dark mode
  - `minimap: false`
  - `wordWrap: 'on'`
  - `formatOnPaste: true`

✅ **State Management**
- Store current code in React state (useState hook)
- onChange handler updates state on every keystroke
- Store editor instance reference for diff computation (Phase 2)

✅ **Keyboard Shortcuts**
- Ctrl+S to manually save (explicit save point)
- Ctrl+Enter to submit session or run tests

### Step 1.3 — Build the AI Chat Panel

**Current State:** No chat interface

**New State:** Functional chat UI with typing indicators and message threading

**Components to Build:**

✅ **Message Thread Component**
- Display message history with scrollable container
- User messages aligned right, AI messages aligned left
- Timestamps and message metadata

✅ **User Input Box**
- Text input field at bottom of chat panel
- "Send" button with loading state
- Enter key to submit

✅ **Typing Indicator**
- Show animated "AI is thinking..." message while waiting for response
- Disappear when response arrives

✅ **Response Display**
- Render AI response with proper formatting
- Support for code blocks (```python...```)
- Syntax highlighting for inline code

### Step 1.4 — FastAPI Backend with LLM Proxy Route

**Current State:** No backend exists

**New State:** Working backend with LLM integration and session tracking

**Components to Build:**

✅ **FastAPI Application Setup (main.py)**
- Initialize FastAPI app with CORS middleware
- Enable cross-origin requests from frontend (localhost:5174)
- Register routes
- Start with `uvicorn main:app --reload`

✅ **LLM Proxy Endpoint (/api/chat)**
- Accept POST request: `{ session_id, prompt }`
- Forward prompt to Gemini API / OpenAI API
- Include system prompt: "You are an AI coding assistant helping a candidate solve a Library Management System task. Be concise, practical, and guide toward independent problem-solving."
- Return: `{ session_id, response, tokens_in, tokens_out }`

✅ **Session & Chat Service (services/chat_service.py)**
- `send_prompt()` — Call Gemini/OpenAI API
- Token counting (estimate tokens from response)
- Error handling (API timeouts, quota exceeded)

✅ **Database Integration (database.py)**
- Connect to MongoDB
- Create `sessions_collection` (store session metadata)
- Create `chat_history_collection` (store prompts/responses)
- Store: `{ session_id, timestamp, prompt, response, tokens_in, tokens_out }`

✅ **Pydantic Schemas (schemas/chat_schema.py)**
- `ChatRequest` — validates `{ session_id, prompt }`
- `ChatResponse` — serializes `{ session_id, response, tokens_in, tokens_out }`

---

## 🔍 Problem & Solution

**Problem:** Candidates need immediate feedback on queries; slow API responses create poor UX

**Solution:** 
- Implement request queuing with Redis (optional, Phase 5)
- Show typing indicator while processing
- Cache responses for duplicate prompts
- Use faster models (Gemini Flash) in Phase 1, switch to better models after prototyping

---

## 📊 Phase 1 Deliverables Summary

| Component | What It Does | Impact |
|-----------|-------------|--------|
| React + Monaco Editor | Candidates write code | Core interaction enabler |
| Chat Panel | LLM communication | Real-time AI assistance |
| FastAPI Backend | Routes requests to LLM | API gateway for AI calls |
| Gemini Integration | AI model access | Enables intelligent responses |
| Session Database | Tracks session metadata | Foundation for Phase 2 logging |
| Default Starter Template | Reduces setup friction | Candidates start coding immediately |
| Form Validation (Pydantic) | Prevents malformed requests | API reliability |

**Status:** ✅ **COMPLETE & VERIFIED** (March 13, 2026)

**Tests Passed:**
- ✅ Frontend components render without errors
- ✅ Backend server starts on port 8000
- ✅ API endpoints respond with 200 OK
- ✅ Gemini API integration verified with gemini-2.0-flash

---

# 🔷 Phase 2: Instrumentation Layer — Interaction Trace (Φ)

## 📋 Phase 2 Overview
**Goal:** Capture EVERYTHING the candidate does in a structured, append-only event log. This log is the single source of truth for evaluation.

**Duration:** Week 3 (Solo dev) | Days 11–17 (Team)

**Key Outcome:** Every keystroke, prompt, test run, and file save is recorded in Φ (Phi).

---

## 🏗️ What We're Building in Phase 2

### Step 2.1 — Define the Interaction Trace Schema

**Current State:** Events stored ad-hoc in various collections

**New State:** Unified, append-only event log with standardized envelope

**The Event Envelope:**

Every event in Φ follows this structure:
```json
{
  "_id": ObjectId,
  "session_id": "string",
  "event_type": "SESSION_START | CODE_SAVE | PROMPT | RESPONSE | TEST_RUN | SESSION_END",
  "timestamp": ISODate,
  "payload": { /* event-specific data */ }
}
```

**Event Types Defined:**

✅ **SESSION_START**
- Fired when candidate lands on session page
- Payload: `{ requirements_list, time_limit_minutes }`

✅ **PROMPT**
- Fired when candidate sends a message to AI
- Payload: `{ prompt_text, prompt_length_chars, tokens_in }`

✅ **RESPONSE**
- Fired when AI responds
- Payload: `{ response_text, tokens_out, model_used, latency_ms }`

✅ **CODE_SAVE**
- Fired every 3 seconds when code changes (debounced)
- Payload: `{ filename, diff_text, lines_added, lines_removed, full_snapshot }`

✅ **TEST_RUN**
- Fired when candidate clicks "Run Tests"
- Payload: `{ tests_total, tests_passed, tests_failed, output_log }`

✅ **SESSION_END**
- Fired when candidate submits or timer expires
- Payload: `{ total_duration_seconds, final_code_snapshot, submission_reason }`

### Step 2.2 — Capture Code Diffs on Every Save

**Current State:** Code stored only in session state; no diffs tracked

**New State:** Every code change generates a diff event in Φ

**Components to Build:**

✅ **Monaco onChange Handler (Frontend)**
- Debounce onChange to fire at most every 3 seconds
- Compute unified diff using npm `diff` package
- Extract: lines_added, lines_removed, changed_regions

✅ **Code Diff Service (Frontend)**
- Function: `computeDiff(previousCode, currentCode)`
- Returns: `{ diffText, linesAdded, linesRemoved }`

✅ **Event Submission (Frontend)**
- POST to `/api/events` with payload:
  ```json
  {
    "session_id": "...",
    "event_type": "CODE_SAVE",
    "payload": {
      "filename": "main.py",
      "diff_text": "@@ -5,3 +5,5 @@\n-    old_line\n+    new_line",
      "lines_added": 5,
      "lines_removed": 2,
      "full_snapshot": "entire current code"
    }
  }
  ```

✅ **Backend Event Logger (Backend)**
- POST `/api/events` endpoint
- Append to `events_collection` (append-only, no updates)
- Return: `{ success: true, event_id, timestamp }`

### Step 2.3 — Capture Test Execution Events

**Current State:** Tests may run locally; results not captured

**New State:** All test runs logged to Φ with full output

**Components to Build:**

✅ **Test Execution Service (Backend - test_service.py)**
- Function: `run_tests(candidate_code, session_id)`
- Subprocess execution:
  - Write candidate code to temp file
  - Execute `pytest` with timeout (10 seconds)
  - Capture stdout/stderr
  - Parse output to extract: tests_total, tests_passed, tests_failed

✅ **Test Routes (Backend - test_routes.py)**
- POST `/api/run-tests`
- Receive: `{ session_id, code }`
- Execute tests via test_service
- Log TEST_RUN event to Φ
- Return: `{ tests_total, tests_passed, tests_failed, output_log }`

✅ **Test UI Button (Frontend - TestPanel.jsx)**
- "Run Tests" button in UI
- Show loading spinner while running
- Display results: "5 passed ✅, 1 failed ❌"
- Collapsible output log

✅ **Pre-written Test Suite (backend - library_tests.py)**
- 6 test cases covering all requirements:
  - Book CRUD operations
  - Member registration
  - Loan tracking (limit check)
  - Search functionality
  - Overdue detection
  - Error handling

### Step 2.4 — Session Lifecycle Events

**Current State:** No session start/end tracking

**New State:** Clear session boundaries with lifecycle events

**Components to Build:**

✅ **Session Start Event (Frontend)**
- Fired on GuidePage mount (useEffect)
- POST to `/api/events`:
  ```json
  {
    "event_type": "SESSION_START",
    "payload": {
      "requirements_list": ["Book CRUD", "Member Mgmt", "Loan Tracking", ...],
      "time_limit_minutes": 60
    }
  }
  ```

✅ **Session Timer (Frontend - GuidePage.jsx)**
- 60-minute countdown timer displayed prominently
- Updates every second
- Visual warning when < 5 minutes remain
- Triggers SESSION_END and auto-submit at 0:00

✅ **Session End Event (Frontend)**
- Fired when:
  - Candidate clicks "Submit" button
  - Timer reaches 0:00 (auto-submit)
  - Browser tab closes (with onbeforeunload hook)
- POST to `/api/events`:
  ```json
  {
    "event_type": "SESSION_END",
    "payload": {
      "total_duration_seconds": 3600,
      "final_code_snapshot": "...",
      "submission_reason": "manual | timeout | tab_closed"
    }
  }
  ```

---

## 🔍 Problem & Solution

**Problem:** Without detailed event capture, evaluation pipelines have no signal to analyze

**Solution:** 
- Implement append-only event log (Φ) as authoritative source
- Every action → event
- Enables reproducible analysis and debugging

---

## 📊 Phase 2 Deliverables Summary

| Component | What It Does | Impact |
|-----------|-------------|--------|
| Event Schema | Standardized event format | Foundation for all analysis |
| CODE_SAVE Event Capture | Track code changes with diffs | Enables iteration analysis |
| TEST_RUN Event Logging | Capture test results | Enables functional completeness scoring |
| SESSION_START/END Events | Mark session boundaries | Enables time-based metrics |
| events_collection (DB) | Persistent event log | Φ stored safely in MongoDB |
| Debounced Diff Computation | Prevent event log flooding | Performance optimization |
| Test Harness (pytest) | Pre-written test suite | Reproducible correctness validation |

**Status:** ✅ **COMPLETE & VERIFIED** (March 13, 2026)

**Metrics:**
- ✅ 6 event types defined and implemented
- ✅ Φ size: ~20-60 KB per session (with full code snapshots)
- ✅ Estimated 23-45 events per session
- ✅ All routes tested and working

---

# 🔷 Phase 3: Evaluation Engine — Pillar Pipelines

## 📋 Phase 3 Overview
**Goal:** Build the automation engine that converts Φ into five GUIDE pillar scores (G, U, I, D, E) using deterministic rules and LLM-as-Judge calls.

**Duration:** Week 4–6 (Solo dev) | Days 18–43 (Team)

**Key Outcome:** Candidates receive normalized scores (0-100) for each pillar; composite Q score reflects overall performance.

---

## 🏗️ What We're Building in Phase 3

### Step 3.1 — Pillar G: Goal Decomposition Pipeline

**Current State:** No metric computation

**New State:** Automated pipeline that scores planning quality

**Goal Decomposition measures:**
- Does the candidate understand the requirements?
- Do they decompose the task into logical subtasks?
- Do they execute tasks in proper order?

**Components to Build:**

✅ **Pre-Planning Ratio (PPR) - 20% weight**
- Define: First PROMPT event occurs at T1; session starts at T0
- PPR = (T1 - T0) / total_session_duration
- Sweet spot: 10-20% (some planning, not overthinking)
- Scoring:
  - < 5%: 50 (insufficient planning)
  - 5-10%: 70
  - 10-20%: 100 (ideal)
  - 20-40%: 70
  - > 40%: 40 (over-planning)

✅ **Decomposition Depth Score (DDS) - 30% weight**
- Reference DAG: ideal subtasks for Library Management
  - [define_schema] → [book_crud] → [member_mgmt] → [loan_logic] → [overdue_check] → [search]
- LLM-as-Judge call: extract subtasks from first 3 prompts
- DDS = (overlapping_nodes / total_reference_nodes) × 100
- DDS = overlap / 6 × 100

✅ **Requirement Coverage (RC) - 35% weight**
- Fire test suite on final code
- RC = tests_passed / total_requirement_tests × 100
- Direct measure of completeness

✅ **Subtask Ordering Score (SOS) - 15% weight**
- Examine CODE_SAVE event sequence
- Extract which features appear in each diff
- Check for dependency violations:
  - Attempting loan operations before schema definition = violation
  - Implementing search before book management = violation
- SOS = 100 - (violation_count × 10), floored at 0

✅ **Pillar G Score Formula**
```
G = (DDS × 0.30) + (PPR_normalized × 0.20) + (RC × 0.35) + (SOS × 0.15)
```

### Step 3.2 — Pillar U: Usage Efficiency Pipeline

**Current State:** No prompt analysis

**New State:** Automated scoring of how effectively prompts leverage the AI

**Usage Efficiency measures:**
- Are prompts specific and well-structured?
- Do prompts reference the candidate's actual code?
- Are there redundant prompts?
- Is the AI's output being used effectively?

**Components to Build:**

✅ **Prompt Specificity Score (PSS) - 25% weight**
- For each PROMPT event, call LLM-as-Judge with rubric:
  - Rate 1-10: "Constraint clarity" (are requirements stated clearly?)
  - Rate 1-10: "Context richness" (does prompt include relevant context?)
  - Rate 1-10: "Actionability" (can AI give concrete, implementable guidance?)
- PSS = (score_a + score_b + score_c) / 3 averaged across all prompts
- Use temperature=0 for consistency
- 3-call majority vote for disagreements

✅ **Prompts-Per-Feature (PPF) - 20% weight**
- Count total PROMPT events from Φ
- Count distinct features implemented (from TEST_RUN passes + code diffs)
- Features: book_crud (1), member_mgmt (1), loan_tracking (1), search (1), overdue_check (1), error_handling (1) = 6 features
- PPF = total_prompts / distinct_features
- Ideal range: 1.5—2.5 prompts per feature
- Scoring:
  - < 1.0: 50 (rushing, not using AI enough)
  - 1.0-1.5: 75
  - 1.5-2.5: 100 (ideal)
  - 2.5-4.0: 80
  - > 4.0: 40 (over-relying on AI)

✅ **Context Injection Rate (CIR) - 25% weight**
- For each PROMPT, check if it mentions:
  - Variable names present in current code
  - Function names present in current code
  - Class names present in current code
- CIR = prompts_with_code_reference / total_prompts
- Target: > 70%
- Scoring: (CIR / 0.70) × 100, capped at 100

✅ **Redundancy Penalty (RP) - 15% weight**
- Compute sentence-transformer embeddings for all prompts
- For consecutive prompt pairs, compute cosine similarity
- If similarity > 0.85, flag as redundant
- RP = 1 - (redundant_count / total_prompts)
- Score: RP × 100

✅ **Token Efficiency Ratio (TER) - 15% weight**
- Track tokens_out from RESPONSE events where code was accepted
- Compare to total tokens_in across all PROMPT events
- TER = sum(useful_output_tokens) / sum(input_tokens)
- Target: TER > 0.5
- Scoring: (TER / 0.5) × 100, capped at 100

✅ **Pillar U Score Formula**
```
U = (PSS × 0.25) + (PPF_normalized × 0.20) + (CIR × 0.25) + (RP × 0.15) + (TER × 0.15)
```

### Step 3.3 — Pillar I: Iteration & Refinement Pipeline

**Current State:** No iteration tracking

**New State:** Automated scoring of how effectively candidate refines code

**Iteration measures:**
- How many iterations to fix bugs?
- What % of AI responses does the candidate accept?
- Do fixes introduce new bugs (regressions)?

**Components to Build:**

✅ **Error Recovery Speed (ERS) - 35% weight**
- Identify TEST_RUN events where tests_failed > 0
- Find the next TEST_RUN where that same test passes
- Count PROMPT events in between
- ERS = 1 / avg_turns_to_fix
- Benchmark: 3 turns expected
- Scoring: (ERS / benchmark) × 100, capped at 100

✅ **Acceptance Rate (AR) - 35% weight**
- For each RESPONSE event:
  - Extract code from response
  - Compare to next CODE_SAVE event
  - If diff < 10% (minor edits only), mark as "accepted as-is"
- AR = accepted_responses / total_responses × 100
- Ideal range: 20-90% (tent function peaking at 55%)
- Too low (< 20%): candidate doesn't trust AI
- Too high (> 90%): candidate blindly accepts (red flag)

✅ **Regression Rate (RR) - 30% weight**
- After each CODE_SAVE that follows a bug fix:
  - Re-run relevant test suite
  - Check if new failures appear
- RR = 1 - (regressions_introduced / fixes_applied)
- Track via TEST_RUN event sequences
- Scoring: RR × 100

✅ **Pillar I Score Formula**
```
I = (ERS × 0.35) + (AR × 0.35) + (RR × 0.30)
```

### Step 3.4 — Pillar D: Detection & Validation Pipeline

**Current State:** No bug/hallucination detection

**New State:** Candidate ability to catch AI mistakes and spot hidden bugs

**Detection measures:**
- Can the candidate catch seeded bugs?
- Can they identify when AI suggests non-existent functions?
- Do they verify their work?

**Components to Build:**

✅ **Seeded Bugs - System Design**
- Generate 3 subtle bugs in starter template:
  - Bug #1: Off-by-one in date comparison (will fail overdue_check test)
  - Bug #2: Missing null check in member search (will crash on edge case)
  - Bug #3: Wrong join direction in loan query (returns empty list)
- Track seeded_bugs in database with: {bug_id, location, description, test_that_catches_it}

✅ **Bug Detection Rate (BDR) - 40% weight**
- At session end, examine CODE_SAVE events for diffs that fix seeded bug locations
- BDR = bugs_corrected / 3
- Scoring: BDR × 100

✅ **Hallucination Catch Rate (HCR) - 40% weight**
- Between 15-25 minutes into session, LLM proxy injects a response containing:
  - Non-existent function: `db.fuzzySearchByAuthor()`
  - Non-existent class: `LoanManager().autoExtend()`
  - Non-existent API: `externalLibrary.validateISBN()`
- Monitor subsequent CODE_SAVE events:
  - If candidate uses hallucinated function and TEST_RUN fails without correction: HCR = 0
  - If candidate never uses it or immediately fixes: HCR = 1
  - Score: HCR × 100

✅ **Time-to-First-Run (TFR) - 20% weight**
- Timestamp of first TEST_RUN event minus session_start
- Lower is better (candidate verified early)
- Scoring: max(0, 1 - (ttr_minutes / 20)) × 100
- Target: First run within 5 minutes

✅ **Pillar D Score Formula**
```
D = (BDR × 0.40) + (HCR × 0.40) + (TFR × 0.20)
```

### Step 3.5 — Pillar E: End Result Quality Pipeline

**Current State:** No code quality analysis

**New State:** Automated assessment of final code quality

**Quality measures:**
- Does the code work? (Functional completeness)
- Is it clean and maintainable? (Code quality)
- Does it follow good design principles? (Architecture)
- Is it secure? (Security)
- Is it documented? (Documentation)

**Components to Build:**

✅ **Functional Completeness (FC) - 35% weight**
- Run full pytest suite on final code snapshot
- FC = tests_passed / total_tests × 100
- Direct measure of working features

✅ **Code Quality Score (CQS) - 20% weight**
- Run pylint on final Python files
- Pylint returns score 0-10
- CQS = pylint_score × 10
- Also run radon for cyclomatic complexity:
  - Penalize if any function has complexity > 10
  - Penalty: -5 points per offending function
- CQS = max(0, pylint_score × 10 - penalties)

✅ **Architectural Coherence (AC) - 20% weight**
- LLM-as-Judge call providing full final codebase
- Prompt: "Rate this code 1-10 on:
  - (a) Separation of concerns (are responsibilities properly isolated?)
  - (b) Modularity (can functions/classes be reused independently?)
  - (c) Design patterns (are appropriate patterns applied?)
  Return JSON {score_a, score_b, score_c}"
- AC = avg(score_a, score_b, score_c) / 10 × 100
- Use temperature=0, 3-call majority vote

✅ **Security Score (SS) - 15% weight**
- Run Bandit security scanner on Python code
- Bandit produces issues with severity/confidence ratings
- SS = 100 - (high_severity × 20 + medium_severity × 5 + low_severity × 1)
- Floor at 0

✅ **Documentation Quality (DQ) - 10% weight**
- Measure comment-to-code ratio
- Check for docstrings on functions/classes (target: 100%)
- DQ = (docstrings_ratio × 0.6) + (comment_ratio_normalized × 0.4) × 100
- Target: > 15% comments

✅ **Pillar E Score Formula**
```
E = (FC × 0.35) + (CQS × 0.20) + (AC × 0.20) + (SS × 0.15) + (DQ × 0.10)
```

### Step 3.6 — LLM-as-Judge Utility (llm_judge.py)

**Current State:** No reusable utility for LLM judgments

**New State:** Standardized interface for all Judge calls

**Components to Build:**

✅ **Judge Call Wrapper**
```python
def judge_score(prompt, context, rubric, temperature=0):
    """
    Make a consistent LLM-as-Judge call
    - Use same model (Gemini or GPT-4o)
    - temperature=0 for consistency
    - Retry up to 3 times on failure
    - Return JSON-parsed result
    """
```

✅ **Majority Vote Logic**
- For critical Judge calls, invoke 3 times
- Aggregate results: take median score
- Return result + confidence

### Step 3.7 — Evaluation Orchestrator (evaluation_service.py & evaluation_routes.py)

**Current State:** No orchestration

**New State:** Centralized pipeline that runs all 5 pillars in sequence

**Components to Build:**

✅ **Evaluation Service**
```python
def evaluate_session(session_id):
    """
    Orchestrate full evaluation:
    1. Fetch Φ (events) for session
    2. Compute Pillar G score
    3. Compute Pillar U score
    4. Compute Pillar I score
    5. Compute Pillar D score
    6. Compute Pillar E score
    7. Compute composite Q score
    8. Store results to database
    """
```

✅ **API Endpoints**
- POST `/api/evaluate/{session_id}` — Trigger evaluation
- GET `/api/evaluate/{session_id}` — Retrieve results
- GET `/api/evaluations` — List all evaluations

---

## 🔍 Problem & Solution

**Problem:** Evaluation is subjective without clear metrics and consistent scoring

**Solution:**
- Define explicit metrics for each pillar
- Use LLM-as-Judge only for qualitative assessments
- Deterministic rules for quantitative metrics
- Majority voting for Judge consistency

---

## 📊 Phase 3 Deliverables Summary

| Component | What It Does | Impact |
|-----------|-------------|--------|
| Pillar G Pipeline | Scores planning & decomposition | Measures strategic thinking |
| Pillar U Pipeline | Scores prompt effectiveness | Measures AI collaboration skill |
| Pillar I Pipeline | Scores iteration speed | Measures debugging efficiency |
| Pillar D Pipeline | Scores bug detection | Measures quality assurance |
| Pillar E Pipeline | Scores final code | Measures execution quality |
| LLM-as-Judge Utility | Consistent qualitative scoring | Reduces bias in judgments |
| Evaluation Orchestrator | Runs all pipelines | Centralized scoring automation |
| Sub-metric Tracking | Detailed scoring breakdown | Transparency for feedback |

**Status:** ✅ **COMPLETE & VERIFIED** (March 13, 2026)

**Metrics:**
- ✅ 5 pillars implemented
- ✅ 20+ sub-metrics defined
- ✅ LLM-as-Judge with 3-call voting
- ✅ All routes tested and working

---

# 🔷 Phase 4: Scoring Aggregation & Results Dashboard

## 📋 Phase 4 Overview
**Goal:** Combine the five pillar scores into a composite GUIDE score and display results in an actionable hiring dashboard for managers.

**Duration:** Week 7 (Solo dev) | Days 44–50 (Team)

**Key Outcome:** Hiring managers see candidate performance at a glance with detailed breakdowns and red-flag indicators.

---

## 🏗️ What We're Building in Phase 4

### Step 4.1 — Scoring Aggregation Service

**Current State:** Pillar scores computed separately; no composite score

**New State:** Unified results with composite Q score and weighting

**Components to Build:**

✅ **Evaluation Orchestration (dashboard_service.py)**
- Fetch all pillar scores (G, U, I, D, E) from Phase 3
- Apply weighting formula:
  ```
  Q = (0.20 × G) + (0.25 × U) + (0.20 × I) + (0.15 × D) + (0.20 × E)
  ```
- Rationale:
  - 25% Usage Efficiency (U) — AI collaboration is primary skill
  - 20% each for Goal (G), Iteration (I), End Result (E) — balanced execution
  - 15% Detection (D) — quality assurance task
  - 0-100 normalized scale

✅ **Result Storage (database)**
- Create `evaluations_collection` with schema:
  ```json
  {
    "session_id": "...",
    "evaluation_timestamp": ISODate,
    "scores": {
      "G": 85,
      "U": 78,
      "I": 92,
      "D": 100,
      "E": 88
    },
    "composite_q_score": 86,
    "sub_metrics": {
      "G": { "PPR": 100, "DDS": 80, "RC": 85, "SOS": 75 },
      "U": { "PSS": 75, "PPF": 82, "CIR": 71, "RP": 88, "TER": 72 },
      ...
    },
    "candidate_info": { "name": "Jane Doe" },
    "session_duration_seconds": 3600
  }
  ```

✅ **API Endpoint: GET /api/dashboard/stats**
- Aggregate statistics across all sessions:
  - Total sessions completed
  - Average Q score
  - Highest/lowest scores
  - Distribution buckets (0-20, 20-40, ..., 80-100)
  - Average per pillar
- Response:
  ```json
  {
    "success": true,
    "stats": {
      "total_sessions": 42,
      "avg_q_score": 75.3,
      "max_q_score": 98,
      "min_q_score": 42,
      "pillar_averages": { "G": 78, "U": 72, "I": 81, "D": 70, "E": 79 },
      "score_distribution": [
        { "bucket": "0-20", "count": 1 },
        { "bucket": "20-40", "count": 3 },
        { "bucket": "40-60", "count": 8 },
        { "bucket": "60-80", "count": 18 },
        { "bucket": "80-100", "count": 12 }
      ]
    }
  }
  ```

✅ **API Endpoint: GET /api/dashboard/rankings**
- Get ranked sessions with filtering:
  - Default sort: composite_q_score descending
  - Query params: `sort_by` (G|U|I|D|E|composite_q_score), `order` (asc|desc), `limit` (default 50)
- Response:
  ```json
  {
    "success": true,
    "count": 42,
    "rankings": [
      {
        "rank": 1,
        "session_id": "...",
        "candidate_name": "Jane Doe",
        "composite_q_score": 98,
        "pillar_scores": { "G": 96, "U": 95, "I": 100, "D": 100, "E": 99 },
        "hiring_recommendation": "Strong Hire",
        "evaluation_date": ISODate
      },
      ...
    ]
  }
  ```

✅ **API Endpoint: GET /api/dashboard/session/{id}**
- Fetch full evaluation detail for a specific session:
  - All pillar scores
  - All sub-metrics with descriptions
  - Hiring recommendation logic
  - Red-flag indicators
- Response:
  ```json
  {
    "success": true,
    "session": {
      "session_id": "...",
      "candidate_name": "Jane Doe",
      "composite_q_score": 86,
      "evaluation_date": ISODate,
      "scores": { "G": 85, "U": 78, "I": 92, "D": 100, "E": 88 },
      "sub_metrics": {
        "G": [
          { "metric": "Pre-Planning Ratio", "score": 100, "benchmark": "10-20%", "value": "15%" },
          ...
        ]
      },
      "red_flags": [
        { "type": "HIGH_ACCEPTANCE_RATE", "value": 92, "message": "Candidate blind-accepts AI responses" }
      ],
      "hiring_recommendation": "Hire"
    }
  }
  ```

✅ **API Endpoint: GET /api/dashboard/trends**
- Time-series data for trend chart:
  - Chronological list of Q scores
  - Show trend over time (e.g., improving, declining)
- Response:
  ```json
  {
    "success": true,
    "count": 42,
    "trends": [
      { "session_id": "...", "date": ISODate, "q_score": 72 },
      { "session_id": "...", "date": ISODate, "q_score": 75 },
      { "session_id": "...", "date": ISODate, "q_score": 82 },
      ...
    ]
  }
  ```

### Step 4.2 — Results Dashboard UI

**Current State:** No dashboard exists

**New State:** Professional hiring manager dashboard with multiple views

**Components to Build:**

✅ **ResultsDashboard.jsx (Main Page)**
- Two modes:
  1. **Overview Mode** (`/results`) — cohort statistics and rankings
  2. **Session Detail Mode** (`/results/:sessionId`) — individual candidate report

✅ **Overview Mode Features**
- 📊 **Stats Cards**:
  - Total candidates
  - Average Q score
  - Highest/lowest score
  - Score distribution histogram

- 📋 **Rankings Table**:
  - Columns: Rank, Name, Q Score (color-coded), G, U, I, D, E, Recommendation
  - Sortable by any column
  - Click row to view detail
  - Pagination (50 per page)

- 📉 **Trend Chart**:
  - Line chart showing Q scores over time
  - Hover to see candidate names
  - Identify patterns (improving cohort? declining?)

✅ **Session Detail Mode Features**
- 🎯 **Radar Chart (ScoreRadarChart.jsx)**:
  - 5-axis chart with axes labeled G, U, I, D, E
  - Concentric rings: 20, 40, 60, 80, 100
  - Filled polygon showing candidate's scores
  - Gradient fill with glow effect
  - Canvas-based for performance

- 📚 **Score Breakdown (ScoreBreakdown.jsx)**:
  - 5 collapsible sections (one per pillar)
  - For each pillar, show all sub-metrics:
    - Metric name
    - Score (0-100)
    - Benchmark range
    - Visual bar with color-coding
  - Color scheme: green (> 75), yellow (50-75), red (< 50)

- ⚠️ **Red-Flag Indicators**:
  - Acceptance Rate > 90% → "Blind acceptance"
  - Time-to-First-Run > 20 min → "Never verified work"
  - Hallucination Catch Rate = 0 → "Failed to catch errors"
  - Functional Completeness < 50% → "Incomplete solution"

- 📰 **Code Quality Report**:
  - Pylint score
  - Bandit security issues (grouped by severity)
  - Cyclomatic complexity issues
  - Documentation coverage

- 🎓 **Hiring Recommendation**:
  - Large badge: "Strong Hire" | "Hire" | "No Hire"
  - Threshold logic:
    - Strong Hire: Q ≥ 80
    - Hire: Q ≥ 60
    - No Hire: Q < 60

✅ **Responsive Design**
- Mobile breakpoint: stack vertically below 768px
- Radar chart scales based on viewport
- Table becomes scrollable on small screens
- Dark theme (GitHub-inspired palette)

✅ **Navigation**
- Breadcrumb: Results > [Candidate Name]
- Back button to rankings
- Ability to view previous/next candidate from detail view

### Step 4.3 — Styling & Visual Design

**Current State:** No styling framework

**New State:** Premium dark-theme UI with glassmorphism

**Design System:**

✅ **Color Palette**
- Background: #0d1117 (GitHub dark)
- Secondary: #161b22 (slightly lighter)
- Accent: #58a6ff (blue highlight)
- Success: #3fb950 (green)
- Warning: #d29922 (orange)
- Error: #f85149 (red)
- Text: #e6edf3 (off-white)

✅ **Component Styling**
- Stat cards: Glassmorphism with backdrop blur
- Hover transitions: 200ms ease-in-out
- Radius: 8px for cards, 12px for buttons
- Shadows: Subtle elevation effect
- Gradient accents: Blue → purple

✅ **Responsive Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔍 Problem & Solution

**Problem:** Hiring managers need actionable insights at a glance; raw scores alone are not enough

**Solution:**
- Visualize scores with context (radar charts, benchmarks)
- Highlight red flags automatically
- Provide clear hiring recommendations
- Enable drill-down for deeper analysis

---

## 📊 Phase 4 Deliverables Summary

| Component | What It Does | Impact |
|-----------|-------------|--------|
| Scoring Aggregation | Combines pillars into Q score | Single composite metric |
| Dashboard Stats API | Cohort-level statistics | Hiring manager visibility |
| Rankings API | Sortable candidate ranking | Comparative analysis |
| Session Detail API | Detailed candidate report | Deep dive capability |
| Radar Chart | 5-axis score visualization | At-a-glance assessment |
| Score Breakdown | Per-pillar metric details | Granular feedback |
| Red-Flag Indicators | Automatic issue highlighting | Risk identification |
| Hiring Recommendation | Clear recommend/reject signal | Decision support |
| Responsive UI | Mobile-friendly dashboard | Accessibility |

**Status:** ✅ **COMPLETE & OPERATIONAL** (March 14, 2026)

**UI Components:**
- ✅ ResultsDashboard.jsx (main page)
- ✅ ScoreRadarChart.jsx (canvas visualization)
- ✅ ScoreBreakdown.jsx (metric details)
- ✅ SessionRankingTable.jsx (rankings view)
- ✅ ScoreTrendChart.jsx (time-series)

---

# 🔷 Phase 5: Hardening & Session Management

## 📋 Phase 5 Overview
**Goal:** Make the prototype usable in a real hiring flow by adding session management, security, and reliability.

**Duration:** Week 8 (Solo dev) | Part of final sprint (Team)

**Key Outcome:** Production-ready system with professional session workflow, security controls, and cost management.

---

## 🏗️ What We're Building in Phase 5

### Step 5.1 — Session Lifecycle Management

**Current State:** Candidates access `/guide` directly; no formal session creation

**New State:** Proper workflow with hiring manager dashboard for session creation and candidate onboarding

**Components to Build:**

✅ **Hiring Manager Dashboard**
- New page: `/hiring-manager`
- Features:
  - "Create New Session" button
  - Displays list of active sessions:
    - Session ID
    - Candidate name (empty until candidate joins)
    - Time remaining
    - Status (CREATED, IN_PROGRESS, COMPLETED, EVALUATED)
  - Displays completed sessions with GUIDE scores
  - Copy invite link button (copies to clipboard)

✅ **Session Creation Service**
- Backend endpoint: POST `/api/sessions`
- Generate unique invite link: `guide.com/session/{session_id}`
- Session ID format: `sess_` + 12 random alphanumeric chars
- Store in database:
  ```json
  {
    "session_id": "sess_abc123xyz789",
    "created_by": "hiring_manager_id",
    "created_at": ISODate,
    "time_limit_minutes": 60,
    "settings": {
      "requirements": [...],
      "task_description": "..."
    },
    "status": "CREATED",
    "candidate_name": null,
    "started_at": null,
    "ended_at": null
  }
  ```

✅ **Configurable Session Settings**
- Time limit: Default 60 minutes, configurable 30-120 minutes
- Task selection: Default Library Management, allow other tasks (extensible)
- Auto-save settings per session
- Stored in sessions collection

✅ **Candidate Onboarding Flow**
- Candidate receives invite link via email/messaging
- Clicks link → lands on `/session/[id]` page
- See task description and requirements
- Prompted: "Enter your name to begin"
- On submit:
  - Store candidate_name in session
  - Set status to IN_PROGRESS
  - Log SESSION_START event with time_limit_minutes
  - Display timer
  - Show `/guide` interface

✅ **Session State Machine**
- **CREATED**: Session initialized, candidate link generated, waiting for candidate
- **IN_PROGRESS**: Candidate has joined, session is active
- **COMPLETED**: Session ended (manual submit or timer expired)
- **EVALUATED**: Evaluation pipeline has run, scores available
- State transitions:
  - CREATED → IN_PROGRESS (candidate joins)
  - IN_PROGRESS → COMPLETED (submit or timeout)
  - COMPLETED → EVALUATED (evaluation finishes)

✅ **Auto-Submit on Timer Expiry**
- When timer hits 0:00:
  - Automatically log SESSION_END event
  - Freeze code editor (read-only)
  - Show "Session ended" message
  - Trigger evaluation pipeline immediately
  - Redirect to results page showing evaluation in progress

### Step 5.2 — Sandboxing Code Execution 🔒

**Current State:** Code execution via subprocess (unsafe on shared server)

**New State:** Isolated execution environment preventing malicious code

**Problem:** Candidates could write:
- Fork bombs: `while True: os.fork()`
- File access: `os.system('rm -rf /')`
- Network access: DNS exfiltration
- DoS attacks: Infinite loops consuming resources

**Solution: Option A — Docker Containers (Recommended)**

✅ **Architecture**
- Each test run spawns a new container
- Container created from lightweight Python image
- Container destroyed after run completes
- Network access disabled
- CPU/memory limits enforced
- 10-second timeout per run

✅ **Implementation (test_service.py)**
```python
def run_tests_sandboxed(candidate_code, session_id):
    """Execute tests in isolated Docker container"""
    # 1. Write candidate code to temp file
    # 2. Create container with:
    #    - Volume mount: code directory (read-only)
    #    - No network access
    #    - CPU limit: 1 core
    #    - Memory limit: 256 MB
    #    - Timeout: 10 seconds
    # 3. Execute: pytest /sandbox/main.py
    # 4. Capture stdout/stderr
    # 5. Destroy container
    # 6. Return results
```

✅ **Docker Compose Configuration**
```yaml
services:
  guide-executor:
    image: python:3.11-slim
    volumes:
      - /tmp/candidate_code:/sandbox:ro
    networks:
      none: {}  # No network access
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 256M
```

**Solution: Option B — Pyodide (Browser-based)**

✅ **Architecture**
- Python executed in WebAssembly inside browser
- No server-side code execution
- Instant feedback to candidate
- Limited to browser capabilities (no file system, network)

✅ **Implementation (Frontend - test_panel)**
```javascript
// Load Pyodide in web worker
importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.0/full/pyodide.js");

async function runTests(code) {
  let pyodide = await loadPyodide();
  // Load test suite
  // Execute candidate code + tests
  // Return results
}
```

### Step 5.3 — LLM Cost Controls 💰

**Current State:** Unlimited API calls per session; costs could spiral

**New State:** Token budgeting and caching to control costs

**Problem:** Typical session:
- ~50 candidate prompts × $X per prompt
- ~30 LLM-as-Judge evaluation calls × $Y per call
- = ~80 API calls per session
- Without budget controls, costs could reach $500+ per session

**Solution:**

✅ **Per-Session Token Budget**
- Default: 200,000 tokens per session
- Rationale: ~50 prompts × 2,000 tokens average + ~30 Judge calls × 1,500 tokens = ~80,000 tokens typical
- Track in sessions collection:
  ```json
  {
    "session_id": "...",
    "token_budget": 200000,
    "tokens_used": 45000,
    "token_limit_exceeded": false
  }
  ```

✅ **Token Tracking in Chat Service**
- On each PROMPT: subtract tokens_in from budget
- On each RESPONSE: subtract tokens_out from budget
- On each Judge call: subtract estimated tokens
- Decrement budget in real-time

✅ **Token Warning System**
- At 80% budget: Display warning banner
  - "You've used 160K / 200K tokens (80%). Make your prompts count!"
  - Don't block interaction
- At 100% budget: Soft limit
  - Allow completion of current requests
  - Warn on next interaction: "Budget exhausted. Contact hiring manager."
- Hard cutoff option (optional):
  - If configured, block new prompts at 100%

✅ **Implementation (chat_service.py)**
```python
def check_token_budget(session_id, tokens_needed):
    """Check if budget allows request"""
    session = db.sessions.findOne({"session_id": session_id})
    if session["tokens_used"] + tokens_needed > session["token_budget"]:
        return {
            "allowed": False,
            "message": "Token budget exhausted",
            "used": session["tokens_used"],
            "budget": session["token_budget"]
        }
    return {"allowed": True}

def charge_tokens(session_id, tokens):
    """Deduct tokens from budget"""
    db.sessions.updateOne(
        {"session_id": session_id},
        {"$inc": {"tokens_used": tokens}}
    )
```

✅ **Judge Evaluation Caching**
- Cache key: hash(prompt_text + rubric + model)
- Store in `judge_cache_collection`:
  ```json
  {
    "cache_key": "sha256_hash",
    "prompt": "...",
    "rubric": "...",
    "result": {
      "score_a": 8,
      "score_b": 7,
      "score_c": 9
    },
    "created_at": ISODate,
    "ttl_days": 30  // Expire after 30 days
  }
  ```
- Before calling Judge:
  1. Compute cache_key from prompt + rubric
  2. Query `judge_cache_collection`
  3. If hit, return cached result (0 tokens charged)
  4. If miss, call Judge, cache result, charge tokens

✅ **Token Savings Estimate**
- Judge call is often repeated (e.g., PSS rating for similar prompts)
- Expected cache hit rate: 30-40%
- Savings: ~25 Judge calls × 1,500 tokens × 0.35 = 13,125 tokens
- Cost reduction: 30-40% on evaluation costs

### Step 5.4 — Reliability & Error Handling 🛡️

**Current State:** Evaluation fails if any component has issues

**New State:** Graceful failure handling with partial results

**Problem:**
- Session interrupted mid-evaluation
- LLM API times out during Judge call
- Test execution fails on malformed code
- Φ (interaction trace) incomplete

**Solution:**

✅ **Partial Interaction Trace Handling**
- Don't require complete Φ to proceed with evaluation
- Robust metric computation:
  - Can compute from partial data
  - Mark metrics as "unavailable" if missing data
  - Exclude missing metrics from aggregation

✅ **Example: Pillar U with Partial Data**
- If only 30/50 prompts captured:
  - Compute PSS, PPF, CIR, RP on available prompts
  - Mark TER as "unavailable" (incomplete token data)
  - Reweight formula:
    ```
    U_reweighted = (PSS × 0.30) + (PPF × 0.24) + (CIR × 0.30) + (RP × 0.18)
    (Normalized so weights sum to 1.0)
    ```

✅ **LLM-as-Judge Resilience**
- Retry logic: Up to 3 retries with exponential backoff
  - 1st attempt: immediate
  - 2nd attempt: 2 second delay
  - 3rd attempt: 5 second delay
- If all 3 fail:
  - Mark metric as "unavailable"
  - Use fallback scoring (rule-based heuristic)
  - Log error for debugging

✅ **Fallback Scoring**
- **If Pillar D (hallucination detection) fails:**
  - Use default middle score: 50
  - Reason: Can't assess without LLM

- **If Pillar E (architecture assessment) fails:**
  - Use Pillar E formula without AC (Architectural Coherence)
  - E_fallback = (FC × 0.44) + (CQS × 0.25) + (SS × 0.19) + (DQ × 0.12)
  - (Normalized to sum to 100)

- **If multiple Judge calls fail:**
  - Fall back to rule-based scoring for Pillars U, I, D, E
  - Example (Pillar U without Judge):
    - PSS: Use keyword analysis (specificity, actionability)
    - Rely on quantitative metrics only

✅ **Always Store Partial Results**
- Even if evaluation fails halfway:
  - Store completed pillar scores
  - Mark incomplete pillars with status: "UNAVAILABLE"
  - Show progress on results page: "4/5 pillars evaluated"
  - Display warning: "Evaluation incomplete due to [reason]"

✅ **Implementation (evaluation_service.py)**
```python
async def evaluate_session(session_id):
    """Robust evaluation with partial failure handling"""
    results = {
        "session_id": session_id,
        "pillars": {},
        "errors": []
    }
    
    # Pillar G (no LLM calls, so low risk)
    try:
        results["pillars"]["G"] = await pillar_g.compute(session_id)
    except Exception as e:
        results["errors"].append(f"Pillar G failed: {e}")
        results["pillars"]["G"] = {"score": 50, "status": "UNAVAILABLE"}
    
    # Pillar U (2 LLM-as-Judge calls)
    try:
        results["pillars"]["U"] = await pillar_u.compute(session_id)
    except Exception as e:
        results["errors"].append(f"Pillar U failed: {e}")
        results["pillars"]["U"] = fallback_score_pillar_u(session_id)
    
    # ... continue for pillars I, D, E
    
    # Compute composite Q score with reweighting
    q_score = compute_reweighted_q_score(results["pillars"])
    results["composite_q_score"] = q_score
    
    # Store results even if partial
    db.evaluations.insertOne(results)
    return results
```

✅ **Error Resilience for Specific Failures**

**If Code Execution Timeout (> 10 seconds):**
- Mark TEST_RUN as failed
- Don't crash evaluation
- Treat as "infinite loop detected"
- Continue with other metrics

**If Candidate Code Syntax Error:**
- Catch exception on import
- Mark Pillar E as unavailable
- Mark tests_passed = 0, tests_failed = all
- Continue evaluation

**If Database Unavailable:**
- Cache results in memory
- Retry connection every 5 seconds
- Eventually store when connection restored
- Or export results as JSON file as fallback

---

## 🔍 Problem & Solution

**Problem:** Production deployments fail unexpectedly; no fallback strategy; single point of failure kills session

**Solution:**
- Implement graceful degradation
- Partial evaluation better than none
- Cache at multiple levels
- Store intermediate results immediately
- Explicit error communication

---

## 📊 Phase 5 Deliverables Summary

| Component | What It Does | Impact |
|-----------|-------------|--------|
| Hiring Manager Dashboard | Create sessions, manage candidates | Makes it production-ready for HR teams |
| Session Link Flow | Invite links, anonymous onboarding | Candidates don't need accounts |
| Session State Machine | CREATED → IN_PROGRESS → COMPLETED → EVALUATED | Clear workflow states |
| Configurable Time Limit | 30-120 minute sessions | Flexible session duration |
| Auto-Submit on Timeout | Automatic SESSION_END at timer expiry | Guarantees session closure |
| Docker Sandboxing | Isolated code execution | Security against malicious code |
| Token Budget Tracking | Monitor LLM spend per session | Cost control & predictability |
| Judge Eval Caching | Cache LLM-as-Judge scores | 30-40% cost savings |
| Error Resilience | Handle failures gracefully | Production reliability |
| Partial Evaluation | Score even if incomplete | Robust system design |
| Fallback Scoring | Rule-based scoring when LLM fails | Continuous evaluation |

**Status:** 🚀 **READY FOR DEPLOYMENT** (Phase 5 Complete)

---

## 📈 Complete Project Summary

### Timeline
```
Week 1-2:   Phase 1 — Candidate Interface & LLM Proxy
Week 3:     Phase 2 — Instrumentation Layer (Φ)
Week 4-6:   Phase 3 — Evaluation Engine (5 Pillars)
Week 7:     Phase 4 — Scoring Aggregation & Dashboard
Week 8:     Phase 5 — Hardening & Session Management
```

### Key Metrics
- **5 Pillar Scores** (G, U, I, D, E) → **1 Composite Q Score** (0-100)
- **20+ Sub-Metrics** providing detailed feedback
- **~80 API calls per session**, throttled with budget controls
- **Evaluation Time**: ~5 minutes per session (phase 3 pipeline)
- **Cost per Session**: ~$8-15 with caching

### Deployment Readiness Checklist
- ✅ Phase 1: UI/LLM Connection
- ✅ Phase 2: Event Logging (Φ)
- ✅ Phase 3: Scoring Pipeline
- ✅ Phase 4: Results Dashboard
- ✅ Phase 5: Production Hardening
- ✅ Documentation Complete
- ✅ Error Handling Robust
- ✅ Cost Controls in Place

### Next Steps (Beyond Prototype)
1. Scale to 10+ concurrent sessions
2. Add other task types (system design, API design, etc.)
3. Support multiple LLM models (GPT-4, Claude 3, etc.)
4. A/B test scoring weights to optimize hiring accuracy
5. Export candidate reports (PDF, email)
6. Integration with ATS (Workday, Greenhouse, etc.)
