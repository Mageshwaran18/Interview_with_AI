/*
 ═══════════════════════════════════════════════════════════════
 Pyodide Executor — Browser-Based Python Execution (Phase 5.2)
 ═══════════════════════════════════════════════════════════════

 What this does:
 - Loads Pyodide (Python in WebAssembly) from CDN
 - Creates a sandboxed Python environment in the browser
 - Executes candidate's code without sending to backend
 - Runs pytest against the code
 - Returns test results

 Why Pyodide over Docker:
 ✅ No backend server needed for execution
 ✅ Instant test feedback (no network latency)
 ✅ Inherent browser sandbox (security)
 ✅ Works offline
 ❌ Limited to browser capabilities (no file system access)
 ❌ Slower Python execution than native
*/

class PyodideExecutor {
  static instance = null;
  static pyodideReady = false;

  constructor() {
    this.pyodide = null;
    this.testCode = null;
  }

  /**
   * Get or create singleton instance
   */
  static getInstance() {
    if (!PyodideExecutor.instance) {
      PyodideExecutor.instance = new PyodideExecutor();
    }
    return PyodideExecutor.instance;
  }

  /**
   * Load Pyodide from CDN
   * This must be called before any code execution
   */
  async initialize() {
    if (PyodideExecutor.pyodideReady && this.pyodide) {
      return this.pyodide;
    }

    try {
      // Load Pyodide from CDN
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
      script.onload = async () => {
        // Pyodide is now available as window.loadPyodide
        this.pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
        });
        PyodideExecutor.pyodideReady = true;
        console.log("✅ Pyodide initialized successfully");
      };
      script.onerror = () => {
        throw new Error("Failed to load Pyodide");
      };
      document.head.appendChild(script);

      // Wait for initialization
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (PyodideExecutor.pyodideReady && this.pyodide) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          throw new Error("Pyodide initialization timeout");
        }, 30000);
      });

      return this.pyodide;
    } catch (error) {
      console.error("Failed to initialize Pyodide:", error);
      throw error;
    }
  }

  /**
   * Execute candidate code
   * Returns the output or error
   */
  async executeCode(code, stdoutCallback = null) {
    if (!this.pyodide) {
      throw new Error("Pyodide not initialized. Call initialize() first.");
    }

    try {
      // Capture stdout
      let output = "";
      const originalStdout = this.pyodide.sys.stdout;

      this.pyodide.sys.stdout = {
        write: (text) => {
          output += text;
          if (stdoutCallback) stdoutCallback(text);
          return text.length;
        },
      };

      // Execute code
      const result = this.pyodide.runPython(code);

      // Restore stdout
      this.pyodide.sys.stdout = originalStdout;

      return {
        success: true,
        output: output,
        result: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        result: null,
        error: error.message,
      };
    }
  }

  /**
   * Run tests using a simplified test runner (no pytest needed in Pyodide)
   * This creates a basic test framework that mimics pytest behavior
   */
  async runTests(candidateCode, testCode) {
    if (!this.pyodide) {
      throw new Error("Pyodide not initialized. Call initialize() first.");
    }

    try {
      // Step 1: Create a test runner framework in Python
      const testRunnerScript = `
import json
import traceback
from io import StringIO
import sys

# Simple test runner framework
class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def add_pass(self, test_name):
        self.passed += 1
        
    def add_fail(self, test_name, error):
        self.failed += 1
        self.errors.append(f"FAILED {test_name}: {error}")

# Create a simple fixture system
class SimpleLibrary:
    """Basic test fixture replacement"""
    def __init__(self):
        pass

# Initialize results tracker
_test_results = TestResult()
_test_count = 0

# Helper function to run a test function
def run_test(test_func, fixture=None):
    global _test_results, _test_count
    _test_count += 1
    try:
        if fixture:
            test_func(fixture)
        else:
            test_func()
        _test_results.add_pass(test_func.__name__)
        print(f"✅ {test_func.__name__}")
    except AssertionError as e:
        _test_results.add_fail(test_func.__name__, str(e))
        print(f"❌ {test_func.__name__}: {e}")
    except Exception as e:
        _test_results.add_fail(test_func.__name__, str(e))
        print(f"❌ {test_func.__name__}: {type(e).__name__}: {e}")
`;

      // Step 2: Load the test runner
      const setupResult = await this.executeCode(testRunnerScript);
      if (!setupResult.success) {
        return {
          tests_total: 0,
          tests_passed: 0,
          tests_failed: 0,
          output_log: `Test setup failed: ${setupResult.error}`,
        };
      }

      // Step 3: Load the candidate code
      let loadOutput = "";
      const candidateLoadResult = await this.executeCode(candidateCode, (text) => {
        loadOutput += text;
      });
      if (!candidateLoadResult.success) {
        return {
          tests_total: 0,
          tests_passed: 0,
          tests_failed: 0,
          output_log: `Candidate code failed: ${candidateLoadResult.error}`,
        };
      }

      // Step 4: Run the test code
      let testOutput = "";
      const testExecResult = await this.executeCode(testCode, (text) => {
        testOutput += text;
      });

      // Step 5: Retrieve results
      const getResultsScript = `
import json
result = {
    "tests_total": _test_count,
    "tests_passed": _test_results.passed,
    "tests_failed": _test_results.failed,
    "errors": _test_results.errors
}
json.dumps(result)
`;

      const resultsResult = await this.executeCode(getResultsScript);
      let results = {
        tests_total: 0,
        tests_passed: 0,
        tests_failed: 0,
        output_log: testOutput,
      };

      try {
        const parsedResults = JSON.parse(resultsResult.result || "{}");
        results = {
          tests_total: parsedResults.tests_total || 0,
          tests_passed: parsedResults.tests_passed || 0,
          tests_failed: parsedResults.tests_failed || 0,
          output_log: testOutput,
        };
      } catch (e) {
        // If can't parse, use fallback counting
        const passCount = (testOutput.match(/✅/g) || []).length;
        const failCount = (testOutput.match(/❌/g) || []).length;
        results = {
          tests_total: passCount + failCount,
          tests_passed: passCount,
          tests_failed: failCount,
          output_log: testOutput,
        };
      }

      return results;
    } catch (error) {
      return {
        tests_total: 0,
        tests_passed: 0,
        tests_failed: 0,
        output_log: `Test execution failed: ${error.message}`,
      };
    }
  }

  /**
   * Clear Python environment
   * Useful for resetting state between runs
   */
  async reset() {
    if (this.pyodide) {
      this.pyodide.runPython("import sys; sys.reset()");
    }
  }
}

export default PyodideExecutor;
