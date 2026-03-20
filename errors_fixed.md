# Errors Fixed — Interview with AI Project

> Full audit of all backend, frontend, and CSS files. Total **17 bugs** identified and fixed.

---

## 🔴 Backend Fixes (9)

### B1 — Security: Plaintext Password Logging
**File:** `app/routes/auth_routes.py`  
**Severity:** 🔴 Critical  
**Issue:** `print(f"Received signup request for password: {user.password}")` was logging plaintext passwords to the console — a critical security vulnerability.  
**Fix:** Removed the password logging line entirely.

---

### B2 — CORS Wildcard with Credentials
**File:** `app/main.py`  
**Severity:** 🔴 Critical  
**Issue:** `allow_origins` contained `"*"` alongside specific origins, while `allow_credentials=True` was set. Per the CORS spec, browsers reject this combination — credentials cannot be used with wildcard origins.  
**Fix:** Removed `"*"` from the origins list, keeping only the specific frontend URLs.

---

### B3 — Deprecated FastAPI Startup Event
**File:** `app/main.py`  
**Severity:** 🟡 Warning  
**Issue:** `@app.on_event("startup")` is deprecated in modern FastAPI.  
**Fix:** Replaced with the modern `lifespan` context manager pattern using `@asynccontextmanager`.

---

### B4 — Startup Crash if Env Var Missing
**File:** `app/config.py`  
**Severity:** 🟠 High  
**Issue:** `int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))` would crash with `TypeError: int() argument must be a string, not NoneType` if the env var is not set in `.env`.  
**Fix:** Added default value: `int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))`.

---

### B5 — Async Function Called Without Await
**File:** `app/services/session_service.py`  
**Severity:** 🔴 Critical  
**Issue:** `log_event()` is an `async` coroutine, but was called without `await` in 2 locations inside synchronous `@staticmethod` methods (`start_session()` and `end_session()`). This meant `SESSION_START` and `SESSION_END` events were **silently never logged** to the Interaction Trace Φ.  
**Fix:** Used `asyncio.ensure_future()` when the event loop is running (inside FastAPI request context) to properly schedule the async calls.

---

### B6 — Instance Call to Static Method
**File:** `app/services/chat_service.py`  
**Severity:** 🟠 High  
**Issue:** `SessionService()` was instantiated as an object, then `await session_service.add_tokens(...)` was called. But `add_tokens()` is a `@staticmethod` (synchronous, not async), so `await` was incorrect.  
**Fix:** Changed to `SessionService.add_tokens(session_id, total_tokens)` — direct static call without `await`.

---

### B7 — Deprecated `.dict()` and `datetime.utcnow()`
**File:** `app/services/evaluation_service.py`  
**Severity:** 🟡 Warning  
**Issue:** Used `evaluation.dict()` (deprecated in Pydantic v2, replaced by `.model_dump()`) and `datetime.utcnow()` (deprecated in Python 3.12+).  
**Fix:** Changed to `evaluation.model_dump(by_alias=False)` and `datetime.now(timezone.utc)`.

---

### B8 — Schema Field Placement + Deprecated datetime
**File:** `app/schemas/evaluation_schema.py`  
**Severity:** 🟠 High  
**Issue:** 
1. `details` field was placed **after** the `Config` inner class in `EvaluationResponse`, which in Pydantic can cause the field to be silently ignored.
2. `datetime.utcnow` used as default factory (deprecated).  
**Fix:** Moved `details` field before `Config` class. Replaced `datetime.utcnow` with `lambda: datetime.now(timezone.utc)` in both `PillarScore` and `EvaluationResult`.

---

### B9 — Deprecated `datetime.utcnow()` in JWT
**File:** `app/utils/jwt_utils.py`  
**Severity:** 🟡 Warning  
**Issue:** `datetime.utcnow()` is deprecated in Python 3.12+.  
**Fix:** Changed to `datetime.now(timezone.utc)`.

---

## 🟡 Frontend Fixes (5)

### F1 — Timer Creates Infinite Intervals
**File:** `interview_with_ai_frontend/src/pages/GuidePage.jsx`  
**Severity:** 🔴 Critical  
**Issue:** The timer `useEffect` had `[timeRemaining]` as its dependency. Since `setTimeRemaining()` changes `timeRemaining` every second, the effect re-runs every second — creating a **new interval each second** without clearing the old one. This causes the timer to accelerate exponentially.  
**Fix:** Added a `timerStartedRef = useRef(false)` guard. The effect now only creates the interval once (when `timeRemaining` transitions from `null` to a number), and the guard prevents re-creation on subsequent changes.

---

### F2 — Stale `navigate` in useCallback
**File:** `interview_with_ai_frontend/src/pages/GuidePage.jsx`  
**Severity:** 🟡 Warning  
**Issue:** `endSession` `useCallback` used `navigate()` but `navigate` wasn't in the dependency array. This could cause stale closure bugs.  
**Fix:** Added `navigate` to the `useCallback` dependency array: `[sessionId, code, navigate]`.

---

### F3 — Duplicate Event Logging (PROMPT & RESPONSE)
**File:** `interview_with_ai_frontend/src/components/ChatPanel.jsx`  
**Severity:** 🟠 High  
**Issue:** `ChatPanel.jsx` was sending `PROMPT` and `RESPONSE` events via `sendEvent()`, but `chat_service.py` on the backend **also logs these same events**. This caused duplicate entries in the Interaction Trace Φ, corrupting evaluation data (double-counting prompts/responses).  
**Fix:** Removed the frontend event logging calls, keeping only the backend logging (which is more reliable and captures additional metadata).

---

### F4 — Python Indentation Error in Starter Code
**File:** `interview_with_ai_frontend/src/components/CodeEditor.jsx`  
**Severity:** 🔴 Critical  
**Issue:** The `STARTER_CODE` template had inconsistent Python indentation — `__init__` used 4 spaces but `add_book` and `get_overdue_loans` used 2 spaces. This would cause an `IndentationError` when the candidate tries to run the code.  
**Fix:** Corrected all method definitions and bodies to use consistent 4-space indentation (PEP 8 standard).

---

### F5 — Incorrect Test Fallback Logic
**File:** `interview_with_ai_frontend/src/components/TestPanel.jsx`  
**Severity:** 🟠 High  
**Issue:** The fallback condition `!results || results.output_log?.includes("failed")` would trigger a backend test execution even when Pyodide succeeded but tests had failures (since "failed" naturally appears in test output). This caused unnecessary backend calls and potentially confusing double results.  
**Fix:** Changed condition to `!results` — only falls back to backend when Pyodide completely fails to produce results.

---

## 🔵 CSS Fixes (3)

### C1 — Duplicate CSS Rule
**File:** `interview_with_ai_frontend/src/pages/GuidePage.css`  
**Severity:** 🟡 Warning  
**Issue:** `.code-editor-container` was defined twice (lines ~364 and ~652). The second definition overrode properties from the first, making the code harder to maintain and debug.  
**Fix:** Merged both rules into a single definition with all properties (`height`, `display`, `flex-direction`, `background`, `flex`, `min-height`).

---

### C2 — Spin Animation on Entire Loading Container
**File:** `interview_with_ai_frontend/src/pages/GuidePage.css`  
**Severity:** 🟡 Warning  
**Issue:** `.pyodide-loading` had `animation: spin 1s linear infinite`, which rotated the **entire container** (including the text "Initializing test engine..."). Only the icon emoji should spin.  
**Fix:** Removed the `animation` property from `.pyodide-loading`.

---

### C3 — Conflicting `@keyframes` Names
**File:** `interview_with_ai_frontend/src/pages/GuidePage.css`  
**Severity:** 🟡 Warning  
**Issue:** `@keyframes spin` was defined in both `GuidePage.css` and `CandidateOnboarding.css`. Since CSS keyframes are global, these could conflict.  
**Fix:** Renamed to `@keyframes guideSpin` in `GuidePage.css` to avoid namespace collisions.

---

## Summary

| Category | Count | Critical | High | Warning |
|----------|-------|----------|------|---------|
| Backend  | 9     | 3        | 3    | 3       |
| Frontend | 5     | 2        | 2    | 1       |
| CSS      | 3     | 0        | 0    | 3       |
| **Total**| **17**| **5**    | **5**| **7**   |
