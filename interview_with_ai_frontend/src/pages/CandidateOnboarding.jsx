import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [windowError, setWindowError] = useState(null); // { reason, start_at|end_at }

  const taskHighlights = [
    "Book and member management",
    "Checkout and returns with limits",
    "Search by title or author",
    "Overdue detection",
    "Meaningful error handling",
    "Ask AI for targeted help",
  ];

  const proTips = [
    "Scan the six requirements before you code",
    "Ship small: run tests every 5-10 minutes",
    "Be specific with AI prompts",
    "Rough plan first, then implement",
  ];

  // Fetch session details on component mount
  useEffect(() => {
    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/sessions/${session_id}`);
        setSession(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch session:", err);
        // Handle 403 window errors
        if (err.response?.status === 403) {
          const detail = err.response.data?.detail || {};
          setWindowError(typeof detail === "object" ? detail : { reason: "unknown" });
        } else {
          setSessionError("Session not found. Check your invite link and try again.");
        }
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [session_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const response = await api.post(`/api/sessions/${session_id}/start`, {
        session_id,
        candidate_name: candidateName.trim(),
      });

      setSession(response.data);
      navigate(`/guide/${session_id}`);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError(err.response?.data?.detail || "Failed to start session. Please try again.");
      setLoading(false);
    }
  };

  if (sessionError) {
    return (
      <div className="candidate-onboarding">
        <StarfieldBackground />
        <div className="center-card">
          <div className="pill pill-alert">Session unavailable</div>
          <div className="error-icon">❌</div>
          <h1>Session Not Found</h1>
          <p>{sessionError}</p>
          <button className="ghost-button" onClick={() => navigate("/")}>
            ← Go back to home
          </button>
        </div>
      </div>
    );
  }

  // ─── Window error screens ─────────────────────────────────────────────────
  if (windowError) {
    const formatTime = (iso) => {
      if (!iso) return "";
      return new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
    };

    if (windowError.reason === "not_started") {
      return (
        <div className="candidate-onboarding">
          <StarfieldBackground />
          <div className="center-card">
            <div className="pill" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Session not open yet</div>
            <div className="error-icon">⏳</div>
            <h1>Session Not Started Yet</h1>
            <p>This session window opens on:</p>
            <p style={{ color: "#fbbf24", fontWeight: 600, fontSize: "1.1rem" }}>{formatTime(windowError.start_at)}</p>
            <p style={{ color: "rgba(232,232,240,0.6)", fontSize: "0.9rem", marginTop: 8 }}>Please come back at that time. This page will work once the window opens.</p>
            <button className="ghost-button" onClick={() => window.location.reload()}>↻ Refresh</button>
          </div>
        </div>
      );
    }

    if (windowError.reason === "expired") {
      return (
        <div className="candidate-onboarding">
          <StarfieldBackground />
          <div className="center-card">
            <div className="pill pill-alert">Session closed</div>
            <div className="error-icon">🔒</div>
            <h1>Session Expired</h1>
            <p>This session window closed on:</p>
            <p style={{ color: "#ff6b8a", fontWeight: 600, fontSize: "1.1rem" }}>{formatTime(windowError.end_at)}</p>
            <p style={{ color: "rgba(232,232,240,0.6)", fontSize: "0.9rem", marginTop: 8 }}>The link is no longer valid. Please contact your hiring manager if you believe this is an error.</p>
            <button className="ghost-button" onClick={() => navigate("/")}>
              ← Go home
            </button>
          </div>
        </div>
      );
    }

    // Generic window error
    return (
      <div className="candidate-onboarding">
        <StarfieldBackground />
        <div className="center-card">
          <div className="pill pill-alert">Access denied</div>
          <div className="error-icon">🚫</div>
          <h1>Session Unavailable</h1>
          <p>{windowError.message || "This session link is not currently accessible."}</p>
          <button className="ghost-button" onClick={() => navigate("/")}>← Go home</button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="candidate-onboarding">
        <StarfieldBackground />
        <div className="center-card">
          <div className="loader-ring" aria-label="Loading session" />
          <p className="muted">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-onboarding">
      <StarfieldBackground />
      <div className="onboarding-shell">
        <header className="onboarding-hero glass-panel">
          <div className="hero-copy">
            <p className="eyebrow">Session invite · {session.session_name || "GUIDE"}</p>
            <h1>Candidate check-in</h1>
            <p className="lede">
              Confirm your details, review the brief, and start the timer. Everything you need is on this page—no wandering or scrolling through filler.
            </p>
            <div className="pill-row">
              <span className="pill">Duration: {session.time_limit_minutes} min</span>
              <span className="pill pill-strong">{session.project_template || "Library Management System"}</span>
              {session.group_name && (
                <span className="pill" style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}>Group: {session.group_name}</span>
              )}
              <span className="pill">AI assistant available</span>
            </div>
          </div>
          <div className="hero-task">
            <div className="mini-label">Build scope</div>
            <h3>Deliver a reliable library system</h3>
            <div className="task-points">
              {taskHighlights.map((item) => (
                <div key={item} className="point">
                  <span>•</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="onboarding-grid">
          <div className="grid-left">
            <div className="glass-panel session-brief">
              <div className="brief-row">
                <div className="brief-item">
                  <div className="mini-label">Session status</div>
                  <p className="brief-value">Ready to start</p>
                </div>
                <div className="brief-item">
                  <div className="mini-label">AI support</div>
                  <p className="brief-value">Use it anytime</p>
                </div>
                <div className="brief-item">
                  <div className="mini-label">Focus</div>
                  <p className="brief-value">Quality over flash</p>
                </div>
              </div>
              <div className="brief-note">
                Keep the window in focus once you start. Timer runs immediately after you submit your name.
              </div>
            </div>

            <div className="glass-panel task-card">
              <div className="section-heading">
                <div>
                  <div className="mini-label">Read once</div>
                  <h3>Task checklist</h3>
                </div>
                <span className="badge">Python</span>
              </div>
              <ul className="checklist">
                <li>Clean data models for books, members, and loans</li>
                <li>Borrow/return flows with limits and overdue flags</li>
                <li>Search by title or author with clear outputs</li>
                <li>Error handling that tells the user what to fix</li>
              </ul>
              <div className="callout">Ask the AI for tight, specific guidance—not broad “how do I build this?” prompts.</div>
            </div>

            <div className="glass-panel tips-inline">
              <div className="section-heading">
                <div className="mini-label">Pro tips</div>
                <h3>Work clean, move fast</h3>
              </div>
              <div className="tip-chips">
                {proTips.map((tip) => (
                  <span key={tip} className="chip">{tip}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-right">
            <div className="glass-panel form-card">
              <div className="section-heading">
                <div>
                  <div className="mini-label">Check-in</div>
                  <h3>Start your session</h3>
                </div>
                <span className="badge badge-soft">Takes ~10 seconds</span>
              </div>

              <form onSubmit={handleSubmit} className="name-form">
                <label htmlFor="name" className="input-label">Your name</label>
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

                <div className="inline-notes">
                  <span>Timer starts after you submit.</span>
                  <span>Stay in this window to avoid pauses.</span>
                </div>

                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? "Starting..." : "Start session"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateOnboarding;
