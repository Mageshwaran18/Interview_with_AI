import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../services/api";
import StarfieldBackground from "../components/StarfieldBackground";
import GlassNav from "../components/GlassNav";
import Toast from "../components/Toast";
import HyperLoader from "../components/HyperLoader";
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
  const [filterState, setFilterState] = useState("ALL"); // Filter by state
  const [sortBy, setSortBy] = useState("created_asc"); // Sort option
  const [notification, setNotification] = useState(null); // Notification system
  const [projectTemplate, setProjectTemplate] = useState("Library Management System");

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
    const interval = setInterval(fetchSessions, 30000);
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

  return (
    <div className="hiring-manager-dashboard">
      {loading && (
        <HyperLoader label="Loading sessions" subtitle="Syncing dashboard data" />
      )}
      <StarfieldBackground />

      <GlassNav>
        <button className="glass-nav-link glass-nav-link-active" onClick={() => navigate('/hiring-manager')}>
          <span>Sessions</span>
        </button>
        <button className="glass-nav-link" onClick={() => navigate('/results')}>
          <span>Results</span>
        </button>
        <button className="glass-nav-link" onClick={() => navigate('/dashboard')}>
          <span>Home</span>
        </button>
      </GlassNav>

      {/* Notification Toast */}
      <Toast
        message={notification?.message}
        type={notification?.type || 'success'}
        onClose={() => setNotification(null)}
      />

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👔 Hiring Manager Dashboard</h1>
          <p className="subtitle">Manage candidate evaluation sessions</p>
          {loading && sessions.length > 0 && (
            <p className="syncing-text">
              🔄 Syncing with server...
            </p>
          )}
        </div>
        <div className="header-actions">
          <button
            className="create-session-btn create-session-btn-secondary"
            onClick={() => navigate("/results")}
          >
            📊 Overall Results
          </button>
          <button
            className="create-session-btn create-session-btn-secondary"
            onClick={() => navigate("/group-sessions")}
          >
            👥 Group Sessions
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

              <div className="form-group">
                <label htmlFor="project-template">Project Template</label>
                <select
                  id="project-template"
                  value={projectTemplate}
                  onChange={(e) => setProjectTemplate(e.target.value)}
                >
                  <option value="Library Management System">Library Management System</option>
                  <option value="Hotel Booking System ( beta )">Hotel Booking System ( beta )</option>
                </select>
                <small>Select the starter project context for the session</small>
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
        <div className="controls-bar">
          {/* Filter by Status */}
          <select
            id="filter-status"
            name="filterStatus"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Status</option>
            <option value="CREATED">⏳ Created (Pending)</option>
            <option value="IN_PROGRESS">🔄 In Progress</option>
            <option value="COMPLETED">✅ Completed</option>
            <option value="EVALUATED">📊 Evaluated</option>
          </select>

          {/* Sort By */}
          <select
            id="sort-by"
            name="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="created_asc">📅 Created (Earliest First)</option>
            <option value="created_desc">📅 Created (Latest First)</option>
            <option value="name_asc">👤 Candidate Name (A-Z)</option>
            <option value="name_desc">👤 Candidate Name (Z-A)</option>
          </select>

          <div className="session-count-text">
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
        ) : (
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

                <div className="card-footer">
                  {session.state === "CREATED" && (
                    <>
                      <button className="copy-link-btn" onClick={() => copyToClipboard(session.invite_link)} title="Click to copy invite link">🔗 Copy Link</button>
                      <button className="action-btn action-btn-terminate" onClick={() => handleTerminateSession(session)} title="Terminate this session">🗑️ Terminate Session</button>
                    </>
                  )}
                  {(session.state === "COMPLETED" || session.state === "EVALUATED") && (
                    <button className="view-results-btn" onClick={() => { sessionStorage.setItem(`user_type_${session.session_id}`, "hiring_manager"); navigate(`/results/${session.session_id}`); }}>📊 View Results</button>
                  )}
                  {session.state === "IN_PROGRESS" && (
                    <>
                      <button className="view-details-btn" onClick={() => navigate(`/guide/${session.session_id}?view_only=true`)} title="View candidate's active session (read-only)">👁️ View Live</button>
                      <button className="action-btn action-btn-terminate" onClick={() => handleTerminateSession(session)} title="Terminate this session">🗑️ Terminate Session</button>
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
