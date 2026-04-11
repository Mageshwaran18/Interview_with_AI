# Interview With AI - System and File Reference

Project: Interview With AI (GUIDE)
Updated: April 11, 2026
Purpose: Practical architecture and file map aligned with the current workspace

---

## 1. System Overview

Interview With AI evaluates how candidates solve coding tasks with AI support. The platform captures session events, runs GUIDE-based evaluation, and provides hiring-facing analytics.

Current major capabilities:
- Candidate coding interface with Monaco editor and AI chat
- Session lifecycle and group session workflows
- Event trace logging for all key interactions
- GUIDE evaluation pipeline (G, U, I, D, E)
- Dashboard and ranking views for hiring managers
- Chat policy enforcement (time lock, cooldown, escalation)

---

## 2. Runtime Architecture

Frontend (React + Vite)
- Candidate pages: onboarding, coding, chat, test run feedback
- Hiring pages: session creation, group sessions, rankings, detailed results

Backend (FastAPI)
- REST routes under auth and api namespaces
- Service layer for business logic
- Evaluation modules for GUIDE scoring

Database (MongoDB)
- User/session/event/evaluation/chat logs and support collections

External integrations
- Google Gemini for assistant responses and evaluation judge flows
- SMTP email delivery for invitations and notifications

---

## 3. Core Data Collections

Main collections used by the backend:
- users_collection
- sessions_collection
- chat_logs_collection
- events_collection
- evaluations_collection
- judge_cache_collection
- token_budgets_collection

Notes:
- events_collection is append-only in design intent and powers evaluation analytics.
- sessions_collection is the source of lifecycle state and interview windows.

---

## 4. Backend Structure (Current)

Root backend package: app

Top-level files:
- app/main.py: FastAPI app bootstrap and router registration
- app/config.py: environment-driven settings
- app/database.py: Mongo connection and collection handles

Subfolders:

1) app/routes
- auth_routes.py
- chat_routes.py
- dashboard_routes.py
- evaluation_routes.py
- event_routes.py
- session_routes.py
- test_routes.py

2) app/services
- auth_service.py
- chat_policy_service.py
- chat_service.py
- dashboard_service.py
- email_service.py
- evaluation_service.py
- event_service.py
- session_service.py
- test_service.py

3) app/evaluation
- llm_judge.py
- minimum_effort_validator.py
- pillar_g.py
- pillar_u.py
- pillar_i.py
- pillar_d.py
- pillar_e.py
- test_evaluation_pipeline.py

4) app/schemas
- user_schema.py
- chat_schema.py
- dashboard_schema.py
- evaluation_schema.py
- event_schema.py
- session_schema.py

5) app/dependencies
- auth_dependency.py

6) app/utils
- hash_utils.py
- jwt_utils.py
- retry_utils.py

7) app/tests
- library_tests.py
- test_e2e_phase5.py
- test_group_session.py

---

## 5. Frontend Structure (Current)

Frontend root: interview_with_ai_frontend

Important top-level files:
- package.json
- vite.config.js
- eslint.config.js
- index.html

Source root: interview_with_ai_frontend/src

1) src/pages
- CandidateOnboarding.jsx/.css
- GuidePage.jsx/.css
- GroupSessionsPage.jsx/.css
- HiringManagerDashboard.jsx/.css
- Dashboard.jsx/.css
- ResultsDashboard.jsx/.css
- Signin.jsx/.css
- Signup.jsx/.css
- ShapeDemo.jsx/.css

2) src/components
- ChatPanel.jsx/.css
- CodeEditor.jsx
- TaskSidebar.jsx
- TestPanel.jsx
- TokenBudgetIndicator.jsx/.css
- ScoreRadarChart.jsx
- ScoreTrendChart.jsx
- ScoreBreakdown.jsx
- SessionRankingTable.jsx
- PillarDetailModal.jsx
- Additional visual/animation components (backgrounds, cards, loaders, buttons)

3) src/services
- api.jsx
- PyodideExecutor.js
- testSuite.js

4) src/utils
- feedbackGenerator.js

5) src root
- App.jsx
- App.css
- main.jsx
- index.css

---

## 6. Workspace-Level Structure (Current)

Top-level folders:
- app
- interview_with_ai_frontend
- Doc_Dumps
- README's
- Tasks_Action_plans
- IAI
- .vscode

Top-level project docs/configs:
- COMPREHENSIVE_PROJECT_DOCUMENTATION.md
- System_and_File.md
- GUIDE.MD
- Doc.MD
- requirements.txt
- pytest.ini
- pyrightconfig.json
- answer_code.md
- email.csv

---

## 7. Recent Architectural Updates Reflected Here

This reference includes updates visible in current codebase state:

1) Chat policy layer introduced
- New service: app/services/chat_policy_service.py
- Route enforcement and frontend lock/cooldown handling are now part of chat flow.

2) Evaluation stability hardening
- Safer score coercion and partial-evaluation handling updates in evaluation modules and service orchestration.
- Duplicate evaluation trigger safeguards in evaluation workflow.

3) Documentation relocation in progress
- Several historical docs are now represented in Doc_Dumps.

---

## 8. Primary Request Flows

A) Candidate chat flow
1. Frontend sends prompt to chat route.
2. Chat policy checks lock, cooldown, and direct-solution violation rules.
3. Allowed request reaches AI service.
4. Response and usage metadata are logged.

B) Test and evaluate flow
1. Candidate submits code for tests.
2. Test service runs suite and logs test run event.
3. Evaluation route/service computes GUIDE pillars.
4. Results are stored and surfaced in dashboard pages.

C) Group session flow
1. Hiring manager configures template, duration, and window.
2. CSV upload provides candidate list.
3. Dry-run validation then confirm/send.
4. Session links and statuses are tracked for dashboard use.

---

## 9. Maintenance Notes

- Keep this file synchronized with COMPREHENSIVE_PROJECT_DOCUMENTATION.md after major changes.
- Prefer Doc_Dumps for archival notes and one-off implementation logs.
- If API contracts change, update both route list and frontend service mapping in this file.
