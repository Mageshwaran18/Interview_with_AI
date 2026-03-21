# Seeded Bugs Reference — Library Management System

## Overview
The starter code contains **3 intentionally seeded bugs** placed in specific locations. These bugs are designed to test the candidate's:
- **Bug Detection Rate (BDR):** Can they identify and fix subtle bugs?
- **Code Quality:** Do they have good debugging practices?
- **Testing Coverage:** Can they write tests to catch these issues?

---

## Bug Locations & Descriptions

### 🐛 Bug #1: Off-by-One in Overdue Detection
**File:** `interview_with_ai_frontend/src/components/CodeEditor.jsx` (STARTER_CODE)
**Function:** `get_overdue_loans()`
**Line:** (In the method, the comparison logic)

**Current (Buggy) Code:**
```python
def get_overdue_loans(self):
    """List all overdue loans (checked out > 14 days and not returned)"""
    overdue = []
    now = datetime.now()
    for loan_id, loan in self.loans.items():
        if not loan['returned']:
            days_checked_out = (now - loan['checkout_date']).days
            if days_checked_out > 14:  # ❌ BUG: Should be >= 14
                overdue.append(loan)
    return overdue
```

**Issue:**
- Uses `>` instead of `>=`
- Causes **one-day lag** in overdue detection
- A book checked out exactly 14 days ago should be overdue but won't be flagged

**How to Fix:**
```python
if days_checked_out >= 14:  # ✅ FIXED
    overdue.append(loan)
```

**Candidate Impact:**
- Requirement: "List all loans that are overdue (checked out more than 14 days ago and not returned)"
- Test will fail because books at exactly 14 days aren't detected as overdue
- Must catch this in code review OR write a test like: `test_overdue_at_14_days_exactly`

---

### 🐛 Bug #2: Missing Null Check in Checkout
**File:** `interview_with_ai_frontend/src/components/CodeEditor.jsx` (STARTER_CODE)
**Function:** `checkout_book(isbn, member_id)`
**Line:** (In the method, before accessing `self.books[isbn]`)

**Current (Buggy) Code:**
```python
def checkout_book(self, isbn, member_id):
    """Checkout a book to a member"""
    current_checkout_count = sum(1 for loan in self.loans.values() 
                                 if loan['member_id'] == member_id and not loan['returned'])
    
    if current_checkout_count > 3:
        return {'error': 'Member has reached checkout limit'}
    
    # ❌ BUG: No verification that book exists
    self.books[isbn]['quantity'] -= 1  # Will raise KeyError if isbn not found
    
    self.loans[isbn + '_' + member_id] = {
        'isbn': isbn,
        'member_id': member_id,
        'checkout_date': datetime.now(),
        'returned': False
    }
    self.members[member_id]['books_checked_out'] += 1
    return {'success': True}
```

**Issue:**
- No check for `if isbn not in self.books`
- Raises `KeyError` when attempting to checkout a non-existent book
- Violates Requirement 6: "All endpoints must return meaningful error messages"

**How to Fix:**
```python
def checkout_book(self, isbn, member_id):
    """Checkout a book to a member"""
    # ✅ FIXED: Check if book exists
    if isbn not in self.books:
        return {'error': f'Book with ISBN {isbn} not found'}
    
    if self.books[isbn]['quantity'] <= 0:
        return {'error': 'Book is out of stock'}
    
    current_checkout_count = sum(1 for loan in self.loans.values() 
                                 if loan['member_id'] == member_id and not loan['returned'])
    
    if current_checkout_count > 3:
        return {'error': 'Member has reached checkout limit'}
    
    self.books[isbn]['quantity'] -= 1
    # ... rest of the code
```

**Candidate Impact:**
- Test will fail: `test_error_on_invalid_isbn()` 
- Requirement 6 test expects meaningful error message but gets exception
- Must implement proper input validation

---

### 🐛 Bug #3: Wrong 3-Book Limit Logic
**File:** `interview_with_ai_frontend/src/components/CodeEditor.jsx` (STARTER_CODE)
**Function:** `checkout_book(isbn, member_id)`
**Line:** (The limit check logic)

**Current (Buggy) Code:**
```python
def checkout_book(self, isbn, member_id):
    """Checkout a book to a member"""
    current_checkout_count = sum(1 for loan in self.loans.values() 
                                 if loan['member_id'] == member_id and not loan['returned'])
    
    # ❌ BUG: Uses > 3 instead of >= 3 (off-by-one)
    if current_checkout_count > 3:  # Allows 4 books!
        return {'error': 'Member has reached checkout limit'}
    
    self.books[isbn]['quantity'] -= 1
    # ... rest of checkout logic
```

**Issue:**
- Uses `>` instead of `>=`
- Allows member to check out **4 books** instead of max 3
- When `current_checkout_count == 3`, the check `3 > 3` is `False`, so checkout proceeds
- Requirement says: "Enforce that a member cannot borrow more than 3 books simultaneously"

**How to Fix:**
```python
# ✅ FIXED: Use >= instead of >
if current_checkout_count >= 3:  # Now properly rejects if already at 3
    return {'error': 'Member has reached checkout limit'}
```

**Candidate Impact:**
- Test will fail: `test_checkout_limit()` - expects 3 books max but gets 4
- Must catch this logic error through:
  - Code review / attention to detail
  - Writing a test: `test_fourth_checkout_denied()`

---

## Testing Strategy for Candidates

### How BDR (Bug Detection Rate) Will Be Calculated

The evaluation system will:

1. **After Session End:** Extract the final code from CODE_SAVE events
2. **Bug Detection:** Check if each bug location was fixed
   - **Bug #1:** Look for `days_checked_out >= 14` in get_overdue_loans()
   - **Bug #2:** Look for null check (`if isbn not in self.books` or similar) in checkout_book()
   - **Bug #3:** Look for `current_checkout_count >= 3` in checkout_book()
3. **Calculate:** BDR = (bugs_fixed / 3) × 100
   - 0 bugs fixed = BDR: 0
   - 1 bug fixed = BDR: 33
   - 2 bugs fixed = BDR: 67
   - 3 bugs fixed = BDR: 100

### Tests That Will Detect These Bugs

The `library_tests.py` includes test cases that will fail if bugs remain:

```python
# Bug #1 Detection
def test_overdue_at_14_days_exactly():
    """Bug #1: Off-by-one in overdue check"""
    library = Library()
    library.add_book('ISBN001', 'Test Book', 'Author', 5)
    library.register_member('M001', 'John', 'john@email.com')
    
    # Manually set checkout date to exactly 14 days ago
    loan_id = 'ISBN001_M001'
    library.loans[loan_id] = {
        'isbn': 'ISBN001',
        'member_id': 'M001',
        'checkout_date': datetime.now() - timedelta(days=14),
        'returned': False
    }
    
    overdue = library.get_overdue_loans()
    assert len(overdue) == 1  # Should be overdue at 14 days exactly!

# Bug #2 Detection
def test_checkout_nonexistent_book():
    """Bug #2: Missing null check"""
    library = Library()
    library.register_member('M001', 'John', 'john@email.com')
    
    result = library.checkout_book('FAKE_ISBN', 'M001')
    # Should return error dict, NOT raise KeyError
    assert 'error' in result
    assert result['error'] != None

# Bug #3 Detection
def test_fourth_book_checkout_denied():
    """Bug #3: Wrong 3-book limit"""
    library = Library()
    library.add_book('ISBN001', 'Book1', 'Author', 10)
    library.add_book('ISBN002', 'Book2', 'Author', 10)
    library.add_book('ISBN003', 'Book3', 'Author', 10)
    library.add_book('ISBN004', 'Book4', 'Author', 10)
    library.register_member('M001', 'John', 'john@email.com')
    
    # Check out 3 books
    library.checkout_book('ISBN001', 'M001')
    library.checkout_book('ISBN002', 'M001')
    library.checkout_book('ISBN003', 'M001')
    
    # Fourth checkout should fail
    result = library.checkout_book('ISBN004', 'M001')
    assert 'error' in result  # Should be rejected!
```

---

## Severity Classification

| Bug | Severity | Impact | Effort to Fix |
|-----|----------|--------|---------------|
| #1 Off-by-one | 🟡 Medium | One-day lag in overdue detection | 5 min |
| #2 Null check | 🔴 High | Runtime crash on invalid input | 10 min |
| #3 Limit logic | 🔴 High | Requirement violation (4 books instead of 3) | 5 min |

---

## Assessment Insights

**Why These Three Bugs?**

1. **Off-by-one (Bug #1):** Tests attention to detail and boundary conditions
2. **Null check (Bug #2):** Tests defensive programming and error handling
3. **Logic error (Bug #3):** Tests code review skills and test-driven thinking

**What Good Candidates Will Do:**
- ✅ Write comprehensive unit tests including edge cases
- ✅ Catch all 3 bugs through test failures
- ✅ Fix bugs + add error handling
- ✅ Refactor for clarity and maintainability

**What Struggling Candidates Will Do:**
- ❌ Only find 1-2 bugs (or none)
- ❌ Focus on new features without checking existing code
- ❌ Skip edge case testing

---

## Updated Requirements Checklist

With seeded bugs in place, candidates must now:

1. ✅ **Book Management:** Add, update, delete, list books
2. ✅ **Member Management:** Register, update, remove members
3. ✅ **Loan Tracking:** Checkout, return books, enforce 3-book limit (Bug #3)
4. ✅ **Search:** By title and author (partial match)
5. ✅ **Overdue Detection:** List overdue loans (>= 14 days, Bug #1)
6. ✅ **Error Handling:** Meaningful errors for invalid input (Bug #2)

---

**Status:** ✅ All 3 seeded bugs implemented in starter code  
**Implementation Date:** March 13, 2026  
**Ready for:** BDR metric evaluation in Phase 3

