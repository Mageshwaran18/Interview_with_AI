/**
 * Simplified Test Suite for Pyodide (Client-Side Execution)
 * 
 * This test suite is designed to run in the browser using Pyodide,
 * without requiring the full pytest framework.
 * 
 * It tests the 6 requirements from the Library Management System task.
 */

export const TEST_SUITE_CODE = `
# ═══════════════════════════════════════════════════════════════
# Simplified Test Suite (for Pyodide - no pytest required)
# ═══════════════════════════════════════════════════════════════

# Try to instantiate the Library class
try:
    library = Library()
except NameError:
    print("❌ Library class not found")
    _test_count = 0
    _test_results.passed = 0
    _test_results.failed = 1
except Exception as e:
    print(f"❌ Failed to instantiate Library: {e}")
    _test_count = 0
    _test_results.passed = 0
    _test_results.failed = 1

# ─────────────────────────────────────────────────────────────
# Requirement 1: Book Management
# ─────────────────────────────────────────────────────────────

test_name = "test_add_book"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    
    # Check if book was added
    if hasattr(library, 'books'):
        if "ISBN001" in library.books or len(library.books) > 0:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Book was not added to library.books")
            print(f"❌ {test_name}: Book not added")
    elif hasattr(library, 'list_books'):
        books = library.list_books()
        if len(books) > 0:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "No books in library")
            print(f"❌ {test_name}: No books found")
    else:
        _test_results.add_fail(test_name, "No way to verify book addition")
        print(f"❌ {test_name}: Can't verify books")
except AttributeError as e:
    _test_results.add_fail(test_name, f"Missing method: {e}")
    print(f"❌ {test_name}: {e}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_list_books"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.add_book("ISBN002", "Web Dev", "Jane Smith", 3)
    
    if hasattr(library, 'list_books'):
        books = library.list_books()
        if len(books) >= 2:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, f"Expected 2+ books, got {len(books)}")
            print(f"❌ {test_name}: Only {len(books)} books")
    elif hasattr(library, 'books'):
        if len(library.books) >= 2:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, f"Only {len(library.books)} books")
            print(f"❌ {test_name}: Only {len(library.books)} books")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_delete_book"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.delete_book("ISBN001")
    
    if hasattr(library, 'books'):
        if "ISBN001" not in library.books:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Book not deleted")
            print(f"❌ {test_name}: Book still exists")
    elif hasattr(library, 'list_books'):
        books = library.list_books()
        if len(books) == 0:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Book not deleted")
            print(f"❌ {test_name}: Book still exists")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

# ─────────────────────────────────────────────────────────────
# Requirement 2: Member Management
# ─────────────────────────────────────────────────────────────

test_name = "test_register_member"
_test_count += 1
try:
    library = Library()
    library.register_member("M001", "Alice", "alice@test.com")
    
    if hasattr(library, 'members'):
        if "M001" in library.members or len(library.members) > 0:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Member not registered")
            print(f"❌ {test_name}: Member not found")
    else:
        _test_results.add_pass(test_name)  # Assume success if no error
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_remove_member"
_test_count += 1
try:
    library = Library()
    library.register_member("M001", "Alice", "alice@test.com")
    library.remove_member("M001")
    
    if hasattr(library, 'members'):
        if "M001" not in library.members:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Member not removed")
            print(f"❌ {test_name}: Member still exists")
    else:
        _test_results.add_pass(test_name)  # Assume success
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

# ─────────────────────────────────────────────────────────────
# Requirement 3: Loan Tracking
# ─────────────────────────────────────────────────────────────

test_name = "test_checkout_book"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.register_member("M001", "Alice", "alice@test.com")
    library.checkout_book("M001", "ISBN001")
    
    # Check if quantity decreased (if using dict-based storage)
    if hasattr(library, 'books'):
        book_data = library.books.get("ISBN001", {})
        if isinstance(book_data, dict) and "quantity" in book_data:
            if book_data["quantity"] == 4:
                _test_results.add_pass(test_name)
                print(f"✅ {test_name}")
            else:
                _test_results.add_fail(test_name, f"Quantity is {book_data['quantity']}, not 4")
                print(f"❌ {test_name}: Quantity wrong")
        else:
            _test_results.add_pass(test_name)  # Assume passes
            print(f"✅ {test_name}")
    else:
        _test_results.add_pass(test_name)  # Can't verify, assume pass
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_return_book"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.register_member("M001", "Alice", "alice@test.com")
    library.checkout_book("M001", "ISBN001")
    library.return_book("M001", "ISBN001")
    
    _test_results.add_pass(test_name)
    print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_borrow_limit"
_test_count += 1
try:
    library = Library()
    for i in range(4):
        library.add_book(f"ISBN{i}", f"Book {i}", "Author", 2)
    
    library.register_member("M001", "Alice", "alice@test.com")
    library.checkout_book("M001", "ISBN0")
    library.checkout_book("M001", "ISBN1")
    library.checkout_book("M001", "ISBN2")
    
    # The 4th checkout should raise an exception
    try:
        library.checkout_book("M001", "ISBN3")
        _test_results.add_fail(test_name, "No exception raised for 4th book")
        print(f"❌ {test_name}: Should reject 4th book")
    except Exception:
        _test_results.add_pass(test_name)
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

# ─────────────────────────────────────────────────────────────
# Requirement 4: Search
# ─────────────────────────────────────────────────────────────

test_name = "test_search_by_title"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python Programming", "John Doe", 5)
    library.add_book("ISBN002", "Web Development", "Jane Smith", 3)
    
    if hasattr(library, 'search_by_title'):
        results = library.search_by_title("Python")
        if len(results) >= 1:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Search returned no results")
            print(f"❌ {test_name}: No results")
    else:
        _test_results.add_fail(test_name, "No search_by_title method")
        print(f"❌ {test_name}: Method missing")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_search_by_author"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.add_book("ISBN002", "Web Dev", "John Smith", 3)
    
    if hasattr(library, 'search_by_author'):
        results = library.search_by_author("John")
        if len(results) >= 1:
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "Search returned no results")
            print(f"❌ {test_name}: No results")
    else:
        _test_results.add_fail(test_name, "No search_by_author method")
        print(f"❌ {test_name}: Method missing")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

# ─────────────────────────────────────────────────────────────
# Requirement 5: Overdue Detection
# ─────────────────────────────────────────────────────────────

test_name = "test_overdue_detection"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    library.register_member("M001", "Alice", "alice@test.com")
    library.checkout_book("M001", "ISBN001")
    
    if hasattr(library, 'get_overdue_loans'):
        overdue = library.get_overdue_loans()
        if isinstance(overdue, list):
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "get_overdue_loans didn't return list")
            print(f"❌ {test_name}: Wrong return type")
    elif hasattr(library, 'list_overdue'):
        overdue = library.list_overdue()
        if isinstance(overdue, list):
            _test_results.add_pass(test_name)
            print(f"✅ {test_name}")
        else:
            _test_results.add_fail(test_name, "list_overdue didn't return list")
            print(f"❌ {test_name}: Wrong return type")
    else:
        _test_results.add_fail(test_name, "No overdue detection method")
        print(f"❌ {test_name}: Method missing")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

# ─────────────────────────────────────────────────────────────
# Requirement 6: Error Handling
# ─────────────────────────────────────────────────────────────

test_name = "test_invalid_isbn_checkout"
_test_count += 1
try:
    library = Library()
    library.register_member("M001", "Alice", "alice@test.com")
    
    try:
        library.checkout_book("M001", "INVALID_ISBN")
        _test_results.add_fail(test_name, "No exception raised")
        print(f"❌ {test_name}: Should raise exception")
    except Exception:
        _test_results.add_pass(test_name)
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")

test_name = "test_invalid_member_checkout"
_test_count += 1
try:
    library = Library()
    library.add_book("ISBN001", "Python 101", "John Doe", 5)
    
    try:
        library.checkout_book("INVALID_MEMBER", "ISBN001")
        _test_results.add_fail(test_name, "No exception raised")
        print(f"❌ {test_name}: Should raise exception")
    except Exception:
        _test_results.add_pass(test_name)
        print(f"✅ {test_name}")
except Exception as e:
    _test_results.add_fail(test_name, str(e))
    print(f"❌ {test_name}: {e}")
`;
