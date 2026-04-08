/**
 * Frontend (Pyodide) Test Suite for Easy 5-Function Calculator
 * Must match the active task contract:
 * add, subtract, multiply, divide, percent
 * Constraints: invalid inputs -> "invalid", zero divisor for divide/percent -> "inf"
 */

export const TEST_SUITE_CODE = `
# ─────────────────────────────────────────────────────────────
# Easy Calculator Test Suite (Pyodide)
# ─────────────────────────────────────────────────────────────

# Required symbols check
required_functions = ["add", "subtract", "multiply", "divide", "percent"]
for fn in required_functions:
    _test_count += 1
    if fn in globals() and callable(globals()[fn]):
        _test_results.add_pass(f"require_{fn}")
        print(f"✅ require_{fn}")
    else:
        _test_results.add_fail(f"require_{fn}", f"Missing function: {fn}")
        print(f"❌ require_{fn}: Missing function: {fn}")

# Helper

def _run_assert(name, condition, message):
    global _test_count
    _test_count += 1
    if condition:
        _test_results.add_pass(name)
        print(f"✅ {name}")
    else:
        _test_results.add_fail(name, message)
        print(f"❌ {name}: {message}")

# Core arithmetic
try:
    _run_assert("test_add_basic", add(2, 3) == 5, f"Expected 5 got {add(2, 3)}")
except Exception as e:
    _run_assert("test_add_basic", False, str(e))

try:
    _run_assert("test_subtract_basic", subtract(10, 4) == 6, f"Expected 6 got {subtract(10, 4)}")
except Exception as e:
    _run_assert("test_subtract_basic", False, str(e))

try:
    _run_assert("test_multiply_basic", multiply(6, 7) == 42, f"Expected 42 got {multiply(6, 7)}")
except Exception as e:
    _run_assert("test_multiply_basic", False, str(e))

try:
    _run_assert("test_divide_basic", divide(8, 2) == 4, f"Expected 4 got {divide(8, 2)}")
except Exception as e:
    _run_assert("test_divide_basic", False, str(e))

try:
    _run_assert("test_percent_basic", percent(10, 3) == 1, f"Expected 1 got {percent(10, 3)}")
except Exception as e:
    _run_assert("test_percent_basic", False, str(e))

# Edge cases for zero divisor
try:
    _run_assert("test_divide_zero", divide(9, 0) == "inf", f"Expected 'inf' got {divide(9, 0)}")
except Exception as e:
    _run_assert("test_divide_zero", False, str(e))

try:
    _run_assert("test_percent_zero", percent(9, 0) == "inf", f"Expected 'inf' got {percent(9, 0)}")
except Exception as e:
    _run_assert("test_percent_zero", False, str(e))

# Invalid input constraints
invalid_cases = [
    ("x", 2),
    (None, 3),
    (True, 2),
]

for idx, (a, b) in enumerate(invalid_cases):
    try:
        _run_assert(f"test_add_invalid_{idx}", add(a, b) == "invalid", f"Expected 'invalid' got {add(a, b)}")
    except Exception as e:
        _run_assert(f"test_add_invalid_{idx}", False, str(e))

for idx, (a, b) in enumerate(invalid_cases):
    try:
        _run_assert(f"test_multiply_invalid_{idx}", multiply(a, b) == "invalid", f"Expected 'invalid' got {multiply(a, b)}")
    except Exception as e:
        _run_assert(f"test_multiply_invalid_{idx}", False, str(e))

# Float and negative checks
try:
    _run_assert("test_add_float", add(1.5, 2.5) == 4.0, f"Expected 4.0 got {add(1.5, 2.5)}")
except Exception as e:
    _run_assert("test_add_float", False, str(e))

try:
    _run_assert("test_subtract_negative", subtract(3, 10) == -7, f"Expected -7 got {subtract(3, 10)}")
except Exception as e:
    _run_assert("test_subtract_negative", False, str(e))
`;
