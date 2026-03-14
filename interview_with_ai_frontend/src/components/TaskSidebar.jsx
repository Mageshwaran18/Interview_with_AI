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
    details: [
      "📌 Create a Book class with attributes: title, author, ISBN, quantity",
      "📌 Implement add_book(isbn, title, author, quantity) method",
      "📌 Implement update_book(isbn, quantity) to update stock",
      "📌 Implement delete_book(isbn) to remove books",
      "📌 Implement list_books() to return all books",
      "📌 Validate that ISBN is unique for each book",
    ],
  },
  {
    id: "member-mgmt",
    title: "Member Management",
    description: "Register, update, and remove library members. Each member has name, email, member_id.",
    details: [
      "📌 Create a Member class with attributes: member_id, name, email",
      "📌 Implement register_member(name, email) method",
      "📌 Generate unique member_id automatically",
      "📌 Implement update_member(member_id, name, email)",
      "📌 Implement remove_member(member_id) method",
      "📌 Ensure member_id is unique (primary key)",
    ],
  },
  {
    id: "loan-tracking",
    title: "Loan Tracking",
    description: "Check out a book to a member. Return a book. Max 3 books per member.",
    details: [
      "📌 Create a Loan class storing: book_isbn, member_id, checkout_date",
      "📌 Implement checkout_book(member_id, isbn) method",
      "📌 Check that member hasn't borrowed 3+ books already",
      "📌 Decrease book quantity when checked out",
      "📌 Implement return_book(member_id, isbn) method",
      "📌 Increase book quantity when returned",
    ],
  },
  {
    id: "search",
    title: "Search",
    description: "Search books by title (partial match) and by author (partial match).",
    details: [
      "📌 Implement search_by_title(partial_title) -> List[Book]",
      "📌 Use case-insensitive partial matching",
      "📌 Return all books whose title contains the search string",
      "📌 Implement search_by_author(partial_author) -> List[Book]",
      "📌 Use case-insensitive partial matching",
      "📌 Return empty list if no matches found",
    ],
  },
  {
    id: "overdue",
    title: "Overdue Detection",
    description: "List all loans overdue (checked out > 14 days ago and not returned).",
    details: [
      "📌 Store checkout_date in Loan objects (use datetime.now())",
      "📌 Implement list_overdue_loans() -> List[Loan]",
      "📌 Calculate days since checkout using datetime",
      "📌 Return loans where days_elapsed > 14 AND status = 'active'",
      "📌 Include member name, book title, and checkout date in output",
      "📌 Sort by overdue days (oldest first)",
    ],
  },
  {
    id: "error-handling",
    title: "Error Handling",
    description: "All endpoints must return meaningful error messages for invalid input.",
    details: [
      "📌 Raise ValueError for invalid ISBN or empty strings",
      "📌 Raise ValueError if book not found or out of stock",
      "📌 Raise ValueError if member not found or invalid",
      "📌 Raise ValueError if trying to checkout > 3 books",
      "📌 Raise ValueError for duplicate ISBN or member_id",
      "📌 Always include descriptive messages in exceptions",
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
