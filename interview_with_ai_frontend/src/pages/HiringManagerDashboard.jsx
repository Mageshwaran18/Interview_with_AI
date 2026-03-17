import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HiringManagerDashboard.css";

/*
 ─── HiringManagerDashboard Component (Phase 5) ───
 
 📚 What this does:
 Displays a dashboard for hiring managers to:
 - Create new sessions for candidates
 - View all existing sessions
 - Track session statuses (CREATED, IN_PROGRESS, COMPLETED, EVALUATED)
 - Copy invite links to share with candidates
 
 🧠 What you'll learn:
 - Fetching data from backend
 - Creating resources via POST
 - Displaying lists dynamically
 - Datetime formatting
 - Modal for creating new sessions
*/

function HiringManagerDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [creatingSession, setCreatingSession] = useState(false);

  // Fetch all sessions on component mount
  useEffect(() => {
    fetchSessions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/sessions");
      setSessions(response.data.sessions);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setError("Failed to load sessions");
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreatingSession(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/sessions/create",
        {
          time_limit_minutes: parseInt(timeLimitMinutes),
        }
      );

      // Add new session to list
      setSessions([response.data, ...sessions]);
      setShowCreateModal(false);
      setTimeLimitMinutes(60);

      // Show success message (you can use a toast library for better UX)
      alert(`Session created! Share this link: ${response.data.invite_link}`);
    } catch (err) {
      console.error("Failed to create session:", err);
      alert("Failed to create session");
    } finally {
      setCreatingSession(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Invite link copied to clipboard!");
  };

  const getStatusBadgeColor = (state) => {
    switch (state) {
      case "CREATED":
        return "status-badge status-created";
      case "IN_PROGRESS":
        return "status-badge status-in-progress";
      case "COMPLETED":
        return "status-badge status-completed";
      case "EVALUATED":
        return "status-badge status-evaluated";
      default:
        return "status-badge";
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="hiring-manager-dashboard">
        <div className="loading">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="hiring-manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👔 Hiring Manager Dashboard</h1>
          <p className="subtitle">Manage candidate evaluation sessions</p>
        </div>
        <button
          className="create-session-btn"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ Create New Session
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Session</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="modal-form">
              <div className="form-group">
                <label htmlFor="time-limit">Session Duration (minutes)</label>
                <select
                  id="time-limit"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(e.target.value)}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (default)</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
                <small>Choose how long the candidate has to complete the task</small>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingSession}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={creatingSession}
                >
                  {creatingSession ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="sessions-container">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>📭 No sessions yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => (
              <div key={session.session_id} className="session-card">
                <div className="card-header">
                  <span className={getStatusBadgeColor(session.state)}>
                    {session.state}
                  </span>
                  <span className="session-id-short">
                    {session.session_id.substring(0, 20)}...
                  </span>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <span className="label">Candidate:</span>
                    <span className="value">
                      {session.candidate_name || "⏳ Waiting for candidate..."}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="label">Time Limit:</span>
                    <span className="value">{session.time_limit_minutes} min</span>
                  </div>

                  <div className="info-row">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(session.created_at)}</span>
                  </div>

                  {session.started_at && (
                    <div className="info-row">
                      <span className="label">Started:</span>
                      <span className="value">{formatDate(session.started_at)}</span>
                    </div>
                  )}

                  {session.submitted_at && (
                    <div className="info-row">
                      <span className="label">Submitted:</span>
                      <span className="value">{formatDate(session.submitted_at)}</span>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  {session.state === "CREATED" && (
                    <button
                      className="copy-link-btn"
                      onClick={() => copyToClipboard(session.invite_link)}
                      title="Click to copy invite link"
                    >
                      🔗 Copy Link
                    </button>
                  )}
                  {session.state === "EVALUATED" && (
                    <button
                      className="view-results-btn"
                      onClick={() => navigate(`/results/${session.session_id}`)}
                    >
                      📊 View Results
                    </button>
                  )}
                  <button
                    className="view-details-btn"
                    onClick={() => navigate(`/session/${session.session_id}`)}
                  >
                    👁️ View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HiringManagerDashboard;
