import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
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
  const [sessions, setSessions] = useState(() => {
    // Load cached sessions from localStorage on mount
    try {
      const cached = localStorage.getItem("hiring_manager_sessions");
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      console.warn("Failed to load cached sessions:", err);
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [creatingSession, setCreatingSession] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" or "card"
  const [filterState, setFilterState] = useState("ALL"); // Filter by state
  const [sortBy, setSortBy] = useState("created_asc"); // Sort option
  const [notification, setNotification] = useState(null); // Notification system

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("hiring_manager_sessions", JSON.stringify(sessions));
    } catch (err) {
      console.warn("Failed to cache sessions:", err);
    }
  }, [sessions]);

  // Fetch all sessions on component mount
  useEffect(() => {
    fetchSessions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchSessions, 30000); // Reduced from 5s to 30s to reduce server load
    return () => clearInterval(interval);
  }, []);

  // Helper function to show notifications instead of alerts
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    // Auto-dismiss after 4 seconds
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get("/api/sessions");
      setSessions(response.data.sessions);
      setError(null); // Clear error when fetch succeeds
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      // Only show error if we have no cached sessions
      if (sessions.length === 0) {
        setError("Failed to load sessions");
      }
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreatingSession(true);

    try {
        const response = await api.post(
          "/api/sessions/create",
        {
          time_limit_minutes: parseInt(timeLimitMinutes),
        }
      );

      // Clear candidate user type marker if exists (this is a new session)
      sessionStorage.removeItem(`user_type_${response.data.session_id}`);
      // Mark as hiring manager for when they view results
      sessionStorage.setItem(`user_type_${response.data.session_id}`, "hiring_manager");

      // Add new session to list
      setSessions([response.data, ...sessions]);
      setShowCreateModal(false);
      setTimeLimitMinutes(60);

      // Show success notification
      showNotification(`Session created! Share this link: ${response.data.invite_link})`, "success");
    } catch (err) {
      console.error("Failed to create session:", err);
      showNotification("Failed to create session", "error");
    } finally {
      setCreatingSession(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Invite link copied to clipboard!", "success");
  };

  // Terminate an incomplete session
  const handleTerminateSession = async (session) => {
    const confirmMsg = `Are you sure you want to terminate the session for ${session.candidate_name || "this candidate"}?\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMsg)) {
      return; // User cancelled
    }

    try {
      // Call backend to terminate session
      await axios.post(
        `http://localhost:8000/api/sessions/${session.session_id}/end`,
        { final_code: "" },
        { params: { reason: "terminated_by_manager" } }
      );

      // Remove session from list or update its state
      setSessions(sessions.filter(s => s.session_id !== session.session_id));
      showNotification(`✅ Session for ${session.candidate_name || "candidate"} has been terminated.`, "success");
    } catch (err) {
      console.error("Failed to terminate session:", err);
      showNotification(`❌ Failed to terminate session: ${err.response?.data?.detail || err.message}`, "error");
    }
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

  // Filter sessions based on selected state
  const filteredSessions = filterState === "ALL" 
    ? sessions 
    : sessions.filter(s => s.state === filterState);

  // Sort sessions based on selected option
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "created_asc":
        return new Date(a.created_at) - new Date(b.created_at);
      case "created_desc":
        return new Date(b.created_at) - new Date(a.created_at);
      case "name_asc":
        return (a.candidate_name || "").localeCompare(b.candidate_name || "");
      case "name_desc":
        return (b.candidate_name || "").localeCompare(a.candidate_name || "");
      default:
        return 0;
    }
  });

  if (loading && sessions.length === 0) {
    return (
      <div className="hiring-manager-dashboard">
        <div className="loading">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="hiring-manager-dashboard">
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '1rem',
          borderRadius: '8px',
          background: notification.type === 'success' ? '#2d9f56' : '#c74444',
          color: '#fff',
          zIndex: 9999,
          minWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease'
        }}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👔 Hiring Manager Dashboard</h1>
          <p className="subtitle">Manage candidate evaluation sessions</p>
          {loading && sessions.length > 0 && (
            <p style={{ fontSize: "0.85rem", color: "#888", marginTop: "0.25rem" }}>
              🔄 Syncing with server...
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="create-session-btn"
            style={{ backgroundColor: "#0066cc" }}
            onClick={() => navigate("/results")}
          >
            📊 Overall Results
          </button>
          <button
            className="create-session-btn"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Create New Session
          </button>
        </div>
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
        {/* View Mode & Filter Controls */}
        <div style={{
          marginBottom: "24px",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
          backgroundColor: "#1a2332",
          padding: "16px",
          borderRadius: "8px",
        }}>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "8px 16px",
                backgroundColor: viewMode === "table" ? "#0066cc" : "#333",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              📊 Table View
            </button>
            <button
              onClick={() => setViewMode("card")}
              style={{
                padding: "8px 16px",
                backgroundColor: viewMode === "card" ? "#0066cc" : "#333",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              🃏 Card View
            </button>
          </div>

          {/* Filter by Status */}
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <option value="ALL">All Status</option>
            <option value="CREATED">⏳ Created (Pending)</option>
            <option value="IN_PROGRESS">🔄 In Progress</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="EVALUATED">📊 Evaluated</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#333",
              color: "white",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <option value="created_asc">📅 Created (Earliest First)</option>
            <option value="created_desc">📅 Created (Latest First)</option>
            <option value="name_asc">👤 Candidate Name (A-Z)</option>
            <option value="name_desc">👤 Candidate Name (Z-A)</option>
          </select>

          <div style={{ marginLeft: "auto", color: "#aaa", fontSize: "13px" }}>
            Showing {sortedSessions.length} session(s)
          </div>
        </div>

        {/* Empty State */}
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>📭 No sessions yet. Create one to get started!</p>
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="empty-state">
            <p>🔍 No sessions match the selected filter.</p>
          </div>
        ) : viewMode === "table" ? (
          /* TABLE VIEW */
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#0f1419",
              borderRadius: "8px",
              overflow: "hidden",
            }}>
              <thead>
                <tr style={{ backgroundColor: "#1a2332", borderBottom: "2px solid #333" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Candidate</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Time Limit</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Created</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Started</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Submitted</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "#aaa", fontWeight: "600", fontSize: "13px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map((session, idx) => (
                  <tr
                    key={session.session_id}
                    style={{
                      borderBottom: "1px solid #222",
                      backgroundColor: idx % 2 === 0 ? "transparent" : "#0a0e13",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1a2332"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "transparent" : "#0a0e13"}
                  >
                    <td style={{ padding: "12px 16px", color: "#fff", fontSize: "13px", fontWeight: "500" }}>
                      {session.candidate_name || "⏳ Pending"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span className={getStatusBadgeColor(session.state)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                        {session.state}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                      {session.time_limit_minutes} min
                    </td>
                    <td style={{ padding: "12px 16px", color: "#888", fontSize: "12px" }}>
                      {new Date(session.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#888", fontSize: "12px" }}>
                      {session.started_at ? new Date(session.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#888", fontSize: "12px" }}>
                      {session.submitted_at ? new Date(session.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", display: "flex", gap: "6px", flexDirection: "column", alignItems: "center" }}>
                      {session.state === "CREATED" && (
                        <>
                          <button
                            onClick={() => copyToClipboard(session.invite_link)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#2c5aa0",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                              width: "100%",
                            }}
                          >
                            🔗 Copy
                          </button>
                          <button
                            onClick={() => handleTerminateSession(session)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "#8b0000",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "500",
                              width: "100%",
                            }}
                            title="Terminate this session"
                          >
                            🗑️ Terminate
                          </button>
                        </>
                      )}
                      {(session.state === "COMPLETED" || session.state === "EVALUATED") && (
                        <button
                          onClick={() => {
                            sessionStorage.setItem(`user_type_${session.session_id}`, "hiring_manager");
                            navigate(`/results/${session.session_id}`);
                          }}
                          style={{
                            padding: "6px 12px",
                            backgroundColor: "#0a6b2c",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                            width: "100%",
                          }}
                        >
                          📊 Results
                        </button>
                      )}
                      {session.state === "IN_PROGRESS" && (
                        <>
                          <button
                            onClick={() => navigate(`/guide/${session.session_id}?view_only=true`)}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#6b5a0a",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                              width: "100%",
                            }}
                          >
                            👁️ Watch
                          </button>
                          <button
                            onClick={() => handleTerminateSession(session)}
                            style={{
                              padding: "5px 10px",
                              backgroundColor: "#8b0000",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                              fontWeight: "500",
                              width: "100%",
                            }}
                            title="Terminate this session"
                          >
                            🗑️ Terminate
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARD VIEW */
          <div className="sessions-grid">
            {sortedSessions.map((session) => (
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

                <div className="card-footer" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {session.state === "CREATED" && (
                    <>
                      <button
                        className="copy-link-btn"
                        onClick={() => copyToClipboard(session.invite_link)}
                        title="Click to copy invite link"
                      >
                        🔗 Copy Link
                      </button>
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#8b0000",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                        onClick={() => handleTerminateSession(session)}
                        title="Terminate this session"
                      >
                        🗑️ Terminate Session
                      </button>
                    </>
                  )}
                  {session.state === "COMPLETED" && (
                    <button
                      className="view-results-btn"
                      onClick={() => {
                        sessionStorage.setItem(`user_type_${session.session_id}`, "hiring_manager");
                        navigate(`/results/${session.session_id}`);
                      }}
                    >
                      📊 View Results
                    </button>
                  )}
                  {session.state === "EVALUATED" && (
                    <button
                      className="view-results-btn"
                      onClick={() => {
                        sessionStorage.setItem(`user_type_${session.session_id}`, "hiring_manager");
                        navigate(`/results/${session.session_id}`);
                      }}
                    >
                      📊 View Results
                    </button>
                  )}
                  {session.state === "IN_PROGRESS" && (
                    <>
                      <button
                        className="view-details-btn"
                        onClick={() => navigate(`/guide/${session.session_id}?view_only=true`)}
                        title="View candidate's active session (read-only)"
                      >
                        👁️ View Live
                      </button>
                      <button
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#8b0000",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                        onClick={() => handleTerminateSession(session)}
                        title="Terminate this session"
                      >
                        🗑️ Terminate Session
                      </button>
                    </>
                  )}
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
