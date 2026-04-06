# Quick Fix: SESSION_START Event Logging Error

## TL;DR - The Problem

The `log_event()` function is **async** but contains only **synchronous MongoDB code**. This async/sync mismatch causes the error when `start_session()` tries to log the event.

**Error:** `There is no current event loop in thread 'AnyIO worker thread'`

**Cause:** Async function called from sync context with blocking I/O operations

**Fix:** Remove the `async` keyword from `log_event()` - make it purely synchronous.

---

## The Fix (2 Files to Change)

### File 1: `app/services/event_service.py`

**Find this:**

```python
async def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    """
    Appends a single event to the Interaction Trace Φ.
    
    This is the CORE function of the instrumentation layer.
    Every significant action during a session flows through here.
    
    Args:
        session_id: Which session this event belongs to
        event_type: PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END
        payload: Event-specific data (differs per event type)
    
    Returns:
        dict with the event_id (MongoDB ObjectId as string)
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
```

**Replace with:**

```python
def log_event(session_id: str, event_type: str, payload: dict) -> dict:
    """
    Appends a single event to the Interaction Trace Φ.
    This is a SYNCHRONOUS function - performs blocking MongoDB insert.
    
    This is the CORE function of the instrumentation layer.
    Every significant action during a session flows through here.
    
    Args:
        session_id: Which session this event belongs to
        event_type: PROMPT, RESPONSE, CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END
        payload: Event-specific data (differs per event type)
    
    Returns:
        dict with the event_id (MongoDB ObjectId as string)
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
```

**Changes:**
- ❌ Remove: `async` keyword from function definition
- ✅ Add: Comment noting this is synchronous

---

### File 2: `app/services/session_service.py`

**Find this code (around line 256-277 in `start_session()` method):**

```python
        from app.services.event_service import log_event
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": doc["time_limit_minutes"],
                    },
                ))
            else:
                loop.run_until_complete(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": doc["time_limit_minutes"],
                    },
                ))
        except Exception as e:
            print(f"Warning: Failed to log SESSION_START event: {e}")
```

**Replace with:**

```python
        from app.services.event_service import log_event
        try:
            log_event(
                session_id=request.session_id,
                event_type="SESSION_START",
                payload={
                    "candidate_name": request.candidate_name,
                    "time_limit_minutes": doc["time_limit_minutes"],
                },
            )
        except Exception as e:
            print(f"Warning: Failed to log SESSION_START event: {e}")
```

**Changes:**
- ❌ Remove: All the `asyncio.get_event_loop()` logic
- ❌ Remove: `asyncio.ensure_future()` and `loop.run_until_complete()` 
- ✅ Keep: Simple synchronous function call
- ✅ Keep: Exception handling

---

## Verification Checklist

After making these changes:

- [ ] File `event_service.py` has `def log_event(...)` (no `async`)
- [ ] File `session_service.py` `start_session()` method calls `log_event()` directly (no event loop logic)
- [ ] No `asyncio` import needed in the event logging section
- [ ] When you start a session, no "Warning: Failed to log SESSION_START event" message should appear
- [ ] Check MongoDB `events_collection` - SESSION_START event should be created

---

## Test It

1. **Start the backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Create a session** (via API or UI)

3. **Start the session** (click "Start Interview" as candidate)

4. **Check the logs:**
   - Should NOT see: `Warning: Failed to log SESSION_START event`
   - Should see success message if logging enabled

5. **Verify in MongoDB:**
   ```bash
   db.events.find({"event_type": "SESSION_START"})
   ```
   Should see the event document

---

## Why This Works

| Before | After |
|--------|-------|
| ❌ `async def log_event()` + blocking `insert_one()` = **Async/sync mismatch** | ✅ `def log_event()` + blocking `insert_one()` = **Sync/sync match** |
| ❌ Event loop tries to manage blocking I/O | ✅ No event loop involved |
| ❌ Worker thread has no event loop to use | ✅ Runs in regular sync context |
| ❌ Error: "No current event loop in thread" | ✅ No error - normal operation |

---

## Additional Fixes (If Needed)

If you have similar patterns elsewhere, check for:

1. **In `chat_service.py`** - search for `await log_event()`
   ```python
   # ❌ BEFORE
   await log_event(session_id, "PROMPT", {...})
   
   # ✅ AFTER
   log_event(session_id, "PROMPT", {...})  # Remove await
   ```

2. **In `test_service.py`** - search for `await log_event()`
   ```python
   # ❌ BEFORE
   await log_event(session_id, "TEST_RUN", {...})
   
   # ✅ AFTER
   log_event(session_id, "TEST_RUN", {...})  # Remove await
   ```

3. Update docstrings in those files to note the change (from async to sync)

---

## Summary

| Step | File | Change | Reason |
|------|------|--------|--------|
| 1 | `event_service.py` | Remove `async` from `log_event()` | Function only does sync work |
| 2 | `session_service.py` | Replace complex event loop code with simple direct call | No async/sync mismatch |
| 3 | Other files | Remove `await` from `log_event()` calls | Function is now synchronous |
| 4 | Test | Verify SESSION_START event is logged without errors | Confirm fix works |

