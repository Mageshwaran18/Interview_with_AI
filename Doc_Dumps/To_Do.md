# Library Management System — Task Design & Test Runner Implementation Guide

**Project:** Interview With AI (GUIDE Platform)
**Scope:** Replace Library Management Systemtask with Library Management System
**Touches:** `test_service.py`, `test_routes.py`, `TaskSidebar.jsx`,
`GuidePage.jsx`, `pillar_d.py`, `pillar_e.py`

---

## Overview: What Needs to Change

The task design lives across **four layers** of the existing system.
Each must be updated together or the evaluation pipeline will produce
incorrect scores.

```
TaskSidebar.jsx          ← What the candidate reads (requirements)
GuidePage.jsx            ← Starter code injected into Monaco editor
test_service.py          ← The 20 test cases + sandboxed runner
test_routes.py           ← /api/test-code endpoint (response shape)
pillar_d.py              ← Bug detection logic (seeded bugs B1/B2/B3)
pillar_e.py              ← Functional Completeness score (fc_score)
```

---

## Step 1: Update `TaskSidebar.jsx` (Requirements Checklist)

**File:** `interview_with_ai_frontend/src/components/TaskSidebar.jsx`

Replace the entire `requirements` array (or however requirements are
currently declared) with the following. The structure must match what
`GuidePage.jsx` already renders — only the content changes.

```jsx
// TaskSidebar.jsx

const CALCULATOR_REQUIREMENTS = [
  {
    id: "req_1",
    label: "Basic Operations",
    description:
      "Implement add(), subtract(), multiply(), and divide() — each accepts two numbers and returns a float.",
    tested: true,   // tells the UI to show a 🧪 badge
  },
  {
    id: "req_2",
    label: "Input Validation",
    description:
      "Reject non-numeric inputs (strings, None, booleans) and return {'error': '<message>'} — never raise exceptions.",
    tested: true,
  },
  {
    id: "req_3",
    label: "Division by Zero Handling",
    description:
      "divide() must check for zero BEFORE performing division and return {'error': 'Division by zero'} if divisor is 0.",
    tested: true,
  },
  {
    id: "req_4",
    label: "Calculation History",
    description:
      "get_history() returns a list of past calculations as dicts: [{expression, result}]. clear_history() resets it to [].",
    tested: true,
  },
  {
    id: "req_5",
    label: "Error Handling",
    description:
      "All functions must return structured {'error': '...'} dicts for invalid input — do not raise unhandled exceptions.",
    tested: true,
  },
];

// Swap the existing requirements prop/constant with CALCULATOR_REQUIREMENTS
// The rendered checklist and its tick-off logic remain unchanged.
```

**What does NOT change:** The JSX rendering loop, tick state management,
and sidebar layout. Only the data array above is replaced.

---

## Step 2: Update Starter Code in `GuidePage.jsx`

**File:** `interview_with_ai_frontend/src/pages/GuidePage.jsx`

Find the `defaultValue` (or `starterCode` / `initialCode`) constant
that is passed to the Monaco `<Editor />` component. Replace it entirely
with the following seeded starter code. The three bugs are intentional —
**do not fix them**.

```python
# starter_code (passed as defaultValue to Monaco Editor)

STARTER_CODE = """
# Library Management System — Interview With AI
# Complete the implementation below.
# DO NOT change function signatures.

history = []  # Stores calculation history


def validate_input(a, b):
    \"\"\"
    Returns True if both inputs are valid numbers.
    Returns {'error': '<message>'} if either input is invalid.
    \"\"\"
    # BUG 3 IS HERE: type(x) == int rejects ALL floats
    if type(a) == int and type(b) == int:
        return True
    return {"error": f"Invalid input: expected numbers, got {type(a).__name__} and {type(b).__name__}"}


def add(a, b):
    \"\"\"Add two numbers. Return float on success, error dict on failure.\"\"\"
    validation = validate_input(a, b)
    if isinstance(validation, dict):
        return validation
    result = a + b
    _log_history(a, "+", b, result)
    return float(result)


def subtract(a, b):
    \"\"\"Subtract b from a. Return float on success, error dict on failure.\"\"\"
    validation = validate_input(a, b)
    if isinstance(validation, dict):
        return validation
    result = a - b
    _log_history(a, "-", b, result)
    return float(result)


def multiply(a, b):
    \"\"\"Multiply two numbers. Return float on success, error dict on failure.\"\"\"
    validation = validate_input(a, b)
    if isinstance(validation, dict):
        return validation
    result = a * b
    _log_history(a, "*", b, result)
    return float(result)


def divide(a, b):
    \"\"\"Divide a by b. Return float on success, error dict on failure.\"\"\"
    validation = validate_input(a, b)
    if isinstance(validation, dict):
        return validation
    # BUG 1 IS HERE: division happens BEFORE the zero guard
    result = a / b
    if b == 0:
        return {"error": "Division by zero"}
    _log_history(a, "/", b, result)
    return float(result)


def _log_history(a, op, b, result):
    \"\"\"Internal helper — appends a calculation to history.\"\"\"
    # BUG 2 IS HERE: no check that result is a valid number before logging
    history.append({
        "expression": f"{a} {op} {b}",
        "result": result
    })


def get_history():
    \"\"\"Return the full calculation history as a list of dicts.\"\"\"
    return history


def clear_history():
    \"\"\"Clear all history entries.\"\"\"
    global history
    history = []
"""
```

**How to wire it into Monaco in `GuidePage.jsx`:**

```jsx
// In GuidePage.jsx — find the Editor component and set defaultValue
import STARTER_CODE from "../constants/starterCode";  // or inline the string

<Editor
  height="100%"
  language="python"
  defaultValue={STARTER_CODE}
  theme="vs-dark"
  options={{ minimap: { enabled: false }, fontSize: 14 }}
  onChange={(value) => setCode(value)}
  onMount={(editor) => { monacoRef.current = editor; }}
/>
```

**Key rule:** `STARTER_CODE` is a module-level constant, not state.
Monaco's `defaultValue` is only read once on mount. If the existing
code uses `value=` instead of `defaultValue=`, keep using `value=` and
set initial state to `STARTER_CODE`.

---

## Step 3: Rewrite `test_service.py` (The Test Runner)

**File:** `app/services/test_service.py`

This is the most important file. It replaces the existing test logic
entirely. The public interface — `run_tests(code: str, session_id: str)`
— must keep the same signature since `test_routes.py` calls it.

```python
# app/services/test_service.py

import traceback
import time
import types
from app.services.event_service import log_event

# ─────────────────────────────────────────────
# TEST CASE REGISTRY
# Each entry: id, label, code (string), visible
# ─────────────────────────────────────────────

SAMPLE_TESTS = [
    {
        "id": "TC-S01",
        "label": "Basic addition",
        "visible": True,
        "code": """
assert add(2, 3) == 5.0, f"Expected 5.0 got {add(2, 3)}"
""",
    },
    {
        "id": "TC-S02",
        "label": "Basic subtraction",
        "visible": True,
        "code": """
assert subtract(10, 4) == 6.0, f"Expected 6.0 got {subtract(10, 4)}"
""",
    },
    {
        "id": "TC-S03",
        "label": "Division by zero returns error dict",
        "visible": True,
        "code": """
result = divide(5, 0)
assert isinstance(result, dict), f"Expected dict, got {type(result)}"
assert "error" in result, "Expected 'error' key in result dict"
""",
    },
    {
        "id": "TC-S04",
        "label": "History records a calculation",
        "visible": True,
        "code": """
clear_history()
add(1, 2)
h = get_history()
assert len(h) == 1, f"Expected 1 history entry, got {len(h)}"
assert h[0]["result"] == 3.0, f"Expected 3.0, got {h[0]['result']}"
""",
    },
]

VALIDATION_TESTS = [
    {
        "id": "TC-V01",
        "label": "Float inputs",
        "visible": False,
        "code": "assert add(1.5, 2.5) == 4.0",
    },
    {
        "id": "TC-V02",
        "label": "Negative numbers",
        "visible": False,
        "code": "assert subtract(0, 7) == -7.0",
    },
    {
        "id": "TC-V03",
        "label": "Multiply by zero",
        "visible": False,
        "code": "assert multiply(100, 0) == 0.0",
    },
    {
        "id": "TC-V04",
        "label": "Divide two floats",
        "visible": False,
        "code": "assert divide(7.5, 2.5) == 3.0",
    },
    {
        "id": "TC-V05",
        "label": "String input returns error dict",
        "visible": False,
        "code": """
result = add("abc", 2)
assert isinstance(result, dict) and "error" in result
""",
    },
    {
        "id": "TC-V06",
        "label": "None input returns error dict",
        "visible": False,
        "code": """
result = multiply(None, 3)
assert isinstance(result, dict) and "error" in result
""",
    },
    {
        "id": "TC-V07",
        "label": "Large numbers",
        "visible": False,
        "code": "assert multiply(1_000_000, 1_000_000) == 1_000_000_000_000.0",
    },
    {
        "id": "TC-V08",
        "label": "Negative result from subtraction",
        "visible": False,
        "code": "assert subtract(3, 10) == -7.0",
    },
    {
        "id": "TC-V09",
        "label": "History preserves insertion order",
        "visible": False,
        "code": """
clear_history()
add(1, 1)
add(2, 2)
h = get_history()
assert h[0]["result"] == 2.0
assert h[1]["result"] == 4.0
""",
    },
    {
        "id": "TC-V10",
        "label": "clear_history resets to empty list",
        "visible": False,
        "code": """
clear_history()
assert get_history() == []
""",
    },
]

BUG_PROBE_TESTS = [
    {
        "id": "TC-B01",
        "label": "Division guard fires before division (Bug 1)",
        "visible": False,
        # Targets: divide() performs `a / b` before checking `if b == 0`
        "code": """
try:
    result = divide(10, 0)
    assert isinstance(result, dict), f"Expected error dict, got: {result}"
    assert "error" in result
except ZeroDivisionError:
    raise AssertionError(
        "Bug 1 active: divide() executes the division before checking for zero"
    )
""",
    },
    {
        "id": "TC-B02",
        "label": "Error responses not logged to history (Bug 2)",
        "visible": False,
        # Targets: _log_history() appends even when result is an error dict
        "code": """
clear_history()
divide(5, 0)
h = get_history()
assert len(h) == 0, (
    f"Bug 2 active: error response was logged to history "
    f"({len(h)} entries found)"
)
""",
    },
    {
        "id": "TC-B03",
        "label": "Float inputs accepted by validate_input (Bug 3)",
        "visible": False,
        # Targets: validate_input uses `type(x) == int` which rejects floats
        "code": """
result = add(1.5, 2.5)
assert result == 4.0, (
    f"Bug 3 active: float inputs incorrectly rejected by validate_input "
    f"(got {result})"
)
""",
    },
]

REGRESSION_TESTS = [
    {
        "id": "TC-R01",
        "label": "Normal division works after Bug 1 fix",
        "visible": False,
        "code": "assert divide(10, 2) == 5.0",
    },
    {
        "id": "TC-R02",
        "label": "Valid calculations still log to history after Bug 2 fix",
        "visible": False,
        "code": """
clear_history()
add(3, 3)
assert len(get_history()) == 1
""",
    },
    {
        "id": "TC-R03",
        "label": "Integer inputs still work after Bug 3 fix",
        "visible": False,
        "code": """
assert add(2, 3) == 5.0
assert subtract(10, 3) == 7.0
""",
    },
]

# Master list: order matters — sample first (shown in UI), then hidden
ALL_TEST_CASES = SAMPLE_TESTS + VALIDATION_TESTS + BUG_PROBE_TESTS + REGRESSION_TESTS


# ─────────────────────────────────────────────
# MODULE LOADER
# ─────────────────────────────────────────────

def _load_candidate_module(code_str: str):
    """
    Dynamically compile and execute the candidate's code into a
    fresh module namespace. Raises SyntaxError if code doesn't parse.
    """
    mod = types.ModuleType("candidate")
    compiled = compile(code_str, "<candidate_code>", "exec")
    exec(compiled, mod.__dict__)
    return mod


# ─────────────────────────────────────────────
# MAIN ENTRY POINT (called by test_routes.py)
# ─────────────────────────────────────────────

def run_tests(code: str, session_id: str) -> dict:
    """
    Execute all 20 test cases against the candidate's submitted code.

    Returns a dict matching the shape test_routes.py already expects:
    {
        total, passed, failed, fc_score,
        results: [ {id, label, status, visible, duration_ms, message?} ]
    }
    """
    results = []

    # --- Attempt to load the candidate's module ---
    try:
        mod = _load_candidate_module(code)
    except SyntaxError as e:
        # If code doesn't compile, all tests fail immediately
        _emit_test_run_event(session_id, 0, len(ALL_TEST_CASES), [])
        return {
            "total": len(ALL_TEST_CASES),
            "passed": 0,
            "failed": len(ALL_TEST_CASES),
            "fc_score": 0.0,
            "error": f"SyntaxError in submitted code: {str(e)}",
            "results": [],
        }

    # Build the test execution scope with candidate functions injected
    # Each test_globals copy is isolated so state leaks don't cross tests
    # EXCEPTION: history tests explicitly call clear_history() to reset state
    base_globals = {
        "add":           getattr(mod, "add", None),
        "subtract":      getattr(mod, "subtract", None),
        "multiply":      getattr(mod, "multiply", None),
        "divide":        getattr(mod, "divide", None),
        "get_history":   getattr(mod, "get_history", None),
        "clear_history": getattr(mod, "clear_history", None),
    }

    # Check all required functions exist before running
    missing = [fn for fn, val in base_globals.items() if val is None]
    if missing:
        return {
            "total": len(ALL_TEST_CASES),
            "passed": 0,
            "failed": len(ALL_TEST_CASES),
            "fc_score": 0.0,
            "error": f"Missing required functions: {', '.join(missing)}",
            "results": [],
        }

    # --- Run each test case ---
    for tc in ALL_TEST_CASES:
        start = time.perf_counter()
        scope = dict(base_globals)  # fresh copy per test

        try:
            exec(compile(tc["code"].strip(), f"<{tc['id']}>", "exec"), scope)
            results.append({
                "id": tc["id"],
                "label": tc["label"],
                "status": "PASS",
                "visible": tc["visible"],
                "duration_ms": round((time.perf_counter() - start) * 1000, 2),
            })

        except AssertionError as e:
            results.append({
                "id": tc["id"],
                "label": tc["label"],
                "status": "FAIL",
                "visible": tc["visible"],
                "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                # For hidden tests, return a generic nudge — never the assertion text
                "message": str(e) if tc["visible"] else _generic_hint(tc["id"]),
            })

        except Exception as e:
            results.append({
                "id": tc["id"],
                "label": tc["label"],
                "status": "ERROR",
                "visible": tc["visible"],
                "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                "message": traceback.format_exc(limit=3) if tc["visible"]
                           else "A hidden test raised an unexpected exception.",
            })

    passed = sum(1 for r in results if r["status"] == "PASS")
    fc_score = round(passed / len(ALL_TEST_CASES), 4)

    # --- Log TEST_RUN event into Interaction Trace Φ ---
    _emit_test_run_event(session_id, passed, len(ALL_TEST_CASES), results)

    return {
        "total": len(ALL_TEST_CASES),
        "passed": passed,
        "failed": len(ALL_TEST_CASES) - passed,
        "fc_score": fc_score,   # ← consumed by pillar_e.py (Functional Completeness)
        "results": results,
    }


def _generic_hint(test_id: str) -> str:
    """
    Returns a non-spoiling hint message for hidden test failures.
    Hints are bucketed by test category, not individual test IDs.
    """
    if test_id.startswith("TC-V"):
        return "A hidden validation test failed. Check your edge case handling."
    if test_id.startswith("TC-B"):
        return "A hidden bug-probe test failed. Review your error handling logic."
    if test_id.startswith("TC-R"):
        return "A hidden regression test failed. Ensure a previous fix didn't break something."
    return "A hidden test failed."


def _emit_test_run_event(session_id: str, passed: int, total: int, results: list):
    """
    Appends a TEST_RUN event to Interaction Trace Φ.
    Uses the synchronous log_event() — no await needed.
    Bug probe pass/fail is extracted here for pillar_d.py to consume.
    """
    bug_results = {
        r["id"]: r["status"]
        for r in results
        if r["id"].startswith("TC-B")
    }

    log_event(
        session_id=session_id,
        event_type="TEST_RUN",
        actor="candidate",
        details={
            "passed": passed,
            "total": total,
            "fc_score": round(passed / total, 4) if total > 0 else 0.0,
            "bug_probe_results": bug_results,
            # e.g. {"TC-B01": "FAIL", "TC-B02": "PASS", "TC-B03": "FAIL"}
        },
        metadata={
            "test_suite": "simple_calculator_v1",
        }
    )
```

---

## Step 4: Update `test_routes.py` (API Endpoint)

**File:** `app/routes/test_routes.py`

The route itself likely doesn't need structural changes — only verify
the request schema accepts `code` + `session_id` and returns the dict
from `run_tests()`. Add the schema comment below if it's missing.

```python
# app/routes/test_routes.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.test_service import run_tests

router = APIRouter()


class TestCodeRequest(BaseModel):
    session_id: str
    code: str


class TestCodeResponse(BaseModel):
    total: int
    passed: int
    failed: int
    fc_score: float          # 0.0–1.0  → feeds pillar_e.py
    results: list            # per-test result objects
    error: str | None = None # set only on SyntaxError / missing functions


@router.post("/api/test-code", response_model=TestCodeResponse)
async def test_code(request: TestCodeRequest):
    """
    Execute the 20-case Library Management System test suite against
    the candidate's code. Called by CodeEditor.jsx's "Run Tests" button.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty.")

    result = run_tests(
        code=request.code,
        session_id=request.session_id,
    )
    return result
```

**No change needed** to how `GuidePage.jsx` calls this endpoint —
`POST /api/test-code` with `{ session_id, code }` is already the
existing contract.

---

## Step 5: Update `pillar_d.py` (Bug Detection Score)

**File:** `app/evaluation/pillar_d.py`

The D pillar reads the `bug_probe_results` field that `test_service.py`
now writes into every `TEST_RUN` event. Update the BDR (Bug Detection
Rate) computation to use the new bug IDs.

```python
# app/evaluation/pillar_d.py  — BDR section update

# ── SEEDED BUG REGISTRY ─────────────────────────────────────────────────
# Maps test case ID → human-readable bug description
SEEDED_BUGS = {
    "TC-B01": "divide() performs division before zero guard (Bug 1)",
    "TC-B02": "_log_history() logs error responses to history (Bug 2)",
    "TC-B03": "validate_input uses type(x)==int, rejecting floats (Bug 3)",
}
TOTAL_BUGS = len(SEEDED_BUGS)  # 3


def compute_bdr(events: list) -> dict:
    """
    Bug Detection Rate: what fraction of the 3 seeded bugs did the
    candidate ultimately fix?

    Strategy: scan all TEST_RUN events in chronological order.
    For each bug probe test (TC-B01/B02/B03), a bug is considered
    'fixed' if its LAST recorded status in any TEST_RUN event is 'PASS'.
    """
    # Collect the latest status per bug probe test across all TEST_RUN events
    latest_bug_status: dict[str, str] = {}

    for event in events:
        if event.get("event_type") != "TEST_RUN":
            continue
        bug_results = event.get("details", {}).get("bug_probe_results", {})
        for test_id, status in bug_results.items():
            if test_id in SEEDED_BUGS:
                latest_bug_status[test_id] = status  # last write wins (chronological)

    bugs_fixed = sum(
        1 for test_id in SEEDED_BUGS
        if latest_bug_status.get(test_id) == "PASS"
    )

    bdr = round(bugs_fixed / TOTAL_BUGS, 4)  # 0.0 – 1.0
    bdr_score = round(bdr * 100, 2)          # 0 – 100

    return {
        "metric": "Bug Detection Rate (BDR)",
        "bugs_fixed": bugs_fixed,
        "bugs_total": TOTAL_BUGS,
        "bdr_raw": bdr,
        "bdr_score": bdr_score,          # ← feeds pillar D composite
        "per_bug": {
            test_id: {
                "description": SEEDED_BUGS[test_id],
                "fixed": latest_bug_status.get(test_id) == "PASS",
                "last_status": latest_bug_status.get(test_id, "NOT_ATTEMPTED"),
            }
            for test_id in SEEDED_BUGS
        },
        "expert_target": "> 0.67 (at least 2 of 3 bugs fixed)",
    }
```

---

## Step 6: Update `pillar_e.py` (Functional Completeness Score)

**File:** `app/evaluation/pillar_e.py`

The E pillar reads `fc_score` from the final `TEST_RUN` event (the one
with the highest `passed` count — i.e., the candidate's best run).

```python
# app/evaluation/pillar_e.py  — FC section update

def compute_fc(events: list) -> dict:
    """
    Functional Completeness (FC): highest fc_score achieved across all
    TEST_RUN events. We take the best run, not the last run, because
    a candidate may make things worse right before submitting.
    """
    test_run_events = [
        e for e in events if e.get("event_type") == "TEST_RUN"
    ]

    if not test_run_events:
        return {
            "metric": "Functional Completeness (FC)",
            "fc_score": 0.0,
            "fc_score_100": 0.0,
            "best_run": None,
            "total_runs": 0,
            "expert_target": "> 0.85 (17+ of 20 tests passing)",
        }

    # Pick the run with the most tests passed
    best_run = max(
        test_run_events,
        key=lambda e: e.get("details", {}).get("passed", 0)
    )
    best_details = best_run.get("details", {})
    fc_score = best_details.get("fc_score", 0.0)

    return {
        "metric": "Functional Completeness (FC)",
        "fc_score": fc_score,            # 0.0 – 1.0
        "fc_score_100": round(fc_score * 100, 2),  # ← feeds pillar E composite
        "best_run": {
            "passed": best_details.get("passed", 0),
            "total":  best_details.get("total", 20),
            "timestamp": best_run.get("timestamp"),
        },
        "total_runs": len(test_run_events),
        "expert_target": "> 0.85 (17+ of 20 tests passing)",
    }
```

---

## Step 7: Verify the "Run Tests" Flow End-to-End

Use this checklist to confirm everything is wired correctly after making
the changes above.

```
FRONTEND TRIGGER
────────────────
GuidePage.jsx
  → candidate clicks "Run Tests"
  → POST /api/test-code
    body: { session_id: "...", code: <Monaco editor value> }

BACKEND ROUTE
─────────────
test_routes.py  →  POST /api/test-code
  → calls run_tests(code, session_id)  in test_service.py

TEST EXECUTION
──────────────
test_service.py
  → _load_candidate_module(code)       # compile + exec
  → loop over ALL_TEST_CASES (20 total)
  → exec each test in isolated scope
  → collect results[]
  → _emit_test_run_event(session_id, ...) # synchronous log_event()

EVENT LOGGING
─────────────
event_service.log_event()              # synchronous, no await
  → writes to events_collection (Interaction Trace Φ)
    event_type: "TEST_RUN"
    details: { passed, total, fc_score, bug_probe_results }

RESPONSE TO FRONTEND
────────────────────
{
  total: 20,
  passed: N,
  failed: 20 - N,
  fc_score: N/20,
  results: [
    { id, label, status, visible, duration_ms }   ← visible tests
    { id, label, status, visible, duration_ms,
      message: "A hidden test failed..." }         ← hidden failures
  ]
}

FRONTEND RENDER (GuidePage.jsx)
───────────────────────────────
Sample tests (TC-S01–S04): show label + PASS/FAIL + duration
Hidden tests: show aggregate count only — "16/20 hidden tests passed"
Bug hints: on TC-B* failure → "Review your error handling logic"

EVALUATION (post-session)
─────────────────────────
pillar_e.py → reads fc_score from TEST_RUN events   → FC metric
pillar_d.py → reads bug_probe_results from events   → BDR metric
pillar_i.py → counts TEST_RUN events, failure→pass  → ERS metric
pillar_d.py → timestamp of first TEST_RUN event     → TFR metric
```

---

## File Change Summary

| File | Change Type | What Changes |
|---|---|---|
| `TaskSidebar.jsx` | Content update | Requirements array → 5 Calculator requirements |
| `GuidePage.jsx` | Content update | `defaultValue`/starter code → seeded calculator code |
| `test_service.py` | Full rewrite | 20 test cases + new runner logic |
| `test_routes.py` | Minor update | Schema comments + ensure `fc_score` in response |
| `pillar_d.py` | Logic update | BDR reads `TC-B01/B02/B03` from `bug_probe_results` |
| `pillar_e.py` | Logic update | FC reads best `fc_score` across all `TEST_RUN` events |

**Files that do NOT need changes:**
`event_service.py`, `evaluation_service.py`, `chat_service.py`,
`session_service.py`, `CodeEditor.jsx`, `ChatPanel.jsx`,
`pillar_g.py`, `pillar_u.py`, `pillar_i.py`