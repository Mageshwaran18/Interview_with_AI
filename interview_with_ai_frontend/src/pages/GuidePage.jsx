import { useState } from "react";
import TaskSidebar from "../components/TaskSidebar";
import CodeEditor from "../components/CodeEditor";
import ChatPanel from "../components/ChatPanel";
import "./GuidePage.css";

/*
 ─── GuidePage Component ───
 
 📚 What this does:
 This is the MAIN page of Phase 1 — the candidate's workspace.
 It assembles the 3-panel layout:
   [Left: Task Requirements] [Center: Code Editor] [Right: AI Chat]
 
 🧠 What you'll learn:
 - Component composition (combining smaller components into a page)
 - "Lifting state up" (code state lives HERE and is passed to children)
 - CSS Grid for complex layouts
 - Generating unique IDs
 
 💡 Key Concept: Lifting State Up
 The code state lives in GuidePage (the parent), not in CodeEditor (the child).
 Why? Because later (Phase 2), we'll need the code value in OTHER components
 too (like for computing diffs). By keeping state in the parent, any child
 can access it through props.
*/

function GuidePage() {
  // The candidate's code — starts empty, CodeEditor will fill in the starter template
  const [code, setCode] = useState("");

  // Generate a simple session ID for this coding session
  // In Phase 5, this will come from the hiring manager's dashboard
  const [sessionId] = useState(() => {
    return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
  });

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
          <span className="topbar-timer">⏱️ 60:00</span>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <main className="guide-panels">
        {/* Left Panel: Task Requirements */}
        <aside className="panel panel-left">
          <TaskSidebar />
        </aside>

        {/* Center Panel: Monaco Code Editor */}
        <section className="panel panel-center">
          <CodeEditor code={code} onCodeChange={setCode} />
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
