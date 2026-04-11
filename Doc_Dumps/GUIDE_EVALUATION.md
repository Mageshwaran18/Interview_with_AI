# GUIDE Evaluation — How Scores Are Calculated

This document explains how the project computes GUIDE scores from a recorded interview session. It is written for junior developers who want to understand the full flow end to end.

## What is GUIDE?
GUIDE is a five-pillar rubric that grades a candidate's interaction with the AI and the resulting code:

- **G — Goal Decomposition**: Planning quality and requirement coverage.
- **U — Usage Efficiency**: How effectively the candidate uses the AI assistant.
- **I — Iteration & Refinement**: How the candidate iterates on feedback and fixes issues.
- **D — Detection & Validation**: How quickly and thoroughly the candidate validates their work.
- **E — End Result Quality**: Functional correctness and code quality of the final output.

A composite score **Q** blends these five pillars.

## Data Inputs
- All calculations read the session trace stored in MongoDB `events_collection` (see [app/schemas/event_schema.py](app/schemas/event_schema.py)).
- Event types used: `SESSION_START`, `SESSION_END`, `PROMPT`, `RESPONSE`, `CODE_SAVE`, and `TEST_RUN`.
- Each event carries a `payload` with the details needed by the metrics (diffs, snapshots, test counts, token usage, etc.).

## End-to-End Workflow
1. **Fetch events** for the session ID and compute session duration (`SESSION_START` to `SESSION_END`).
2. **Minimum effort check** ([app/evaluation/minimum_effort_validator.py](app/evaluation/minimum_effort_validator.py))
   - Enforces basic activity: at least 1 prompt (G), 5 prompts (U), 2 test runs (I), 1 test run (D), 1 code save (E), and a session lasting 30s+.
   - If violations exist, the affected pillars are marked to receive a score of 0 after computation.
3. **Compute each pillar** (G, U, I, D, E) using their pipeline modules under `app/evaluation/`.
   - Each pillar returns a numeric score and a breakdown of sub-metrics.
   - Errors per pillar are caught so the rest of the pipeline can continue.
4. **Partial evaluation handling** ([app/services/evaluation_service.py](app/services/evaluation_service.py))
   - If a pillar fails (score is `None`), it is marked unavailable.
   - Available pillars get reweighted proportionally before computing Q.
5. **Apply minimum effort penalties**
   - Pillars flagged in step 2 are set to 0 even if they produced a score.
6. **Compute composite Q**
   - Q = Σ(weight × pillar score) using the (possibly reweighted) weights.
7. **Store results**
   - Results are saved to MongoDB `evaluations_collection` with sub-metrics, minimum-effort report, partial-evaluation notice, total events, and duration.

## Pillar Formulas and Metrics
All scores are normalized to 0–100 unless noted.

### G — Goal Decomposition ([app/evaluation/pillar_g.py](app/evaluation/pillar_g.py))
Formula: `G = 0.30*DDS + 0.20*PPR + 0.35*RC + 0.15*SOS`
- **DDS** (Decomposition Depth): LLM judge checks first 3 prompts against a reference DAG of subtasks.
- **PPR** (Pre-Planning Ratio): Time before first prompt / total session; sweet spot 10–20%.
- **RC** (Requirement Coverage): Tests passed / total tests on the last test run.
- **SOS** (Subtask Ordering Score): Checks feature implementation order against reference dependencies; -10 per violation.

### U — Usage Efficiency ([app/evaluation/pillar_u.py](app/evaluation/pillar_u.py))
Formula: `U = 0.25*PSS + 0.20*PPF + 0.20*CIR + 0.20*RP + 0.15*TER`
- **PSS** (Prompt Specificity): LLM judge rates sampled prompts on clarity/context/actionability.
- **PPF** (Prompts per Feature): Prompts divided by estimated features from tests (target 1.5–2.5).
- **CIR** (Context Injection): % of prompts that reference the candidate's own code or domain terms (target ≥70%).
- **RP** (Redundancy Penalty): Penalizes highly similar consecutive prompts (SequenceMatcher > 0.85).
- **TER** (Token Efficiency): Output tokens / input tokens; higher is better.

### I — Iteration & Refinement ([app/evaluation/pillar_i.py](app/evaluation/pillar_i.py))
Formula: `I = 0.40*ERS + 0.35*AR + 0.25*RR`
- **ERS** (Error Recovery Speed): Prompts needed to move from a failing test to an improved test.
- **AR** (Acceptance Rate): How often AI code is accepted with <10% changes; sweet spot ~55%.
- **RR** (Regression Rate): 1 - (regressions / fixes) across consecutive test runs.

### D — Detection & Validation ([app/evaluation/pillar_d.py](app/evaluation/pillar_d.py))
Formula: `D = 0.50*TFR + 0.25*BDR + 0.25*HCR`
- **TFR** (Time to First Run): Minutes from session start to first test run; faster is better.
- **BDR** (Bug Detection Rate): Heuristic detection of bug-fix patterns in CODE_SAVE diffs.
- **HCR** (Hallucination Catch Rate): Heuristic rollback/removal detection between code snapshots.

### E — End Result Quality ([app/evaluation/pillar_e.py](app/evaluation/pillar_e.py))
Formula: `E = 0.25*FC + 0.20*SS + 0.20*CQS + 0.15*DQ + 0.20*AC`
- **FC** (Functional Completeness): Final test pass rate from the last test run.
- **SS** (Security Score): Bandit scan if available; otherwise heuristic security checks.
- **CQS** (Code Quality Score): Heuristics on naming, line length, function length, bare excepts, magic numbers, indentation.
- **DQ** (Documentation Quality): Comment ratio and docstring coverage.
- **AC** (Architectural Coherence): LLM judge rates separation of concerns, modularity, design patterns, error handling, extensibility.

## Composite Score Q
- Base weights: G 0.20, U 0.25, I 0.20, D 0.15, E 0.20 (see `WEIGHTS` in [app/services/evaluation_service.py](app/services/evaluation_service.py)).
- If any pillar is unavailable, weights are re-distributed proportionally across the available pillars before computing Q.
- After reweighting, Q = Σ(weight × pillar score), skipping unavailable pillars.

## Minimum Effort Enforcement
- Enforced before scoring; violations zero out the corresponding pillar(s) after computation.
- Also rejects sessions shorter than 30s by zeroing all pillars.
- A human-readable report is attached to the stored evaluation for transparency.

## LLM-as-Judge Behavior
- Used in DDS, PSS, and AC metrics via [app/evaluation/llm_judge.py](app/evaluation/llm_judge.py).
- Uses Gemini with temperature 0, structured JSON prompts, optional majority voting, caching, and retry with backoff.
- If the judge call fails due to quota or parsing, metrics fall back to neutral/zero as coded in each pillar.

## Storage and Retrieval
- Evaluations are stored in `evaluations_collection` with: pillar scores (and sub-metrics), composite Q, weight map, total events, session duration, minimum-effort report, and partial-evaluation metadata.
- Retrieval and deletion are provided by helper functions in [app/services/evaluation_service.py](app/services/evaluation_service.py).

## How to Read Results Quickly
- Check the minimum-effort report first to see if any pillars were zeroed.
- Look at the `partial_evaluation` section to see if any pillars were unavailable and how weights were re-distributed.
- Inspect each pillar's `sub_metrics` for the raw measurements behind the score.
