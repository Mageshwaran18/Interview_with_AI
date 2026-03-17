import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import TaskSidebar from "../components/TaskSidebar";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import TestPanel from "../components/TestPanel";
import { sendEvent, triggerEvaluation } from "../services/api";
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
  const timerRef = useRef(null);
  const sessionActiveRef = useRef(true);

  // ─── Panel Visibility State ───
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  
  // Fetch session details on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/sessions/${sessionId}`
        );
        setSession(response.data);
        
        // Convert minutes to seconds for timer
        const durationSeconds = response.data.time_limit_minutes * 60;
        setTimeRemaining(durationSeconds);
        setSessionLoading(false);
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setSessionError("Failed to load session. Redirecting...");
        setSessionLoading(false);
        setTimeout(() => navigate("/"), 2000);
      }
    };
    
    if (urlSessionId) {
      fetchSession();
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
      if (!sessionActiveRef.current) return;
      sessionActiveRef.current = false;
      setSessionActive(false);

      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Call backend to end session
      try {
        const response = await axios.post(
          `http://localhost:8000/api/sessions/${sessionId}/end?reason=${reason}`,
          {
            final_code: code,
          }
        );
        
        console.log("Session ended:", response.data);
        
        // Trigger evaluation pipeline after a short delay
        setTimeout(() => {
          triggerEvaluation(sessionId).catch((err) =>
            console.warn("Auto-evaluation failed:", err)
          );
        }, 1000);
      } catch (error) {
        console.warn("Failed to end session:", error);
      }
    },
    [sessionId, code]
  );

  // ─── Session Start + Timer (runs when timeRemaining is set) ───
  useEffect(() => {
    if (timeRemaining === null) return; // Wait for session to load
    
    // Start the countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          endSession("timer_expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining]); // Run when timeRemaining is initialized

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
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#0d1117",
          color: "#e6edf3",
          fontSize: "18px",
        }}>
          ⏳ Loading session...
        </div>
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
        }}>
          <div>
            <p style={{ fontSize: "20px", color: "#f85149" }}>❌ {sessionError}</p>
            <p style={{ color: "#8b949e" }}>Redirecting to home...</p>
          </div>
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
            <button className="submit-btn" onClick={() => endSession("submitted")}>
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
            <TaskSidebar code={code} />
          </aside>
        )}

        {/* Center Panel: Code Editor + Test Panel */}
        <section className="panel panel-center">
          <CodeEditor code={code} onCodeChange={setCode} sessionId={sessionId} />
          <TestPanel sessionId={sessionId} code={code} />
        </section>

        {/* Right Panel: AI Chat */}
        {rightPanelOpen && (
          <aside className="panel panel-right">
            <ChatPanel sessionId={sessionId} />
          </aside>
        )}
      </main>
    </div>
  );
}

export default GuidePage;
