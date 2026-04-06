# Error Analysis: SESSION_START Event Logging Issue

## The Error Message
```
Warning: Failed to log SESSION_START event: There is no current event loop in thread 'AnyIO worker thread'.
```

---

## Root Cause Analysis

### What's Happening

The error occurs in `app/services/session_service.py` in the `start_session()` method when it tries to log the `SESSION_START` event.

**The Problem:**

```python
# In session_service.py, line 256-277
from app.services.event_service import log_event

try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.ensure_future(log_event(...))  # ❌ Async function
    else:
        loop.run_until_complete(log_event(...))
except Exception as e:
    print(f"Warning: Failed to log SESSION_START event: {e}")
```

**In event_service.py, line 21:**

```python
async def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    """Async function, but..."""
    event_doc = {...}
    result = events_collection.insert_one(event_doc)  # ❌ Blocking I/O operation!
    return {...}
```

### The Mismatch

There's a **fundamental architectural mismatch**:

1. **`start_session()` is synchronous** (no `async` keyword)
   - Called from a FastAPI route handler
   - Executes in a request thread

2. **`log_event()` is async** (has `async` keyword)
   - But contains **only synchronous MongoDB operations**
   - No actual await calls (no real async work)

3. **The attempt to handle this**:
   - Code checks if an event loop is running
   - If yes: Uses `asyncio.ensure_future()` to schedule the coroutine
   - If no: Uses `loop.run_until_complete()` to run it

4. **Where it breaks**:
   - When `asyncio.ensure_future()` is called, Python schedules `log_event()` on the event loop
   - The event loop tries to run `log_event()` in an AnyIO worker thread
   - Inside `log_event()`, the MongoDB operation `insert_one()` is a **blocking I/O call**
   - This blocking call in an AnyIO worker thread → **No event loop available in that thread**
   - Error: "There is no current event loop in thread 'AnyIO worker thread'"

---

## Visual Diagram

```
FastAPI Route Handler (async)
    ↓
Calls: start_session() [SYNC function]
    ↓
Tries: asyncio.ensure_future(log_event(...)) [ASYNC function]
    ↓
Python schedules log_event() on the event loop
    ↓
Event loop starts executing log_event() in AnyIO worker thread
    ↓
log_event() executes:
    result = events_collection.insert_one(...)  [BLOCKING I/O]
    ↓
Worker thread tries to run blocking operation
    ↓
❌ ERROR: "No current event loop in thread 'AnyIO worker thread'"

Why? Because:
- AsyncIO worker threads DON'T have event loops
- Blocking I/O calls CAN'T run in threads without an event loop
- We're trying to mix async/sync incorrectly
```

---

## The Core Problem: Async/Sync Mismatch

### Current Architecture (❌ BROKEN)

```
start_session()
    ├─ SYNC function
    ├─ Calls MongoDB.update_one() [SYNC, blocking OK here]
    └─ Tries to call log_event() [ASYNC, but no real async work]
        └─ Inside log_event():
            └─ Calls events_collection.insert_one() [SYNC, blocking]
                └─ ❌ Fails because async context expects no blocking calls
```

### Why This Fails

| Operation | Type | Where It Runs | Works? |
|-----------|------|---------------|--------|
| `update_one()` in start_session | Blocking | Sync function ✓ | ✅ YES |
| `insert_one()` in log_event | Blocking | Async function but in worker thread ✗ | ❌ NO |

---

## Solution

### Option 1: Make `log_event()` Synchronous (SIMPLEST) ✅ RECOMMENDED

**Why:** The function doesn't actually do any async operations. It just inserts a document synchronously.

```python
# app/services/event_service.py

# ❌ BEFORE
async def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    event_doc = {...}
    result = events_collection.insert_one(event_doc)  # Sync operation
    return {...}

# ✅ AFTER
def log_event(session_id: str, event_type: str, payload: dict) -> dict:  # Remove 'async'
    """
    Appends a single event to the Interaction Trace Φ.
    This is a SYNCHRONOUS function that performs a blocking MongoDB insert.
    """
    event_doc = {
        "session_id": session_id,
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc),
        "payload": payload,
    }
    
    result = events_collection.insert_one(event_doc)
    
    return {
        "event_id": str(result.inserted_id),
        "event_type": event_type,
        "timestamp": event_doc["timestamp"].isoformat(),
    }


async def get_session_events(session_id: str, event_type: str = None) -> list:
    # Keep this async if used from async contexts
    query = {"session_id": session_id}
    if event_type:
        query["event_type"] = event_type
    
    events = list(
        events_collection.find(query).sort("timestamp", 1)
    )
    
    for event in events:
        event["_id"] = str(event["_id"])
    
    return events
```

**Then simplify the call in session_routes.py:**

```python
# app/services/session_service.py

# ❌ BEFORE (complicated event loop handling)
from app.services.event_service import log_event
try:
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.ensure_future(log_event(...))
    else:
        loop.run_until_complete(log_event(...))
except Exception as e:
    print(f"Warning: Failed to log SESSION_START event: {e}")

# ✅ AFTER (simple sync call)
from app.services.event_service import log_event
try:
    log_event(
        session_id=request.session_id,
        event_type="SESSION_START",
        payload={
            "candidate_name": request.candidate_name,
            "time_limit_minutes": doc["time_limit_minutes"],
        }
    )
except Exception as e:
    print(f"Warning: Failed to log SESSION_START event: {e}")
```

**Pros:**
- ✅ Simple and clean
- ✅ No event loop complexity
- ✅ All MongoDB operations run in the same sync context
- ✅ Works from both sync and async functions

**Cons:**
- None for this use case

---

### Option 2: Make `start_session()` Async

**Why:** All operations properly async, no mixing sync/async.

```python
@staticmethod
async def start_session(request: SessionOnboardingRequest) -> SessionResponse:  # async
    # ... existing code ...
    
    # Now we can properly await the log_event
    from app.services.event_service import log_event
    try:
        await log_event(
            session_id=request.session_id,
            event_type="SESSION_START",
            payload={
                "candidate_name": request.candidate_name,
                "time_limit_minutes": doc["time_limit_minutes"],
            }
        )
    except Exception as e:
        print(f"Warning: Failed to log SESSION_START event: {e}")
    
    return SessionService.get_session(request.session_id)
```

**Route handler also becomes async:**

```python
@router_sessions.post("/{session_id}/start", response_model=SessionResponse)
async def start_session_handler(request: SessionOnboardingRequest):
    return await SessionService.start_session(request)
```

**Pros:**
- ✅ Proper async/await pattern
- ✅ No blocking calls in event loop

**Cons:**
- ❌ Requires more changes throughout codebase
- ❌ But still has an issue: MongoDB insert is still blocking in async context

---

### Option 3: Use Thread Pool Executor (Most Robust, but Overkill)

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=5)

async def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    """Run blocking MongoDB operation in thread pool."""
    event_doc = {
        "session_id": session_id,
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc),
        "payload": payload,
    }
    
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        executor,
        lambda: events_collection.insert_one(event_doc)
    )
    
    return {
        "event_id": str(result.inserted_id),
        "event_type": event_type,
        "timestamp": event_doc["timestamp"].isoformat(),
    }
```

**Pros:**
- ✅ Proper async handling of blocking I/O
- ✅ No blocking the event loop

**Cons:**
- ❌ Adds complexity
- ❌ Thread pool overhead
- ❌ For MongoDB operations (~1-5ms), overhead not worth it

---

## Recommendation

**Use Option 1: Make `log_event()` Synchronous**

### Why?

1. **Simplicity**: The function only does synchronous work
2. **Correctness**: MongoDB operations are inherently blocking; no reason to pretend they're async
3. **Performance**: Removes unnecessary async/await overhead
4. **Clarity**: Code intent is clear - this is a sync I/O operation

### Implementation Steps

1. Remove `async` keyword from `log_event()` in `app/services/event_service.py`
2. Simplify the call in `app/services/session_service.py` (in `start_session()` method)
3. Update documentation to note that event logging is synchronous
4. Test by running a session and verifying SESSION_START event is logged

---

## Additional Notes

### Why Does the Code Have This Issue?

The code attempted to be "clever" by trying to handle both async and sync contexts:

```python
loop = asyncio.get_event_loop()
if loop.is_running():
    asyncio.ensure_future(log_event(...))  # Schedule on running loop
else:
    loop.run_until_complete(log_event(...))  # Run in thread
```

This pattern **doesn't work** because:
- If loop is running (most common in FastAPI): `ensure_future()` schedules the coroutine
- The coroutine runs in an eventloop worker, which can't handle blocking calls
- If loop not running: `run_until_complete()` also fails because it also can't handle blocking ops

### The Correct Principle

- **Async/await** is for **non-blocking I/O** (network, file I/O with async libraries)
- **MongoDB with PyMongo** is **blocking I/O** (synchronous)
- Therefore, MongoDB calls should stay **synchronous**
- If you need async MongoDB access, use **Motor** (async wrapper for PyMongo)

---

## Summary

| Aspect | Current (❌ Broken) | Fix (✅ Recommended) |
|--------|-------------------|----------------------|
| Function | `async def log_event()` | `def log_event()` |
| Internal call | `events_collection.insert_one()` | `events_collection.insert_one()` |
| Caller (`start_session`) | Sync with complex loop handling | Sync with simple direct call |
| Error | Event loop missing in worker thread | No error - runs in sync context |
| Complexity | High (event loop logic) | Low (just call function) |

