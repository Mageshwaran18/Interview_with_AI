# 🐛 GUIDE — Complete Error & Bug Report

**Generated:** March 20, 2026  
**Scope:** Full codebase audit — CSS, Logic, UX, Backend, Component errors  
**Status:** Errors identified only — NOT fixed

---

## Table of Contents

1. [CSS & Styling Errors](#1-css--styling-errors)
2. [Layout & Overflow Errors (Unwanted Scrollbars)](#2-layout--overflow-errors-unwanted-scrollbars)
3. [Logical Errors & Bugs](#3-logical-errors--bugs)
4. [Missing Error Handling](#4-missing-error-handling)
5. [Component Failure Risks](#5-component-failure-risks)
6. [Accessibility & UX Violations](#6-accessibility--ux-violations)
7. [Backend Errors](#7-backend-errors)
8. [Security Concerns](#8-security-concerns)

---

## 1. CSS & Styling Errors

### 1.1 Triple `#root` CSS Conflict
- **Files:** `index.css` (L32-39), `App.css` (L1-13), `GuidePage.css` (L6-12)
- **Problem:** `#root` is styled in THREE different places with conflicting rules:
  - `index.css`: `height: 100vh`, `display: flex`, `flex-direction: column`
  - `App.css`: `height: 100%`, `display: flex` (via `#root > div`)
  - `GuidePage.css`: `height: 100vh`, `width: 100vw`, `display: flex` (NO `flex-direction`)
- **Impact:** Global layout conflicts. GuidePage.css overrides `#root` for ALL pages (Signin, Signup, Dashboard, Results, etc.) because CSS isn't scoped. This can cause Signin/Signup/Dashboard pages to display incorrectly.

### 1.2 Leftover Vite Template CSS in `App.css`
- **File:** `App.css` (L15-49)
- **Problem:** Contains unused Vite boilerplate styles (`.logo`, `.logo:hover`, `@keyframes logo-spin`, `.card`, `.read-the-docs`) that serve no purpose in the project.
- **Impact:** Dead CSS code; no functional effect but pollutes the codebase.

### 1.3 Duplicate `@keyframes` Names Across Files
- **Files:** `GuidePage.css` has `fadeIn` (L451), `CandidateOnboarding.css` has `fadeIn` (L92), `HiringManagerDashboard.css` has `fadeIn` (L89), `ResultsDashboard.css` has `fadeSlideDown` and `spin` (L632, L720), `CandidateOnboarding.css` has `spin` (L35)
- **Problem:** Multiple `@keyframes fadeIn` and `@keyframes spin` definitions across globally-loaded CSS files. Whichever loads last will override the others.
- **Impact:** Animations may behave unexpectedly depending on CSS load order.

### 1.4 `.submit-btn` CSS Conflict Between GuidePage.css and HiringManagerDashboard.css
- **Files:** `GuidePage.css` (L625-653), `HiringManagerDashboard.css` (L221-234)
- **Problem:** Both files define `.submit-btn` with different styles. The GuidePage version has gradient green background with specific padding, while the HiringManagerDashboard version has different padding and flex behavior.
- **Impact:** The submit button in the "Create Session" modal may inherit GuidePage styles if that CSS is loaded, or vice versa.

### 1.5 `.view-results-btn` CSS Conflict
- **Files:** `GuidePage.css` (L790-806), `HiringManagerDashboard.css` (L380-388)
- **Problem:** Both define `.view-results-btn` with totally different styles (gradient vs transparent background).
- **Impact:** Whichever CSS loads last wins, causing inconsistent button appearance.

### 1.6 `.form-group` CSS Conflict
- **Files:** `CandidateOnboarding.css` (L259-263), `HiringManagerDashboard.css` (L153-155)
- **Problem:** Both define `.form-group` with different margin/gap settings.
- **Impact:** Form spacing may be inconsistent across pages.

### 1.7 Missing CSS for `TokenBudgetIndicator`
- **File:** `TokenBudgetIndicator.jsx`
- **Problem:** The component uses classes like `token-budget-indicator`, `token-bar-container`, etc. These styles exist in `GuidePage.css` (L812-913), meaning they are NOT self-contained and only work when GuidePage CSS is loaded.
- **Impact:** If `TokenBudgetIndicator` is used outside GuidePage, it will be completely unstyled.

### 1.8 No CSS File for `Dashboard.jsx`
- **File:** `Dashboard.jsx`
- **Problem:** Uses entirely inline styles with no dedicated CSS file. All styles are hardcoded in JSX with `style={{...}}` objects.
- **Impact:** Inconsistent styling approach, harder to maintain, no hover state management (uses onMouseOver/onMouseOut inline JS for hover effects which is fragile).

### 1.9 No CSS File for `Signin.jsx` and `Signup.jsx`
- **Files:** `Signin.jsx`, `Signup.jsx`
- **Problem:** Entirely inline styles. Form inputs have hardcoded light-theme borders (`border: '1px solid #ccc'`) which clash with the dark background.
- **Impact:** Input fields appear with light gray borders on a dark form, creating poor contrast and inconsistent look.

### 1.10 `GuidePage.css` Missing `flex-direction` on `#root`
- **File:** `GuidePage.css` (L6-12)
- **Problem:** `#root` is set to `display: flex` without `flex-direction`, defaulting to `row`. But `index.css` sets it to `flex-direction: column`. Since GuidePage.css loads later, it removes the column direction.
- **Impact:** On the GuidePage, layout breaks because children now lay out horizontally instead of vertically.

### 1.11 Light Mode Media Query in `index.css` Conflicts with Dark Theme
- **File:** `index.css` (L74-85)
- **Problem:** Contains `@media (prefers-color-scheme: light)` that changes `:root` background to white and button background to `#f9f9f9`. The entire app is designed as dark theme, so this media query would break the UI for users with light mode OS settings.
- **Impact:** Users with system light mode see white backgrounds, light buttons — completely breaking the dark theme design.

---

## 2. Layout & Overflow Errors (Unwanted Scrollbars)

### 2.1 `100vw` Causes Horizontal Scrollbar
- **File:** `GuidePage.css` (L8)
- **Problem:** `#root { width: 100vw }` — `100vw` includes the vertical scrollbar width on Windows/Linux. This causes the content to be wider than the viewport, producing an **unwanted horizontal scrollbar**.
- **Impact:** Horizontal scrollbar appears at the bottom on pages using GuidePage CSS.

### 2.2 `min-height: 100vh` + `height: 100%` Conflict on `.guide-page`
- **File:** `GuidePage.css` (L15-25)
- **Problem:** `.guide-page` has both `height: 100%` AND `min-height: 100vh`. Since `#root` has `height: 100vh`, the `height: 100%` makes it 100vh, but `min-height: 100vh` could cause overflow if content grows.
- **Impact:** Combined with `overflow: hidden`, any content overflow is silently clipped instead of being properly handled.

### 2.3 HiringManagerDashboard Has No `overflow` Control
- **File:** `HiringManagerDashboard.css` (L5-11)
- **Problem:** `.hiring-manager-dashboard` uses `min-height: 100vh` with `padding: 40px 20px` but no `overflow-x: hidden`. The table inside can overflow horizontally.
- **Impact:** Horizontal scrollbar may appear when viewing sessions with long data. The `overflowX: auto` on the table wrapper doesn't prevent the page-level scrollbar.

### 2.4 `ResultsDashboard` Missing `overflow-y` on Main Container  
- **File:** `ResultsDashboard.css` (L7-19)
- **Problem:** `.results-dashboard` has `overflow-x: hidden` but no `overflow-y: auto`. With `min-height: 100vh` and many sessions, the content may push past the viewport.
- **Impact:** On pages with lots of rankings, vertical scrolling may not work smoothly and an unwanted vertical scrollbar may appear from `body`.

### 2.5 CandidateOnboarding Vertical Overflow
- **File:** `CandidateOnboarding.css` (L5-15)
- **Problem:** `.candidate-onboarding` has `min-height: 100vh` and `overflow-y: auto`, but on small screens the content (welcome section + task description + form + tips) easily exceeds viewport height.
- **Impact:** Two scrollbars — one from the container and another from the body — can appear simultaneously.

### 2.6 Dashboard Page No Horizontal Overflow Prevention
- **File:** `Dashboard.jsx`
- **Problem:** The inline-styled container has no `overflow-x: hidden`. On very small viewports, the horizontally-laid buttons can overflow.
- **Impact:** Horizontal scrollbar on mobile-sized screens.

### 2.7 Monaco Editor Height Calculation Issue
- **File:** `CodeEditor.jsx` (L171)
- **Problem:** Editor height is `calc(100% - 40px)` (accounting for the header). But if the parent `.code-editor-container` doesn't have a properly resolved height (e.g., from flex layout), the `calc()` may resolve to 0.
- **Impact:** Monaco editor may render with 0 height in certain layout configurations.

---

## 3. Logical Errors & Bugs

### 3.1 `useEffect` Dependencies Warning in `TaskSidebar.jsx`
- **File:** `TaskSidebar.jsx` (L129-156)
- **Problem:** The `useEffect` that auto-updates `subItemsChecked` references `subItemsChecked` inside the effect but it's NOT listed in the dependency array (only `[code]` is listed). React ESLint rule `react-hooks/exhaustive-deps` would flag this.
- **Impact:** The auto-detection checkbox update uses a stale `subItemsChecked` snapshot. Could lead to checkboxes losing manually-toggled state.

### 3.2 `useEffect` Missing Dependency in `CandidateOnboarding.jsx`
- **File:** `CandidateOnboarding.jsx` (L33-35)
- **Problem:** `useEffect` depends on `session_id` but calls `fetchSessionDetails()` which is defined outside the effect without being in the deps array. React will warn about this.
- **Impact:** If `fetchSessionDetails` changes identity (e.g., uses closures over state), the effect may not re-run correctly.

### 3.3 Timer `useEffect` Dependency Bug in `GuidePage.jsx`
- **File:** `GuidePage.jsx` (L155-190)
- **Problem:** The timer setup `useEffect` has `[timeRemaining]` as dependency. Every time `setTimeRemaining` updates the state, this effect re-runs. The guard `if (timerRef.current !== null) return;` prevents duplicate intervals, but the effect teardown/re-setup is unnecessary overhead on every second.
- **Impact:** React invokes the cleanup and re-runs the effect every second, causing unnecessary re-renders and potential timer drift.

### 3.4 Race Condition in `endSession` — Double Submit
- **File:** `GuidePage.jsx` (L106-146)
- **Problem:** When the timer expires, `endSessionRef.current("timer_expired")` is called. But the "Submit" button also calls `endSession("submitted")`. If a user clicks Submit at exactly the moment the timer reaches 0, both can fire. The `sessionActiveRef` guard should prevent this, but there's a tiny window for a race condition with the `setInterval` callback.
- **Impact:** Potential double API call to `/api/sessions/{id}/end`.

### 3.5 `endSession` Does Not Read `final_code` from Request Body
- **File:** `session_routes.py` (L90-123)
- **Problem:** The `end_session` route accepts `final_code` as a **query parameter** (`Optional[str] = None`), but the frontend sends it as a **JSON body** (`{ final_code: codeRef.current }`). FastAPI won't populate the `final_code` parameter from the body.
- **Impact:** `final_code` will ALWAYS be `None` on the backend. The candidate's final code is never saved.

### 3.6 Missing `import` for CSS in `main.jsx`
- **File:** `main.jsx`
- **Problem:** No import of `index.css` or `App.css` in `main.jsx`. The CSS must be imported somewhere to take effect. If Vite handles this via index.html, it works, but the standard pattern is to import CSS in `main.jsx`.
- **Impact:** Global styles may not load depending on build configuration.

### 3.7 `fetchSessionDetails` Missing `loading` Initialization
- **File:** `CandidateOnboarding.jsx` (L27, L37-51)
- **Problem:** `loading` state is initialized to `false` (L27), but the function `fetchSessionDetails` sets `setLoading(false)` at the end. There's no `setLoading(true)` at the start of `fetchSessionDetails`, so the loading state never becomes `true` during fetch.
- **Impact:** The loading spinner (L114-122) will never show because `loading` is always `false` and the condition `if (!session)` is relied on instead. Works by accident, but the `loading` state is dead code.

### 3.8 `asyncio.create_task` Used in Non-Async Context Warning
- **File:** `session_routes.py` (L115)
- **Problem:** `asyncio.create_task(run_evaluation(session_id))` is called inside `async def end_session()`, but `run_evaluation` needs to be a coroutine for this to work. If it's a regular function, this will raise a TypeError.
- **Impact:** If `run_evaluation` is not async, the entire evaluation auto-trigger silently fails.

### 3.9 `GuidePage` Navigates to `/` on Error with No Auth Context
- **File:** `GuidePage.jsx` (L86)
- **Problem:** On session load error, it auto-redirects to `/` (Signin page) after 3 seconds. But this should go to `/dashboard` if the user is already logged in, not back to signin.
- **Impact:** Authenticated users get sent to the login page after a session error.

### 3.10 `Dashboard.jsx` "Start GUIDE Session" Links to Deprecated `/guide` Route
- **File:** `Dashboard.jsx` (L61)
- **Problem:** The "Start GUIDE Session" button navigates to `/guide` (without a session_id). In GuidePage.jsx (L90-95), if no `urlSessionId` is provided, it sets an error "No session ID provided". This means clicking the button from Dashboard will always show an error.
- **Impact:** The main CTA button on the Dashboard page is broken — it always shows "No session ID provided" error.

### 3.11 Hardcoded `localhost:8000` URLs Throughout Frontend
- **Files:** `GuidePage.jsx` (L59, L121), `CandidateOnboarding.jsx` (L40, L73), `HiringManagerDashboard.jsx` (L64, L84, L126), `TestPanel.jsx` (L84), `TokenBudgetIndicator.jsx` (L34)
- **Problem:** Direct `axios.get("http://localhost:8000/...")` calls bypass the centralized `api.jsx` Axios instance. The api.jsx has `baseURL: "http://127.0.0.1:8000"` while some components use `http://localhost:8000`.
- **Impact:** (1) If the backend is on a different host/port, you need to update every file individually. (2) Mixed `localhost` vs `127.0.0.1` may cause CORS issues in some browsers.

### 3.12 Seeded Bug in Starter Code (Intentional but Confusing)
- **File:** `CodeEditor.jsx` (L57)
- **Problem:** The starter code template has an off-by-one bug (`> 14` instead of `>= 14`) that's labeled as "BUG" in a comment. This is intentional for testing, but the comment makes it obvious to the candidate.
- **Impact:** The comment reveals the seeded bug, undermining the bug-detection evaluation metric (BDR).

### 3.13 `chat_service.py` Logs to Wrong Collection
- **File:** `chat_service.py` (L148)
- **Problem:** `sessions_collection.insert_one(interaction_log)` — chat interactions are being logged to the `sessions` collection (meant for session metadata) instead of a dedicated `chat_logs` or `interactions` collection.
- **Impact:** The sessions collection gets polluted with individual chat messages, mixing session metadata with interaction logs.

### 3.14 `model` Mismatch in `chat_service.py`
- **File:** `chat_service.py` (L16) vs `ChatPanel.jsx` (L141)
- **Problem:** Backend uses `gemini-2.5-flash` model, but the frontend displays "Gemini 2.0 Flash" to the user.
- **Impact:** The displayed AI model name doesn't match the actual model being used.

---

## 4. Missing Error Handling

### 4.1 Signin/Signup — `alert()` for Error Messages
- **Files:** `Signin.jsx` (L25), `Signup.jsx` (L20)
- **Problem:** Uses `alert()` for login/signup failures. This is browser-native, blocks the UI thread, and provides a poor user experience.
- **Impact:** Jarring error display; no inline error messages near the form fields.

### 4.2 HiringManagerDashboard — `alert()` Everywhere
- **File:** `HiringManagerDashboard.jsx` (L101, L104, L112, L133, L136)
- **Problem:** Uses `alert()` for success messages, error messages, and clipboard copy confirmation. Five different `alert()` calls in one component.
- **Impact:** Extremely poor UX with blocking modal dialogs.

### 4.3 `ChatPanel` — `confirm()` for Clear Chat
- **File:** `ChatPanel.jsx` (L129)
- **Problem:** Uses browser-native `confirm()` dialog for clear chat confirmation.
- **Impact:** Inconsistent UX; no styled confirmation dialog.

### 4.4 No Network Error Handling in `api.jsx`
- **File:** `api.jsx`
- **Problem:** The Axios instance has no response interceptors. If the backend returns a 401 (token expired), the user isn't automatically logged out or shown a session-expired message.
- **Impact:** Expired JWT tokens result in silent 401 errors with no user feedback.

### 4.5 Missing Error Boundary on Critical Routes
- **File:** `App.jsx` (L14-16, L42-43)
- **Problem:** `Dashboard`, `Signin`, `Signup`, `ResultsDashboard`, and `HiringManagerDashboard` are NOT wrapped in `ErrorBoundary`. Only `GuidePage` and `CandidateOnboarding` are.
- **Impact:** Unhandled React errors on Dashboard, Results, or HiringManager pages will crash the entire app with a white screen.

### 4.6 `config.py` — No Validation for Missing Environment Variables
- **File:** `config.py` (L6-13)
- **Problem:** `MONGO_URL`, `DATABASE_NAME`, `SECRET_KEY`, `GEMINI_API_KEY` can all be `None` if the `.env` file is missing or incomplete. No validation or error message is raised.
- **Impact:** App starts but crashes later with cryptic errors (e.g., `MongoClient(None)` or `genai.configure(api_key=None)`).

### 4.7 `database.py` — No Connection Error Handling at Module Level
- **File:** `database.py` (L6)
- **Problem:** `MongoClient(settings.MONGO_URL)` is called at module import time with no try/except. If MongoDB is not running, the entire app fails to import.
- **Impact:** Crashes on startup with no helpful error message about MongoDB being unreachable.

### 4.8 `health_check` Returns 200 Even on Failure
- **File:** `main.py` (L86-95)
- **Problem:** The `/health` endpoint returns HTTP 200 with `{"status": "unhealthy"}` when the database is disconnected. Health check endpoints should return a non-200 status code (e.g., 503) on failure.
- **Impact:** Load balancers and monitoring tools that rely on HTTP status codes will think the app is healthy when it's not.

### 4.9 `GuidePage` — No Confirmation Before Submit
- **File:** `GuidePage.jsx` (L303)
- **Problem:** Clicking "Submit" immediately ends the session with no confirmation dialog. There's no "Are you sure?" prompt before ending the session permanently.
- **Impact:** Accidental clicks permanently end the coding session.

---

## 5. Component Failure Risks

### 5.1 `Particles.jsx` — Canvas Performance on Low-End Devices
- **File:** `Particles.jsx`, `Signin.jsx` (L32-42), `Signup.jsx` (L27-37)
- **Problem:** 200 particles are rendered on both Signin and Signup pages. The canvas animation runs continuously with no throttling or visibility check.
- **Impact:** High CPU/GPU usage on low-end devices; pages may stutter.

### 5.2 `ElectricBorder.jsx` — No Error Boundary Inside Component
- **File:** `ElectricBorder.jsx`
- **Problem:** If the canvas context fails or throws an error, the entire Signin/Signup page crashes with no fallback.
- **Impact:** Users cannot sign in if WebGL/Canvas is unsupported.

### 5.3 `PyodideExecutor` — 15-Second Timeout May Be Too Short
- **File:** `TestPanel.jsx` (L40)
- **Problem:** Pyodide initialization has a 15-second timeout. On slow networks or cold starts, loading the ~10MB Pyodide WASM bundle can take longer.
- **Impact:** Tests always fallback to backend on slow connections, defeating the purpose of client-side execution.

### 5.4 `ScoreTrendChart` Uses `window.innerWidth` Directly
- **File:** `ResultsDashboard.jsx` (L532)
- **Problem:** `width={Math.min(window.innerWidth - 80, 900)}` — this is computed once at render time and never updated on window resize.
- **Impact:** The chart doesn't resize responsively; on browser resize, the chart stays at its initial width.

### 5.5 `HiringManagerDashboard` — 5-Second Polling Interval
- **File:** `HiringManagerDashboard.jsx` (L58)
- **Problem:** `setInterval(fetchSessions, 5000)` — polling the backend every 5 seconds. This is aggressive and will strain the backend under load.
- **Impact:** High server load from continuous polling; potential performance issues with many concurrent hiring managers.

### 5.6 `TokenBudgetIndicator` — Silently Swallows Errors
- **File:** `TokenBudgetIndicator.jsx` (L38-44)
- **Problem:** The catch block sets `setError(null)` instead of displaying the error. If the `/budget` endpoint doesn't exist or returns an error, the component shows nothing.
- **Impact:** Token budget is silently invisible even when the feature is supposed to work; no way for users to know it's broken.

---

## 6. Accessibility & UX Violations

### 6.1 `<p>` Tag Used as Clickable Button (Signin/Signup)
- **Files:** `Signin.jsx` (L107-130), `Signup.jsx` (L102-125)
- **Problem:** A `<p>` element is used with `onClick` for navigation ("Create one now ✨" and "Sign in instead 🚀"). `<p>` is not focusable by keyboard and has no semantic button/link role.
- **Impact:** Not keyboard-accessible; screen readers don't announce it as interactive.

### 6.2 Missing `aria-label` on Icon-Only Buttons
- **Files:** `GuidePage.jsx` (L284-290, L321-327), `ChatPanel.jsx` (L143-166)
- **Problem:** Panel toggle buttons contain only Unicode arrows (◀ ▶) and the clear chat button is just 🗑️ with no `aria-label`.
- **Impact:** Screen readers announce these as empty or meaningless buttons.

### 6.3 No Password Confirmation Field on Signup
- **File:** `Signup.jsx`
- **Problem:** The signup form only has email and password fields. There's no "confirm password" field to catch typos.
- **Impact:** Users can accidentally mistype their password with no way to verify.

### 6.4 No Password Strength Indicator
- **Files:** `Signin.jsx`, `Signup.jsx`
- **Problem:** No minimum password length validation on the frontend. Users can submit empty or single-character passwords.
- **Impact:** Weak password acceptance (backend might validate, but no frontend feedback).

### 6.5 `using index as key` in ChatPanel Message List
- **File:** `ChatPanel.jsx` (L176)
- **Problem:** `key={index}` — using array index as React key for message list. If messages are reordered or deleted, this can cause incorrect rendering.
- **Impact:** React may not properly reconcile message components, leading to stale or duplicated messages in edge cases.

### 6.6 No Responsive Design for GuidePage Three-Panel Layout
- **File:** `GuidePage.css`, `GuidePage.jsx`
- **Problem:** The three-panel grid (`280px 1fr 350px`) has no responsive media queries. On tablets or small screens, the panels are squeezed or overflow.
- **Impact:** GuidePage is unusable on screens smaller than ~960px wide.

### 6.7 `Signin.jsx` / `Signup.jsx` Input Width Not Controlled
- **Files:** `Signin.jsx` (L55-61, L65-71), `Signup.jsx` (L50-56, L60-66)
- **Problem:** Input elements have no `width` or `display: block` style. They render at their default intrinsic width, which may be narrower than expected.
- **Impact:** Form inputs appear as small, narrow fields that don't fill the form container.

---

## 7. Backend Errors

### 7.1 `start_session` Route Ignores `session_id` from URL Path
- **File:** `session_routes.py` (L72-86)
- **Problem:** The route accepts `session_id` as a path parameter, but `SessionService.start_session(request)` only uses the request body (which contains `session_id` from the onboarding form). The path `session_id` is never used.
- **Impact:** URL parameter mismatch — if the body `session_id` differs from the URL, the wrong session is started.

### 7.2 `chat_service.py` Mixes Sync and Async Code
- **File:** `chat_service.py` (L72, L148)
- **Problem:** `chat_with_ai` is `async def`, but `sessions_collection.insert_one()` (L148) is a synchronous PyMongo call. PyMongo doesn't support async operations natively.
- **Impact:** The synchronous DB call blocks the async event loop, reducing server throughput under load.

### 7.3 `retry_with_backoff` May Not Handle Async Correctly
- **File:** `chat_service.py` (L99-107)
- **Problem:** An inner async function `gemini_call()` is defined and passed to `retry_with_backoff()`. But `model.generate_content(prompt)` (L100) is a synchronous Google API call being wrapped in an async function.
- **Impact:** The retry utility may not properly await the synchronous call, or it may work by accident depending on implementation.

### 7.4 No Rate Limiting on Any Endpoint
- **Files:** All route files
- **Problem:** No rate limiting middleware is configured. Any endpoint can be called unlimited times.
- **Impact:** Vulnerable to brute-force attacks on `/auth/signin`, API abuse on `/api/chat`, and DoS attacks.

### 7.5 JWT Token Not Validated on Protected Routes
- **File:** `Dashboard.jsx` (L17-24), `api.jsx`
- **Problem:** The Dashboard manually calls `getCurrentUser(token)` to validate the token, but no other page (GuidePage, ResultsDashboard, HiringManagerDashboard) checks authentication. The backend routes for sessions, chat, events, evaluation, and dashboard don't use `Depends(get_current_user)`.
- **Impact:** All API endpoints except `/auth/me` are publicly accessible without authentication.

### 7.6 `end_session` Accepts Final Code as Query Parameter
- **File:** `session_routes.py` (L94)
- **Problem:** `final_code: Optional[str] = None` is defined as a regular function parameter (not `Body()` or `Query()`), so FastAPI may try to parse it as a query parameter. The frontend sends it as JSON body.
- **Impact:** Final code is never received by the backend (see also 3.5).

---

## 8. Security Concerns

### 8.1 JWT Token Stored in `localStorage`
- **File:** `Signin.jsx` (L20)
- **Problem:** JWT token is stored in `localStorage`. This makes it accessible to any JavaScript on the page, including XSS attacks.
- **Impact:** XSS vulnerability can lead to token theft and session hijacking.

### 8.2 No CSRF Protection
- **File:** `main.py`
- **Problem:** No CSRF middleware is added. While CORS is configured, CORS alone doesn't prevent CSRF attacks from same-origin scripts.
- **Impact:** Cross-site request forgery attacks could be performed.

### 8.3 Sensitive Information in Error Responses
- **Files:** `session_routes.py` (L53, L86, L123), multiple route files
- **Problem:** `raise HTTPException(status_code=500, detail=str(e))` — raw Python exception messages are sent to the client in error responses.
- **Impact:** Internal implementation details (file paths, database errors, stack traces) can be leaked to attackers.

### 8.4 No Input Sanitization on Chat Prompts
- **File:** `chat_service.py`
- **Problem:** User prompts are sent directly to Gemini API and stored in MongoDB without any sanitization or length limits.
- **Impact:** Potential prompt injection attacks or MongoDB injection via crafted inputs.

### 8.5 `navigator.clipboard.writeText` Without Permissions Check
- **File:** `HiringManagerDashboard.jsx` (L111)
- **Problem:** `navigator.clipboard.writeText(text)` is called without checking if the Clipboard API is available or handling the promise rejection.
- **Impact:** On browsers that don't support the Clipboard API or when permissions are denied, this silently fails.

---

## Summary

| Category | Count |
|----------|-------|
| CSS & Styling Errors | 11 |
| Layout & Overflow Errors | 7 |
| Logical Errors & Bugs | 14 |
| Missing Error Handling | 9 |
| Component Failure Risks | 6 |
| Accessibility & UX Violations | 7 |
| Backend Errors | 6 |
| Security Concerns | 5 |
| **Total** | **65** |
