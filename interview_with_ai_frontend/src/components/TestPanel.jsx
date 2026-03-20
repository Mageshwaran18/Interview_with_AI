import { useState, useEffect } from "react";
import { sendEvent } from "../services/api";
import PyodideExecutor from "../services/PyodideExecutor";
import { TEST_SUITE_CODE } from "../services/testSuite";

/*
 ─── TestPanel Component ───
 
 📚 What this does:
 A "Run Tests" button with results display.
 When clicked, executes the candidate's code in the browser using Pyodide
 (Python WebAssembly), runs tests against it, and returns pass/fail results.
 No backend needed for test execution!
 
 🧠 What you'll learn:
 - Calling Pyodide to run Python code in the browser
 - Displaying dynamic results (pass/fail counts)
 - Conditional rendering (showing/hiding results)
 - Loading states during async operations
 - Fallback to backend if Pyodide fails
*/

function TestPanel({ sessionId, code, readOnly = false }) {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideError, setPyodideError] = useState(null);

  // Initialize Pyodide on component mount
  useEffect(() => {
    const initPyodide = async () => {
      try {
        console.log("🔧 Initializing Pyodide...");
        const executor = PyodideExecutor.getInstance();
        
        // Set a timeout for Pyodide initialization (15 seconds max)
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
        } catch (pyodideError) {
          console.warn("⚠️ Pyodide execution failed, falling back to backend:", pyodideError);
          executionMode = "backend_fallback";
        }
      }

      // Fallback to backend if Pyodide not ready or completely failed
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
            throw new Error(`Backend test failed: ${response.statusText}`);
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
        output_log: results.output_log || "",
      };

      setTestResults(formattedResults);

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

  return (
    <div className="test-panel">
      {/* Pyodide Status Indicator */}
      {!pyodideReady && !pyodideError && (
        <div className="pyodide-loading">
          <span>🔄 Initializing test engine...</span>
        </div>
      )}

      {pyodideError && (
        <div className="pyodide-error">
          <span>⚠️ Browser test engine unavailable: {pyodideError}</span>
          <span style={{ display: "block", fontSize: "12px", marginTop: "4px", color: "#8b949e" }}>
            → Tests will use backend when you click "Run Tests"
          </span>
        </div>
      )}

      <button
        className="run-tests-btn"
        onClick={handleRunTests}
        disabled={isRunning || readOnly}
        title={
          readOnly ? "Tests disabled in view-only mode" :
          pyodideError ? "Using backend test engine (Pyodide unavailable)" :
          !pyodideReady ? "Loading test engine..." : "Run tests"
        }
      >
        {isRunning ? "⏳ Running..." : "▶️ Run Tests"}
      </button>

      {testResults && (
        <div className="test-results">
          <div className="test-summary">
            <span className="test-passed">✅ {testResults.tests_passed}</span>
            <span className="test-failed">❌ {testResults.tests_failed}</span>
            <span className="test-total">/ {testResults.tests_total} total</span>
          </div>

          <button
            className="toggle-log-btn"
            onClick={() => setShowLog(!showLog)}
          >
            {showLog ? "Hide Log ▲" : "Show Log ▼"}
          </button>

          {showLog && (
            <pre className="test-output-log">{testResults.output_log}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export default TestPanel;
