def build_phase_evaluation_prompt(
    problem_title: str,
    problem_statement: str,
    problem_constraints: str,
    phase: str,
    user_answer: str
):
    return f"""
You are a strict DSA interviewer.

Problem Title: {problem_title}
Problem Statement: {problem_statement}
Problem Constraints: {problem_constraints}
Current Phase: {phase}
Candidate Answer: {user_answer}

Rules:
1. Evaluate only the current phase.
2. Consider the constraints before judging correctness.
3. Do not move to next phase if answer is weak, incorrect, or does not satisfy constraints.
4. Do not give hints unless user explicitly asks.
5. Return structured feedback.
"""