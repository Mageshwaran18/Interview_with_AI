"""
Retry Logic for LLM API Calls (Phase 5.4)

📚 What this does:
Implements automatic retry with exponential backoff for LLM API calls.
This improves reliability when network issues or temporary rate limits occur.

🔄 Strategy:
- Retry up to 3 times on transient errors
- Wait time: 2^attempt_number seconds (1s, 2s, 4s)
- On final failure: return unavailable marker (not 0/50%)

💡 Why exponential backoff:
Avoids overwhelming the server during rate limits.
Gives time for the service to recover.
"""

import asyncio
import functools
from typing import Callable, Any
import logging

logger = logging.getLogger(__name__)


def is_retryable_error(error: Exception) -> bool:
    """
    Determine if an error is worth retrying.
    
    Retryable: Network timeouts, rate limits (429), temporary server errors (5xx)
    Not retryable: Invalid requests (400), authentication failures (401/403)
    
    Args:
        error: The exception that occurred
        
    Returns:
        True if we should retry, False if we should fail immediately
    """
    error_str = str(error).lower()
    
    # Retryable patterns
    retryable_patterns = [
        "timeout",
        "connection",
        "429",  # Too Many Requests
        "503",  # Service Unavailable
        "504",  # Gateway Timeout
        "500",  # Internal Server Error
        "502",  # Bad Gateway
        "network",
        "reset",
    ]
    
    for pattern in retryable_patterns:
        if pattern in error_str:
            return True
    
    return False


async def retry_with_backoff(
    func: Callable,
    max_retries: int = 3,
    initial_wait: float = 1.0,
    backoff_factor: float = 2.0,
) -> Any:
    """
    Execute a coroutine with exponential backoff retry logic.
    
    Args:
        func: Async function to execute
        max_retries: Maximum number of retry attempts (total = max_retries + 1)
        initial_wait: Initial wait time in seconds
        backoff_factor: Multiplier for exponential backoff
        
    Returns:
        Result of the function if successful
        
    Raises:
        Exception: If all retries are exhausted
    """
    last_error = Exception("Unknown error")  # Initialize with a default error
    
    for attempt in range(max_retries + 1):
        try:
            result = await func()
            if attempt > 0:
                logger.info(f"✅ Succeeded after {attempt} retries")
            return result
            
        except Exception as e:
            last_error = e
            
            # Check if error is worth retrying
            if not is_retryable_error(e):
                logger.warning(f"❌ Non-retryable error: {e}")
                raise
            
            # Check if we have retries left
            if attempt >= max_retries:
                logger.error(f"❌ Failed after {max_retries + 1} attempts")
                raise
            
            # Calculate wait time with exponential backoff
            wait_time = initial_wait * (backoff_factor ** attempt)
            logger.warning(
                f"⏳ Attempt {attempt + 1}/{max_retries + 1} failed: {str(e)[:100]}. "
                f"Retrying in {wait_time}s..."
            )
            
            # Wait before retrying
            await asyncio.sleep(wait_time)
    
    # This shouldn't happen, but just in case
    raise last_error


def retry_decorator(max_retries: int = 3, initial_wait: float = 1.0):
    """
    Decorator for async functions to add retry logic.
    
    Usage:
        @retry_decorator(max_retries=3)
        async def my_api_call():
            return await some_llm_api()
    
    Args:
        max_retries: Number of retry attempts
        initial_wait: Initial wait time in seconds
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            async def call():
                return await func(*args, **kwargs)
            
            return await retry_with_backoff(
                call,
                max_retries=max_retries,
                initial_wait=initial_wait
            )
        
        return wrapper
    
    return decorator


# Example usage:
# @retry_decorator(max_retries=3, initial_wait=1.0)
# async def judge_call_with_retry(prompt):
#     response = model.generate_content(prompt)
#     return response
