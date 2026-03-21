"""
Pytest configuration and fixtures for evaluation tests.
"""

import pytest
import asyncio
from datetime import datetime
import logging
from app.database import events_collection, evaluations_collection
from .test_evaluation_pipeline import create_test_session_events

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(scope="function")
async def session_id():
    """
    Fixture that provides a session ID and creates test events.
    """
    from uuid import uuid4
    
    # Generate unique session ID
    test_session_id = f"test_session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}"
    logger.info(f"\n✓ Generated test session ID: {test_session_id}")
    
    # Create test events
    event_count = await create_test_session_events(test_session_id, duration_minutes=60)
    logger.info(f"✓ Created {event_count} test events for session")
    
    yield test_session_id
    
    # Cleanup after test
    logger.info(f"\nCleaning up session: {test_session_id}")
    events_collection.delete_many({"session_id": test_session_id})
    evaluations_collection.delete_many({"session_id": test_session_id})
    logger.info(f"✓ Cleanup complete")


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Setup database connections for tests."""
    try:
        # Verify collections exist and are accessible
        logger.info("Setting up test database...")
        events_collection.database.command('ping')
        logger.info("✓ Database connection verified")
        yield
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        raise

