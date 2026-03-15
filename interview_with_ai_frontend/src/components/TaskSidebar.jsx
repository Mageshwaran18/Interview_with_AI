import { useState } from "react";

/*
 ─── TaskSidebar Component ───
 
 📚 What this does:
 Displays the Library Management System requirements as a checklist.
 The candidate can see exactly what they need to build.
 
 🧠 What you'll learn:
 - React state with useState (to track checked items)
 - .map() to render lists
 - CSS classes for styling
*/

// Core requirements (5 essential tasks) with checkbox items instead of functions
const REQUIREMENTS = [
  {
    id: "book-mgmt",
    title: "Book Management",
    description: "Implement CRUD operations for books.",
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
    checkboxItems: [
      "Detect overdue loans",
      "Calculate days overdue",
      "Generate report",
    ],
  },
];

function TaskSidebar() {
  // Track which requirements are expanded
  const [expanded, setExpanded] = useState({});
  // Track sub-item checkboxes (format: "req-id_item-index")
  const [subItemsChecked, setSubItemsChecked] = useState({});

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
                  return (
                    <div key={idx} className="subitem-checkbox-row">
                      <button
                        className="subitem-checkbox"
                        onClick={() => toggleSubItemCheck(itemKey)}
                        title={item}
                      >
                        {subItemsChecked[itemKey] ? "✅" : "☐"}
                      </button>
                      <span className="subitem-label">{item}</span>
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
