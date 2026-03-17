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

function TestPanel({ sessionId, code }) {
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
        await executor.initialize();
        setPyodideReady(true);
        console.log("✅ Pyodide ready for test execution");
      } catch (error) {
        console.error("❌ Failed to initialize Pyodide:", error);
        setPyodideError(error.message);
        setPyodideReady(false);
      }
    };

    initPyodide();
  }, []);

  const handleRunTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestResults(null);

    try {
      const executor = PyodideExecutor.getInstance();

      if (!pyodideReady || !executor.pyodide) {
        throw new Error(
          "Pyodide not initialized. Check browser console for details."
        );
      }

      console.log("🧪 Running tests...");
      const results = await executor.runTests(code, TEST_SUITE_CODE);

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
          execution_mode: "pyodide",
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
          <span>⚠️ Test engine unavailable: {pyodideError}</span>
        </div>
      )}

      <button
        className="run-tests-btn"
        onClick={handleRunTests}
        disabled={isRunning || !pyodideReady}
        title={
          !pyodideReady ? "Test engine is loading..." : "Run tests with Pyodide"
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
