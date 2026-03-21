import subprocess
import tempfile
import os
import re
from app.services.event_service import log_event


# ─── Test Execution Service ───
#
# 📚 What this does:
# Runs the candidate's Python code against a pre-written test suite.
# This is how Functional Completeness (Pillar E) is auto-computed.
#
# 💡 Approach (simple for prototype):
# 1. Write candidate code to a temp directory as candidate_code.py
# 2. Copy the test file into the same temp directory
# 3. Set CANDIDATE_FILE env var so the test can find it
# 4. Run pytest from that directory


# Path to the pre-written test suite
TEST_SUITE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "tests",
    "library_tests.py"
)


async def run_tests(session_id: str, code: str) -> dict:
    """
    Execute the candidate's code against the pre-written test suite.
    
    Args:
        session_id: Which session this test run belongs to
        code: The candidate's current code as a string
    
    Returns:
        dict with tests_total, tests_passed, tests_failed, output_log
    """
    import shutil
    
    # Step 1: Create temp directory with candidate code
    temp_dir = tempfile.mkdtemp(prefix="guide_test_")
    candidate_file = os.path.join(temp_dir, "candidate_code.py")
    test_file = os.path.join(temp_dir, "test_library.py")
    
    try:
        # Write candidate code
        with open(candidate_file, "w", encoding="utf-8") as f:
            f.write(code)
        
        # Copy test suite into temp directory
        shutil.copy2(TEST_SUITE_PATH, test_file)
        
        # Step 2: Run pytest with 10-second timeout
        env = {**os.environ, "CANDIDATE_FILE": candidate_file}
        
        result = subprocess.run(
            ["python", "-m", "pytest", test_file, "-v", "--tb=short"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=temp_dir,
            env=env,
        )
        
        output = result.stdout + result.stderr
        
    except subprocess.TimeoutExpired:
        output = "⏰ Test execution timed out (10 second limit)"
    except Exception as e:
        output = f"❌ Error running tests: {str(e)}"
    finally:
        # Cleanup
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass
    
    # Step 3: Parse results
    test_results = parse_test_output(output)
    
    # Step 4: Log TEST_RUN event to Φ
    try:
        await log_event(session_id, "TEST_RUN", {
            "tests_total": test_results["tests_total"],
            "tests_passed": test_results["tests_passed"],
            "tests_failed": test_results["tests_failed"],
            "output_log": output[:2000],
        })
    except Exception as e:
        print(f"Warning: Failed to log TEST_RUN event: {e}")
    
    return {
        "session_id": session_id,
        **test_results,
        "output_log": output,
    }


def parse_test_output(output: str) -> dict:
    """Parse pytest output to extract pass/fail counts."""
    tests_passed = 0
    tests_failed = 0
    
    passed_match = re.search(r"(\d+)\s+passed", output)
    failed_match = re.search(r"(\d+)\s+failed", output)
    error_match = re.search(r"(\d+)\s+error", output)
    
    if passed_match:
        tests_passed = int(passed_match.group(1))
    if failed_match:
        tests_failed = int(failed_match.group(1))
    if error_match:
        tests_failed += int(error_match.group(1))
    
    tests_total = tests_passed + tests_failed
    
    # Fallback: count PASSED/FAILED lines
    if tests_total == 0:
        tests_passed = len(re.findall(r"PASSED", output))
        tests_failed = len(re.findall(r"FAILED", output)) + len(re.findall(r"ERROR", output))
        tests_total = tests_passed + tests_failed
    
    return {
        "tests_total": tests_total,
        "tests_passed": tests_passed,
        "tests_failed": tests_failed,
    }
