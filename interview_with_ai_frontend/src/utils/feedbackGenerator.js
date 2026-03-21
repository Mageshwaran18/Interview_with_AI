/**
 * Feedback Generator — Generates specific, actionable feedback based on pillar metrics.
 * Not generic — tailored to actual scores and performance indicators.
 */

const METRIC_DEFINITIONS = {
  // Goal Decomposition (G)
  PPR: {
    name: "Planning Productivity Ratio",
    full: "Measures effectiveness of planning vs execution time",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent planning efficiency! You're spending optimal time understanding the problem before coding. Keep this balanced approach.";
      if (score >= 60)
        return "Your planning phase is adequate, but consider spending more time decomposing complex requirements upfront to reduce rework during execution.";
      if (score >= 40)
        return `Your planning is consuming ${100 - score}% too much time relative to execution. Try to identify core requirements faster and move to implementation sooner. Break large problems into tasks as you code.`;
      return "You're spending far too much time in planning with minimal execution. This suggests analysis paralysis. Set a time limit for planning, then start implementing incrementally.";
    },
  },
  RC: {
    name: "Requirement Clarity",
    full: "How well you understand and clarify requirements",
    feedback: (score) => {
      if (score >= 80)
        return "You have strong requirement clarity. You ask clarifying questions and understand edge cases well.";
      if (score >= 60)
        return "You understand most requirements, but you may have missed some edge cases or constraints. Ask more follow-up questions about boundary conditions.";
      if (score >= 40)
        return "Your requirement understanding is incomplete. You're diving into implementation without asking enough context questions. Clarify ambiguous requirements with the AI before coding.";
      return "Critical clarity issues detected. You're attempting to implement features without understanding them. Always start by clarifying: scope, constraints, edge cases, and success criteria.";
    },
  },
  SOS: {
    name: "Solution Organization Score",
    full: "How well-structured is your overall solution approach",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent solution architecture! Your code is well-organized into logical components with clear separation of concerns.";
      if (score >= 60)
        return "Your solution is reasonably organized but has some structural issues. Consider grouping related functionality and reducing interdependencies between modules.";
      if (score >= 40)
        return "Your solution lacks clear organization. Code is scattered, responsibilities aren't clearly separated. Refactor to group related logic and create clear module boundaries.";
      return "Critical structural problems. Your code appears monolithic or tangled. Start over with a clean architecture: identify entities, separate concerns, and organize by functionality.";
    },
  },
  DDS: {
    name: "Design Decision Score",
    full: "Quality of technical decisions made during implementation",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent technical decisions! Your choice of algorithms, data structures, and patterns are well-justified and efficient.";
      if (score >= 60)
        return "Your design decisions are generally sound but not optimal. Review the trade-offs: did you choose the right data structure? Could the algorithm be more efficient?";
      if (score >= 40)
        return "Several questionable design choices detected. You're using inefficient algorithms or inappropriate data structures. Discuss alternatives with the AI and analyze complexity implications.";
      return "Major design issues. Your implementation suggests poor algorithmic understanding. Consult the AI about algorithm selection, complexity analysis, and appropriate data structures.";
    },
  },

  // Usage Efficiency (U)
  PSS: {
    name: "Prompt Specification Score",
    full: "How specific and detailed your AI prompts are",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent prompt engineering! Your queries to the AI are specific, context-rich, and result in high-quality responses.";
      if (score >= 60)
        return "Your prompts are mostly good but sometimes lack sufficient context. Include more details: current code state, specific problem, constraints, and desired outcome.";
      if (score >= 40)
        return "Your prompts are too vague. Instead of 'fix this', try 'the linked list insertion is failing for duplicate values; expected order is preserved, actual order reverses. Please debug.' Be specific.";
      return "Very poor prompt quality. You're asking generic questions like 'how to debug?' Provide the AI with: error message, code snippet, expected vs actual behavior, and what you've already tried.";
    },
  },
  PPF: {
    name: "Prompt Processing Frequency",
    full: "Optimal balance between AI assistance and independent problem-solving",
    feedback: (score) => {
      if (score >= 80)
        return "Perfect balance! You're seeking AI help at strategic moments—when you need guidance or are stuck—not for every keystroke.";
      if (score >= 60)
        return "You're over-relying on the AI for common tasks. Try solving more problems independently first, then validate with the AI. This builds deeper understanding.";
      if (score >= 40)
        return "You're making excessive AI requests, often for tasks you should solve alone. Attempt the problem first, consult when stuck. This improves learning and reduces context bloat.";
      return "Extreme over-reliance on AI. You're requesting help for every minor issue. Build problem-solving skills by attempting tasks independently and only asking AI for truly difficult problems.";
    },
  },
  CIR: {
    name: "Code Implementation Rate",
    full: "Speed of translating AI suggestions into working code",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent implementation speed! You quickly translate AI suggestions into functional, integrated code without errors.";
      if (score >= 60)
        return "You're reasonably quick at implementing suggestions but make occasional mistakes. Review AI suggestions before copy-pasting; understand the code changes.";
      if (score >= 40)
        return "You're slow to implement or make frequent errors when coding AI suggestions. Read the suggestions carefully and trace through the logic before integrating into your project.";
      return "Very slow or error-prone implementations. This suggests you're not understanding the AI-suggested code. Ask for explanations and break implementations into smaller steps.";
    },
  },
  RP: {
    name: "Request Precision",
    full: "How well you communicate needs and expectations to the AI",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent precision! The AI understands your needs on the first or second request. You communicate expectations clearly.";
      if (score >= 60)
        return "You're reasonably clear but need clarification iterations. Try to anticipate what the AI needs to know and provide it upfront.";
      if (score >= 40)
        return "Your requests often need rephrasing. The AI misunderstands what you're asking. Before requesting, write down what you need: problem statement, constraints, desired output.";
      return "Very poor precision. You're making vague requests and getting irrelevant responses. Structure your requests: context, specific problem, expected output, any constraints.";
    },
  },
  TER: {
    name: "Total Execution Responsiveness",
    full: "How quickly you act on and test AI suggestions",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent responsiveness! You test AI suggestions immediately after implementation and catch issues fast.";
      if (score >= 60)
        return "You're testing suggestions but with some delay. Implement and test immediately—don't accumulate multiple changes before testing.";
      if (score >= 40)
        return "You're slow to test implementations. Test each AI suggestion right away to catch errors early. Batching changes makes debugging harder.";
      return "Very poor feedback loop. You're implementing without immediate testing, leading to cascading errors. Test after every change, especially AI-suggested code.";
    },
  },

  // Iteration & Refinement (I)
  ERS: {
    name: "Error Recognition Speed",
    full: "How quickly you identify when something isn't working",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent! You catch errors immediately through testing and quickly identify the root cause.";
      if (score >= 60)
        return "You identify most errors but sometimes miss subtle bugs. Add more test cases and edge case testing to catch issues faster.";
      if (score >= 40)
        return "You're slow to identify errors. Implement systematic testing: unit tests, edge cases, boundary conditions. Don't assume code is correct—verify it.";
      return "Poor error detection. You're pushing broken code forward without noticing. Test immediately after each change. Use print statements, assertions, and debuggers.";
    },
  },
  AR: {
    name: "Adaptation Rate",
    full: "How quickly you adjust your approach based on feedback",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent adaptability! You quickly adjust strategy when something isn't working and try new approaches.";
      if (score >= 60)
        return "You adapt reasonably well but sometimes persist with failing approaches. When something doesn't work twice, try a different strategy.";
      if (score >= 40)
        return "You're slow to abandon failing approaches. If a solution doesn't work, don't just tweak it repeatedly—consider fundamentally different strategies or ask the AI for alternatives.";
      return "Very poor adaptability. You're repeating the same failed approach multiple times. When something doesn't work, stop and reconsider the entire approach. Pivot faster.";
    },
  },
  RR: {
    name: "Refinement Responsiveness",
    full: "How thoroughly you refactor and clean up code after initial implementation",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent refactoring! After getting code working, you optimize it, improve readability, and handle edge cases thoroughly.";
      if (score >= 60)
        return "You do some cleanup but could be more thorough. After getting working code, spend time refactoring: remove duplication, improve variable names, add comments, optimize performance.";
      if (score >= 40)
        return "Minimal refinement. You're leaving 'working but messy' code. Always reserve 20-30% of time to refactor: improve naming, add documentation, optimize for maintainability.";
      return "No refinement effort. You're stopping at 'first working version'. Professional code requires polish: clean names, documentation, edge case handling, performance optimization.";
    },
  },

  // Detection & Validation (D)
  TFR: {
    name: "Test First Rate",
    full: "How many tests you write before or during implementation",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent testing approach! You're writing tests as you code, catching bugs early.";
      if (score >= 60)
        return "You test after implementation. Consider writing tests beforehand (TDD) or while coding to catch issues earlier and guide your implementation.";
      if (score >= 40)
        return "Testing is minimal. Write comprehensive test cases covering normal cases, edge cases, and error conditions. Tests should catch bugs before they reach production.";
      return "No proactive testing. You're shipping untested code. Always write tests: at least one per function, including edge cases and error scenarios.";
    },
  },
  BDR: {
    name: "Bug Detection Rate",
    full: "Percentage of bugs you find before deployment",
    feedback: (score) => {
      if (score >= 80)
        return "Outstanding! You're catching almost all bugs before release. Your validation process is thorough.";
      if (score >= 60)
        return "You're catching most bugs but some slip through. Add more edge case testing and pair-test with colleagues when possible.";
      if (score >= 40)
        return "You're missing significant bugs. Implement more rigorous testing: boundary conditions, null values, large inputs, rapid user interaction. Use a test checklist.";
      return "Critical validation gaps. You're shipping without proper testing. For every feature, test: happy path, error cases, boundaries, and invalid inputs.";
    },
  },
  HCR: {
    name: "Hallucination Check Rate",
    full: "How often you verify AI suggestions against actual documentation/behavior",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent! You verify AI suggestions thoroughly—checking documentation, API references, and testing before trusting output.";
      if (score >= 60)
        return "You spot-check AI suggestions but sometimes trust them too quickly. Always verify unfamiliar API calls and architecture decisions.";
      if (score >= 40)
        return "You're trusting AI suggestions without enough verification. Test AI code suggestions immediately and check API documentation before using suggested functions.";
      return "High risk of hallucination acceptance. You're using AI-suggested code without verification, possibly implementing non-existent functions or wrong APIs. Verify everything.";
    },
  },

  // End Result Quality (E)
  FC: {
    name: "Functionality Completeness",
    full: "All required features are implemented and working",
    feedback: (score) => {
      if (score >= 80)
        return "Perfect! All required functionality is implemented, integrated, and working correctly.";
      if (score >= 60)
        return "Most features are working but you may have missed some edge cases or secondary features. Review the requirements checklist again.";
      if (score >= 40)
        return "Several features are missing or incomplete. Return to spec and systematically implement each feature. Don't skip requirements to save time.";
      return "Critical incompleteness. Core features are missing or non-functional. Revisit requirements and implement systematically, testing each feature.";
    },
  },
  SS: {
    name: "Security Score",
    full: "Code is safe from common vulnerabilities",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent security practices! Your code handles input validation, uses secure patterns, and avoids common vulnerabilities.";
      if (score >= 60)
        return "Security is reasonable but has minor issues. Review: input validation, SQL injection protection, secure storage of sensitive data, and proper error handling.";
      if (score >= 40)
        return "Security concerns detected. You're not validating user input or using insecure patterns. Implement input validation, escape outputs, use parameterized queries, and handle errors safely.";
      return "Critical security issues. Your code is vulnerable to injection attacks, buffer overflows, or info leaks. Review OWASP Top 10 and implement security best practices immediately.";
    },
  },
  CQS: {
    name: "Code Quality Score",
    full: "Code is readable, maintainable, and well-documented",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent code quality! Your code is clean, well-named, well-documented, and easy to understand and maintain.";
      if (score >= 60)
        return "Code quality is good but could be improved. Add more comments for complex logic, use better variable names, and reduce code duplication.";
      if (score >= 40)
        return "Code quality is poor. Variable names are cryptic, functions are too long, no comments for complex logic. Refactor: break large functions into smaller ones, add documentation.";
      return "Critical quality issues. Your code is unreadable and unmaintainable. Use meaningful names, keep functions small (< 50 lines), document complex logic, and remove duplication.";
    },
  },
  DQ: {
    name: "Documentation Quality",
    full: "Code has clear documentation and comments",
    feedback: (score) => {
      if (score >= 80)
        return "Excellent documentation! Every function has a clear docstring, complex logic is commented, and the overall structure is documented.";
      if (score >= 60)
        return "Documentation is adequate but incomplete. Add docstrings to public functions and comments explaining the 'why' for complex algorithms.";
      if (score >= 40)
        return "Documentation is minimal. Add docstrings to all functions describing inputs, outputs, and exceptions. Comment complex algorithms and design decisions.";
      return "No meaningful documentation. Add comprehensive docstrings and comments. For every complex section, explain the logic and why you chose this approach.";
    },
  },
  AC: {
    name: "Architecture Clarity",
    full: "System architecture is clear and easy to understand",
    feedback: (score) => {
      if (score >= 80)
        return "Outstanding architecture! Module responsibilities are clear, dependencies are minimal, and changes are easy to make.";
      if (score >= 60)
        return "Architecture is reasonable but could be clearer. Some tight coupling detected. Review and reduce dependencies between modules.";
      if (score >= 40)
        return "Architecture is confused. Responsibilities are unclear, modules are tightly coupled, changes affect too many places. Redesign with clear separation of concerns.";
      return "No clear architecture. Your code is a tangled mess of interdependencies. Redesign: identify entities, group related functionality, separate concerns, minimize coupling.";
    },
  },
};

const PILLAR_OBJECTIVES = {
  G: {
    name: "Goal Decomposition",
    objective: "Breaking down complex problems into manageable tasks and planning effectively",
    keySuccess: "Balanced time between understanding requirements and implementation",
    metrics: ["PPR", "RC", "SOS", "DDS"],
  },
  U: {
    name: "Usage Efficiency",
    objective: "Effective collaboration with AI, clear communication, and strategic assistance usage",
    keySuccess: "Getting the right help at the right time with clear, specific requests",
    metrics: ["PSS", "PPF", "CIR", "RP", "TER"],
  },
  I: {
    name: "Iteration & Refinement",
    objective: "Continuously improving code through testing, refactoring, and adaptation",
    keySuccess: "Quick error detection and rapid strategy adjustment when needed",
    metrics: ["ERS", "AR", "RR"],
  },
  D: {
    name: "Detection & Validation",
    objective: "Proactive bug detection, testing, and verification before deployment",
    keySuccess: "Finding and fixing issues before they reach users",
    metrics: ["TFR", "BDR", "HCR"],
  },
  E: {
    name: "End Result Quality",
    objective: "Delivering secure, functional, well-documented, and maintainable code",
    keySuccess: "Code that works, is safe, and others can understand and maintain",
    metrics: ["FC", "SS", "CQS", "DQ", "AC"],
  },
};

/**
 * Generate detailed feedback for a specific metric
 */
export function generateMetricFeedback(metricName, score, description = "") {
  const metric = METRIC_DEFINITIONS[metricName];
  if (!metric) return null;

  return {
    metricName,
    displayName: metric.name,
    full: metric.full,
    score: Math.round(score * 10) / 10,
    feedback: metric.feedback(score),
    description,
    severity: getSeverity(score),
  };
}

/**
 * Generate comprehensive feedback for an entire pillar
 */
export function generatePillarFeedback(pillarId, subMetrics, pillarScore) {
  const pillar = PILLAR_OBJECTIVES[pillarId];
  if (!pillar) return null;

  // Generate feedback for each sub-metric
  const metricFeedbacks = subMetrics
    .filter((m) => METRIC_DEFINITIONS[m.name])
    .map((m) => generateMetricFeedback(m.name, m.value, m.description))
    .filter((f) => f !== null);

  // Identify weak areas (lowest scoring metrics)
  const weakAreas = metricFeedbacks
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .filter((f) => f.score < 70);

  // Identify strong areas (highest scoring metrics)
  const strongAreas = metricFeedbacks
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter((f) => f.score >= 70);

  // Generate summary feedback
  const summaryFeedback = generatePillarSummary(pillarId, pillarScore, weakAreas, strongAreas);

  return {
    pillarId,
    pillarName: pillar.name,
    objective: pillar.objective,
    keySuccess: pillar.keySuccess,
    score: Math.round(pillarScore * 10) / 10,
    severity: getSeverity(pillarScore),
    metricFeedbacks,
    weakAreas,
    strongAreas,
    summary: summaryFeedback,
    topActions: getTopActions(pillarId, pillarScore, weakAreas),
  };
}

/**
 * Generate context-aware summary for the pillar
 */
function generatePillarSummary(pillarId, score, weakAreas, strongAreas) {
  const pillar = PILLAR_OBJECTIVES[pillarId];

  if (score >= 80) {
    return `Outstanding ${pillar.name} performance! You're excelling at ${strengthDescription(pillarId)}. Keep this up—you're a model for this competency.`;
  }
  if (score >= 60) {
    const weak = weakAreas[0]?.displayName || "core areas";
    return `Good ${pillar.name} work with room to improve. Your main challenge is ${weak}. Focus on that and you'll unlock the next level of performance.`;
  }
  if (score >= 40) {
    const weak = weakAreas.map((a) => a.displayName).join(" and ");
    return `Your ${pillar.name} needs significant improvement. Priority areas: ${weak}. These are holding you back from higher-quality work.`;
  }
  return `Critical gaps in ${pillar.name}. You're struggling with fundamental aspects of ${pillar.objective.toLowerCase()}. Address the priority issues immediately to improve overall performance.`;
}

/**
 * Get context-specific description of what they're doing well
 */
function strengthDescription(pillarId) {
  const descriptions = {
    G: "breaking down problems and planning",
    U: "getting effective AI assistance",
    I: "iteration and continuous improvement",
    D: "validation and bug detection",
    E: "delivering high-quality, secure code",
  };
  return descriptions[pillarId] || "this competency";
}

/**
 * Generate top 3 prioritized action items
 */
function getTopActions(pillarId, score, weakAreas) {
  const actions = [];

  // High-priority: critical weaknesses
  weakAreas.forEach((area) => {
    if (area.score < 50) {
      actions.push({
        priority: "CRITICAL",
        action: `Fix ${area.displayName} (currently ${area.score}/100)`,
        description: area.feedback,
      });
    } else if (area.score < 70) {
      actions.push({
        priority: "HIGH",
        action: `Improve ${area.displayName} (currently ${area.score}/100)`,
        description: area.feedback,
      });
    }
  });

  // Add pillar-specific improvement suggestions
  const suggestions = {
    G: [
      { priority: "MEDIUM", action: "Do a requirements review before coding", description: "Ensure you fully understand what you're building before diving in." },
      { priority: "MEDIUM", action: "Break down large features into smaller tasks", description: "Smaller tasks are easier to understand, implement, and test." },
    ],
    U: [
      { priority: "MEDIUM", action: "Write more detailed prompts to the AI", description: "Include context, current code state, and what you've tried. Quality input = quality output." },
      { priority: "MEDIUM", action: "Test AI suggestions before integrating them", description: "Don't assume the AI is correct—verify and understand the code first." },
    ],
    I: [
      { priority: "MEDIUM", action: "Add immediate testing after each change", description: "Test before refactoring, test before integration, test after fixes." },
      { priority: "MEDIUM", action: "Practice strategic refactoring", description: "After code works, allocate time to improve readability, remove duplication, optimize." },
    ],
    D: [
      { priority: "MEDIUM", action: "Create comprehensive test cases", description: "Think of edge cases: null values, empty inputs, boundary conditions, rapid changes." },
      { priority: "MEDIUM", action: "Build a quality checklist", description: "Before marking code done: tested? edge cases? secure? documented? maintainable?" },
    ],
    E: [
      { priority: "MEDIUM", action: "Add documentation as you code", description: "Document functions, complex logic, and design decisions while they're fresh in your mind." },
      { priority: "MEDIUM", action: "Review security best practices", description: "Input validation, error handling, secure storage, protection against common attacks." },
    ],
  };

  // Add 1-2 pillar-specific actions if we have room
  const pillarSuggestions = suggestions[pillarId] || [];
  pillarSuggestions.slice(0, Math.max(0, 3 - actions.length)).forEach((s) => {
    actions.push(s);
  });

  return actions.slice(0, 3);
}

/**
 * Determine severity level based on score
 */
function getSeverity(score) {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "critical";
}

/**
 * Get color for severity level
 */
export function getSeverityColor(severity) {
  const colors = {
    excellent: "#3fb950",
    good: "#3fb950",
    warning: "#f0883e",
    critical: "#f85149",
  };
  return colors[severity] || "#8b949e";
}

export default {
  generateMetricFeedback,
  generatePillarFeedback,
  METRIC_DEFINITIONS,
  PILLAR_OBJECTIVES,
};
