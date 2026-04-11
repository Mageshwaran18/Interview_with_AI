import { useState, useEffect } from "react";

/*
 ─── TaskSidebar Component (Phase 2+ Update) ───
 
 📚 What this does:
 Displays the Simple Calculator requirements as a checklist.
 NOW: Automatically detects which functions exist in the code editor!
 The candidate can see exactly what they need to build.
 
 🧠 What you'll learn:
 - React state with useState (to track checked items)
 - useEffect to auto-detect functions in code
 - Regex patterns to find function definitions
 - .map() to render lists
 - CSS classes for styling
*/

// Core requirements (5 essential tasks) with function detection patterns
const REQUIREMENTS = [
  {
    id: "req_1",
    title: "Requirement 1: add()",
    description: "Implement add(a, b). Return a + b for valid numeric inputs.",
    functionsToDetect: [{ name: "add", label: "add()" }],
    checkboxItems: ["add() implemented"],
  },
  {
    id: "req_2",
    title: "Requirement 2: subtract()",
    description: "Implement subtract(a, b). Return a - b for valid numeric inputs.",
    functionsToDetect: [{ name: "subtract", label: "subtract()" }],
    checkboxItems: ["subtract() implemented"],
  },
  {
    id: "req_3",
    title: "Requirement 3: multiply()",
    description: "Implement multiply(a, b). Return a * b for valid numeric inputs.",
    functionsToDetect: [{ name: "multiply", label: "multiply()" }],
    checkboxItems: ["multiply() implemented"],
  },
  {
    id: "req_4",
    title: "Requirement 4: divide()",
    description: "Implement divide(a, b). If b == 0, return 'inf'; otherwise return a / b.",
    functionsToDetect: [{ name: "divide", label: "divide()" }],
    checkboxItems: ["divide() implemented"],
  },
  {
    id: "req_5",
    title: "Requirement 5: percent()",
    description: "Implement percent(a, b). If b == 0, return 'inf'; otherwise return a % b.",
    functionsToDetect: [{ name: "percent", label: "percent()" }],
    checkboxItems: ["percent() implemented"],
  },
];

/**
 * Detects which functions are implemented in the code
 * @param {string} code - The Python code to analyze
 * @returns {Object} Map of function name -> is implemented
 */
function detectImplementedFunctions(code) {
  if (!code || typeof code !== 'string') return {};
  
  const detected = {};
  
  REQUIREMENTS.forEach((req) => {
    if (req.functionsToDetect) {
      req.functionsToDetect.forEach(({ name }) => {
        // Regex to find function definitions: "def function_name("
        // Handles: def add_book(, def add_book (, def add_book\n(, etc.
        const regex = new RegExp(`def\\s+${name}\\s*\\(`, 'i');
        detected[name] = regex.test(code);
        
        if (detected[name]) {
          console.log(`✅ Function detected: ${name}`);
        }
      });
    }
  });
  
  return detected;
}

function TaskSidebar({ code = "" }) {
  // Track which requirements are expanded
  const [expanded, setExpanded] = useState({});
  // Track sub-item checkboxes (format: "req-id_item-index")
  const [subItemsChecked, setSubItemsChecked] = useState({});
  // Track detected functions in code
  const [detectedFunctions, setDetectedFunctions] = useState({});

  // ─── Auto-detect implemented functions when code changes ───
  useEffect(() => {
    const detected = detectImplementedFunctions(code);
    setDetectedFunctions(detected);

    // Auto-update checkboxes based on detected functions
    setSubItemsChecked((prevChecked) => {
      const newChecked = { ...prevChecked };
      let hasChanges = false;

      REQUIREMENTS.forEach((req) => {
        if (req.functionsToDetect) {
          req.functionsToDetect.forEach(({ name }, funcIndex) => {
            // Map function to its checkbox item index
            const isImplemented = detected[name];
            const checkboxKey = `${req.id}_${funcIndex}`;

            // Only update if the state differs from detected state
            if (newChecked[checkboxKey] !== isImplemented) {
              newChecked[checkboxKey] = isImplemented;
              hasChanges = true;
            }
          });
        }
      });

      if (hasChanges) {
        return newChecked;
      }
      return prevChecked;
    });
  }, [code]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isRequirementComplete = (req) =>
    req.checkboxItems.every((_, idx) => subItemsChecked[`${req.id}_${idx}`]);

  const toggleCheck = (req, e) => {
    e.stopPropagation();
    const shouldCompleteAll = !isRequirementComplete(req);
    setSubItemsChecked((prev) => {
      const next = { ...prev };
      req.checkboxItems.forEach((_, idx) => {
        next[`${req.id}_${idx}`] = shouldCompleteAll;
      });
      return next;
    });
  };

  const toggleSubItemCheck = (key) => {
    setSubItemsChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Count completed main requirements (auto-derived from sub-items)
  const completedCount = REQUIREMENTS.filter((req) => isRequirementComplete(req)).length;
  // Count total sub-items
  const totalSubItems = REQUIREMENTS.reduce((sum, req) => sum + req.checkboxItems.length, 0);
  // Count completed sub-items
  const completedSubItems = Object.values(subItemsChecked).filter(Boolean).length;

  return (
    <div className="task-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">📋 Task Requirements</h2>
        <p className="sidebar-subtitle">Simple Calculator</p>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${(completedCount / REQUIREMENTS.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          {completedCount} / {REQUIREMENTS.length} requirements • {completedSubItems} / {totalSubItems} tasks
        </p>
      </div>

      {/* Requirements List */}
      <div className="requirements-list">
        {REQUIREMENTS.map((req) => (
          <div key={req.id} className="requirement-item">
            {/* Main Requirement Checkbox + Expand Toggle */}
            <div
              className={`requirement-card ${isRequirementComplete(req) ? "completed" : ""}`}
              onClick={() => toggleExpand(req.id)}
            >
              <button
                className="requirement-checkbox"
                onClick={(e) => toggleCheck(req, e)}
                title="Mark as completed"
              >
                {isRequirementComplete(req) ? "✅" : "⬜"}
              </button>
              <div className="requirement-content">
                <h3 className="requirement-title">{req.title}</h3>
                <p className="requirement-desc">{req.description}</p>
              </div>
              <div className="requirement-expand-icon">
                {expanded[req.id] ? "▼" : "▶"}
              </div>
            </div>

            {/* Sub-items Checklist (Dropdown) */}
            {expanded[req.id] && (
              <div className="requirement-subitems">
                {req.checkboxItems.map((item, idx) => {
                  const itemKey = `${req.id}_${idx}`;
                  const isChecked = subItemsChecked[itemKey];
                  
                  // Get the function name for this item (if it exists)
                  const funcInfo = req.functionsToDetect?.[idx];
                  const isAutoDetected = funcInfo && detectedFunctions[funcInfo.name];
                  
                  return (
                    <div key={idx} className="subitem-checkbox-row">
                      <button
                        className="subitem-checkbox"
                        onClick={() => toggleSubItemCheck(itemKey)}
                        title={item}
                      >
                        {isChecked ? "✅" : "☐"}
                      </button>
                      <span className="subitem-label">
                        {item}
                        {isAutoDetected && (
                          <span className="auto-detected-badge" title="Auto-detected from code">
                            🔍 auto
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskSidebar;
