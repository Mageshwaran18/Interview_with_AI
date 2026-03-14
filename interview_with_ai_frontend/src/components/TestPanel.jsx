import { useState } from "react";
import { runTests } from "../services/api";

/*
 ─── TestPanel Component ───
 
 📚 What this does:
 A "Run Tests" button with results display.
 When clicked, sends the candidate's code to the backend,
 which runs pytest against it and returns pass/fail results.
 
 🧠 What you'll learn:
 - Calling an API with data (candidate's code)
 - Displaying dynamic results (pass/fail counts)
 - Conditional rendering (showing/hiding results)
 - Loading states during async operations
*/

function TestPanel({ sessionId, code }) {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const handleRunTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestResults(null);

    try {
      const response = await runTests(sessionId, code);
      setTestResults(response.data);
    } catch (error) {
      setTestResults({
        tests_total: 0,
        tests_passed: 0,
        tests_failed: 0,
        output_log: `Error running tests: ${error.message}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="test-panel">
      <button
        className="run-tests-btn"
        onClick={handleRunTests}
        disabled={isRunning}
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
