import { useState, useEffect, useRef, useCallback } from "react";
import { sendEvent } from "../services/api";
import PyodideExecutor from "../services/PyodideExecutor";
import { TEST_SUITE_CODE } from "../services/testSuite";

/*
 ─── TestPanel Component (Rewritten) ───
 
 📚 Features:
 - "Run Tests" button with immediate pass/fail summary
 - Draggable floating log panel with detailed test output
 - Per-test breakdown with color-coded pass/fail lines
 - Fallback to backend if Pyodide unavailable
*/

function TestPanel({ sessionId, code, readOnly = false }) {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideError, setPyodideError] = useState(null);

  // ─── Draggable Log Panel State ───
  const [logPos, setLogPos] = useState({ x: 120, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const logPanelRef = useRef(null);

  // Initialize Pyodide on component mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log("🔧 Initializing Pyodide...");
        const executor = PyodideExecutor.getInstance();

        const initPromise = executor.initialize();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Pyodide initialization timeout (60s)")), 60000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        setPyodideReady(true);
        console.log("✅ Pyodide ready for test execution");
      } catch (error) {
        console.error("❌ Failed to initialize Pyodide:", error);
        setPyodideError(error.message);
        setPyodideReady(false);
        console.log("ℹ️ Will use backend for test execution");
      }
    };

    initPyodide();
  }, []);

  // ─── Drag Handlers ───
  const handleMouseDown = useCallback((e) => {
    // Only drag from header area
    if (!e.target.closest(".test-log-header")) return;
    setIsDragging(true);
    const rect = logPanelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      setLogPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ─── Run Tests ───
  const handleRunTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestResults(null);

    try {
      let results = null;
      let executionMode = "unknown";

      // Try Pyodide first (browser execution)
      if (pyodideReady) {
        try {
          console.log("🧪 Running tests with Pyodide...");
          const executor = PyodideExecutor.getInstance();
          results = await executor.runTests(code, TEST_SUITE_CODE);
          executionMode = "pyodide";
          console.log("✅ Pyodide test execution successful");
        } catch (pyoErr) {
          console.warn("⚠️ Pyodide execution failed, falling back to backend:", pyoErr);
          executionMode = "backend_fallback";
        }
      }

      // Fallback to backend
      if (!results) {
        try {
          console.log("🔄 Using backend test execution...");
          const response = await fetch("/api/run-tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              code: code,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend test failed (${response.status}): ${errorText}`);
          }

          results = await response.json();
          executionMode = executionMode === "unknown" ? "backend" : executionMode;
          console.log("✅ Backend test execution successful");
        } catch (backendError) {
          console.error("❌ Backend test execution also failed:", backendError);
          if (!results) {
            results = {
              tests_total: 0,
              tests_passed: 0,
              tests_failed: 0,
              output_log: `Failed to run tests:\n- Pyodide: ${pyodideReady ? "Error" : "Not ready"}\n- Backend: ${backendError.message}`,
            };
          }
        }
      }

      // Format results
      const formattedResults = {
        tests_total: results.tests_total || 0,
        tests_passed: results.tests_passed || 0,
        tests_failed: results.tests_failed || 0,
        output_log: results.output_log || "No output captured",
      };

      setTestResults(formattedResults);

      // Auto-show log if there are failures
      if (formattedResults.tests_failed > 0) {
        setShowLog(true);
      }

      // Log TEST_RUN event
      try {
        await sendEvent(sessionId, "TEST_RUN", {
          tests_total: formattedResults.tests_total,
          tests_passed: formattedResults.tests_passed,
          tests_failed: formattedResults.tests_failed,
          execution_mode: executionMode,
        });
      } catch (e) {
        console.warn("Failed to log TEST_RUN event:", e);
      }
    } catch (error) {
      console.error("Test execution error:", error);
      setTestResults({
        tests_total: 0,
        tests_passed: 0,
        tests_failed: 0,
        output_log: `⚠️ Error running tests: ${error.message}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // ─── Parse output_log into individual test lines ───
  const parseLogLines = (log) => {
    if (!log) return [];
    return log
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line, idx) => {
        const trimmed = line.trim();
        let status = "neutral";
        if (trimmed.startsWith("✅") || trimmed.includes("PASSED")) status = "pass";
        else if (trimmed.startsWith("❌") || trimmed.includes("FAILED") || trimmed.includes("ERROR")) status = "fail";
        else if (trimmed.startsWith("[Python Error]")) status = "error";
        return { id: idx, text: trimmed, status };
      });
  };

  return (
    <>
      <div className="test-panel">
        {/* Pyodide Status */}
        {!pyodideReady && !pyodideError && (
          <div className="pyodide-loading">
            <span>🔄 Initializing test engine...</span>
          </div>
        )}

        {pyodideError && (
          <div className="pyodide-error">
            <span>⚠️ Browser engine unavailable</span>
            <span className="pyodide-error-hint">→ Using backend</span>
          </div>
        )}

        <button
          className="run-tests-btn"
          onClick={handleRunTests}
          disabled={isRunning || readOnly}
          title={
            readOnly
              ? "Tests disabled in view-only mode"
              : pyodideError
              ? "Using backend test engine"
              : !pyodideReady
              ? "Loading test engine..."
              : "Run tests"
          }
        >
          {isRunning ? "⏳ Running..." : "▶️ Run Tests"}
        </button>

        {testResults && (
          <div className="test-results">
            <div className="test-summary">
              <span className="test-badge test-badge-passed">✅ {testResults.tests_passed} passed</span>
              <span className="test-badge test-badge-failed">❌ {testResults.tests_failed} failed</span>
              <span className="test-total">/ {testResults.tests_total} total</span>
            </div>

            <button
              className="toggle-log-btn"
              onClick={() => setShowLog(!showLog)}
            >
              {showLog ? "Hide Log ▲" : "Show Log ▼"}
            </button>
          </div>
        )}
      </div>

      {/* ─── Draggable Floating Log Panel ─── */}
      {showLog && testResults && (
        <div
          ref={logPanelRef}
          className="test-log-overlay"
          style={{
            left: `${logPos.x}px`,
            top: `${logPos.y}px`,
            cursor: isDragging ? "grabbing" : "default",
          }}
          onMouseDown={handleMouseDown}
        >
          <div className="test-log-header">
            <div className="test-log-drag-handle">
              <span className="drag-grip">⠿</span>
              <span className="test-log-title">
                Test Results — {testResults.tests_passed}✅ {testResults.tests_failed}❌
              </span>
            </div>
            <button
              className="test-log-close"
              onClick={() => setShowLog(false)}
              title="Close log panel"
            >
              ✕
            </button>
          </div>

          <div className="test-log-body">
            {parseLogLines(testResults.output_log).map((line) => (
              <div key={line.id} className={`test-result-line ${line.status}`}>
                {line.text}
              </div>
            ))}
            {testResults.output_log && testResults.output_log.trim() === "" && (
              <div className="test-result-line neutral">No output captured from test execution.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TestPanel;
