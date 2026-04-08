import time
import traceback
import types
from app.services.event_service import log_event


SAMPLE_TESTS = [
    {
        "id": "TC-S01",
        "label": "add() basic",
        "visible": True,
        "code": "assert add(2, 3) == 5",
    },
    {
        "id": "TC-S02",
        "label": "subtract() basic",
        "visible": True,
        "code": "assert subtract(10, 4) == 6",
    },
    {
        "id": "TC-S03",
        "label": "divide() zero handling",
        "visible": True,
        "code": "assert divide(7, 0) == 'inf'",
    },
    {
        "id": "TC-S04",
        "label": "percent() basic",
        "visible": True,
        "code": "assert percent(10, 3) == 1",
    },
]

VALIDATION_TESTS = [
    {"id": "TC-V01", "label": "multiply() basic", "visible": False, "code": "assert multiply(6, 7) == 42"},
    {"id": "TC-V02", "label": "float add", "visible": False, "code": "assert add(1.5, 2.5) == 4.0"},
    {"id": "TC-V03", "label": "negative subtract", "visible": False, "code": "assert subtract(3, 10) == -7"},
    {"id": "TC-V04", "label": "divide floats", "visible": False, "code": "assert divide(7.5, 2.5) == 3.0"},
    {"id": "TC-V05", "label": "string invalid", "visible": False, "code": "assert add('a', 2) == 'invalid'"},
    {"id": "TC-V06", "label": "None invalid", "visible": False, "code": "assert multiply(None, 2) == 'invalid'"},
    {"id": "TC-V07", "label": "bool invalid", "visible": False, "code": "assert divide(True, 2) == 'invalid'"},
    {"id": "TC-V08", "label": "percent zero handling", "visible": False, "code": "assert percent(10, 0) == 'inf'"},
]

BUG_PROBE_TESTS = [
    {
        "id": "TC-B01",
        "label": "divide checks zero first",
        "visible": False,
        "code": """
try:
    out = divide(5, 0)
    assert out == 'inf'
except ZeroDivisionError:
    raise AssertionError('divide() raised ZeroDivisionError instead of returning inf')
""",
    },
    {
        "id": "TC-B02",
        "label": "invalid input handling is consistent",
        "visible": False,
        "code": """
assert add('x', 1) == 'invalid'
assert subtract(None, 1) == 'invalid'
assert multiply(True, 1) == 'invalid'
""",
    },
    {
        "id": "TC-B03",
        "label": "percent uses modulus semantics",
        "visible": False,
        "code": "assert percent(13, 5) == 3",
    },
]

REGRESSION_TESTS = [
    {"id": "TC-R01", "label": "large multiply", "visible": False, "code": "assert multiply(100000, 100000) == 10000000000"},
    {"id": "TC-R02", "label": "negative divide", "visible": False, "code": "assert divide(-8, 2) == -4"},
    {"id": "TC-R03", "label": "zero add", "visible": False, "code": "assert add(0, 0) == 0"},
]

ALL_TEST_CASES = SAMPLE_TESTS + VALIDATION_TESTS + BUG_PROBE_TESTS + REGRESSION_TESTS



def _load_candidate_module(code_str: str):
    mod = types.ModuleType("candidate")
    compiled = compile(code_str, "<candidate_code>", "exec")
    exec(compiled, mod.__dict__)
    return mod



def run_tests(code: str, session_id: str) -> dict:
    results = []

    try:
        mod = _load_candidate_module(code)
    except SyntaxError as exc:
        _emit_test_run_event(session_id, 0, len(ALL_TEST_CASES), [])
        return {
            "session_id": session_id,
            "total": len(ALL_TEST_CASES),
            "passed": 0,
            "failed": len(ALL_TEST_CASES),
            "fc_score": 0.0,
            "error": f"SyntaxError in submitted code: {exc}",
            "results": [],
            "tests_total": len(ALL_TEST_CASES),
            "tests_passed": 0,
            "tests_failed": len(ALL_TEST_CASES),
            "output_log": f"SyntaxError in submitted code: {exc}",
        }

    base_globals = {
        "add": getattr(mod, "add", None),
        "subtract": getattr(mod, "subtract", None),
        "multiply": getattr(mod, "multiply", None),
        "divide": getattr(mod, "divide", None),
        "percent": getattr(mod, "percent", None),
    }

    missing = [fn for fn, value in base_globals.items() if value is None]
    if missing:
        error_msg = f"Missing required functions: {', '.join(missing)}"
        _emit_test_run_event(session_id, 0, len(ALL_TEST_CASES), [])
        return {
            "session_id": session_id,
            "total": len(ALL_TEST_CASES),
            "passed": 0,
            "failed": len(ALL_TEST_CASES),
            "fc_score": 0.0,
            "error": error_msg,
            "results": [],
            "tests_total": len(ALL_TEST_CASES),
            "tests_passed": 0,
            "tests_failed": len(ALL_TEST_CASES),
            "output_log": error_msg,
        }

    for tc in ALL_TEST_CASES:
        start = time.perf_counter()
        scope = dict(base_globals)

        try:
            exec(compile(tc["code"].strip(), f"<{tc['id']}>", "exec"), scope)
            results.append(
                {
                    "id": tc["id"],
                    "label": tc["label"],
                    "status": "PASS",
                    "visible": tc["visible"],
                    "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                }
            )
        except AssertionError as exc:
            results.append(
                {
                    "id": tc["id"],
                    "label": tc["label"],
                    "status": "FAIL",
                    "visible": tc["visible"],
                    "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                    "message": str(exc) if tc["visible"] else _generic_hint(tc["id"]),
                }
            )
        except Exception:
            results.append(
                {
                    "id": tc["id"],
                    "label": tc["label"],
                    "status": "ERROR",
                    "visible": tc["visible"],
                    "duration_ms": round((time.perf_counter() - start) * 1000, 2),
                    "message": traceback.format_exc(limit=3)
                    if tc["visible"]
                    else "A hidden test raised an unexpected exception.",
                }
            )

    passed = sum(1 for r in results if r["status"] == "PASS")
    total = len(ALL_TEST_CASES)
    failed = total - passed
    fc_score = round(passed / total, 4)

    _emit_test_run_event(session_id, passed, total, results)

    return {
        "session_id": session_id,
        "total": total,
        "passed": passed,
        "failed": failed,
        "fc_score": fc_score,
        "results": results,
        "tests_total": total,
        "tests_passed": passed,
        "tests_failed": failed,
        "output_log": _build_output_log(results, passed, total),
    }



def _generic_hint(test_id: str) -> str:
    if test_id.startswith("TC-V"):
        return "A hidden validation test failed. Recheck input constraints."
    if test_id.startswith("TC-B"):
        return "A hidden behavior test failed. Recheck edge-case rules."
    if test_id.startswith("TC-R"):
        return "A hidden regression test failed."
    return "A hidden test failed."



def _build_output_log(results: list, passed: int, total: int) -> str:
    lines = [f"Summary: {passed}/{total} tests passed"]
    visible = [r for r in results if r.get("visible")]
    hidden_total = sum(1 for r in results if not r.get("visible"))
    hidden_passed = sum(1 for r in results if not r.get("visible") and r.get("status") == "PASS")

    for row in visible:
        status_icon = "PASS" if row["status"] == "PASS" else row["status"]
        detail = f" - {row.get('message')}" if row.get("message") else ""
        lines.append(f"{row['id']} [{status_icon}] {row['label']}{detail}")

    if hidden_total:
        lines.append(f"Hidden tests: {hidden_passed}/{hidden_total} passed")

    return "\n".join(lines)



def _emit_test_run_event(session_id: str, passed: int, total: int, results: list):
    bug_results = {r["id"]: r["status"] for r in results if r["id"].startswith("TC-B")}
    failed = total - passed
    payload = {
        "passed": passed,
        "total": total,
        "failed": failed,
        "fc_score": round(passed / total, 4) if total > 0 else 0.0,
        "bug_probe_results": bug_results,
        "tests_passed": passed,
        "tests_total": total,
        "tests_failed": failed,
        "test_suite": "easy_arithmetic_v1",
    }
    log_event(session_id, "TEST_RUN", payload)
