# PHASE 2 QUICK REFERENCE
**Fast lookup guide for Phase 2 components**

---

## 📦 What's New

### Backend Files (6 Created + 3 Modified)

| File | Type | Purpose |
|------|------|---------|
| `event_schema.py` | NEW | Event validation models |
| `event_service.py` | NEW | Event logging logic |
| `event_routes.py` | NEW | Event API endpoints |
| `test_service.py` | NEW | Test execution engine |
| `test_routes.py` | NEW | Test API endpoint |
| `library_tests.py` | NEW | Pre-written test suite |
| `database.py` | MOD | Added events_collection |
| `chat_service.py` | MOD | Logs PROMPT + RESPONSE |
| `main.py` | MOD | Registered new routers |

### Frontend Components (1 Created + 3 Modified)

| File | Type | Purpose |
|------|------|---------|
| `CodeEditor.jsx` | MOD | Debounced diff capture |
| `TestPanel.jsx` | NEW | Test execution UI |
| `GuidePage.jsx` | MOD | Timer + session events |
| `api.jsx` | MOD | Event & test functions |

---

## 🚀 API Endpoints

### POST /api/events
Log any event to Interaction Trace Φ
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{"session_id": "...", "event_type": "CODE_SAVE", "payload": {...}}'
```

### GET /api/events/{session_id}
Retrieve all events for a session
```bash
curl http://localhost:8000/api/events/session_12345
```

### POST /api/run-tests
Execute candidate code against test suite
```bash
curl -X POST http://localhost:8000/api/run-tests \
  -H "Content-Type: application/json" \
  -d '{"session_id": "...", "code": "class Library: ..."}'
```

---

## 📊 Event Types (6)

| Event | When | Source |
|-------|------|--------|
| SESSION_START | Candidate begins | GuidePage mount |
| SESSION_END | Candidate ends | Submit or timeout |
| PROMPT | Candidate asks AI | ChatPanel |
| RESPONSE | AI responds | Gemini API |
| CODE_SAVE | Code changes (every 3s) | CodeEditor |
| TEST_RUN | Tests executed | TestPanel |

---

## 💾 Database

**Collection:** `events_collection`
- ✅ Append-only (no updates/deletes)
- ✅ ~20-60 KB per session
- ✅ 23-45 events per session
- ✅ Indexed on (session_id, timestamp)

---

## 🎯 Key Features

### CodeEditor (NEW FEATURE)
- Debounced (3s) code change detection
- Computes unified diffs
- Sends CODE_SAVE events automatically

### TestPanel (NEW COMPONENT)
- "Run Tests" button
- Shows pass/fail counts
- Collapsible output log

### GuidePage (ENHANCED)
- 60-minute countdown timer
- SESSION_START event on mount
- SESSION_END event on submit/timeout
- Auto-submit at 0:00

---

## 📈 Usage Examples

### Querying Events

```python
# Get all events for a session
db.events.find({"session_id": "session_12345"})

# Get only CODE_SAVE events
db.events.find({"session_id": "session_12345", "event_type": "CODE_SAVE"})

# Count test runs
db.events.count_documents({"session_id": "session_12345", "event_type": "TEST_RUN"})

# Get prompts and responses
db.events.find({
    "session_id": "session_12345",
    "event_type": {"$in": ["PROMPT", "RESPONSE"]}
})
```

### Calling Endpoints

```javascript
// Log a code save event
await sendEvent(sessionId, "CODE_SAVE", {
  filename: "main.py",
  diff_text: "@@ ...",
  lines_added: 5,
  lines_removed: 0,
  full_snapshot: "class Library: ..."
});

// Run tests
const result = await runTests(sessionId, code);
// Returns: {tests_total, tests_passed, tests_failed, output_log}
```

---

## 🔍 Monitoring

### Check Event Count
```bash
mongosh
use interview_with_ai
db.events.count()  # Total events across all sessions
db.events.count_documents({session_id: "session_12345"})  # Per session
```

### View Recent Events
```javascript
db.events.find({session_id: "session_12345"}).sort({timestamp: -1}).limit(5)
```

### Aggregate Event Types
```javascript
db.events.aggregate([
  {$match: {session_id: "session_12345"}},
  {$group: {_id: "$event_type", count: {$sum: 1}}}
])
```

---

## ⚙️ Configuration

### Environment (.env)
```
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=interview_with_ai
GEMINI_API_KEY=your_key_here
```

### Frontend Ports
- Local: `http://localhost:5174/guide`
- Swagger API: `http://localhost:8000/docs`

---

## 📋 Verification

### Quick Test Checklist
- [ ] Backend starts: `uvicorn app.main:app --reload`
- [ ] Frontend starts: `npm run dev`
- [ ] Open http://localhost:5174/guide
- [ ] Timer visible in top bar
- [ ] Edit code → wait 3s → CODE_SAVE logged
- [ ] Click "Run Tests" → results displayed
- [ ] Check MongoDB: `db.events.count()`

---

## 🚀 Next Steps

### For Phase 3
1. Read events from events_collection
2. Filter by event_type
3. Apply eval algorithms
4. Compute 5 GUIDE pillars
5. Return scores JSON

### Commands
```bash
# View all events for a session
curl http://localhost:8000/api/events/session_12345

# Monitor test runs
db.events.find({event_type: "TEST_RUN"})

# Check session timeline
db.events.find({session_id: "session_12345"}).sort({timestamp: 1})
```

---

## 📚 Documentation

- **GUIDE.MD** — Main guide (Phase 1 + 2)
- **PHASE_2_IMPLEMENTATION_SUMMARY.md** — Technical details
- **PHASE_2_VERIFICATION_REPORT.md** — QA results
- **PHASE_2_COMPLETION_REPORT.md** — Executive summary

---

## ✅ Status

**Phase 2: COMPLETE ✅**

All components implemented, verified, and documented.
Ready for Phase 3 Evaluation Engine.
