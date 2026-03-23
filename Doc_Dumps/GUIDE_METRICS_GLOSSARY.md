# GUIDE Framework — Complete Metrics Glossary

**Last Updated:** March 14, 2026  
**Version:** Phase 4 (with Interactive Feedback System)

---

## Quick Reference — All 19 Metrics

| ID | Acronym | Full Form | Pillar | Weight | Purpose |
|:---|---------|-----------|--------|--------|---------|
| 1 | PPR | Pre-Planning Ratio | G | 20% | Measures time spent on initial planning |
| 2 | RC | Requirement Coverage | G | 20% | Percentage of requirements addressed |
| 3 | SOS | Subtask Ordering Score | G | 20% | Quality of execution order vs optimal DAG |
| 4 | DDS | Decomposition Depth Score | G | 20% | How well task is broken into subtasks |
| 5 | PSS | Prompt Specificity Score | U | 25% | Quality and clarity of AI prompts |
| 6 | PPF | Prompts-per-Feature | U | 25% | Efficiency of AI usage (prompts to features) |
| 7 | CIR | Context Injection Rate | U | 25% | % of prompts referencing candidate's code |
| 8 | RP | Redundancy Penalty | U | 25% | Penalizes repetitive/duplicate prompts |
| 9 | TER | Token Efficiency Ratio | U | 25% | Useful output tokens / total input tokens |
| 10 | ERS | Error Recovery Speed | I | 20% | Prompts needed to fix failed tests |
| 11 | AR | Acceptance Rate | I | 20% | % of AI outputs used without modification |
| 12 | RR | Regression Rate | I | 20% | Code stability: 1 - (regressions / fixes) |
| 13 | TFR | Time-to-First-Run | D | 15% | Minutes until first test execution |
| 14 | BDR | Bug Detection Rate | D | 15% | % of seeded bugs found before submission |
| 15 | HCR | Hallucination Catch Rate | D | 15% | % of AI mistakes caught by candidate |
| 16 | FC | Functional Completeness | E | 20% | % of features implemented & tested |
| 17 | SS | Security Score | E | 20% | Vulnerability checks & security practices |
| 18 | CQS | Code Quality Score | E | 20% | PEP 8 compliance, readability, best practices |
| 19 | DQ | Documentation Quality | E | 20% | Comment-to-code ratio (target >15%) |
| 20 | AC | Architectural Coherence | E | 20% | System design quality & maintainability |

---

## Detailed Breakdown by Pillar

### 🎯 PILLAR G: Goal Decomposition (Weight: 20%)
**Measures:** How well the candidate understands and decomposes the problem before implementation.

#### PPR — Pre-Planning Ratio
- **Definition:** Ratio of time spent before first prompt to total session time
- **Ideal Range:** 10-20% of total session time
- **Measures:** Planning process maturity
- **Computation:** (timestamp_first_prompt - session_start) / total_duration
- **Feedback:** Too little planning (chaotic), too much planning (analysis paralysis)

#### RC — Requirement Coverage
- **Definition:** Percentage of stated requirements that are implemented and tested
- **Ideal Range:** 95-100%
- **Measures:** Solution completeness
- **Computation:** tests_passed / total_tests
- **Feedback:** Missing requirements indicate incomplete understanding

#### SOS — Subtask Ordering Score
- **Definition:** How well the implementation follows the optimal task dependency order
- **Ideal Range:** 90-100 (minimal dependency violations)
- **Measures:** Execution discipline
- **Computation:** Penalty for each dependency violation = 100 - (violations × 10)
- **Feedback:** Proper ordering = better code organization

#### DDS — Decomposition Depth Score
- **Definition:** How well the candidate decomposed the task into subtasks during planning
- **Ideal Range:** 80-100 (identifies 80%+ of optimal subtasks)
- **Measures:** Problem analysis quality
- **Computation:** LLM-as-Judge on first 3 prompts; overlapping_nodes / total_reference_nodes
- **Feedback:** Deeper decomposition = better architecture

**Aggregate Formula:** G = 0.30×DDS + 0.20×PPR + 0.35×RC + 0.15×SOS

---

### ⚡ PILLAR U: Usage Efficiency (Weight: 25%)
**Measures:** How effectively the candidate collaborates with the AI assistant.

#### PSS — Prompt Specificity Score
- **Definition:** Quality of prompts based on clarity, context, and actionability
- **Ideal Range:** 80-100
- **Measures:** Communication effectiveness with AI
- **Computation:** LLM-as-Judge rates 1-10 across (a) constraint clarity, (b) context richness, (c) actionability
- **Feedback:** Generic prompts vs. well-crafted, contextual prompts

#### PPF — Prompts-per-Feature
- **Definition:** Ratio of prompts needed per feature implemented
- **Ideal Range:** 1.5-2.5 prompts per feature
- **Measures:** AI usage efficiency
- **Computation:** total_prompts / distinct_features_implemented
- **Feedback:** Too many prompts = over-reliance; too few = under-utilized AI

#### CIR — Context Injection Rate
- **Definition:** Percentage of prompts that reference the candidate's own code
- **Ideal Range:** 70%+ of prompts include code context
- **Measures:** Context awareness
- **Computation:** (prompts_with_code_refs / total_prompts) × 100
- **Feedback:** High CIR = working iteratively with actual code

#### RP — Redundancy Penalty
- **Definition:** Penalizes repetitive or duplicate prompts
- **Ideal Range:** >90 (low redundancy)
- **Measures:** Prompt variety and strategy evolution
- **Computation:** Cosine similarity check; >0.85 similarity = redundancy flag
- **Feedback:** Asking same question multiple times = inefficient

#### TER — Token Efficiency Ratio
- **Definition:** Ratio of useful output tokens to total input tokens
- **Ideal Range:** 0.6-0.8 (60-80% of AI input produces useful output)
- **Measures:** AI output utilization
- **Computation:** useful_output_tokens / (input_tokens + output_tokens)
- **Feedback:** Lower ratio = more wasted AI computation

**Aggregate Formula:** U = 0.25×PSS + 0.20×PPF + 0.20×CIR + 0.20×RP + 0.15×TER

---

### 🔄 PILLAR I: Iteration & Refinement (Weight: 20%)
**Measures:** How well the candidate learns from feedback and iterates on solutions.

#### ERS — Error Recovery Speed
- **Definition:** Number of prompts needed between a failed test and the next passing test
- **Ideal Range:** 1-2 prompts per bug fix
- **Measures:** Problem-solving agility
- **Computation:** average(prompts_between_failures_and_fixes)
- **Feedback:** Quick fix = good debugging; many prompts = slower learning

#### AR — Acceptance Rate
- **Definition:** Percentage of AI-generated code used as-is (with <10% modifications)
- **Ideal Range:** 60-75% (balance between acceptance and critical thinking)
- **Measures:** AI output quality AND candidate discernment
- **Computation:** (accepted_outputs / total_ai_outputs) × 100
- **Feedback:** Too high = blindly accepting; too low = distrusting AI

#### RR — Regression Rate
- **Definition:** Formula: 1 - (regressions / total_fixes)  
- **Ideal Range:** >0.95 (fewer than 5% regressions)
- **Measures:** Code stability after iterations
- **Computation:** When a fix causes new failures
- **Feedback:** High regressions = insufficient testing before moving on

**Aggregate Formula:** I = 0.40×ERS + 0.35×AR + 0.25×RR

---

### 🛡️ PILLAR D: Detection & Validation (Weight: 15%)
**Measures:** Candidate's approach to testing, validation, and bug detection.

#### TFR — Time-to-First-Run
- **Definition:** Minutes elapsed from session start until first test execution
- **Ideal Range:** 5-10 minutes
- **Measures:** Test-driven development discipline
- **Computation:** MIN(timestamp of any TEST_RUN event - session_start)
- **Feedback:** Too early = incomplete understanding; too late = risky coding

#### BDR — Bug Detection Rate
- **Definition:** Percentage of seeded bugs successfully identified and fixed
- **Ideal Range:** 70-90% (catches most, some intentional left to discover later)
- **Measures:** Validation thoroughness
- **Computation:** bugs_found / total_seeded_bugs × 100
- **Feedback:** Comprehensive testing = higher BDR

#### HCR — Hallucination Catch Rate
- **Definition:** Percentage of AI mistakes caught by the candidate
- **Ideal Range:** >80%
- **Measures:** Critical thinking and code skepticism
- **Computation:** (ai_errors_caught / total_ai_errors) × 100
- **Feedback:** Higher = better code review instincts

**Aggregate Formula:** D = 0.50×TFR + 0.25×BDR + 0.25×HCR

---

### ✨ PILLAR E: End Result Quality (Weight: 20%)
**Measures:** The final deliverable—does it work, is it secure, and is it well-crafted?

#### FC — Functional Completeness
- **Definition:** Percentage of requirements successfully implemented and tested
- **Ideal Range:** 95-100%
- **Measures:** Feature delivery
- **Computation:** tests_passed / total_requirement_tests × 100
- **Feedback:** Missing features = incomplete delivery

#### SS — Security Score (NEW in Phase 4)
- **Definition:** Assessment of security-conscious coding practices
- **Ideal Range:** 80-100
- **Measures:** Vulnerability awareness
- **Computation:** Checks for: input validation, no hardcoded secrets, safe library use, proper authentication, authorization
- **Feedback:** Security practices = production-ready code

#### CQS — Code Quality Score
- **Definition:** Adherence to PEP 8 style guide and Python best practices
- **Ideal Range:** 85-100
- **Measures:** Code readability and maintainability
- **Computation:** Linter analysis + manual review
- **Feedback:** Clean code = easier to maintain

#### DQ — Documentation Quality
- **Definition:** Comment-to-code ratio; presence of docstrings on all functions/classes
- **Ideal Range:** >15% comments + comprehensive docstrings
- **Measures:** Maintainability for future developers
- **Computation:** (comment_lines / total_lines) × 100 + docstring_coverage_ratio
- **Feedback:** Poor documentation = knowledge loss

#### AC — Architectural Coherence
- **Definition:** Overall system design quality, modularity, and adherence to design patterns
- **Ideal Range:** 80-100
- **Measures:** Long-term maintainability
- **Computation:** LLM-as-Judge on code structure, separation of concerns, reusability
- **Feedback:** Good architecture = scalable, testable code

**Aggregate Formula:** E = 0.25×FC + 0.20×SS + 0.20×CQS + 0.15×DQ + 0.20×AC

---

## Composite GUIDE Score (Q)

### Final Calculation
```
Q = (0.20 × G) + (0.25 × U) + (0.20 × I) + (0.15 × D) + (0.20 × E)

Where:
- G = Goal Decomposition (0-100)
- U = Usage Efficiency (0-100)
- I = Iteration & Refinement (0-100)
- D = Detection & Validation (0-100)
- E = End Result Quality (0-100)
- Q = Composite GUIDE Score (0-100)
```

### Score Interpretation
- **80-100:** Excellent — Promotable after onboarding
- **60-79:** Good — Solid hire, focused growth areas
- **40-59:** Fair — Promising but needs development
- **0-39:** Poor — Does not meet requirements

---

## Quick Search — Find Metrics by Purpose

### Planning & Understanding
- **PPR** (Pre-Planning Ratio) — How much time spent planning?
- **RC** (Requirement Coverage) — Did you understand the requirements?
- **DDS** (Decomposition Depth Score) — How well did you break down the task?

### AI Collaboration
- **PSS** (Prompt Specificity Score) — Quality of questions to AI?
- **PPF** (Prompts-per-Feature) — Efficient use of AI?
- **CIR** (Context Injection Rate) — Referencing your own code?
- **TER** (Token Efficiency Ratio) — Useful AI outputs?

### Problem Solving
- **SOS** (Subtask Ordering Score) — Logical implementation order?
- **ERS** (Error Recovery Speed) — Quick bug fixes?
- **AR** (Acceptance Rate) — Smart about AI outputs?
- **RR** (Regression Rate) — Code stability?

### Testing & Validation
- **TFR** (Time-to-First-Run) — Testing discipline?
- **BDR** (Bug Detection Rate) — Found the bugs?
- **HCR** (Hallucination Catch Rate) — Caught AI mistakes?

### Final Quality
- **FC** (Functional Completeness) — Does it work?
- **SS** (Security Score) — Production-ready?
- **CQS** (Code Quality Score) — Clean code?
- **DQ** (Documentation Quality) — Understandable?
- **AC** (Architectural Coherence) — Good design?

---

## Notes for Evaluators

### Understanding the Weights
- **Pillar U (25%)** is weighted most — AI collaboration is critical in 2026 interviews
- **Pillar G (20%), I (20%), E (20%)** are equally important — balanced skills matter
- **Pillar D (15%)** is lowest — assumes good practices as baseline

### About Score-Based Feedback
All 19 metrics have **score-dependent feedback**:
- **80-100 (Excellent):** Recognition + encouragement to maintain
- **60-79 (Good):** Identify specific improvement area
- **40-59 (Warning):** Multiple issues, prescriptive guidance
- **0-39 (Critical):** Fundamental problem, urgent action required

### Customization
Each metric's feedback can be customized by editing `feedbackGenerator.js`:
- Update score thresholds (currently 80/60/40)
- Modify feedback text for different contexts
- Add/remove metrics as GUIDE framework evolves

---

**Version History:**
- **v1.0** (March 14, 2026) — Initial glossary for Phase 4 enhancement
