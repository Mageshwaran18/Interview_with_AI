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

// Simplified requirements with CRUD operations for the Library Management System
const REQUIREMENTS = [
  {
    id: "student-mgmt",
    title: "Student Management",
    description: "Create student registration and login functions.",
    details: [
      "registerStudent(name, email, password)",
      "loginStudent(email, password)",
    ],
  },
  {
    id: "book-mgmt",
    title: "Book Management",
    description: "Implement CRUD operations for books.",
    details: [
      "addBook(title, author, isbn, copies)",
      "removeBook(bookId)",
      "updateBook(bookId, details)",
      "getBook(bookId)",
      "getAllBooks()",
    ],
  },
  {
    id: "search",
    title: "Search & Discovery",
    description: "Search functionality for books.",
    details: [
      "searchBookByTitle(title)",
    ],
  },
  {
    id: "borrowing",
    title: "Borrowing System",
    description: "Manage book borrowing operations.",
    details: [
      "getBorrowedBooks(studentId)",
    ],
  },
  {
    id: "history",
    title: "History & Records",
    description: "Track student borrowing history.",
    details: [
      "getStudentBorrowHistory(studentId)",
    ],
  },
  {
    id: "fine-mgmt",
    title: "Fine Management",
    description: "Calculate and manage library fines.",
    details: [
      "calculateFine(studentId, bookId)",
      "payFine(studentId, amount)",
    ],
  },
  {
    id: "analytics",
    title: "Analytics & Stats",
    description: "Generate library statistics.",
    details: [
      "getLibraryStats()",
    ],
  },
];

function TaskSidebar() {
  // Track which requirements the user has checked off
  const [checked, setChecked] = useState({});
  // Track which requirements are expanded
  const [expanded, setExpanded] = useState({});

  const toggleCheck = (id, e) => {
    e.stopPropagation(); // Prevent triggering expand/collapse
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
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
          <div key={req.id} className="requirement-item">
            {/* Top Section - Always Visible */}
            <div
              className={`requirement-card ${checked[req.id] ? "completed" : ""}`}
              onClick={() => toggleExpand(req.id)}
            >
              <button
                className="requirement-checkbox"
                onClick={(e) => toggleCheck(req.id, e)}
                title="Mark as completed"
              >
                {checked[req.id] ? "✅" : "⬜"}
              </button>
              <div className="requirement-content">
                <h3 className="requirement-title">{req.title}</h3>
                <p className="requirement-desc">{req.description}</p>
              </div>
              <div className="requirement-expand-icon">
                {expanded[req.id] ? "▼" : "▶"}
              </div>
            </div>

            {/* Expanded Section - Details */}
            {expanded[req.id] && (
              <div className="requirement-details">
                <ul className="details-list">
                  {req.details.map((detail, idx) => (
                    <li key={idx} className="detail-item">
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TaskSidebar;
