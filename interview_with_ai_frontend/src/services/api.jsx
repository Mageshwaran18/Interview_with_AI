import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // FastAPI backend
});

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

/*
Why create axios instance?

- Centralized baseURL
- Reusable API configuration
- Cleaner architecture
*/