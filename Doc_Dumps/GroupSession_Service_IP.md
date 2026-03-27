# Group Session Service — Implementation Plan (Checklist)

## Scope
- [x] Enable hiring managers to create bulk session groups with group name, template, duration, start/end window (India/Chennai time), CSV (Name, Gmail), per-row validation, dry-run confirmation, and email invites.
- [x] Enforce link validity outside window (not-yet-started / expired messaging for candidates).
- [x] Filter results dashboard by group hire; surface group metadata in rankings/detail.

## Backend (API, Models, Services)
- [x] Schemas: extend session schema with `group_id`, `group_name`, `project_template`, `start_at`, `end_at`, `candidate_email`; add `BulkSessionCreateRequest/Response` and per-candidate result shape; default timezone handling (store as ISO, assume input is Asia/Kolkata or include tz offset).
- [x] Sessions collection: persist window fields and group metadata per session; optionally add `session_groups` collection for summary (group name, created_at, counts, creator email, window, template).
- [x] Service: refactor `create_session` to accept candidate + window + template + group; add `create_sessions_bulk` to loop candidates, generate `group_id` (group_<ts>_<rand>), return per-row status; cap rows at 20.
- [x] Validation: require group_name, start_at < end_at, end_at in future, duration bounds, project template required, email format, no duplicate emails/names, row limit enforced; support dry-run mode that performs validation only (no DB insert, no email).
- [x] Window enforcement: in `get_session`/`start_session`, reject with 403 + reason if now < start_at (not started) or now > end_at (expired); include start/end in response for UI messaging.
- [x] Email service: create invite sender using env creds; template includes candidate name, group name, project template, duration, start/end (Asia/Kolkata), link, and warning about validity window; on failure, record error in response.
- [x] Routes: add `POST /api/sessions/bulk-create` with dry-run flag; update existing responses to include group info/window; add `GET /api/session-groups` (list recent groups + counts) and support `group_id` filter on rankings/stats/trends endpoints.
- [x] Results data: ensure rankings/stat endpoints include `group_id`, `group_name` in rows; detail endpoint returns group/window fields for display.

## Frontend (Creation UX)
- [x] Dashboard: change Manage Sessions card/action to "Group Sessions" and route to new Group Sessions screen/modal.
- [x] Group Sessions UI: fields for group name, duration select, project template select, start/end datetime pickers (default to now/+X), CSV upload (Name, Gmail), row count guard (<=20), duplicate/email validation, and summary of errors.
- [x] Dry run: "Validate" button hits bulk endpoint with dry_run=true, shows per-row validation results without sending mail or creating sessions; enable "Confirm & Send" only after valid.
- [x] Submit: call bulk-create, show per-row status (sent/failed, link), allow copy/download CSV of generated links; toast for partial failures.
- [x] Candidate gating: session page should display friendly "Not started yet" / "Expired" states using 403 response detail; show start/end window in local time.

## Frontend (Results Filtering)
- [x] Add group filter bar on results overview: dropdown/autocomplete from `GET /api/session-groups`; allow manual entry if needed; show active filter chip with clear/reset.
- [x] Wire filter to `getDashboardStats`, `getSessionRankings`, `getScoreTrends` (pass group_id/group_name); update service calls accordingly.
- [x] Rankings table: display group name chip per row; clicking row still opens session detail.
- [x] Session detail: show group name and window; respect candidate/hiring-manager flows.

## Validation & Limits
- [x] CSV format: columns Name, Gmail required; reject missing/extra columns; validate emails; dedupe; limit 20 rows; return structured errors per row.
- [x] Datetime: require start_at/end_at; enforce end > start; end not in past; convert to UTC server-side but display/send as Asia/Kolkata in emails.

## Testing & QA
- [x] Backend unit tests: bulk-create validation (row cap, duplicate, bad dates), dry-run vs send, window enforcement on start/get, email failure reporting; integration for filtered rankings/stats.
- [ ] Frontend tests: CSV parser/validator, date validation, dry-run flow state, API wiring for filters, not-started/expired UI states.
- [ ] Manual checks: create valid group (<=20 rows) and confirm emails/logs; dry-run shows errors; links blocked before start/after end; results filter shows only that group; chip reset restores all.

## Ops & Config
- [x] Add env vars for email provider (e.g., SENDGRID_KEY / SMTP creds) and default frontend base URL for invite links; document timezone assumption (Asia/Kolkata).
- [x] Migration/backfill: existing sessions get null group fields; UI should handle absent group gracefully.

## Open Questions (resolved)
- [x] Dry-run validate-only: yes, required before send.
- [x] CSV row limit: 20.
- [x] Timezone in emails: India/Chennai (Asia/Kolkata).
