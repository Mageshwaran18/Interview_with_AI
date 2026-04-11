# DSA_buildplan.md
# Interview with AI — Personalized DSA Mock Interview Service
## Prototype Build Plan (Integrated into GUIDE Platform)

> **Author:** Senior Software Engineering Reference  
> **Date:** March 2026  
> **Target Repo:** `Interview_with_AI/` (existing GUIDE project)  
> **Service Type:** Standalone micromodule, plug-in to GUIDE's FastAPI + React + MongoDB stack  
> **Paper Reference:** *"Interview with AI: Personalized AI-Driven DSA Mock Interview Platform using LLMs"*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Decision — Why a Separate Service?](#2-architecture-decision)
3. [Prerequisites & Environment Check](#3-prerequisites--environment-check)
4. [Service Architecture Overview](#4-service-architecture-overview)
5. [Phase 1 — Backend: Data Models & MongoDB Collections](#5-phase-1--backend-data-models--mongodb-collections)
6. [Phase 2 — Backend: Pydantic Schemas](#6-phase-2--backend-pydantic-schemas)
7. [Phase 3 — Backend: Interview Engine (Core Logic)](#7-phase-3--backend-interview-engine-core-logic)
8. [Phase 4 — Backend: API Routes](#8-phase-4--backend-api-routes)
9. [Phase 5 — Backend: Scoring Engine (Mathematical Model)](#9-phase-5--backend-scoring-engine-mathematical-model)
10. [Phase 6 — Backend: Register Routes in main.py](#10-phase-6--register-routes-in-mainpy)
11. [Phase 7 — Frontend: Page & Component Scaffold](#11-phase-7--frontend-page--component-scaffold)
12. [Phase 8 — Frontend: DSA Session Page (Core UI)](#12-phase-8--frontend-dsa-session-page-core-ui)
13. [Phase 9 — Frontend: Phase-by-Phase Components](#13-phase-9--frontend-phase-by-phase-components)
14. [Phase 10 — Frontend: Feedback Report Dashboard](#14-phase-10--frontend-feedback-report-dashboard)
15. [Phase 11 — Frontend: Routing Integration](#15-phase-11--frontend-routing-integration)
16. [Phase 12 — Integration Testing](#16-phase-12--integration-testing)
17. [Phase 13 — Environment & Deployment Config](#17-phase-13--environment--deployment-config)
18. [Complete New File Tree](#18-complete-new-file-tree)
19. [Known Risks & Mitigation](#19-known-risks--mitigation)

---

## 1. Executive Summary

The research paper defines a **5-phase DSA mock interview pipeline**:

| Phase | Name | Responsibility |
|-------|------|----------------|
| 1 | **Intuition** | Candidate explains their approach; LLM evaluates conceptual depth |
| 2 | **Algorithm Discussion** | Step-by-step algorithm design; LLM assesses logic & data structures |
| 3 | **Complexity Analysis** | Time/space complexity justification; LLM may introduce optimization prompts |
| 4 | **Coding** | Implementation against test cases; automated correctness evaluation |
| 5 | **Performance Feedback** | Composite score report across all 5 dimensions |

The scoring model from the paper is:

```
S = wi × I + wa × A + wc × C + wp × P + wf × F
```

Where `I`=Intuition Accuracy, `A`=Algorithmic Clarity, `C`=Complexity Understanding, `P`=Programming Correctness, `F`=Feedback Response.

This service is built as a **separate submodule** inside the existing `Interview_with_AI/` project. It reuses:
- **GUIDE's auth system** (JWT, `auth_dependency.py`)
- **GUIDE's chat infrastructure** (`chat_service.py`, Gemini API)
- **GUIDE's event logger** (`event_service.py`) for trace auditability
- **GUIDE's MongoDB connection** (`database.py`)

It introduces its own routes, services, schemas, and frontend pages so that neither service breaks the other.

---

## 2. Architecture Decision

### Why a Separate Submodule, Not a New Microservice?

The GUIDE project is currently a **monolith** (single FastAPI process + single React SPA). Introducing a full microservice with its own Docker container and port is overkill for a prototype.

**Decision: Co-located submodule** — new router prefix `/api/dsa/...`, new MongoDB collections prefixed `dsa_`, new frontend route `/dsa/...`.

Benefits:
- Reuses existing auth, Gemini client, DB connection — no duplication.
- One `uvicorn` process, one React app.
- Easily extractable into a true microservice later by moving the `app/dsa/` folder.

### Integration Boundary

```
GUIDE Service                        DSA Service (NEW)
─────────────────────────────────    ──────────────────────────────────
/api/chat       → chat_service       /api/dsa/sessions    → dsa_session_service
/api/events     → event_service  ←── /api/dsa/phases      → dsa_phase_service
/auth/*         → auth_service   ←── /api/dsa/evaluate    → dsa_scoring_service
/api/evaluate   → 5-pillar eval      /api/dsa/problems    → dsa_problem_service
MongoDB collections:                 New MongoDB collections:
  sessions, events, evaluations        dsa_sessions, dsa_phases
  users, judge_cache                   dsa_evaluations, dsa_problems
```

---

## 3. Prerequisites & Environment Check

Before writing a single line of code, verify the following. These are non-negotiable preconditions.

### 3.1 Backend Check

```bash
# From project root
cd Interview_with_AI

# Verify venv is activated
source IAI/Scripts/activate        # Windows
# OR
source IAI/bin/activate            # Linux/macOS

# Confirm existing packages are installed
python -c "import fastapi, pymongo, google.generativeai; print('OK')"

# Confirm MongoDB is reachable
python -c "from app.database import db; print(db.list_collection_names())"

# Confirm Gemini key works
python -c "
import google.generativeai as genai
import os
from dotenv import load_dotenv
load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')
r = model.generate_content('Say OK')
print(r.text)
"
```

### 3.2 Frontend Check

```bash
cd interview_with_ai_frontend
node --version     # Must be >= 18
npm --version      # Must be >= 9
npm run dev        # Confirm it boots on localhost:5173
```

### 3.3 New Python Dependency

The coding phase requires sandboxed code execution. Add to `requirements.txt`:

```
# Add these lines to existing requirements.txt
RestrictedPython==7.1       # Safe Python code execution sandbox
pyflakes==3.2.0             # Static code analysis for quality scoring
```

Install:

```bash
pip install RestrictedPython==7.1 pyflakes==3.2.0
```

> **Why RestrictedPython?** The paper specifies that submitted code is evaluated against test cases. Running arbitrary user code with `exec()` is a critical security vulnerability. `RestrictedPython` provides a restricted execution environment that blocks filesystem access, import abuse, and infinite loops.

---

## 4. Service Architecture Overview

```
app/
└── dsa/                          ← NEW — entire DSA service lives here
    ├── __init__.py
    ├── routes/
    │   ├── dsa_session_routes.py
    │   ├── dsa_phase_routes.py
    │   ├── dsa_problem_routes.py
    │   └── dsa_evaluation_routes.py
    ├── services/
    │   ├── dsa_session_service.py
    │   ├── dsa_phase_service.py    ← Interview engine (LLM prompting per phase)
    │   ├── dsa_problem_service.py
    │   ├── dsa_code_executor.py    ← Sandboxed code runner
    │   └── dsa_scoring_service.py  ← S = wi×I + wa×A + wc×C + wp×P + wf×F
    ├── schemas/
    │   ├── dsa_session_schema.py
    │   ├── dsa_phase_schema.py
    │   ├── dsa_problem_schema.py
    │   └── dsa_evaluation_schema.py
    └── data/
        └── dsa_problems_seed.json  ← 20 seeded DSA problems

interview_with_ai_frontend/src/
├── pages/
│   ├── DSALanding.jsx            ← Problem picker
│   ├── DSASessionPage.jsx        ← Main 5-phase interview interface
│   └── DSAFeedbackPage.jsx       ← Final score report
├── components/dsa/
│   ├── PhaseProgressBar.jsx
│   ├── IntuitPhasePanel.jsx
│   ├── AlgoPhasePanel.jsx
│   ├── ComplexityPhasePanel.jsx
│   ├── CodingPhasePanel.jsx
│   └── FeedbackCard.jsx
└── services/
    └── dsa_api.js                ← Axios calls to /api/dsa/
```

---

## 5. Phase 1 — Backend: Data Models & MongoDB Collections

### 5.1 Create `app/dsa/__init__.py`

```python
# app/dsa/__init__.py
# DSA Interview Service — plug-in module for GUIDE platform
```

### 5.2 Create `app/dsa/data/dsa_problems_seed.json`

This is the DSA problem repository. Seed with 20 representative problems covering arrays, trees, graphs, DP, and strings. Each problem must have clearly defined test cases so the coding phase can be automatically evaluated.

**File:** `app/dsa/data/dsa_problems_seed.json`

```json
[
  {
    "id": "dsa_001",
    "title": "Two Sum",
    "difficulty": "easy",
    "topic": "arrays",
    "description": "Given an array of integers and a target, return indices of the two numbers that add up to the target.",
    "examples": [
      {"input": "nums=[2,7,11,15], target=9", "output": "[0,1]"}
    ],
    "test_cases": [
      {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected": [0, 1]},
      {"input": {"nums": [3, 2, 4], "target": 6}, "expected": [1, 2]},
      {"input": {"nums": [3, 3], "target": 6}, "expected": [0, 1]}
    ],
    "driver_code": "def test(nums, target):\n    return solution(nums, target)",
    "optimal_complexity": {"time": "O(n)", "space": "O(n)"},
    "hint_keywords": ["hashmap", "complement", "dictionary"]
  },
  {
    "id": "dsa_002",
    "title": "Valid Parentheses",
    "difficulty": "easy",
    "topic": "stack",
    "description": "Given a string of brackets, determine if it is valid.",
    "examples": [
      {"input": "s='()[]{}'", "output": "True"}
    ],
    "test_cases": [
      {"input": {"s": "()[]{}"}, "expected": true},
      {"input": {"s": "(]"}, "expected": false},
      {"input": {"s": "{[]}"}, "expected": true}
    ],
    "driver_code": "def test(s):\n    return solution(s)",
    "optimal_complexity": {"time": "O(n)", "space": "O(n)"},
    "hint_keywords": ["stack", "push", "pop", "matching"]
  }
]
```

> **Action:** Populate this file with a minimum of 20 problems before any testing. Balance easy (8), medium (8), hard (4). Each must have 3–5 test cases for the coding phase evaluator.

### 5.3 Extend `app/database.py`

Open the existing `app/database.py` and add the following new collection references at the bottom of the file. **Do not modify existing collection lines.**

```python
# --- ADD THESE LINES to the bottom of app/database.py ---

# DSA Interview Service Collections
dsa_sessions_collection = db["dsa_sessions"]
dsa_phases_collection   = db["dsa_phases"]
dsa_evaluations_collection = db["dsa_evaluations"]
dsa_problems_collection = db["dsa_problems"]
```

**Collection schemas (MongoDB documents):**

**`dsa_sessions`:**
```json
{
  "_id": "ObjectId",
  "dsa_session_id": "dsa_session_xyz",
  "user_email": "candidate@example.com",
  "problem_id": "dsa_001",
  "problem_title": "Two Sum",
  "status": "CREATED | PHASE_1 | PHASE_2 | PHASE_3 | PHASE_4 | COMPLETED",
  "current_phase": 1,
  "phases_completed": [],
  "created_at": "ISODate",
  "completed_at": "ISODate | null",
  "final_code": "string | null"
}
```

**`dsa_phases`:**
```json
{
  "_id": "ObjectId",
  "dsa_session_id": "dsa_session_xyz",
  "phase_number": 1,
  "phase_name": "intuition | algorithm | complexity | coding | feedback",
  "conversation_history": [
    {"role": "interviewer", "content": "..."},
    {"role": "candidate", "content": "..."}
  ],
  "phase_score": 82.5,
  "phase_feedback": "string",
  "started_at": "ISODate",
  "completed_at": "ISODate | null",
  "passed": true
}
```

**`dsa_evaluations`:**
```json
{
  "_id": "ObjectId",
  "dsa_session_id": "dsa_session_xyz",
  "scores": {
    "I": 85.0,
    "A": 78.0,
    "C": 72.0,
    "P": 90.0,
    "F": 80.0
  },
  "weights": {
    "wi": 0.20, "wa": 0.20, "wc": 0.20, "wp": 0.25, "wf": 0.15
  },
  "composite_score": 81.85,
  "detailed_feedback": {
    "I": "Strong intuition with clear reasoning...",
    "A": "Algorithm design was logical...",
    "C": "Time complexity identified correctly but space was off...",
    "P": "All test cases passed...",
    "F": "Responded well to follow-up questions..."
  },
  "computed_at": "ISODate"
}
```

---

## 6. Phase 2 — Backend: Pydantic Schemas

Create the following files under `app/dsa/schemas/`.

### 6.1 `app/dsa/schemas/dsa_session_schema.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DSASessionStatus(str, Enum):
    CREATED   = "CREATED"
    PHASE_1   = "PHASE_1"
    PHASE_2   = "PHASE_2"
    PHASE_3   = "PHASE_3"
    PHASE_4   = "PHASE_4"
    COMPLETED = "COMPLETED"

class CreateDSASessionRequest(BaseModel):
    problem_id: str
    # user_email injected from JWT token, not from body

class DSASessionResponse(BaseModel):
    dsa_session_id: str
    problem_id: str
    problem_title: str
    status: DSASessionStatus
    current_phase: int
    created_at: datetime
```

### 6.2 `app/dsa/schemas/dsa_phase_schema.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class ConversationTurn(BaseModel):
    role: str      # "interviewer" | "candidate"
    content: str

class PhaseMessageRequest(BaseModel):
    dsa_session_id: str
    phase_number: int
    candidate_message: str
    conversation_history: List[ConversationTurn] = []

class PhaseMessageResponse(BaseModel):
    dsa_session_id: str
    phase_number: int
    interviewer_response: str
    phase_complete: bool      # True when LLM decides phase is done
    phase_score: Optional[float] = None
    phase_feedback: Optional[str] = None
    advance_to_phase: Optional[int] = None  # Next phase number

class StartPhaseResponse(BaseModel):
    dsa_session_id: str
    phase_number: int
    phase_name: str
    opening_question: str     # LLM-generated first question for the phase
```

### 6.3 `app/dsa/schemas/dsa_problem_schema.py`

```python
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ProblemSummary(BaseModel):
    id: str
    title: str
    difficulty: str
    topic: str
    description: str

class ProblemDetail(ProblemSummary):
    examples: List[Dict[str, str]]
    optimal_complexity: Dict[str, str]
    # test_cases and driver_code NOT returned to frontend (prevents cheating)
```

### 6.4 `app/dsa/schemas/dsa_evaluation_schema.py`

```python
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class DSAScores(BaseModel):
    I: float   # Intuition Accuracy (0-100)
    A: float   # Algorithmic Clarity (0-100)
    C: float   # Complexity Understanding (0-100)
    P: float   # Programming Correctness (0-100)
    F: float   # Feedback Response (0-100)

class DSAWeights(BaseModel):
    wi: float = 0.20
    wa: float = 0.20
    wc: float = 0.20
    wp: float = 0.25
    wf: float = 0.15

class DSAEvaluationResponse(BaseModel):
    dsa_session_id: str
    scores: DSAScores
    weights: DSAWeights
    composite_score: float
    detailed_feedback: Dict[str, str]
    computed_at: datetime
```

---

## 7. Phase 3 — Backend: Interview Engine (Core Logic)

This is the most critical piece. The interview engine controls the LLM prompting strategy per phase.

### 7.1 `app/dsa/services/dsa_problem_service.py`

```python
import json
import os
import uuid
from app.database import dsa_problems_collection

SEED_PATH = os.path.join(os.path.dirname(__file__), "../data/dsa_problems_seed.json")

def seed_problems_if_empty():
    """Seeds the DB from JSON file on first boot."""
    if dsa_problems_collection.count_documents({}) == 0:
        with open(SEED_PATH, "r") as f:
            problems = json.load(f)
        dsa_problems_collection.insert_many(problems)
        print(f"[DSA] Seeded {len(problems)} problems into dsa_problems collection.")

def get_all_problems(difficulty: str = None, topic: str = None) -> list:
    query = {}
    if difficulty:
        query["difficulty"] = difficulty
    if topic:
        query["topic"] = topic
    problems = list(dsa_problems_collection.find(query, {"_id": 0, "test_cases": 0, "driver_code": 0}))
    return problems

def get_problem_by_id(problem_id: str) -> dict:
    """Returns FULL problem including test_cases (backend only)."""
    return dsa_problems_collection.find_one({"id": problem_id}, {"_id": 0})

def get_problem_summary(problem_id: str) -> dict:
    """Returns problem WITHOUT test_cases (safe for frontend)."""
    return dsa_problems_collection.find_one(
        {"id": problem_id},
        {"_id": 0, "test_cases": 0, "driver_code": 0}
    )
```

### 7.2 `app/dsa/services/dsa_session_service.py`

```python
import uuid
from datetime import datetime
from app.database import dsa_sessions_collection
from app.dsa.services.dsa_problem_service import get_problem_summary

def create_dsa_session(user_email: str, problem_id: str) -> dict:
    problem = get_problem_summary(problem_id)
    if not problem:
        raise ValueError(f"Problem {problem_id} not found.")
    
    session_id = f"dsa_{uuid.uuid4().hex[:10]}"
    doc = {
        "dsa_session_id": session_id,
        "user_email": user_email,
        "problem_id": problem_id,
        "problem_title": problem["title"],
        "status": "CREATED",
        "current_phase": 1,
        "phases_completed": [],
        "created_at": datetime.utcnow(),
        "completed_at": None,
        "final_code": None
    }
    dsa_sessions_collection.insert_one(doc)
    return doc

def get_session(dsa_session_id: str) -> dict:
    return dsa_sessions_collection.find_one(
        {"dsa_session_id": dsa_session_id}, {"_id": 0}
    )

def advance_session_phase(dsa_session_id: str, completed_phase: int) -> dict:
    next_phase = completed_phase + 1
    new_status = f"PHASE_{next_phase}" if next_phase <= 4 else "COMPLETED"
    dsa_sessions_collection.update_one(
        {"dsa_session_id": dsa_session_id},
        {
            "$set": {"current_phase": next_phase, "status": new_status},
            "$push": {"phases_completed": completed_phase}
        }
    )
    return get_session(dsa_session_id)

def mark_session_complete(dsa_session_id: str, final_code: str) -> dict:
    dsa_sessions_collection.update_one(
        {"dsa_session_id": dsa_session_id},
        {"$set": {
            "status": "COMPLETED",
            "final_code": final_code,
            "completed_at": datetime.utcnow()
        }}
    )
    return get_session(dsa_session_id)
```

### 7.3 `app/dsa/services/dsa_phase_service.py` ← CORE ENGINE

This is the heart of the system. Each phase has a distinct system prompt persona that mimics a real technical interviewer.

```python
"""
DSA Phase Service — LLM Interview Engine
Each phase has a distinct system prompt crafted to simulate a specific
dimension of a real technical interview conversation.
"""
import google.generativeai as genai
import os
from datetime import datetime
from app.database import dsa_phases_collection
from app.dsa.services.dsa_problem_service import get_problem_by_id

# --- PHASE SYSTEM PROMPTS ---

PHASE_PROMPTS = {
    1: {
        "name": "intuition",
        "system": """You are a senior software engineer conducting a technical interview.
The candidate has been given the following problem:

PROBLEM: {problem_description}

You are in the INTUITION phase. Your job is to:
1. Ask the candidate to explain their initial thought process and approach.
2. Probe the conceptual reasoning — why did they choose this approach?
3. Ask about potential alternative approaches.
4. Introduce one edge case or constraint variation to test adaptability.
5. Do NOT let the candidate jump to code yet.

Rules:
- Ask ONE question at a time.
- Be encouraging but rigorous.
- When you have enough signal to score intuition (usually 3-5 exchanges), respond with:
  PHASE_COMPLETE|score=<0-100>|feedback=<one paragraph assessment>
- Before PHASE_COMPLETE, never reveal the score.
""",
        "opening": "Let's start. Can you walk me through your initial thoughts on this problem? What approach comes to mind first and why?"
    },
    2: {
        "name": "algorithm",
        "system": """You are a senior software engineer in the ALGORITHM DISCUSSION phase.

PROBLEM: {problem_description}

The candidate has already described their intuition. Now:
1. Ask them to describe the step-by-step algorithm they would implement.
2. Probe data structure choices — why a hashmap vs array vs tree?
3. Ask about edge cases their algorithm handles.
4. Challenge them with a restriction (e.g., "What if you couldn't use extra space?").

When you have enough signal (usually 4-6 exchanges), respond with:
PHASE_COMPLETE|score=<0-100>|feedback=<one paragraph assessment>
""",
        "opening": "Great intuition. Now let's dig deeper — walk me through the exact steps of your algorithm. What data structures would you use and why?"
    },
    3: {
        "name": "complexity",
        "system": """You are a senior software engineer in the COMPLEXITY ANALYSIS phase.

PROBLEM: {problem_description}

1. Ask the candidate for the time complexity of their algorithm and justification.
2. Ask for the space complexity.
3. Ask if there is a way to optimize either.
4. Test whether they know the theoretical lower bound for this problem.
5. Introduce a follow-up: "If the input size was 10^9, would your solution still work?"

When you have enough signal (3-5 exchanges), respond with:
PHASE_COMPLETE|score=<0-100>|feedback=<one paragraph assessment>
""",
        "opening": "Now let's talk about complexity. What is the time complexity of the algorithm you described, and can you justify it?"
    },
    4: {
        "name": "coding",
        "system": """You are a senior software engineer in the CODING REVIEW phase.

PROBLEM: {problem_description}

The candidate has submitted their code. Your job is to:
1. Review the code for correctness, readability, and style.
2. Ask about one specific implementation choice.
3. Point out one potential issue (or confirm there are none).
4. Ask if they want to add any test cases they thought of.
5. Do NOT fix the code for them — only probe with questions.

When review is complete (2-4 exchanges), respond with:
PHASE_COMPLETE|score=<score_from_test_results>|feedback=<one paragraph assessment>
""",
        "opening": "I can see you've submitted your code. Let me ask — can you walk me through a tricky part of your implementation?"
    }
}


def get_genai_model():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    return genai.GenerativeModel("gemini-2.5-flash")


def start_phase(dsa_session_id: str, phase_number: int, problem_id: str) -> dict:
    """Initialize a phase and return the LLM's opening question."""
    phase_config = PHASE_PROMPTS.get(phase_number)
    if not phase_config:
        raise ValueError(f"Invalid phase number: {phase_number}")
    
    problem = get_problem_by_id(problem_id)
    opening_q = phase_config["opening"]
    
    # Insert phase record into DB
    doc = {
        "dsa_session_id": dsa_session_id,
        "phase_number": phase_number,
        "phase_name": phase_config["name"],
        "conversation_history": [
            {"role": "interviewer", "content": opening_q}
        ],
        "phase_score": None,
        "phase_feedback": None,
        "started_at": datetime.utcnow(),
        "completed_at": None,
        "passed": False
    }
    dsa_phases_collection.insert_one(doc)
    
    return {
        "dsa_session_id": dsa_session_id,
        "phase_number": phase_number,
        "phase_name": phase_config["name"],
        "opening_question": opening_q
    }


def send_phase_message(
    dsa_session_id: str,
    phase_number: int,
    candidate_message: str,
    conversation_history: list,
    problem_id: str
) -> dict:
    """
    Send candidate message to LLM interviewer.
    Returns interviewer response and signals phase completion if ready.
    """
    phase_config = PHASE_PROMPTS.get(phase_number)
    problem = get_problem_by_id(problem_id)
    
    system_prompt = phase_config["system"].format(
        problem_description=problem["description"]
    )
    
    # Build conversation context for Gemini
    history_text = "\n".join(
        [f"{t['role'].upper()}: {t['content']}" for t in conversation_history]
    )
    full_prompt = f"""
{system_prompt}

CONVERSATION SO FAR:
{history_text}

CANDIDATE: {candidate_message}

INTERVIEWER:"""

    model = get_genai_model()
    response = model.generate_content(full_prompt)
    raw_response = response.text.strip()
    
    # Parse phase completion signal
    phase_complete = False
    phase_score = None
    phase_feedback = None
    
    if "PHASE_COMPLETE" in raw_response:
        phase_complete = True
        # Parse: PHASE_COMPLETE|score=82|feedback=Good reasoning...
        parts = raw_response.split("|")
        for part in parts:
            if part.startswith("score="):
                try:
                    phase_score = float(part.split("=")[1])
                except ValueError:
                    phase_score = 70.0
            elif part.startswith("feedback="):
                phase_feedback = part.split("=", 1)[1]
        
        # Clean display response — remove the signal from what candidate sees
        display_response = parts[0].replace("PHASE_COMPLETE", "").strip()
        if not display_response:
            display_response = "Great. We've covered this phase thoroughly. Let's move on."
    else:
        display_response = raw_response
    
    # Append to conversation history in DB
    new_turns = [
        {"role": "candidate", "content": candidate_message},
        {"role": "interviewer", "content": display_response}
    ]
    
    update_doc = {"$push": {"conversation_history": {"$each": new_turns}}}
    
    if phase_complete:
        update_doc["$set"] = {
            "phase_score": phase_score,
            "phase_feedback": phase_feedback,
            "completed_at": datetime.utcnow(),
            "passed": True if (phase_score or 0) >= 50 else False
        }
    
    dsa_phases_collection.update_one(
        {"dsa_session_id": dsa_session_id, "phase_number": phase_number},
        update_doc
    )
    
    return {
        "dsa_session_id": dsa_session_id,
        "phase_number": phase_number,
        "interviewer_response": display_response,
        "phase_complete": phase_complete,
        "phase_score": phase_score,
        "phase_feedback": phase_feedback,
        "advance_to_phase": phase_number + 1 if phase_complete else None
    }


def get_phase_data(dsa_session_id: str, phase_number: int) -> dict:
    return dsa_phases_collection.find_one(
        {"dsa_session_id": dsa_session_id, "phase_number": phase_number},
        {"_id": 0}
    )
```

### 7.4 `app/dsa/services/dsa_code_executor.py`

```python
"""
Sandboxed Python Code Executor for DSA Coding Phase.
Uses RestrictedPython to safely run user-submitted code against test cases.
"""
from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.Guards import safe_builtins
import ast
import time

EXECUTION_TIMEOUT_SECONDS = 5

def execute_code_against_tests(user_code: str, test_cases: list, driver_code: str) -> dict:
    """
    Runs user_code against test_cases in a restricted environment.
    Returns detailed pass/fail results per test case.
    """
    results = []
    total = len(test_cases)
    passed = 0
    
    for idx, tc in enumerate(test_cases):
        result = _run_single_test(user_code, driver_code, tc, idx)
        results.append(result)
        if result["passed"]:
            passed += 1
    
    correctness_score = (passed / total * 100) if total > 0 else 0.0
    
    return {
        "total_tests": total,
        "passed": passed,
        "failed": total - passed,
        "correctness_score": round(correctness_score, 2),
        "results": results
    }


def _run_single_test(user_code: str, driver_code: str, test_case: dict, idx: int) -> dict:
    try:
        # Compile user code in restricted mode
        byte_code = compile_restricted(user_code, "<candidate_code>", "exec")
        
        restricted_globals = safe_globals.copy()
        restricted_globals["__builtins__"] = safe_builtins
        local_ns = {}
        
        start = time.time()
        exec(byte_code, restricted_globals, local_ns)
        elapsed = time.time() - start
        
        if elapsed > EXECUTION_TIMEOUT_SECONDS:
            return {
                "test_number": idx + 1,
                "passed": False,
                "error": "Time limit exceeded",
                "input": test_case["input"],
                "expected": test_case["expected"],
                "got": None
            }
        
        # Inject 'solution' function and run test driver
        # driver_code calls solution(**test_case['input'])
        exec(compile_restricted(driver_code, "<driver>", "exec"), restricted_globals, local_ns)
        
        solution_fn = local_ns.get("solution")
        if not solution_fn:
            return {
                "test_number": idx + 1,
                "passed": False,
                "error": "Function named 'solution' not found in submitted code.",
                "input": test_case["input"],
                "expected": test_case["expected"],
                "got": None
            }
        
        got = solution_fn(**test_case["input"])
        passed = got == test_case["expected"]
        
        return {
            "test_number": idx + 1,
            "passed": passed,
            "error": None,
            "input": test_case["input"],
            "expected": test_case["expected"],
            "got": got
        }
        
    except SyntaxError as e:
        return {
            "test_number": idx + 1,
            "passed": False,
            "error": f"SyntaxError: {str(e)}",
            "input": test_case["input"],
            "expected": test_case["expected"],
            "got": None
        }
    except Exception as e:
        return {
            "test_number": idx + 1,
            "passed": False,
            "error": f"RuntimeError: {str(e)}",
            "input": test_case["input"],
            "expected": test_case["expected"],
            "got": None
        }
```

> **Key Engineering Decision:** User code must define a function called `solution`. This is enforced by the driver code in each problem. The candidate is told this convention on the coding phase UI. This prevents arbitrary execution patterns and keeps the executor deterministic.

### 7.5 `app/dsa/services/dsa_scoring_service.py`

```python
"""
DSA Scoring Service
Implements the mathematical model from the paper:
    S = wi × I + wa × A + wc × C + wp × P + wf × F
"""
from datetime import datetime
from app.database import dsa_phases_collection, dsa_evaluations_collection

# Default weights — tunable via config/experiment
DEFAULT_WEIGHTS = {
    "wi": 0.20,   # Intuition Accuracy
    "wa": 0.20,   # Algorithmic Clarity
    "wc": 0.20,   # Complexity Understanding
    "wp": 0.25,   # Programming Correctness (slightly higher — hard evidence)
    "wf": 0.15    # Feedback Response (probed via follow-up questions)
}

PHASE_TO_DIMENSION = {
    1: "I",   # Phase 1 → Intuition
    2: "A",   # Phase 2 → Algorithmic Clarity
    3: "C",   # Phase 3 → Complexity Understanding
    4: "P",   # Phase 4 → Programming Correctness
}


def compute_final_score(dsa_session_id: str, coding_score_override: float = None) -> dict:
    """
    Computes composite score S from all 5 dimensions.
    Coding score can be overridden with the actual test-execution score (P).
    Feedback Response score (F) is derived from engagement across phases 1-3.
    """
    scores = {}
    feedback = {}
    
    # Collect scores from phase documents
    for phase_num, dimension in PHASE_TO_DIMENSION.items():
        phase_doc = dsa_phases_collection.find_one(
            {"dsa_session_id": dsa_session_id, "phase_number": phase_num}
        )
        if phase_doc and phase_doc.get("phase_score") is not None:
            scores[dimension] = phase_doc["phase_score"]
            feedback[dimension] = phase_doc.get("phase_feedback", "")
        else:
            scores[dimension] = 0.0   # Phase not attempted
            feedback[dimension] = "Phase not completed."
    
    # Override P with actual code execution score if provided
    if coding_score_override is not None:
        scores["P"] = coding_score_override
    
    # F (Feedback Response) = avg responsiveness across phases 1-3
    # Proxy: average of I, A, C minus 10 (penalizes poor follow-up handling)
    f_score = max(0, (scores.get("I", 0) + scores.get("A", 0) + scores.get("C", 0)) / 3 - 10)
    scores["F"] = round(f_score, 2)
    feedback["F"] = "Assessed from responsiveness to follow-up probes across phases 1-3."
    
    # Compute composite score
    w = DEFAULT_WEIGHTS
    S = (
        w["wi"] * scores.get("I", 0) +
        w["wa"] * scores.get("A", 0) +
        w["wc"] * scores.get("C", 0) +
        w["wp"] * scores.get("P", 0) +
        w["wf"] * scores.get("F", 0)
    )
    S = round(S, 2)
    
    result = {
        "dsa_session_id": dsa_session_id,
        "scores": scores,
        "weights": DEFAULT_WEIGHTS,
        "composite_score": S,
        "detailed_feedback": feedback,
        "computed_at": datetime.utcnow()
    }
    
    # Upsert — allow re-evaluation
    dsa_evaluations_collection.update_one(
        {"dsa_session_id": dsa_session_id},
        {"$set": result},
        upsert=True
    )
    
    return result


def get_evaluation(dsa_session_id: str) -> dict:
    return dsa_evaluations_collection.find_one(
        {"dsa_session_id": dsa_session_id}, {"_id": 0}
    )
```

---

## 8. Phase 4 — Backend: API Routes

### 8.1 `app/dsa/routes/dsa_problem_routes.py`

```python
from fastapi import APIRouter, Query, Depends
from app.dsa.services.dsa_problem_service import get_all_problems, get_problem_summary
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/api/dsa/problems", tags=["DSA Problems"])

@router.get("/")
def list_problems(
    difficulty: str = Query(None),
    topic: str = Query(None),
    current_user: dict = Depends(get_current_user)
):
    return get_all_problems(difficulty=difficulty, topic=topic)

@router.get("/{problem_id}")
def get_problem(problem_id: str, current_user: dict = Depends(get_current_user)):
    problem = get_problem_summary(problem_id)
    if not problem:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem
```

### 8.2 `app/dsa/routes/dsa_session_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from app.dsa.schemas.dsa_session_schema import CreateDSASessionRequest, DSASessionResponse
from app.dsa.services.dsa_session_service import create_dsa_session, get_session
from app.dependencies.auth_dependency import get_current_user

router = APIRouter(prefix="/api/dsa/sessions", tags=["DSA Sessions"])

@router.post("/")
def create_session(req: CreateDSASessionRequest, current_user: dict = Depends(get_current_user)):
    try:
        session = create_dsa_session(
            user_email=current_user["email"],
            problem_id=req.problem_id
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{dsa_session_id}")
def get_dsa_session(dsa_session_id: str, current_user: dict = Depends(get_current_user)):
    session = get_session(dsa_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
```

### 8.3 `app/dsa/routes/dsa_phase_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from app.dsa.schemas.dsa_phase_schema import PhaseMessageRequest, PhaseMessageResponse, StartPhaseResponse
from app.dsa.services import dsa_phase_service, dsa_session_service
from app.dsa.services.dsa_code_executor import execute_code_against_tests
from app.dsa.services.dsa_problem_service import get_problem_by_id
from app.dependencies.auth_dependency import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/dsa/phases", tags=["DSA Phases"])


@router.post("/start")
def start_phase(
    dsa_session_id: str,
    phase_number: int,
    current_user: dict = Depends(get_current_user)
):
    session = dsa_session_service.get_session(dsa_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    result = dsa_phase_service.start_phase(
        dsa_session_id=dsa_session_id,
        phase_number=phase_number,
        problem_id=session["problem_id"]
    )
    return result


@router.post("/message", response_model=PhaseMessageResponse)
def send_message(req: PhaseMessageRequest, current_user: dict = Depends(get_current_user)):
    session = dsa_session_service.get_session(req.dsa_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    result = dsa_phase_service.send_phase_message(
        dsa_session_id=req.dsa_session_id,
        phase_number=req.phase_number,
        candidate_message=req.candidate_message,
        conversation_history=[t.dict() for t in req.conversation_history],
        problem_id=session["problem_id"]
    )
    
    # If phase is complete, advance session state
    if result["phase_complete"]:
        dsa_session_service.advance_session_phase(req.dsa_session_id, req.phase_number)
    
    return result


class CodeSubmitRequest(BaseModel):
    dsa_session_id: str
    code: str

@router.post("/submit-code")
def submit_code(req: CodeSubmitRequest, current_user: dict = Depends(get_current_user)):
    """
    Coding Phase (Phase 4) code submission endpoint.
    Runs code against test cases, returns pass/fail results.
    """
    session = dsa_session_service.get_session(req.dsa_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    problem = get_problem_by_id(session["problem_id"])
    
    execution_result = execute_code_against_tests(
        user_code=req.code,
        test_cases=problem["test_cases"],
        driver_code=problem["driver_code"]
    )
    
    # Start coding phase conversation with the test results as context
    opening = dsa_phase_service.start_phase(
        dsa_session_id=req.dsa_session_id,
        phase_number=4,
        problem_id=session["problem_id"]
    )
    
    dsa_session_service.mark_session_complete(req.dsa_session_id, req.code)
    
    return {
        "execution_result": execution_result,
        "interviewer_opening": opening["opening_question"]
    }
```

### 8.4 `app/dsa/routes/dsa_evaluation_routes.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from app.dsa.services.dsa_scoring_service import compute_final_score, get_evaluation
from app.dsa.services.dsa_session_service import get_session
from app.dependencies.auth_dependency import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/dsa/evaluate", tags=["DSA Evaluation"])


class EvaluateRequest(BaseModel):
    coding_score_override: Optional[float] = None


@router.post("/{dsa_session_id}")
def trigger_evaluation(
    dsa_session_id: str,
    req: EvaluateRequest = EvaluateRequest(),
    current_user: dict = Depends(get_current_user)
):
    session = get_session(dsa_session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return compute_final_score(
        dsa_session_id=dsa_session_id,
        coding_score_override=req.coding_score_override
    )


@router.get("/{dsa_session_id}")
def get_dsa_evaluation(dsa_session_id: str, current_user: dict = Depends(get_current_user)):
    result = get_evaluation(dsa_session_id)
    if not result:
        raise HTTPException(status_code=404, detail="Evaluation not found. Run POST first.")
    return result
```

---

## 9. Phase 5 — Backend: Scoring Engine (Mathematical Model)

The scoring model is already implemented in `dsa_scoring_service.py` (Phase 3.5). Here, verify it satisfies the paper's constraints:

| Paper Variable | Code Variable | Source | Default Weight |
|----------------|--------------|--------|----------------|
| I (Intuition Accuracy) | `scores["I"]` | Phase 1 LLM score | `wi = 0.20` |
| A (Algorithmic Clarity) | `scores["A"]` | Phase 2 LLM score | `wa = 0.20` |
| C (Complexity Understanding) | `scores["C"]` | Phase 3 LLM score | `wc = 0.20` |
| P (Programming Correctness) | `scores["P"]` | Phase 4 test execution | `wp = 0.25` |
| F (Feedback Response) | `scores["F"]` | Derived from I+A+C avg | `wf = 0.15` |

**Constraint check:** `wi + wa + wc + wp + wf = 0.20 + 0.20 + 0.20 + 0.25 + 0.15 = 1.00` ✅

To tune weights for experimentation, edit `DEFAULT_WEIGHTS` dict in `dsa_scoring_service.py`. A future enhancement can expose these as DB-stored config.

---

## 10. Phase 6 — Register Routes in main.py

Open `app/main.py` and add the DSA service router registrations. Place them **after all existing router inclusions** to avoid import order conflicts.

```python
# --- ADD THESE IMPORTS at the top of app/main.py ---
from app.dsa.routes import dsa_problem_routes, dsa_session_routes, dsa_phase_routes, dsa_evaluation_routes
from app.dsa.services.dsa_problem_service import seed_problems_if_empty

# --- ADD THESE LINES in the startup event or after app creation ---

@app.on_event("startup")
async def on_startup():
    seed_problems_if_empty()   # Seeds DSA problems on first boot

# --- ADD THESE ROUTER REGISTRATIONS below existing app.include_router calls ---
app.include_router(dsa_problem_routes.router)
app.include_router(dsa_session_routes.router)
app.include_router(dsa_phase_routes.router)
app.include_router(dsa_evaluation_routes.router)
```

**Verify at http://localhost:8000/docs** — you should see new route groups:
- `DSA Problems`
- `DSA Sessions`
- `DSA Phases`
- `DSA Evaluation`

---

## 11. Phase 7 — Frontend: Page & Component Scaffold

### 11.1 Create Directory Structure

```bash
cd interview_with_ai_frontend/src

mkdir -p components/dsa
touch pages/DSALanding.jsx
touch pages/DSASessionPage.jsx
touch pages/DSAFeedbackPage.jsx

touch components/dsa/PhaseProgressBar.jsx
touch components/dsa/IntuitPhasePanel.jsx
touch components/dsa/AlgoPhasePanel.jsx
touch components/dsa/ComplexityPhasePanel.jsx
touch components/dsa/CodingPhasePanel.jsx
touch components/dsa/FeedbackCard.jsx

touch services/dsa_api.js
```

### 11.2 `src/services/dsa_api.js`

```javascript
import axios from "axios";

const BASE = "http://localhost:8000";

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("jwt_token")}` }
});

export const dsa = {
  // Problems
  listProblems: (difficulty = null, topic = null) =>
    axios.get(`${BASE}/api/dsa/problems/`, {
      params: { difficulty, topic },
      ...authHeaders()
    }),

  getProblem: (problem_id) =>
    axios.get(`${BASE}/api/dsa/problems/${problem_id}`, authHeaders()),

  // Sessions
  createSession: (problem_id) =>
    axios.post(`${BASE}/api/dsa/sessions/`, { problem_id }, authHeaders()),

  getSession: (dsa_session_id) =>
    axios.get(`${BASE}/api/dsa/sessions/${dsa_session_id}`, authHeaders()),

  // Phases
  startPhase: (dsa_session_id, phase_number) =>
    axios.post(
      `${BASE}/api/dsa/phases/start`,
      null,
      { params: { dsa_session_id, phase_number }, ...authHeaders() }
    ),

  sendMessage: (payload) =>
    axios.post(`${BASE}/api/dsa/phases/message`, payload, authHeaders()),

  submitCode: (dsa_session_id, code) =>
    axios.post(`${BASE}/api/dsa/phases/submit-code`, { dsa_session_id, code }, authHeaders()),

  // Evaluation
  triggerEvaluation: (dsa_session_id, coding_score_override = null) =>
    axios.post(
      `${BASE}/api/dsa/evaluate/${dsa_session_id}`,
      { coding_score_override },
      authHeaders()
    ),

  getEvaluation: (dsa_session_id) =>
    axios.get(`${BASE}/api/dsa/evaluate/${dsa_session_id}`, authHeaders()),
};
```

---

## 12. Phase 8 — Frontend: DSA Session Page (Core UI)

### 12.1 `src/pages/DSALanding.jsx`

This is the problem picker. The candidate selects a problem and begins their session.

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dsa } from "../services/dsa_api";

const DIFFICULTIES = ["all", "easy", "medium", "hard"];
const TOPICS = ["all", "arrays", "stack", "trees", "graphs", "dp", "strings"];

export default function DSALanding() {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState({ difficulty: null, topic: null });
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, [filter]);

  async function fetchProblems() {
    try {
      const res = await dsa.listProblems(filter.difficulty, filter.topic);
      setProblems(res.data);
    } catch (err) {
      console.error("Failed to load problems:", err);
    }
  }

  async function handleStart(problem_id) {
    setStarting(problem_id);
    try {
      const res = await dsa.createSession(problem_id);
      const { dsa_session_id } = res.data;
      navigate(`/dsa/session/${dsa_session_id}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      setStarting(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-2">DSA Mock Interview</h1>
      <p className="text-gray-400 mb-6">
        Select a problem. The AI interviewer will guide you through intuition,
        algorithm design, complexity analysis, and coding.
      </p>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="bg-gray-800 text-white px-3 py-2 rounded"
          onChange={(e) => setFilter(f => ({ ...f, difficulty: e.target.value === "all" ? null : e.target.value }))}
        >
          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className="bg-gray-800 text-white px-3 py-2 rounded"
          onChange={(e) => setFilter(f => ({ ...f, topic: e.target.value === "all" ? null : e.target.value }))}
        >
          {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Problem Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {problems.map(p => (
          <div key={p.id} className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-blue-500 transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                p.difficulty === "easy" ? "bg-green-900 text-green-300" :
                p.difficulty === "medium" ? "bg-yellow-900 text-yellow-300" :
                "bg-red-900 text-red-300"
              }`}>{p.difficulty}</span>
            </div>
            <p className="text-gray-400 text-sm mb-1">Topic: {p.topic}</p>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{p.description}</p>
            <button
              onClick={() => handleStart(p.id)}
              disabled={starting === p.id}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-medium"
            >
              {starting === p.id ? "Starting..." : "Start Interview"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 12.2 `src/pages/DSASessionPage.jsx`

This is the main interview page. It manages phase transitions and renders the appropriate phase panel.

```jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dsa } from "../services/dsa_api";
import PhaseProgressBar from "../components/dsa/PhaseProgressBar";
import IntuitPhasePanel from "../components/dsa/IntuitPhasePanel";
import AlgoPhasePanel from "../components/dsa/AlgoPhasePanel";
import ComplexityPhasePanel from "../components/dsa/ComplexityPhasePanel";
import CodingPhasePanel from "../components/dsa/CodingPhasePanel";

const PHASES = [
  { num: 1, label: "Intuition" },
  { num: 2, label: "Algorithm" },
  { num: 3, label: "Complexity" },
  { num: 4, label: "Coding" },
  { num: 5, label: "Feedback" },
];

export default function DSASessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseData, setPhaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  async function loadSession() {
    try {
      const res = await dsa.getSession(sessionId);
      setSession(res.data);
      setCurrentPhase(res.data.current_phase);
      await initPhase(res.data.current_phase);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function initPhase(phaseNum) {
    if (phaseNum > 4) return; // Phases 1-4 only; 5 is feedback
    try {
      const res = await dsa.startPhase(sessionId, phaseNum);
      setPhaseData(res.data);
    } catch (err) {
      // Phase already started — retrieve existing data
      console.log("Phase already in progress, loading existing state.");
    }
  }

  async function handlePhaseAdvance(nextPhase) {
    setCurrentPhase(nextPhase);
    if (nextPhase <= 4) {
      await initPhase(nextPhase);
    } else {
      // Trigger evaluation and go to feedback page
      await dsa.triggerEvaluation(sessionId);
      navigate(`/dsa/feedback/${sessionId}`);
    }
  }

  if (loading) return <div className="text-white p-8">Loading session...</div>;

  const PHASE_PANELS = {
    1: IntuitPhasePanel,
    2: AlgoPhasePanel,
    3: ComplexityPhasePanel,
    4: CodingPhasePanel,
  };
  const ActivePanel = PHASE_PANELS[currentPhase];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
        <div>
          <span className="text-gray-400 text-sm">Problem: </span>
          <span className="font-semibold">{session?.problem_title}</span>
        </div>
        <PhaseProgressBar phases={PHASES} currentPhase={currentPhase} completedPhases={session?.phases_completed || []} />
      </div>

      {/* Active Phase Panel */}
      <div className="flex-1 p-6">
        {ActivePanel && (
          <ActivePanel
            sessionId={sessionId}
            phaseData={phaseData}
            onPhaseComplete={handlePhaseAdvance}
          />
        )}
      </div>
    </div>
  );
}
```

---

## 13. Phase 9 — Frontend: Phase-by-Phase Components

### 13.1 `src/components/dsa/PhaseProgressBar.jsx`

```jsx
export default function PhaseProgressBar({ phases, currentPhase, completedPhases }) {
  return (
    <div className="flex items-center gap-2">
      {phases.map((phase, idx) => {
        const done = completedPhases.includes(phase.num);
        const active = phase.num === currentPhase;
        return (
          <div key={phase.num} className="flex items-center">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              done ? "bg-green-800 text-green-200" :
              active ? "bg-blue-700 text-white" :
              "bg-gray-700 text-gray-400"
            }`}>
              {done ? "✓" : phase.num} {phase.label}
            </div>
            {idx < phases.length - 1 && <div className="w-4 h-px bg-gray-600 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}
```

### 13.2 Generic Conversation Phase Panel Pattern

Phases 1, 2, and 3 share the same conversational UI pattern. Create a reusable base component, then wrap it for each phase.

**`src/components/dsa/ConversationPhasePanel.jsx`** (shared base):

```jsx
import { useState, useRef, useEffect } from "react";
import { dsa } from "../../services/dsa_api";

export default function ConversationPhasePanel({ sessionId, phaseNumber, phaseName, phaseData, onPhaseComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (phaseData?.opening_question) {
      setMessages([{ role: "interviewer", content: phaseData.opening_question }]);
    }
  }, [phaseData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    setMessages(prev => [...prev, { role: "candidate", content: userMsg }]);

    try {
      const res = await dsa.sendMessage({
        dsa_session_id: sessionId,
        phase_number: phaseNumber,
        candidate_message: userMsg,
        conversation_history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      const data = res.data;
      setMessages(prev => [...prev, { role: "interviewer", content: data.interviewer_response }]);

      if (data.phase_complete) {
        setPhaseComplete(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-400">Phase {phaseNumber}: {phaseName}</h2>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-gray-900 rounded-lg p-4 min-h-64">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-lg px-4 py-3 rounded-xl text-sm ${
              m.role === "candidate"
                ? "bg-blue-700 text-white"
                : "bg-gray-700 text-gray-100"
            }`}>
              <span className="block text-xs opacity-60 mb-1">
                {m.role === "interviewer" ? "🤖 AI Interviewer" : "👤 You"}
              </span>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Phase Complete Banner */}
      {phaseComplete && (
        <div className="bg-green-900 border border-green-600 rounded-lg p-4 mb-4 text-green-200">
          <strong>Phase {phaseNumber} complete.</strong> Ready to advance.
          <button
            onClick={() => onPhaseComplete(phaseNumber + 1)}
            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded font-medium"
          >
            Advance to Phase {phaseNumber + 1} →
          </button>
        </div>
      )}

      {/* Input */}
      {!phaseComplete && (
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
            placeholder="Type your response..."
            rows={3}
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg p-3 resize-none focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 rounded-lg font-medium"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      )}
    </div>
  );
}
```

**`src/components/dsa/IntuitPhasePanel.jsx`:**
```jsx
import ConversationPhasePanel from "./ConversationPhasePanel";
export default (props) => <ConversationPhasePanel {...props} phaseNumber={1} phaseName="Intuition" />;
```

**`src/components/dsa/AlgoPhasePanel.jsx`:**
```jsx
import ConversationPhasePanel from "./ConversationPhasePanel";
export default (props) => <ConversationPhasePanel {...props} phaseNumber={2} phaseName="Algorithm Discussion" />;
```

**`src/components/dsa/ComplexityPhasePanel.jsx`:**
```jsx
import ConversationPhasePanel from "./ConversationPhasePanel";
export default (props) => <ConversationPhasePanel {...props} phaseNumber={3} phaseName="Complexity Analysis" />;
```

### 13.3 `src/components/dsa/CodingPhasePanel.jsx`

The coding phase needs the Monaco editor (already installed in the project).

```jsx
import { useState } from "react";
import Editor from "@monaco-editor/react";
import { dsa } from "../../services/dsa_api";

const STARTER_CODE = `def solution(*args, **kwargs):
    # Write your solution here
    pass
`;

export default function CodingPhasePanel({ sessionId, phaseData, onPhaseComplete }) {
  const [code, setCode] = useState(STARTER_CODE);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [interviewerFeedback, setInterviewerFeedback] = useState(null);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await dsa.submitCode(sessionId, code);
      const data = res.data;
      setResults(data.execution_result);
      setInterviewerFeedback(data.interviewer_opening);
      setSubmitted(true);

      // Auto-advance after a short delay
      setTimeout(() => {
        onPhaseComplete(5);  // Advance to feedback phase
      }, 8000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-blue-400">Phase 4: Coding</h2>
      <p className="text-gray-400 text-sm mb-4">
        Implement your solution. Your function must be named <code className="bg-gray-800 px-1 rounded">solution</code>.
      </p>

      <div className="flex-1 border border-gray-700 rounded-lg overflow-hidden mb-4">
        <Editor
          height="400px"
          defaultLanguage="python"
          value={code}
          onChange={(val) => setCode(val || "")}
          theme="vs-dark"
          options={{ fontSize: 14, minimap: { enabled: false }, wordWrap: "on" }}
        />
      </div>

      {/* Test Results */}
      {results && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
          <div className="flex gap-4 mb-3">
            <span className="text-green-400 font-semibold">✓ Passed: {results.passed}</span>
            <span className="text-red-400 font-semibold">✗ Failed: {results.failed}</span>
            <span className="text-blue-400 font-semibold">Score: {results.correctness_score}%</span>
          </div>
          {results.results.map((r, i) => (
            <div key={i} className={`text-xs p-2 rounded mb-1 ${r.passed ? "bg-green-900/30 text-green-300" : "bg-red-900/30 text-red-300"}`}>
              Test {r.test_number}: {r.passed ? "PASS" : `FAIL — ${r.error || `Expected ${JSON.stringify(r.expected)}, got ${JSON.stringify(r.got)}`}`}
            </div>
          ))}
        </div>
      )}

      {interviewerFeedback && (
        <div className="bg-gray-800 border border-blue-600 rounded-lg p-4 mb-4 text-blue-200 text-sm">
          <strong>🤖 Interviewer:</strong> {interviewerFeedback}
          <p className="text-gray-400 mt-2 text-xs">Advancing to feedback in a few seconds...</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-lg"
        >
          {submitting ? "Running Tests..." : "Submit Code"}
        </button>
      )}
    </div>
  );
}
```

---

## 14. Phase 10 — Frontend: Feedback Report Dashboard

### `src/pages/DSAFeedbackPage.jsx`

```jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dsa } from "../services/dsa_api";

const DIMENSION_LABELS = {
  I: { label: "Intuition Accuracy", color: "bg-purple-700" },
  A: { label: "Algorithmic Clarity", color: "bg-blue-700" },
  C: { label: "Complexity Understanding", color: "bg-cyan-700" },
  P: { label: "Programming Correctness", color: "bg-green-700" },
  F: { label: "Feedback Response", color: "bg-orange-700" },
};

export default function DSAFeedbackPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvaluation() {
      try {
        const res = await dsa.getEvaluation(sessionId);
        setEvaluation(res.data);
      } catch {
        // Trigger evaluation if not yet computed
        const res = await dsa.triggerEvaluation(sessionId);
        setEvaluation(res.data);
      } finally {
        setLoading(false);
      }
    }
    loadEvaluation();
  }, [sessionId]);

  if (loading) return <div className="text-white p-8">Computing your score...</div>;
  if (!evaluation) return <div className="text-white p-8">Score not available.</div>;

  const { scores, composite_score, detailed_feedback, weights } = evaluation;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Interview Complete 🎉</h1>
      <p className="text-gray-400 mb-8">Here is your detailed performance report.</p>

      {/* Composite Score */}
      <div className="flex items-center justify-center mb-10">
        <div className="text-center bg-gray-800 rounded-full w-40 h-40 flex flex-col items-center justify-center border-4 border-blue-500">
          <span className="text-5xl font-bold text-blue-400">{composite_score.toFixed(1)}</span>
          <span className="text-sm text-gray-400 mt-1">/ 100</span>
          <span className="text-xs text-gray-500">Composite Score</span>
        </div>
      </div>

      {/* Formula Display */}
      <div className="bg-gray-900 rounded-lg p-4 mb-8 text-center text-sm font-mono text-gray-300">
        S = {weights.wi}×I + {weights.wa}×A + {weights.wc}×C + {weights.wp}×P + {weights.wf}×F
        &nbsp;&nbsp;=&nbsp;&nbsp;
        {weights.wi}×{scores.I?.toFixed(1)} + {weights.wa}×{scores.A?.toFixed(1)} + {weights.wc}×{scores.C?.toFixed(1)} + {weights.wp}×{scores.P?.toFixed(1)} + {weights.wf}×{scores.F?.toFixed(1)}
        &nbsp;&nbsp;= <strong className="text-blue-400">{composite_score.toFixed(2)}</strong>
      </div>

      {/* Dimension Breakdown */}
      <div className="space-y-4 mb-8">
        {Object.entries(DIMENSION_LABELS).map(([key, cfg]) => (
          <div key={key} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">{cfg.label}</span>
              <span className={`${cfg.color} text-white text-sm font-bold px-3 py-1 rounded`}>
                {scores[key]?.toFixed(1) ?? "N/A"}
              </span>
            </div>
            {/* Score Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div
                className={`${cfg.color} h-2 rounded-full transition-all duration-700`}
                style={{ width: `${scores[key] || 0}%` }}
              />
            </div>
            <p className="text-gray-300 text-sm">{detailed_feedback[key]}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/dsa")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          Try Another Problem
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
```

---

## 15. Phase 11 — Frontend: Routing Integration

Open `src/App.jsx` and add the three new DSA routes. **Do not remove any existing routes.**

```jsx
// Add these imports at the top of App.jsx
import DSALanding from "./pages/DSALanding";
import DSASessionPage from "./pages/DSASessionPage";
import DSAFeedbackPage from "./pages/DSAFeedbackPage";

// Add these Route entries inside your existing <Routes> block:
<Route path="/dsa" element={<DSALanding />} />
<Route path="/dsa/session/:sessionId" element={<DSASessionPage />} />
<Route path="/dsa/feedback/:sessionId" element={<DSAFeedbackPage />} />
```

Also add a navigation entry in `Dashboard.jsx` so existing users can discover the DSA Interview feature:

```jsx
// Inside Dashboard.jsx, add this button/link to the navigation section
<button onClick={() => navigate("/dsa")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
  🎯 Start DSA Interview
</button>
```

---

## 16. Phase 12 — Integration Testing

Follow this checklist in order. Do not skip ahead — each step depends on the one before it.

### 16.1 Backend Unit Tests

Create `app/dsa/tests/test_dsa_service.py`:

```python
import pytest
from app.dsa.services.dsa_scoring_service import compute_final_score, DEFAULT_WEIGHTS

def test_weights_sum_to_one():
    w = DEFAULT_WEIGHTS
    total = w["wi"] + w["wa"] + w["wc"] + w["wp"] + w["wf"]
    assert abs(total - 1.0) < 1e-9, f"Weights sum to {total}, expected 1.0"

def test_code_executor_passes_correct_code():
    from app.dsa.services.dsa_code_executor import execute_code_against_tests
    user_code = "def solution(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target-n], i]\n        seen[n] = i"
    test_cases = [{"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected": [0, 1]}]
    driver = "def test(nums, target):\n    return solution(nums, target)"
    result = execute_code_against_tests(user_code, test_cases, driver)
    assert result["passed"] == 1

def test_code_executor_catches_syntax_error():
    from app.dsa.services.dsa_code_executor import execute_code_against_tests
    bad_code = "def solution(nums, target:\n    pass"  # SyntaxError
    test_cases = [{"input": {"nums": [1, 2], "target": 3}, "expected": [0, 1]}]
    driver = ""
    result = execute_code_against_tests(bad_code, test_cases, driver)
    assert result["passed"] == 0
    assert "SyntaxError" in result["results"][0]["error"]
```

Run:
```bash
pytest app/dsa/tests/test_dsa_service.py -v
```

### 16.2 API Smoke Tests

```bash
# 1. Start backend
uvicorn app.main:app --reload

# 2. Check DSA routes appear in Swagger
curl http://localhost:8000/docs | grep -i dsa

# 3. Authenticate and get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass"}' | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 4. List problems (should return seeded problems)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/dsa/problems/

# 5. Create a DSA session
curl -s -X POST http://localhost:8000/api/dsa/sessions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"problem_id": "dsa_001"}'

# 6. Trigger evaluation with mock session
```

### 16.3 End-to-End Manual Test Flow

```
1. Login → navigate to /dsa
2. Select "Two Sum" (easy)   ← problem picker should appear
3. Click "Start Interview"   ← should redirect to /dsa/session/{id}
4. Respond to Phase 1 questions (2-3 messages)
5. Observe phase completion banner
6. Click "Advance to Phase 2"
7. Repeat for Phases 2 and 3
8. In Phase 4, type a solution in Monaco editor, click "Submit Code"
9. Observe test pass/fail results
10. Observe automatic redirect to /dsa/feedback/{id}
11. Verify composite score formula is displayed
12. Verify per-dimension score bars and feedback text appear
```

---

## 17. Phase 13 — Environment & Deployment Config

### 17.1 No New Environment Variables Needed

The DSA service reuses `GEMINI_API_KEY` and `MONGO_URL` from the existing `.env`. No additional keys required.

### 17.2 Seeding on Startup

The `seed_problems_if_empty()` call in `main.py`'s startup event handles seeding. On the first boot against a fresh DB, it will load from `dsa_problems_seed.json` automatically.

### 17.3 CORS Check

If the frontend dev server is running on a different port, ensure existing CORS settings in `app/main.py` cover `http://localhost:5173`. Check this line exists:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    ...
)
```

### 17.4 Production Deployment

No changes needed to existing `vercel.json` or Netlify config. The DSA routes are part of the same FastAPI process. Frontend routes (`/dsa/*`) are client-side routes handled by React Router — ensure `index.html` fallback is configured in the hosting provider.

---

## 18. Complete New File Tree

The following files are **net-new additions** to the repository. No existing files are deleted; only `app/main.py`, `app/database.py`, and `src/App.jsx` are modified (additive changes only).

```
app/
└── dsa/
    ├── __init__.py                             ← NEW
    ├── data/
    │   └── dsa_problems_seed.json              ← NEW (populate with 20+ problems)
    ├── routes/
    │   ├── dsa_problem_routes.py               ← NEW
    │   ├── dsa_session_routes.py               ← NEW
    │   ├── dsa_phase_routes.py                 ← NEW
    │   └── dsa_evaluation_routes.py            ← NEW
    ├── services/
    │   ├── dsa_problem_service.py              ← NEW
    │   ├── dsa_session_service.py              ← NEW
    │   ├── dsa_phase_service.py                ← NEW (CORE ENGINE)
    │   ├── dsa_code_executor.py                ← NEW
    │   └── dsa_scoring_service.py              ← NEW (S = wi×I + ...)
    ├── schemas/
    │   ├── dsa_session_schema.py               ← NEW
    │   ├── dsa_phase_schema.py                 ← NEW
    │   ├── dsa_problem_schema.py               ← NEW
    │   └── dsa_evaluation_schema.py            ← NEW
    └── tests/
        └── test_dsa_service.py                 ← NEW

interview_with_ai_frontend/src/
├── pages/
│   ├── DSALanding.jsx                          ← NEW
│   ├── DSASessionPage.jsx                      ← NEW
│   └── DSAFeedbackPage.jsx                     ← NEW
└── components/dsa/
    ├── PhaseProgressBar.jsx                    ← NEW
    ├── ConversationPhasePanel.jsx              ← NEW (shared base)
    ├── IntuitPhasePanel.jsx                    ← NEW
    ├── AlgoPhasePanel.jsx                      ← NEW
    ├── ComplexityPhasePanel.jsx                ← NEW
    ├── CodingPhasePanel.jsx                    ← NEW
    └── FeedbackCard.jsx                        ← NEW

# MODIFIED (additive only):
app/main.py            ← +4 router registrations, +startup seeder
app/database.py        ← +4 collection variables
src/App.jsx            ← +3 routes
src/pages/Dashboard.jsx ← +1 navigation button
requirements.txt       ← +RestrictedPython, +pyflakes
```

**Total new files:** 23  
**Modified files:** 5  
**Deleted files:** 0

---

## 19. Known Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| LLM returns `PHASE_COMPLETE` too early or never | High | Add a max-exchange counter (10 messages) that forces phase completion with a default score of 60 |
| `RestrictedPython` blocks legitimate code patterns (e.g., list comprehensions with certain builtins) | Medium | Test all seeded problems' solutions through the executor before deployment; whitelist safe builtins as needed |
| Gemini API quota exhausted mid-interview | Medium | Reuse the existing `generate_mock_response()` from `chat_service.py` as a fallback; the phase will still complete but scores will be estimated |
| LLM score parsing fails (malformed `PHASE_COMPLETE|score=...` response) | Medium | Try-except around score parsing with a sensible default (70.0) — already in `dsa_phase_service.py` |
| Cold start — `dsa_problems_seed.json` missing | Low | The `seed_problems_if_empty()` function will fail silently; `GET /api/dsa/problems/` will return an empty list. Add an assertion in the startup function to raise loudly |
| Phase conversation history grows very large (token overflow) | Low | Limit conversation history passed to the LLM to the last 10 turns. Add a `[-10:]` slice in `dsa_phase_service.send_phase_message()` |
| Candidate refreshes the page mid-phase | Low | `start_phase()` is idempotent for already-started phases if you add an upsert check. On `DSASessionPage` mount, always load the existing phase document before re-calling `start_phase` |

---

> **Build this bottom-up:** DB → Schemas → Services → Routes → Register in main → Frontend services → Frontend components → Frontend pages → Test.  
> If you get stuck at any layer, isolate using the Swagger UI at `http://localhost:8000/docs` before touching the frontend.
>
> The entire prototype is designed to be live in **one sprint (5–7 focused days)** following this plan.
```
