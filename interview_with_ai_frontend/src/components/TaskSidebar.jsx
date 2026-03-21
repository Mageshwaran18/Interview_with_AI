import { useState, useEffect } from "react";

/*
 ─── TaskSidebar Component (Phase 2+ Update) ───
 
 📚 What this does:
 Displays the Library Management System requirements as a checklist.
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
    id: "book-mgmt",
    title: "Book Management",
    description: "Implement CRUD operations for books.",
    functionsToDetect: [
      { name: "add_book", label: "Add book function" },
      { name: "delete_book", label: "Delete book function" },
    ],
    checkboxItems: [
      "Add book function",
      "Delete book function",
      "Error handling",
    ],
  },
  {
    id: "member-mgmt",
    title: "Member Management",
    description: "Register and manage library members.",
    functionsToDetect: [
      { name: "register_member", label: "Register member function" },
      { name: "update_member", label: "Update member details" },
    ],
    checkboxItems: [
      "Register member function",
      "Update member details",
      "Validation implemented",
    ],
  },
  {
    id: "loan-tracking",
    title: "Loan Tracking",
    description: "Handle book checkout and returns.",
    functionsToDetect: [
      { name: "checkout_book", label: "Checkout function" },
      { name: "return_book", label: "Return function" },
    ],
    checkboxItems: [
      "Checkout function",
      "Return function",
      "3-book limit enforced",
    ],
  },
  {
    id: "search",
    title: "Search Functionality",
    description: "Search books by title and author.",
    functionsToDetect: [
      { name: "search_by_title", label: "Search by title" },
      { name: "search_by_author", label: "Search by author" },
    ],
    checkboxItems: [
      "Search by title",
      "Search by author",
      "Partial match support",
    ],
  },
  {
    id: "overdue-detection",
    title: "Overdue Detection",
    description: "Identify and track overdue books.",
    functionsToDetect: [
      { name: "get_overdue_loans", label: "Detect overdue loans" },
    ],
    checkboxItems: [
      "Detect overdue loans",
      "Calculate days overdue",
      "Generate report",
    ],
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
        <p className="sidebar-subtitle">Library Management System</p>
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
