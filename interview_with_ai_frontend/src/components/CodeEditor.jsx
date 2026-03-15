import { useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { createPatch } from "diff";
import { sendEvent } from "../services/api";

/*
 ─── CodeEditor Component (Phase 2 Update) ───
 
 📚 What's new in Phase 2:
 - Debounced code diff capture (every 3 seconds)
 - Computes unified diff between current and previous code
 - POSTs CODE_SAVE events to the Interaction Trace Φ
 
 🧠 What you'll learn:
 - Debouncing: limiting how often a function fires
 - createPatch: computing unified diffs between two strings
 - useRef for mutable values that persist across renders
 - useCallback for memoized event handlers
 
 💡 Key Concept: Debouncing
 Without debouncing, every keystroke would trigger a diff + API call.
 With debouncing (3s), we wait 3 seconds after the LAST keystroke
 before computing the diff. This prevents flooding the event log.
*/

// Starter template that appears when the editor first loads
const STARTER_CODE = `# Library Management System
# Start building your solution below
from datetime import datetime, timedelta

class Library:
    def __init__(self):
        self.books = {}
        self.loans = {}

  # Task 1 (Bug-Free): Book Management
  def add_book(self, isbn, title, author, quantity):
    """Add a book to the library"""
    self.books[isbn] = {
      'title': title,
      'author': author,
      'quantity': quantity,
      'date_added': datetime.now(),
    }
    return {'success': True}

  # Task 2 (Bugged): Overdue Detection
  # BUG: Uses > 14 instead of >= 14 (off-by-one)
  def get_overdue_loans(self):
    """List all overdue loans (checked out >= 14 days and not returned)"""
    overdue = []
    now = datetime.now()

    for loan in self.loans.values():
      if not loan['returned']:
        days_checked_out = (now - loan['checkout_date']).days
        if days_checked_out > 14:
          overdue.append(loan)

    return overdue

  # TODO: Implement remaining requirements

`;

function CodeEditor({ code, onCodeChange, sessionId }) {
  // Ref to the Monaco editor instance (for future use like formatting)
  const editorRef = useRef(null);

  // Ref to store the PREVIOUS code snapshot for diff computation
  const previousCodeRef = useRef(STARTER_CODE);

  // Ref for the debounce timer
  const debounceTimerRef = useRef(null);

  // Called when the editor first mounts
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  // ─── Debounced Code Save ───
  // Computes diff and sends CODE_SAVE event to Φ
  const saveCodeDiff = useCallback(
    async (newCode) => {
      const oldCode = previousCodeRef.current;

      // Skip if no actual change
      if (newCode === oldCode) return;

      // Compute unified diff
      const diffText = createPatch("main.py", oldCode, newCode, "previous", "current");

      // Count lines added/removed
      const lines = diffText.split("\n");
      const linesAdded = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
      const linesRemoved = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;

      // Send CODE_SAVE event to Φ (fire and forget, don't block the editor)
      try {
        await sendEvent(sessionId, "CODE_SAVE", {
          filename: "main.py",
          diff_text: diffText,
          lines_added: linesAdded,
          lines_removed: linesRemoved,
          full_snapshot: newCode,
        });
      } catch (error) {
        console.warn("Failed to log CODE_SAVE event:", error);
      }

      // Update the previous code snapshot
      previousCodeRef.current = newCode;
    },
    [sessionId]
  );

  // ─── onChange Handler with Debounce ───
  const handleCodeChange = useCallback(
    (value) => {
      // Always update the parent state immediately (so typing feels instant)
      onCodeChange(value);

      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set a new timer: fire after 3 seconds of no typing
      debounceTimerRef.current = setTimeout(() => {
        saveCodeDiff(value);
      }, 3000);
    },
    [onCodeChange, saveCodeDiff]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="code-editor-container">
      {/* Editor Header */}
      <div className="editor-header">
        <span className="editor-tab">
          <span className="file-icon">🐍</span>
          main.py
        </span>
        <span className="editor-language">Python</span>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="calc(100% - 40px)"
        language="python"
        theme="vs-dark"
        value={code || STARTER_CODE}
        onChange={handleCodeChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          lineNumbers: "on",
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
}

export default CodeEditor;
