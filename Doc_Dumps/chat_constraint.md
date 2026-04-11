# Chat Constraints Implementation Checklist

## Objective
- [ ] Enforce controlled AI assistance for candidates without allowing full-solution bypass.
- [ ] Keep support useful for debugging, syntax help, small snippets, and library guidance.

## Required Rules
- [x] Candidate cannot use AI chat for first 5 minutes after session starts.
- [x] Candidate can send only 1 chat message per minute.
- [ ] If candidate requests direct/full solution:
- [x] First violation: warning only.
- [x] Second violation: warning + stricter notice.
- [x] Third violation: end session and start evaluation.
- [ ] AI can help with errors, syntax, small snippets, and inbuilt/library usage examples.
- [x] AI must refuse complete function/code dump requests.

## File-Level Implementation Plan

### Backend: Schemas
- [ ] Update `app/schemas/chat_schema.py`
- [ ] Add optional policy/metadata fields if needed for future-proofing (server remains source of truth).
- [ ] Define structured error response payload pattern for blocked chat.

### Backend: Chat Policy Service
- [x] Create `app/services/chat_policy_service.py`
- [x] Implement time-lock check (first 5 minutes).
- [x] Implement cooldown check (60 seconds per message).
- [x] Implement direct-solution request detection (rules + patterns).
- [x] Implement violation escalation logic (1st/2nd warning, 3rd terminate).
- [x] Return machine-readable decision object for route layer.

### Backend: Chat Route Enforcement
- [x] Update `app/routes/chat_routes.py`
- [x] Enforce policy checks before calling AI.
- [x] Return `423` for initial lock with remaining seconds.
- [x] Return `429` for cooldown with remaining seconds.
- [x] Return `403` for policy warning blocks.
- [x] On 3rd violation, terminate session and trigger evaluation pipeline.

### Backend: Chat Service Guardrails
- [x] Update `app/services/chat_service.py`
- [x] Move strict assistant constraints to server-side system prompt.
- [ ] Allow only coaching-style support (debug/syntax/library/small snippets).
- [ ] Disallow full end-to-end task/function solutions.
- [x] Add post-response safety shaping if response violates policy.

### Backend: Session State + Persistence
- [x] Update `app/services/session_service.py`
- [x] Initialize chat policy state when session starts:
- [x] `chat_enabled_at` (started_at + 5 minutes)
- [x] `last_chat_at`
- [x] `violation_count`
- [x] `cooldown_seconds` (=60)
- [ ] Ensure session end reason supports policy termination (e.g., `policy_violation_limit`).

### Backend: Event Logging
- [ ] Use `app/services/event_service.py` to log policy actions.
- [ ] Log events:
- [x] `CHAT_REQUEST`
- [x] `CHAT_BLOCKED_LOCK`
- [x] `CHAT_BLOCKED_RATE_LIMIT`
- [x] `CHAT_POLICY_WARNING`
- [x] `CHAT_POLICY_TERMINATED`
- [x] `CHAT_ALLOWED`

### Frontend: API Layer
- [x] Update `interview_with_ai_frontend/src/services/api.jsx`
- [ ] Handle blocked chat response codes (`423`, `429`, `403`) and payloads.

### Frontend: Chat Panel UX
- [x] Update `interview_with_ai_frontend/src/components/ChatPanel.jsx`
- [x] Disable input during first-5-minute lock.
- [x] Show countdown timer for unlock.
- [x] Disable input during 1-minute cooldown after each message.
- [x] Show cooldown remaining time.
- [x] Render warning messages for policy violations.
- [x] On termination response, lock chat and show session ended notice.

## Policy Detection Rules
- [ ] Add keyword/regex checks for direct-solution intent, e.g.:
- [ ] "give complete solution"
- [ ] "write full function"
- [ ] "paste final code"
- [ ] "give all functions"
- [ ] "return only code"
- [ ] Keep false positives low by requiring threshold/combination matches.

## API Contract (Recommended)
- [ ] Standardize blocked response payload keys:
- [ ] `code` (`CHAT_LOCKED`, `CHAT_RATE_LIMIT`, `CHAT_POLICY_WARNING`, `CHAT_POLICY_TERMINATED`)
- [ ] `message`
- [ ] `wait_seconds` (for lock/cooldown)
- [ ] `violation_count`
- [ ] `session_state`

## Testing Checklist

### Backend Unit Tests
- [ ] Lock active before 5 minutes => blocked.
- [ ] Lock expires at 5 minutes => allowed.
- [ ] Cooldown active within 60 seconds => blocked.
- [ ] Cooldown expired after 60 seconds => allowed.
- [ ] Violation escalation 1st/2nd => warning.
- [ ] Violation escalation 3rd => session terminated.

### Backend Integration Tests
- [ ] `POST /api/chat` returns expected codes and payloads for lock/cooldown/policy.
- [ ] Policy termination triggers evaluation kickoff.

### Frontend QA
- [ ] Chat input disabled correctly during initial lock.
- [ ] Chat input disabled correctly during cooldown.
- [ ] Warning messages display correctly.
- [ ] Session termination state reflected immediately in UI.

## Rollout Plan
- [ ] Phase 1: Backend enforcement only (non-bypassable).
- [ ] Phase 2: Frontend UX countdowns and messaging.
- [ ] Phase 3: Detection tuning and false-positive reduction.
- [ ] Phase 4: Analytics and dashboard reporting.

## Done Criteria
- [ ] First 5-minute chat lock works from session start.
- [ ] 1-message-per-minute cooldown enforced.
- [ ] 3-strike direct-solution policy enforced with auto-termination at strike 3.
- [ ] AI still supports allowed guidance scope.
- [ ] Policy actions are auditable via events.
- [ ] Manual API calls cannot bypass constraints.
