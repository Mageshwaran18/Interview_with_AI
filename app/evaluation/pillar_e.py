"""
Pillar E: End Result Quality Pipeline

📚 What this measures:
The quality of the candidate's final submitted code — functional
correctness, code quality, documentation, architecture, and security.

Metrics:
- FC (Functional Completeness): tests_passed / total_tests from final run
- CQS (Code Quality Score): Analyze code for PEP 8 and best practices
- SS (Security Score): Run Bandit for vulnerabilities or heuristic analysis
- DQ (Documentation Quality): Comment and docstring coverage
- AC (Architectural Coherence): LLM-as-Judge on design patterns

Aggregate: E = 0.25×FC + 0.20×SS + 0.20×CQS + 0.15×DQ + 0.20×AC
"""

import re
import json
import subprocess
import logging
from app.database import events_collection
from app.evaluation.llm_judge import judge_with_voting

logger = logging.getLogger(__name__)


async def compute_fc(session_id: str) -> dict:
    """
    Functional Completeness: tests_passed / total_tests
    from the FINAL test run of the session.

    This is the ultimate measure — did the code actually work?
    """
    # Get the last TEST_RUN event
    last_test = events_collection.find_one(
        {"session_id": session_id, "event_type": "TEST_RUN"},
        sort=[("timestamp", -1)]
    )

    if not last_test:
        return {
            "score": 0.0,
            "tests_passed": 0,
            "tests_total": 0,
            "reasoning": "No test runs found — cannot measure completeness"
        }

    payload = last_test.get("payload", {})
    total = payload.get("tests_total", 0)
    passed = payload.get("tests_passed", 0)

    if total == 0:
        return {
            "score": 0.0,
            "tests_passed": 0,
            "tests_total": 0,
            "reasoning": "No tests executed in final run"
        }

    fc = (passed / total) * 100

    return {
        "score": round(fc, 1),
        "tests_passed": passed,
        "tests_total": total,
        "tests_failed": payload.get("tests_failed", 0),
        "pass_rate": round(passed / total, 4),
    }


async def compute_cqs(session_id: str) -> dict:
    """
    Code Quality Score: Analyze the final code snapshot for
    common quality indicators.

    Since we can't run pylint in the prototype (no subprocess access
    to candidate code), we use heuristic analysis:
    - Naming conventions (snake_case for functions, PascalCase for classes)
    - Line length compliance (< 120 chars)
    - Function length (< 30 lines ideal)
    - No bare except clauses
    - Proper indentation consistency

    Normalized to 0-100 scale.
    """
    # Get the last CODE_SAVE with a full snapshot
    last_save = events_collection.find_one(
        {"session_id": session_id, "event_type": "CODE_SAVE"},
        sort=[("timestamp", -1)]
    )

    if not last_save:
        return {
            "score": 50.0,
            "issues": [],
            "reasoning": "No code snapshot available — using neutral score"
        }

    code = last_save.get("payload", {}).get("full_snapshot", "")
    if not code or len(code.strip()) < 20:
        return {
            "score": 50.0,
            "issues": [],
            "reasoning": "Code snapshot too short to analyze"
        }

    lines = code.split("\n")
    total_lines = len(lines)
    issues = []
    deductions = 0

    # --- Check 1: Line length ---
    long_lines = sum(1 for line in lines if len(line.rstrip()) > 120)
    if long_lines > 0:
        pct = long_lines / total_lines
        if pct > 0.15:
            deductions += 10
            issues.append(f"{long_lines} lines exceed 120 characters ({pct:.0%})")
        else:
            deductions += 3
            issues.append(f"{long_lines} lines exceed 120 characters")

    # --- Check 2: Function naming (snake_case) ---
    func_defs = re.findall(r'def\s+(\w+)\s*\(', code)
    bad_names = [f for f in func_defs if f != f.lower() and not f.startswith("_")]
    if bad_names:
        deductions += min(10, len(bad_names) * 2)
        issues.append(f"Non-snake_case functions: {', '.join(bad_names[:5])}")

    # --- Check 3: Class naming (PascalCase) ---
    class_defs = re.findall(r'class\s+(\w+)', code)
    bad_classes = [c for c in class_defs if c[0].islower()]
    if bad_classes:
        deductions += min(5, len(bad_classes) * 2)
        issues.append(f"Non-PascalCase classes: {', '.join(bad_classes[:5])}")

    # --- Check 4: Bare except clauses ---
    bare_excepts = len(re.findall(r'except\s*:', code))
    if bare_excepts > 0:
        deductions += bare_excepts * 3
        issues.append(f"{bare_excepts} bare except clause(s) — should specify exception type")

    # --- Check 5: Function length ---
    # Split code into functions and check line counts
    func_starts = [(m.start(), m.group(1)) for m in re.finditer(r'def\s+(\w+)\s*\(', code)]
    long_funcs = []
    for i, (start, name) in enumerate(func_starts):
        if i + 1 < len(func_starts):
            end = func_starts[i + 1][0]
        else:
            end = len(code)
        func_body = code[start:end]
        func_lines = len(func_body.strip().split("\n"))
        if func_lines > 30:
            long_funcs.append(f"{name} ({func_lines} lines)")

    if long_funcs:
        deductions += min(10, len(long_funcs) * 3)
        issues.append(f"Long functions: {', '.join(long_funcs[:3])}")

    # --- Check 6: Magic numbers ---
    magic_numbers = re.findall(r'(?<!["\'])\b(?:(?<!=\s)(?<!\w)(\d{2,}))\b(?!["\'])', code)
    # Filter out common numbers like line numbers, indices
    significant_magic = [n for n in magic_numbers if int(n) > 10 and n not in ("100", "255")]
    if len(significant_magic) > 5:
        deductions += 5
        issues.append(f"{len(significant_magic)} potential magic numbers found")

    # --- Check 7: Consistent indentation ---
    indent_types = set()
    for line in lines:
        if line and line[0] == " ":
            leading_spaces = len(line) - len(line.lstrip())
            if leading_spaces > 0:
                indent_types.add(leading_spaces % 4 == 0)
        elif line and line[0] == "\t":
            indent_types.add("tab")

    if "tab" in indent_types and True in indent_types:
        deductions += 5
        issues.append("Mixed tabs and spaces")

    # --- Final Score ---
    score = max(10.0, 100.0 - deductions)

    return {
        "score": round(score, 1),
        "total_lines": total_lines,
        "issues_found": len(issues),
        "issues": issues[:10],
        "deductions": deductions,
    }


async def compute_dq(session_id: str) -> dict:
    """
    Documentation Quality: Measures comment-to-code ratio
    and docstring presence in functions/classes.

    Scoring:
    - Comment ratio: 10-25% is sweet spot → 50 points max
    - Docstring coverage: each documented function → 50 points max
    """
    last_save = events_collection.find_one(
        {"session_id": session_id, "event_type": "CODE_SAVE"},
        sort=[("timestamp", -1)]
    )

    if not last_save:
        return {
            "score": 50.0,
            "comment_ratio": 0,
            "docstring_coverage": 0,
            "reasoning": "No code snapshot available"
        }

    code = last_save.get("payload", {}).get("full_snapshot", "")
    if not code or len(code.strip()) < 20:
        return {
            "score": 50.0,
            "comment_ratio": 0,
            "docstring_coverage": 0,
            "reasoning": "Code snapshot too short"
        }

    lines = code.split("\n")
    total_lines = len([l for l in lines if l.strip()])  # Non-blank lines

    if total_lines == 0:
        return {
            "score": 50.0,
            "comment_ratio": 0,
            "docstring_coverage": 0,
            "reasoning": "No non-blank lines"
        }

    # --- Comment ratio ---
    comment_lines = sum(1 for l in lines if l.strip().startswith("#"))
    comment_ratio = comment_lines / total_lines if total_lines > 0 else 0

    # Sweet spot: 10-25%
    if 0.10 <= comment_ratio <= 0.25:
        comment_score = 50.0
    elif comment_ratio < 0.10:
        comment_score = (comment_ratio / 0.10) * 50.0
    else:
        # Too many comments is slightly penalized
        comment_score = max(30.0, 50.0 - (comment_ratio - 0.25) * 100)

    # --- Docstring coverage ---
    func_defs = re.findall(r'def\s+\w+\s*\(', code)
    total_funcs = len(func_defs)

    # Count docstrings (triple-quoted strings right after def)
    docstring_count = len(re.findall(
        r'def\s+\w+\s*\([^)]*\)\s*(?:->\s*\w+)?\s*:\s*\n\s+"""',
        code
    ))
    # Also count single-quote docstrings
    docstring_count += len(re.findall(
        r"def\s+\w+\s*\([^)]*\)\s*(?:->\s*\w+)?\s*:\s*\n\s+'''",
        code
    ))

    if total_funcs > 0:
        docstring_coverage = min(1.0, docstring_count / total_funcs)
    else:
        docstring_coverage = 0.5  # Neutral if no functions

    docstring_score = docstring_coverage * 50.0

    # Combined score
    score = comment_score + docstring_score

    return {
        "score": round(score, 1),
        "comment_ratio": round(comment_ratio, 4),
        "comment_lines": comment_lines,
        "total_code_lines": total_lines,
        "functions_found": total_funcs,
        "functions_documented": docstring_count,
        "docstring_coverage": round(docstring_coverage, 4),
    }


async def compute_ac(session_id: str) -> dict:
    """
    Architectural Coherence: LLM-as-Judge evaluates the final
    code for separation of concerns, modularity, design patterns,
    and overall structure.
    """
    last_save = events_collection.find_one(
        {"session_id": session_id, "event_type": "CODE_SAVE"},
        sort=[("timestamp", -1)]
    )

    if not last_save:
        return {
            "score": 50.0,
            "reasoning": "No code snapshot available for architectural analysis"
        }

    code = last_save.get("payload", {}).get("full_snapshot", "")
    if not code or len(code.strip()) < 50:
        return {
            "score": 50.0,
            "reasoning": "Code too short for architectural analysis"
        }

    # Truncate if very long (to avoid token limits)
    if len(code) > 8000:
        code = code[:8000] + "\n# ... (truncated for analysis)"

    judge_prompt = f"""You are evaluating the architectural quality of a Python Library Management System implementation.

Code to evaluate:
```python
{code}
```

Rate the code from 1-10 on each dimension:
(a) Separation of Concerns — Are different responsibilities cleanly separated?
(b) Modularity — Can components be reused or modified independently?
(c) Design Patterns — Are appropriate patterns used (e.g., classes, encapsulation)?
(d) Error Handling — Are edge cases and errors handled gracefully?
(e) Extensibility — How easy would it be to add new features?

Scoring guide:
- 1-3: Monolithic, everything in one function, no structure
- 4-6: Basic structure (one class), some separation, minimal error handling
- 7-8: Good OOP design, clear methods, proper error handling, readable
- 9-10: Professional-grade, patterns like Repository/Service, comprehensive

Return ONLY a JSON object:
{{"score_a": <1-10>, "score_b": <1-10>, "score_c": <1-10>, "score_d": <1-10>, "score_e": <1-10>, "score": <average>, "reasoning": "<brief explanation>"}}"""

    result = await judge_with_voting(judge_prompt)

    judge_score = result.get("score", 5.0)
    normalized = (judge_score / 10.0) * 100

    return {
        "score": round(min(100.0, normalized), 1),
        "judge_score": judge_score,
        "reasoning": result.get("reasoning", ""),
        "sub_scores": {
            "separation_of_concerns": result.get("score_a", 0),
            "modularity": result.get("score_b", 0),
            "design_patterns": result.get("score_c", 0),
            "error_handling": result.get("score_d", 0),
            "extensibility": result.get("score_e", 0),
        }
    }


async def compute_ss(session_id: str) -> dict:
    """
    Security Score: Run Bandit on the final code snapshot to detect
    potential security vulnerabilities.
    
    Bandit ratings:
    - HIGH severity: -20 points each
    - MEDIUM severity: -5 points each
    - LOW severity: -1 point each
    
    Formula: SS = max(0, 100 - (high×20 + medium×5 + low×1))
    
    If Bandit is not available, uses heuristic security analysis on common issues:
    - SQL injection patterns
    - Hardcoded credentials
    - Insecure random usage
    - Eval/exec usage
    - Weak cryptography
    """
    last_save = events_collection.find_one(
        {"session_id": session_id, "event_type": "CODE_SAVE"},
        sort=[("timestamp", -1)]
    )

    if not last_save:
        return {
            "score": 50.0,
            "method": "unavailable",
            "reasoning": "No code snapshot available for security analysis"
        }

    code = last_save.get("payload", {}).get("full_snapshot", "")
    if not code or len(code.strip()) < 20:
        return {
            "score": 50.0,
            "method": "unavailable",
            "reasoning": "Code snapshot too short to analyze"
        }

    # Try using Bandit if available
    try:
        import tempfile
        import os
        
        # Write code to temp file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_path = f.name
        
        try:
            # Run Bandit and capture JSON output
            result = subprocess.run(
                ['bandit', '-f', 'json', temp_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            output = json.loads(result.stdout)
            results = output.get('results', [])
            
            # Count issues by severity
            high_count = sum(1 for r in results if r.get('severity') == 'HIGH')
            medium_count = sum(1 for r in results if r.get('severity') == 'MEDIUM')
            low_count = sum(1 for r in results if r.get('severity') == 'LOW')
            
            # Calculate score
            deductions = (high_count * 20) + (medium_count * 5) + (low_count * 1)
            ss_score = max(0.0, 100.0 - deductions)
            
            issues = [
                f"{r.get('test_name', 'unknown')}: {r.get('issue_text', '')}"
                for r in results[:5]
            ]
            
            logger.info(f"Bandit analysis: {high_count}H {medium_count}M {low_count}L issues")
            
            return {
                "score": round(ss_score, 1),
                "method": "bandit",
                "high_severity": high_count,
                "medium_severity": medium_count,
                "low_severity": low_count,
                "total_issues": len(results),
                "issues": issues,
                "deductions": deductions
            }
            
        finally:
            # Clean up temp file
            os.unlink(temp_path)
            
    except (subprocess.TimeoutExpired, FileNotFoundError, json.JSONDecodeError) as e:
        logger.warning(f"Bandit execution failed ({type(e).__name__}), using heuristic analysis")
    except Exception as e:
        logger.warning(f"Bandit unavailable: {e}, using heuristic analysis")
    
    # --- Fallback: Heuristic security analysis ---
    issues = []
    deductions = 0
    
    # HIGH severity patterns
    # 1. Common SQL injection patterns
    sql_patterns = [
        r'query\s*\+=\s*["\'].*\{',  # query += "... {"
        r'execute\s*\(\s*["\'].*\{',  # execute("... {")
        r'SELECT\s+.*\+\s*',  # SELECT ... + (string concatenation)
    ]
    for pattern in sql_patterns:
        if re.search(pattern, code, re.IGNORECASE):
            issues.append("Potential SQL injection: string concatenation in query")
            deductions += 20
            break
    
    # 2. Hardcoded credentials
    if re.search(r'(password|pwd|secret|key|token)\s*=\s*["\'][^"\']+["\']', code, re.IGNORECASE):
        issues.append("Potential hardcoded credentials detected")
        deductions += 20
    
    # 3. Eval/exec usage
    if re.search(r'\b(eval|exec|compile|__import__)\s*\(', code):
        issues.append("Use of eval/exec/compile is a security risk")
        deductions += 20
    
    # MEDIUM severity patterns
    # 1. Insecure random (random. instead of secrets.)
    if re.search(r'import\s+random(?!ly)', code) and re.search(r'random\.(choice|randint|sample)', code):
        if not re.search(r'import\s+secrets', code):
            issues.append("Using random module for security operations (use secrets instead)")
            deductions += 5
    
    # 2. Pickle usage
    if re.search(r'\bpickle\.load', code):
        issues.append("pickle.load() can execute arbitrary code (security risk)")
        deductions += 5
    
    # 3. Assert for validation
    if re.search(r'assert\s+.+,\s+["\']', code):
        issues.append("Using assert for input validation (should use exceptions)")
        deductions += 5
    
    # LOW severity patterns
    # 1. No input validation message
    if not re.search(r'(if\s+not\s+|raise|ValueError|TypeError)', code):
        issues.append("Limited input validation patterns detected")
        deductions += 1
    
    # 2. Comments with sensitive info
    if re.search(r'#.*?(password|secret|key|token)', code, re.IGNORECASE):
        issues.append("Sensitive information in comments")
        deductions += 1
    
    # Calculate final score
    ss_score = max(0.0, 100.0 - deductions)
    
    return {
        "score": round(ss_score, 1),
        "method": "heuristic",
        "issues_found": len(set(issues)),
        "issues": issues[:5],
        "deductions": deductions,
        "note": "Using heuristic analysis (Bandit not available)"
    }


async def compute_e_score(session_id: str) -> dict:
    """
    Aggregate Pillar E score.
    E = 0.25×FC + 0.20×SS + 0.20×CQS + 0.15×DQ + 0.20×AC
    """
    fc = await compute_fc(session_id)
    ss = await compute_ss(session_id)
    cqs = await compute_cqs(session_id)
    dq = await compute_dq(session_id)
    ac = await compute_ac(session_id)

    e_score = (
        0.25 * fc["score"] +
        0.20 * ss["score"] +
        0.20 * cqs["score"] +
        0.15 * dq["score"] +
        0.20 * ac["score"]
    )

    return {
        "pillar": "E",
        "name": "End Result Quality",
        "score": round(e_score, 1),
        "sub_metrics": {
            "FC": fc,
            "SS": ss,
            "CQS": cqs,
            "DQ": dq,
            "AC": ac,
        }
    }

