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

// These are the requirements from the GUIDE document (Section 7.1)
// Each requirement is what the candidate must implement
const REQUIREMENTS = [
  {
    id: "book-mgmt",
    title: "Book Management",
    description: "Add, update, delete, and list books. Each book has title, author, ISBN, quantity.",
  },
  {
    id: "member-mgmt",
    title: "Member Management",
    description: "Register, update, and remove library members. Each member has name, email, member_id.",
  },
  {
    id: "loan-tracking",
    title: "Loan Tracking",
    description: "Check out a book to a member. Return a book. Max 3 books per member.",
  },
  {
    id: "search",
    title: "Search",
    description: "Search books by title (partial match) and by author (partial match).",
  },
  {
    id: "overdue",
    title: "Overdue Detection",
    description: "List all loans overdue (checked out > 14 days ago and not returned).",
  },
  {
    id: "error-handling",
    title: "Error Handling",
    description: "All endpoints must return meaningful error messages for invalid input.",
  },
];

function TaskSidebar() {
  // Track which requirements the user has checked off
  const [checked, setChecked] = useState({});

  const toggleCheck = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Count completed items for progress display
  const completedCount = Object.values(checked).filter(Boolean).length;

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
          {completedCount} / {REQUIREMENTS.length} completed
        </p>
      </div>

      {/* Requirements List */}
      <div className="requirements-list">
        {REQUIREMENTS.map((req) => (
          <div
            key={req.id}
            className={`requirement-card ${checked[req.id] ? "completed" : ""}`}
            onClick={() => toggleCheck(req.id)}
          >
            <div className="requirement-checkbox">
              {checked[req.id] ? "✅" : "⬜"}
            </div>
            <div className="requirement-content">
              <h3 className="requirement-title">{req.title}</h3>
              <p className="requirement-desc">{req.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskSidebar;
