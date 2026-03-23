import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import StarfieldBackground from "../components/StarfieldBackground";
import "./CandidateOnboarding.css";

/*
 ─── CandidateOnboarding Component (Phase 5) ───
 
 📚 What this does:
 When a candidate receives a session link and visits the page:
 1. Fetches the session details to verify it exists
 2. Shows the session info (time limit, task description)
 3. Asks for candidate's name
 4. Transitions to `/guide/{session_id}` (GuidePage) when started
 
 🧠 What you'll learn:
 - URL parameters with useParams
 - Form submission and validation
 - Session state transitions (CREATED → IN_PROGRESS)
 - Navigation between pages
*/

function CandidateOnboarding() {
  const { session_id } = useParams();
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  // Fetch session details on component mount
  useEffect(() => {
    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/api/sessions/${session_id}`
        );
        setSession(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setSessionError(
          "Session not found. Check your invite link and try again."
        );
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [session_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!candidateName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (candidateName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend to start the session
      const response = await api.post(
        `/api/sessions/${session_id}/start`,
        {
          session_id: session_id,
          candidate_name: candidateName.trim(),
        }
      );

      // Update session state locally
      setSession(response.data);

      // Redirect to GuidePage
      // The session_id is already in the URL, so GuidePage can access it via params
      navigate(`/guide/${session_id}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError(
        err.response?.data?.detail ||
        "Failed to start session. Please try again."
      );
      setLoading(false);
    }
  };

  if (sessionError) {
    return (
      <div className="candidate-onboarding">
        <StarfieldBackground />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h1>Session Not Found</h1>
          <p>{sessionError}</p>
          <button
            className="go-back-btn"
            onClick={() => navigate("/")}
          >
            ← Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="candidate-onboarding">
        <StarfieldBackground />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-onboarding">
      <StarfieldBackground />
      {/* Welcome Section */}
      <div className="onboarding-container">
        <div className="welcome-section">
          <div className="welcome-header">
            <span className="welcome-icon">🎯</span>
            <h1>Welcome to GUIDE</h1>
            <p className="welcome-subtitle">
              AI Collaboration Evaluation Service
            </p>
          </div>

          <div className="session-info">
            <div className="info-box">
              <span className="info-icon">⏱️</span>
              <div className="info-content">
                <span className="info-label">Session Duration</span>
                <span className="info-value">
                  {session.time_limit_minutes} minutes
                </span>
              </div>
            </div>

            <div className="info-box">
              <span className="info-icon">📋</span>
              <div className="info-content">
                <span className="info-label">Task</span>
                <span className="info-value">
                  Library Management System
                </span>
              </div>
            </div>

            <div className="info-box">
              <span className="info-icon">🤖</span>
              <div className="info-content">
                <span className="info-label">AI Assistant</span>
                <span className="info-value">Available for help</span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="task-description">
          <h2>📚 What You'll Build</h2>
          <div className="task-content">
            <p>
              You'll implement a <strong>Library Management System</strong> using Python.
              The system should support:
            </p>
            <ul>
              <li>📚 Book Management (add, update, delete, list)</li>
              <li>👥 Member Management (registration, updates)</li>
              <li>🔄 Loan Tracking (checkout, return, borrow limits)</li>
              <li>🔍 Search Functionality (by title, author)</li>
              <li>⏰ Overdue Detection (track overdue books)</li>
              <li>⚠️ Error Handling (meaningful error messages)</li>
            </ul>
            <p className="task-note">
              💡 <strong>Hint:</strong> You can ask the AI for help anytime!
              Ask specific questions about implementation details for better results.
            </p>
          </div>
        </div>

        {/* Name Entry Form */}
        <div className="name-form-section">
          <h2>Let's Get Started! 👋</h2>
          <form onSubmit={handleSubmit} className="name-form">
            <div className="form-group">
              <label htmlFor="name">Enter Your Name</label>
              <input
                type="text"
                id="name"
                placeholder="John Doe"
                value={candidateName}
                onChange={(e) => {
                  setCandidateName(e.target.value);
                  setError(null);
                }}
                disabled={loading}
                autoFocus
              />
              {error && <span className="form-error">{error}</span>}
            </div>

            <div className="form-info">
              <p>
                ✅ Once you click "Start Session", the timer will begin.
              </p>
              <p>
                📌 Make sure your browser stays focused on this window.
              </p>
            </div>

            <button
              type="submit"
              className="start-session-btn"
              disabled={loading}
            >
              {loading ? "Starting..." : "🚀 Start Session"}
            </button>
          </form>
        </div>

        {/* Helpful Tips */}
        <div className="tips-section">
          <h3>💡 Pro Tips</h3>
          <div className="tips-grid">
            <div className="tip">
              <span className="tip-icon">🎯</span>
              <p>
                <strong>Read Requirements First:</strong>
                Start by understanding all 6 requirements in the left panel.
              </p>
            </div>
            <div className="tip">
              <span className="tip-icon">🧪</span>
              <p>
                <strong>Run Tests Often:</strong>
                Test your code frequently to catch bugs early.
              </p>
            </div>
            <div className="tip">
              <span className="tip-icon">🤔</span>
              <p>
                <strong>Ask Specific Questions:</strong>
                The better your prompt, the better the AI's response.
              </p>
            </div>
            <div className="tip">
              <span className="tip-icon">📍</span>
              <p>
                <strong>Plan Your Approach:</strong>
                Spend a few minutes thinking about the task structure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateOnboarding;
