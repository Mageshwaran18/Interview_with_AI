import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import TaskSidebar from "../components/TaskSidebar";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import TestPanel from "../components/TestPanel";
import { sendEvent, triggerEvaluation } from "../services/api";
import api from "../services/api";
import "./GuidePage.css";

/*
 ─── GuidePage Component (Phase 5 Update) ───
 
 📚 What's new in Phase 5:
 - Accepts session_id from URL (/guide/:session_id)
 - Fetches session details from backend
 - Uses session's time_limit_minutes for timer
 - Properly ends session with /api/sessions/{id}/end
 - SERVER state machine integration (CREATED → IN_PROGRESS → COMPLETED)
*/

function GuidePage() {
  const navigate = useNavigate();
  const { session_id: urlSessionId } = useParams();
  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get("view_only") === "true";
  
  // Session ID from URL (priority) or fallback to auto-generate
  const [sessionId] = useState(urlSessionId || "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8));
  
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [code, setCode] = useState("");
  
  // ─── Timer State ───
  // Will be set from session.time_limit_minutes
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [sessionActive, setSessionActive] = useState(true);
  const [submitting, setSubmitting] = useState(false); // ← Prevent double submission race condition
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false); // ← Confirmation dialog
  const timerRef = useRef(null);
  const sessionActiveRef = useRef(true);
  const codeRef = useRef(""); // Store code in ref to avoid stale closures

  // Update code ref when code changes
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // ─── Panel Visibility State ───
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  
  // Fetch session details on mount
  useEffect(() => {
    const fetchSession = async () => {
      console.log("Fetching session:", sessionId);
      try {
        const response = await axios.get(
          `http://localhost:8000/api/sessions/${sessionId}`
        );
        console.log("Session loaded:", response.data);
        setSession(response.data);
        
        // Calculate timer based on session start time (for persistence across refreshes)
        const totalSeconds = response.data.time_limit_minutes * 60;
        let remainingSeconds = totalSeconds;
        
        if (response.data.started_at) {
          // Session already started: calculate elapsed time
          const startTime = new Date(response.data.started_at).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
          
          console.log(`Timer calculation: Total=${totalSeconds}s, Elapsed=${elapsedSeconds}s, Remaining=${remainingSeconds}s`);
        }
        
        setTimeRemaining(remainingSeconds);
        setSessionLoading(false);
      } catch (err) {
        console.error("Failed to fetch session:", err.response?.data || err.message);
        setSessionError(
          `Failed to load session: ${err.response?.data?.detail || err.message}`
        );
        setSessionLoading(false);
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    };
    
    if (urlSessionId) {
      fetchSession();
    } else {
      setSessionError("No session ID provided");
      setSessionLoading(false);
    }
  }, [sessionId, urlSessionId, navigate]);

  // Format seconds → "MM:SS"
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── End Session (uses refs to avoid stale closures) ───
  const endSession = useCallback(
    async (reason) => {
      // ← GUARD: Double-check if already submitting (prevent race condition)
      if (!sessionActiveRef.current || submitting) return;
      
      sessionActiveRef.current = false;
      setSessionActive(false);
      setSubmitting(true);

      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Call backend to end session
      try {
        const response = await axios.post(
          `/api/sessions/${sessionId}/end?reason=${reason}`,
          {
            final_code: codeRef.current, // Use ref instead of state
          }
        );
        
        console.log("Session ended:", response.data);
        
        // ✅ Redirect candidate to results page after submission
        // Store user type in session storage so ResultsDashboard knows this is a candidate
        sessionStorage.setItem(`user_type_${sessionId}`, "candidate");
        
        // Trigger evaluation pipeline after a short delay
        setTimeout(() => {
          triggerEvaluation(sessionId).catch((err) =>
            console.warn("Auto-evaluation failed:", err)
          );
          // Navigate to results after a brief delay
          navigate(`/results/${sessionId}`);
        }, 1500);
      } catch (error) {
        console.warn("Failed to end session:", error);
        // ← Reset submitting state on error so user can retry
        setSubmitting(false);
      }
    },
    [sessionId, navigate, submitting]
  );

  // ─── Session Start + Timer (runs when timeRemaining is first set) ───
  // Create stable endSession callback that doesn't depend on variable state
  const endSessionRef = useRef(null);
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  useEffect(() => {
    // Only set up timer once, when timeRemaining is first available
    if (timeRemaining === null) return;
    
    // If timer is already running, don't set up again
    if (timerRef.current !== null) return;
    
    console.log("⏱️ Starting timer with", timeRemaining, "seconds remaining");
    
    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          console.log("⏰ Timer expired, ending session");
          // Call via ref to avoid stale closure
          if (endSessionRef.current) {
            endSessionRef.current("timer_expired");
          }
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    // Cleanup: clear interval on unmount
    return () => {
      if (timerRef.current) {
        console.log("🛑 Clearing timer interval");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemaining]); // Re-run when timeRemaining is first set from null

  // Timer warning: red when < 5 minutes
  const isTimerWarning = timeRemaining !== null && timeRemaining < 300;

  // Calculate dynamic grid columns based on open panels
  const getGridTemplateColumns = () => {
    if (leftPanelOpen && rightPanelOpen) return "280px 1fr 350px";
    if (leftPanelOpen && !rightPanelOpen) return "280px 1fr";
    if (!leftPanelOpen && rightPanelOpen) return "1fr 350px";
    return "1fr"; // Both closed
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="guide-page">
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0d1117",
          color: "#e6edf3",
          fontSize: "18px",
          gap: "20px",
        }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "4px solid #30363d",
            borderTop: "4px solid #58a6ff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}></div>
          <p>⏳ Loading session...</p>
          <p style={{ fontSize: "12px", color: "#8b949e" }}>Session ID: {sessionId}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (sessionError) {
    return (
      <div className="guide-page">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0d1117",
          color: "#e6edf3",
          textAlign: "center",
          flexDirection: "column",
          gap: "20px",
          padding: "40px",
        }}>
          <div>
            <p style={{ fontSize: "24px", color: "#f85149", margin: "0 0 10px 0" }}>❌ Error Loading Session</p>
            <p style={{ color: "#8b949e", fontSize: "16px", margin: "0 0 20px 0" }}>{sessionError}</p>
            <p style={{ color: "#8b949e", fontSize: "14px" }}>Redirecting to home in 3 seconds...</p>
          </div>
          <button 
            onClick={() => navigate("/")}
            style={{
              padding: "10px 20px",
              background: "#238636",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              marginTop: "20px"
            }}
          >
            Go Home Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="guide-page">
      {/* Top Bar */}
      <header className="guide-topbar">
        <div className="topbar-left">
          <button
            className="panel-toggle-btn left-toggle"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            title={leftPanelOpen ? "Hide left panel" : "Show left panel"}
            aria-label={leftPanelOpen ? "Hide left panel with tasks" : "Show left panel with tasks"}
          >
            {leftPanelOpen ? "◀" : "▶"}
          </button>
          <span className="topbar-logo">🎯 GUIDE</span>
          <span className="topbar-divider">|</span>
          <span className="topbar-task">Library Management System</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-session">Session: {sessionId.slice(0, 20)}...</span>
          <span className={`topbar-timer ${isTimerWarning ? "timer-warning" : ""}`}>
            ⏱️ {timeRemaining !== null ? formatTime(timeRemaining) : "Loading..."}
          </span>
          {sessionActive && (
            <button 
              className="submit-btn" 
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isViewOnly || submitting}
              title={isViewOnly ? "Hiring managers cannot submit sessions" : "Submit your solution"}
            >
              📤 Submit
            </button>
          )}
          {!sessionActive && (
            <>
              <span className="session-ended-badge">Session Ended</span>
              <button
                className="view-results-btn"
                onClick={() => navigate(`/results/${sessionId}`)}
              >
                📊 View Results
              </button>
            </>
          )}
          <button
            className="panel-toggle-btn right-toggle"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title={rightPanelOpen ? "Hide right panel" : "Show right panel"}
            aria-label={rightPanelOpen ? "Hide right panel with chat" : "Show right panel with chat"}
          >
            {rightPanelOpen ? "▶" : "◀"}
          </button>
        </div>
      </header>

      {/* Three-Panel Layout with Dynamic Grid */}
      <main className="guide-panels" style={{
        gridTemplateColumns: getGridTemplateColumns()
      }}>
        {/* Left Panel: Task Requirements */}
        {leftPanelOpen && (
          <aside className="panel panel-left">
            {session && <TaskSidebar code={code} />}
          </aside>
        )}

        {/* Center Panel: Code Editor + Test Panel */}
        <section className="panel panel-center">
          {session && (
            <>
              {isViewOnly && (
                <div style={{
                  backgroundColor: "#1E3A5F",
                  color: "#FFA500",
                  padding: "12px 16px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderBottom: "1px solid #FFA500",
                }}>
                  👁️ VIEW-ONLY MODE - You are watching a candidate's session. Editing is disabled.
                </div>
              )}
              <CodeEditor code={code} onCodeChange={setCode} sessionId={sessionId} readOnly={isViewOnly} />
              {/* ✅ Run Tests button enabled - uses backend fallback if Pyodide fails */}
              <TestPanel sessionId={sessionId} code={code} readOnly={isViewOnly} />
            </>
          )}
        </section>

        {/* Right Panel: AI Chat */}
        {rightPanelOpen && (
          <aside className="panel panel-right">
            {session && <ChatPanel sessionId={sessionId} readOnly={isViewOnly} />}
          </aside>
        )}
      </main>

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '450px',
            textAlign: 'center',
            border: '1px solid #444'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>⚠️ Submit Your Solution?</h3>
            <p style={{ marginBottom: '1.5rem', color: '#aaa', fontSize: '0.95rem' }}>
              Once you submit, your session will end and you cannot make further changes. Make sure your solution is complete before submitting.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #444',
                  background: 'transparent',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  flex: 1,
                  opacity: submitting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  endSession("submitted");
                }}
                disabled={submitting}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: submitting ? '#888888' : '#2d9f56',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  flex: 1,
                  fontWeight: 'bold',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuidePage;
