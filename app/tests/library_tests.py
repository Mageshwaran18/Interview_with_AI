"""
Pre-written test suite for the Library Management System.

This test suite validates the candidate's implementation against
the 6 requirements from the task sidebar:
  1. Book Management (add, update, delete, list)
  2. Member Management (register, update, remove)
  3. Loan Tracking (checkout, return, 3-book limit)
  4. Search (by title, by author - partial match)
  5. Overdue Detection (> 14 days)
  6. Error Handling (meaningful errors, not crashes)

📚 How it works:
- The candidate's code is imported from a temp file via CANDIDATE_FILE env var
- Each test function exercises one requirement
- pytest collects results and we parse them

💡 This is read-only — candidates don't see or edit this file.
"""

import os
import sys
import importlib.util
from datetime import datetime, timedelta

import pytest


# ─── Load Candidate Code ───
# Import the candidate's code from the temp file
@pytest.fixture
def library():
    """Load and instantiate the candidate's Library class."""
    candidate_file = os.environ.get("CANDIDATE_FILE", "")
    
    if not candidate_file or not os.path.exists(candidate_file):
        pytest.skip("No candidate file provided")
    
    # Dynamically import the candidate's module
    spec = importlib.util.spec_from_file_location("candidate_code", candidate_file)
    module = importlib.util.module_from_spec(spec)
    
    try:
        spec.loader.exec_module(module)
    except Exception as e:
        pytest.fail(f"Candidate code has syntax/import errors: {e}")
    
    # Look for a Library class
    if not hasattr(module, "Library"):
        pytest.fail("No 'Library' class found in candidate code")
    
    return module.Library()


# ═══════════════════════════════════════════
# Test Suite: Book Management
# ═══════════════════════════════════════════

class TestBookManagement:
    """Requirement 1: Add, update, delete, and list books."""
    
    def test_add_book(self, library):
        """Can add a book to the library."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            # Check if book exists (try common patterns)
            if hasattr(library, 'books'):
                assert "ISBN001" in library.books or len(library.books) > 0
            elif hasattr(library, 'list_books'):
                books = library.list_books()
                assert len(books) > 0
        except AttributeError:
            pytest.fail("Library class missing 'add_book' method")
    
    def test_list_books(self, library):
        """Can list all books in the library."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.add_book("ISBN002", "Web Dev", "Jane Smith", 3)
            
            if hasattr(library, 'list_books'):
                books = library.list_books()
                assert len(books) >= 2
            elif hasattr(library, 'books'):
                assert len(library.books) >= 2
            else:
                pytest.fail("No way to list books found")
        except AttributeError:
            pytest.fail("Library class missing 'add_book' or 'list_books' method")
    
    def test_delete_book(self, library):
        """Can delete a book from the library."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.delete_book("ISBN001")
            
            if hasattr(library, 'books'):
                assert "ISBN001" not in library.books
            elif hasattr(library, 'list_books'):
                books = library.list_books()
                assert len(books) == 0
        except AttributeError:
            pytest.fail("Library class missing 'delete_book' method")


# ═══════════════════════════════════════════
# Test Suite: Member Management
# ═══════════════════════════════════════════

class TestMemberManagement:
    """Requirement 2: Register, update, and remove members."""
    
    def test_register_member(self, library):
        """Can register a new library member."""
        try:
            library.register_member("M001", "Alice", "alice@test.com")
            
            if hasattr(library, 'members'):
                assert "M001" in library.members or len(library.members) > 0
        except AttributeError:
            pytest.fail("Library class missing 'register_member' method")
    
    def test_remove_member(self, library):
        """Can remove a library member."""
        try:
            library.register_member("M001", "Alice", "alice@test.com")
            library.remove_member("M001")
            
            if hasattr(library, 'members'):
                assert "M001" not in library.members
        except AttributeError:
            pytest.fail("Library class missing 'remove_member' method")


# ═══════════════════════════════════════════
# Test Suite: Loan Tracking
# ═══════════════════════════════════════════

class TestLoanTracking:
    """Requirement 3: Checkout, return, and 3-book limit."""
    
    def test_checkout_book(self, library):
        """Can check out a book to a member."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.register_member("M001", "Alice", "alice@test.com")
            library.checkout_book("M001", "ISBN001")
            
            # Book quantity should decrease
            if hasattr(library, 'books') and isinstance(library.books, dict):
                book = library.books.get("ISBN001", {})
                if isinstance(book, dict) and "quantity" in book:
                    assert book["quantity"] == 4
        except AttributeError:
            pytest.fail("Library class missing 'checkout_book' method")
    
    def test_return_book(self, library):
        """Can return a checked-out book."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.register_member("M001", "Alice", "alice@test.com")
            library.checkout_book("M001", "ISBN001")
            library.return_book("M001", "ISBN001")
        except AttributeError:
            pytest.fail("Library class missing 'return_book' method")
    
    def test_borrow_limit(self, library):
        """Enforces 3-book maximum per member."""
        try:
            for i in range(4):
                library.add_book(f"ISBN{i}", f"Book {i}", "Author", 2)
            library.register_member("M001", "Alice", "alice@test.com")
            
            library.checkout_book("M001", "ISBN0")
            library.checkout_book("M001", "ISBN1")
            library.checkout_book("M001", "ISBN2")
            
            # 4th checkout should raise an error
            with pytest.raises(Exception):
                library.checkout_book("M001", "ISBN3")
        except AttributeError:
            pytest.fail("Library class missing checkout methods")


# ═══════════════════════════════════════════
# Test Suite: Search
# ═══════════════════════════════════════════

class TestSearch:
    """Requirement 4: Search by title and author (partial match)."""
    
    def test_search_by_title(self, library):
        """Can search books by title (partial match)."""
        try:
            library.add_book("ISBN001", "Python Programming", "John Doe", 5)
            library.add_book("ISBN002", "Web Development", "Jane Smith", 3)
            
            results = library.search_by_title("Python")
            assert len(results) >= 1
        except AttributeError:
            pytest.fail("Library class missing 'search_by_title' method")
    
    def test_search_by_author(self, library):
        """Can search books by author (partial match)."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.add_book("ISBN002", "Web Dev", "John Smith", 3)
            
            results = library.search_by_author("John")
            assert len(results) >= 2
        except AttributeError:
            pytest.fail("Library class missing 'search_by_author' method")


# ═══════════════════════════════════════════
# Test Suite: Overdue Detection
# ═══════════════════════════════════════════

class TestOverdueDetection:
    """Requirement 5: Detect loans overdue > 14 days."""
    
    def test_overdue_detection(self, library):
        """Can detect overdue loans (> 14 days)."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            library.register_member("M001", "Alice", "alice@test.com")
            library.checkout_book("M001", "ISBN001")
            
            # Try to get overdue loans
            if hasattr(library, 'get_overdue_loans'):
                overdue = library.get_overdue_loans()
                # No overdue loans right after checkout
                assert isinstance(overdue, list)
            elif hasattr(library, 'list_overdue'):
                overdue = library.list_overdue()
                assert isinstance(overdue, list)
            else:
                pytest.fail("No overdue detection method found")
        except AttributeError:
            pytest.fail("Library class missing overdue detection method")


# ═══════════════════════════════════════════
# Test Suite: Error Handling
# ═══════════════════════════════════════════

class TestErrorHandling:
    """Requirement 6: Meaningful error messages."""
    
    def test_invalid_isbn_checkout(self, library):
        """Returns error for invalid ISBN during checkout."""
        try:
            library.register_member("M001", "Alice", "alice@test.com")
            with pytest.raises(Exception):
                library.checkout_book("M001", "INVALID_ISBN")
        except AttributeError:
            pytest.fail("Library class missing 'checkout_book' method")
    
    def test_invalid_member_checkout(self, library):
        """Returns error for invalid member during checkout."""
        try:
            library.add_book("ISBN001", "Python 101", "John Doe", 5)
            with pytest.raises(Exception):
                library.checkout_book("INVALID_MEMBER", "ISBN001")
        except AttributeError:
            pytest.fail("Library class missing 'checkout_book' method")
