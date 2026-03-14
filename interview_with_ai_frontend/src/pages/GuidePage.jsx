import { useState, useEffect, useRef, useCallback } from "react";
import TaskSidebar from "../components/TaskSidebar";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import TestPanel from "../components/TestPanel";
import { sendEvent } from "../services/api";
import "./GuidePage.css";

/*
 ─── GuidePage Component (Phase 2 Update) ───
 
 📚 What's new in Phase 2:
 - Working countdown timer (60:00 → 0:00)
 - SESSION_START event logged on mount
 - SESSION_END event logged on submit or timer expiry
 - TestPanel integrated into the editor area
 - sessionId passed to CodeEditor for diff logging
*/

const SESSION_DURATION_SECONDS = 60 * 60; // 60 minutes

function GuidePage() {
  const [code, setCode] = useState("");
  const [sessionId] = useState(() => {
    return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
  });

  // ─── Timer State ───
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION_SECONDS);
  const [sessionActive, setSessionActive] = useState(true);
  const timerRef = useRef(null);
  const sessionActiveRef = useRef(true); // Ref mirror for callbacks

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

      // Log SESSION_END event
      try {
        await sendEvent(sessionId, "SESSION_END", {
          reason: reason,
        });
      } catch (error) {
        console.warn("Failed to log SESSION_END:", error);
      }
    },
    [sessionId]
  );

  // ─── Session Start + Timer (runs ONCE on mount) ───
  useEffect(() => {
    // Log SESSION_START event
    sendEvent(sessionId, "SESSION_START", {
      requirements_list: [
        "Book Management",
        "Member Management",
        "Loan Tracking",
        "Search",
        "Overdue Detection",
        "Error Handling",
      ],
      time_limit_minutes: 60,
    }).catch((err) => console.warn("Failed to log SESSION_START:", err));

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
  }, []); // Empty dependency array — runs only once

  // Timer warning: red when < 5 minutes
  const isTimerWarning = timeRemaining < 300;

  return (
    <div className="guide-page">
      {/* Top Bar */}
      <header className="guide-topbar">
        <div className="topbar-left">
          <span className="topbar-logo">🎯 GUIDE</span>
          <span className="topbar-divider">|</span>
          <span className="topbar-task">Library Management System</span>
        </div>
        <div className="topbar-right">
          <span className="topbar-session">Session: {sessionId.slice(0, 20)}...</span>
          <span className={`topbar-timer ${isTimerWarning ? "timer-warning" : ""}`}>
            ⏱️ {formatTime(timeRemaining)}
          </span>
          {sessionActive && (
            <button className="submit-btn" onClick={() => endSession("submitted")}>
              📤 Submit
            </button>
          )}
          {!sessionActive && <span className="session-ended-badge">Session Ended</span>}
        </div>
      </header>

      {/* Three-Panel Layout */}
      <main className="guide-panels">
        {/* Left Panel: Task Requirements */}
        <aside className="panel panel-left">
          <TaskSidebar />
        </aside>

        {/* Center Panel: Code Editor + Test Panel */}
        <section className="panel panel-center">
          <CodeEditor code={code} onCodeChange={setCode} sessionId={sessionId} />
          <TestPanel sessionId={sessionId} code={code} />
        </section>

        {/* Right Panel: AI Chat */}
        <aside className="panel panel-right">
          <ChatPanel sessionId={sessionId} />
        </aside>
      </main>
    </div>
  );
}

export default GuidePage;
