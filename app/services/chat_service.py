import google.generativeai as genai
from datetime import datetime, timezone
from app.config import settings
from app.database import sessions_collection


# ─── Configure the Gemini API ───
# This sets up the API key globally so all calls use it
genai.configure(api_key=settings.GEMINI_API_KEY)

# ─── Create the Gemini Model Instance ───
# Using gemini-2.0-flash which is faster and available
model = genai.GenerativeModel("gemini-2.5-flash")


# ─── Mock Response Generator ───
# Used when API quota is exhausted (free tier limit: 0)
def generate_mock_response(prompt: str) -> dict:
    """
    Generates a realistic mock response based on the prompt.
    Used when Gemini API quota is exceeded.
    """
    prompt_lower = prompt.lower()
    
    # Keyword-based mock responses for common library system questions
    if "class" in prompt_lower:
        return {
            "response": "A Python class is a blueprint for creating objects. It defines attributes (data) and methods (functions) that objects of that class will have.\n\nExample:\n```python\nclass Book:\n    def __init__(self, title, author):\n        self.title = title\n        self.author = author\n    \n    def display_info(self):\n        return f'{self.title} by {self.author}'\n```\nClasses allow you to organize related data and functionality together.",
            "source": "mock",
            "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 80, "total_tokens": 95}
        }
    
    if "dictionary" in prompt_lower or "dict" in prompt_lower or "how to store" in prompt_lower:
        return {
            "response": "Dictionaries are key-value pairs in Python. Perfect for the library system!\n\nExample:\n```python\nbooks = {\n    'ISBN001': {'title': 'Python 101', 'author': 'John Doe', 'quantity': 5},\n    'ISBN002': {'title': 'Web Dev', 'author': 'Jane Smith', 'quantity': 3}\n}\n\n# Access:\nprint(books['ISBN001']['title'])  # Output: Python 101\n\n# Add:\nbooks['ISBN003'] = {'title': 'Data Science', 'author': 'Bob', 'quantity': 2}\n\n# Update:\nbooks['ISBN001']['quantity'] -= 1  # Checkout a book\n```\nDictionaries are fast for lookups and perfect for managing books by ISBN or ID.",
            "source": "mock",
            "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 120, "total_tokens": 140}
        }
    
    if "error" in prompt_lower or "exception" in prompt_lower or "try" in prompt_lower:
        return {
            "response": "Error handling in Python uses try-except blocks. Here's how for the library system:\n\n```python\ntry:\n    # Attempt to find and checkout a book\n    book = books.get(isbn)\n    if not book:\n        raise ValueError(f'Book {isbn} not found')\n    if book['quantity'] == 0:\n        raise ValueError('Book out of stock')\n    book['quantity'] -= 1\nexcept ValueError as e:\n    print(f'Error: {e}')\nexcept Exception as e:\n    print(f'Unexpected error: {e}')\n```\nAlways handle errors gracefully to provide better user experience.",
            "source": "mock",
            "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 110, "total_tokens": 130}
        }
    
    if "search" in prompt_lower:
        return {
            "response": "For searching in a library system, use partial string matching:\n\n```python\ndef search_books(query):\n    results = []\n    for isbn, book in books.items():\n        if query.lower() in book['title'].lower() or query.lower() in book['author'].lower():\n            results.append((isbn, book))\n    return results\n\n# Usage:\nresults = search_books('Python')  # Finds all books with 'Python' in title/author\n```\nUse .lower() for case-insensitive matching.",
            "source": "mock",
            "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 100, "total_tokens": 115}
        }
    
    if "loop" in prompt_lower or "for" in prompt_lower or "while" in prompt_lower:
        return {
            "response": "Loops are essential for iterating through books and members:\n\n```python\n# For loop - iterate through all books\nfor isbn, book in books.items():\n    print(f'{book[\"title\"]} ({book[\"quantity\"]} in stock)')\n\n# List comprehension - find available books\navailable = [isbn for isbn, book in books.items() if book['quantity'] > 0]\n\n# While loop - checkout mechanism\nwhile member['books_checked_out'] < 3:\n    checkout_book(member_id, isbn)\n    member['books_checked_out'] += 1\n```\nChoose based on your needs: for loops for iteration, list comprehensions for filtering, while for conditional repetition.",
            "source": "mock",
            "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 130, "total_tokens": 150}
        }
    
    # Default helpful response
    return {
        "response": f"I received your question about the Library Management System. Here's some general guidance:\n\n1. **Data Structure**: Use dictionaries to store books and members\n2. **Book Properties**: ISBN, title, author, quantity, date_added\n3. **Member Properties**: member_id, name, email, books_checked_out, max_books (3)\n4. **Operations**: \n   - Checkout: Decrease book quantity, add to member's list\n   - Return: Increase quantity, remove from member's list\n   - Search: Use string matching with .lower() for case-insensitive search\n   - Overdue: Track checkout dates, calculate days difference\n5. **Error Handling**: Validate inputs, handle edge cases (no books, member limit)\n\nWould you like help with any specific part? (e.g., data structure, checkout logic, search functionality)",
        "source": "mock",
        "token_count": {"prompt_tokens": len(prompt.split()), "response_tokens": 150, "total_tokens": 175}
    }


async def chat_with_ai(session_id: str, prompt: str) -> dict:
    """
    Sends the user's prompt to Google Gemini and returns the AI response.
    Falls back to mock responses if API quota is exceeded.
    
    Flow:
    1. Try to send prompt to Gemini API
    2. If quota error, use intelligent mock response
    3. Extract the text response and token count
    4. Log the interaction to MongoDB (seed of Interaction Trace Φ)
    5. Return the response text
    
    Args:
        session_id: Unique identifier for this coding session
        prompt: The user's message/question to the AI
        
    Returns:
        dict with 'response' text and 'session_id'
    """
    
    ai_response_text = None
    token_count = None
    source = "gemini"
    
    # ── Step 1: Try Gemini API ──
    try:
        response = model.generate_content(prompt)
        ai_response_text = response.text
        
        usage = response.usage_metadata
        token_count = {
            "prompt_tokens": usage.prompt_token_count,
            "response_tokens": usage.candidates_token_count,
            "total_tokens": usage.total_token_count,
        }
        source = "gemini"
        
    except Exception as e:
        # ── Check if it's a quota error ──
        error_str = str(e)
        if "quota" in error_str.lower() or "429" in error_str:
            print(f"⚠️  Gemini quota exceeded: {error_str[:100]}...")
            print("📝 Using intelligent mock response instead")
            
            # Get mock response
            mock_data = generate_mock_response(prompt)
            ai_response_text = mock_data["response"]
            token_count = mock_data.get("token_count", {
                "prompt_tokens": len(prompt.split()),
                "response_tokens": len(ai_response_text.split()),
                "total_tokens": len(prompt.split()) + len(ai_response_text.split())
            })
            source = "mock"
        else:
            # Re-raise if it's a different error
            raise
    
    # ── Step 2: Log to MongoDB (Interaction Trace Φ seed) ──
    # This is the FOUNDATION of the evaluation system.
    # Every prompt and response is saved so the Evaluation Engine
    # (Phase 3) can later analyze the candidate's AI usage patterns.
    interaction_log = {
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc),
        "prompt": prompt,
        "response": ai_response_text,
        "token_count": token_count,
        "source": source,  # Track whether real API or mock
    }
    sessions_collection.insert_one(interaction_log)
    
    # ── Step 3: Return to the route layer ──
    return {
        "session_id": session_id,
        "response": ai_response_text,
    }
