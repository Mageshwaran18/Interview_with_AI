import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // FastAPI backend
});

// ─── Response Interceptor for Error Handling ───
// Handle 401 (Unauthorized) - token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      sessionStorage.clear();
      // Redirect to signin
      window.location.href = "/";
      console.warn("Session expired. Please sign in again.");
    }
    return Promise.reject(error);
  }
);

// Signup API
export const signupUser = (data) => {
  return api.post("/auth/signup", data);
};

// Signin API
export const signinUser = (data) => {
  return api.post("/auth/signin", data);
};

// Protected route
export const getCurrentUser = (token) => {
  return api.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// ─── Phase 1: AI Chat API ───
// Sends a message to the backend LLM proxy → Google Gemini
export const sendChatMessage = (sessionId, prompt) => {
  return api.post("/api/chat", {
    session_id: sessionId,
    prompt: prompt,
  });
};

// ─── Phase 2: Event Logging API ───
// Logs any event to the Interaction Trace Φ
// Events: CODE_SAVE, TEST_RUN, SESSION_START, SESSION_END
export const sendEvent = (sessionId, eventType, payload) => {
  return api.post("/api/events", {
    session_id: sessionId,
    event_type: eventType,
    payload: payload,
  });
};

// ─── Phase 2: Test Execution API ───
// Sends candidate code to be tested against the pre-written test suite
export const runTests = (sessionId, code) => {
  return api.post("/api/run-tests", {
    session_id: sessionId,
    code: code,
  });
};

// ─── Phase 4: Dashboard API ───
// Get aggregate statistics across all evaluated sessions
export const getDashboardStats = (groupId = null) => {
  const params = groupId ? `?group_id=${groupId}` : "";
  return api.get(`/api/dashboard/stats${params}`);
};

// Get ranked sessions with sorting and optional group filter
export const getSessionRankings = (limit = 50, sortBy = "composite_q_score", order = "desc", groupId = null) => {
  let url = `/api/dashboard/rankings?limit=${limit}&sort_by=${sortBy}&order=${order}`;
  if (groupId) url += `&group_id=${groupId}`;
  return api.get(url);
};

// Get detailed evaluation for a specific session
export const getSessionDetail = (sessionId) => {
  return api.get(`/api/dashboard/session/${sessionId}`);
};

// Get score trend data for chart visualization
export const getScoreTrends = (limit = 20, groupId = null) => {
  let url = `/api/dashboard/trends?limit=${limit}`;
  if (groupId) url += `&group_id=${groupId}`;
  return api.get(url);
};

// ─── Group Sessions API ───
// Bulk create sessions (dry_run=true for validation, false for real)
export const bulkCreateSessions = (payload, dryRun = false) => {
  return api.post(`/api/sessions/bulk-create?dry_run=${dryRun}`, payload);
};

// List session groups for the results filter dropdown
export const getSessionGroups = () => {
  return api.get("/api/session-groups");
};

// Trigger evaluation pipeline for a session
export const triggerEvaluation = (sessionId) => {
  return api.post(`/api/evaluate/${sessionId}`);
};

export default api;

/*
Why create axios instance?

- Centralized baseURL
- Reusable API configuration
- Cleaner architecture
*/