"""
Phase 3: Evaluation Pipeline Test Suite
Comprehensive tests for all 5 pillars and the evaluation orchestrator.
"""

import asyncio
import logging
import pytest
from datetime import datetime, timedelta
from app.database import events_collection, evaluations_collection
from app.services.evaluation_service import run_evaluation, get_evaluation
from app.evaluation.pillar_g import compute_g_score
from app.evaluation.pillar_u import compute_u_score
from app.evaluation.pillar_i import compute_i_score
from app.evaluation.pillar_d import compute_d_score
from app.evaluation.pillar_e import compute_e_score

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_test_session_events(session_id: str, duration_minutes: int = 60):
    """
    Create realistic test events for a session to enable evaluation testing.
    """
    logger.info(f"Creating test events for session {session_id}")
    
    now = datetime.utcnow()
    events = []
    
    # Session start
    events.append({
        "session_id": session_id,
        "event_type": "SESSION_START",
        "timestamp": now,
        "payload": {}
    })
    
    # Add some planning time (5% of session)
    planning_end = now + timedelta(minutes=duration_minutes * 0.05)
    
    # First prompt - ask for task breakdown
    events.append({
        "session_id": session_id,
        "event_type": "PROMPT",
        "timestamp": planning_end,
        "payload": {
            "prompt_text": "Can you help me build a Library Management System? I need to implement book management, member registration, and loan tracking. Should I start with the data structures?"
        }
    })
    
    # AI response
    events.append({
        "session_id": session_id,
        "event_type": "RESPONSE",
        "timestamp": planning_end + timedelta(seconds=2),
        "payload": {
            "response_text": "Great! Start with defining your data structures: Book (id, title, author), Member (id, name, email), and Loan (book_id, member_id, checkout_date, return_date). Then implement CRUD operations for each."
        }
    })
    
    # Code saves with diffs
    code_save_time = planning_end + timedelta(minutes=5)
    events.append({
        "session_id": session_id,
        "event_type": "CODE_SAVE",
        "timestamp": code_save_time,
        "payload": {
            "filename": "library.py",
            "diff_text": "+ class Book:\n+     def __init__(self, id, title, author):\n+         self.id = id\n+         self.title = title\n+         self.author = author",
            "lines_added": 4,
            "lines_removed": 0,
            "full_snapshot": "class Book:\n    def __init__(self, id, title, author):\n        self.id = id\n        self.title = title\n        self.author = author\n"
        }
    })
    
    # More prompts for features
    events.append({
        "session_id": session_id,
        "event_type": "PROMPT",
        "timestamp": code_save_time + timedelta(minutes=10),
        "payload": {
            "prompt_text": "Now I need to implement book CRUD operations. Here's my class so far. Can you help me add add_book, delete_book, update_book methods?"
        }
    })
    
    # Response with code context (high CIR)
    events.append({
        "session_id": session_id,
        "event_type": "RESPONSE",
        "timestamp": code_save_time + timedelta(minutes=10, seconds=2),
        "payload": {
            "response_text": "def add_book(self, book):\n    self.books.append(book)\ndef delete_book(self, id):\n    self.books = [b for b in self.books if b.id != id]\ndef update_book(self, id, title, author):\n    for b in self.books:\n        if b.id == id:\n            b.title = title\n            b.author = author"
        }
    })
    
    # Test run - partial pass
    test_time = code_save_time + timedelta(minutes=20)
    events.append({
        "session_id": session_id,
        "event_type": "TEST_RUN",
        "timestamp": test_time,
        "payload": {
            "tests_total": 6,
            "tests_passed": 3,
            "tests_failed": 3,
            "output": "FAILED: test_add_book\nFAILED: test_remove_member\nFAILED: test_loan_tracking\n"
        }
    })
    
    # More iterations
    events.append({
        "session_id": session_id,
        "event_type": "PROMPT",
        "timestamp": test_time + timedelta(minutes=5),
        "payload": {
            "prompt_text": "Three tests are failing. Can you fix the issues?"
        }
    })
    
    # Final test run - full pass
    final_test_time = now + timedelta(minutes=duration_minutes * 0.95)
    events.append({
        "session_id": session_id,
        "event_type": "TEST_RUN",
        "timestamp": final_test_time,
        "payload": {
            "tests_total": 6,
            "tests_passed": 6,
            "tests_failed": 0,
            "output": "PASSED: All tests passed!\n"
        }
    })
    
    # Multiple code saves to show progression
    for i in range(3):
        events.append({
            "session_id": session_id,
            "event_type": "CODE_SAVE",
            "timestamp": code_save_time + timedelta(minutes=i*10),
            "payload": {
                "filename": "library.py",
                "diff_text": f"+ # Implementation {i+2}",
                "lines_added": 1,
                "lines_removed": 0,
                "full_snapshot": f"# File snapshot {i+2}\n"
            }
        })
    
    # Session end
    session_end = now + timedelta(minutes=duration_minutes)
    events.append({
        "session_id": session_id,
        "event_type": "SESSION_END",
        "timestamp": session_end,
        "payload": {}
    })
    
    # Insert all events
    if events:
        result = events_collection.insert_many(events)
        logger.info(f"Inserted {len(result.inserted_ids)} test events")
        return len(result.inserted_ids)
    
    return 0


@pytest.mark.asyncio
async def test_pillar_g(session_id: str):
    """Test Pillar G computation."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING PILLAR G - Goal Decomposition")
    logger.info(f"{'='*60}")
    
    result = await compute_g_score(session_id)
    
    logger.info(f"Pillar G Score: {result.get('score', 'N/A')}")
    logger.info(f"Sub-metrics: {result.get('sub_metrics', {}).keys()}")
    for metric_name, metric_data in result.get('sub_metrics', {}).items():
        logger.info(f"  {metric_name}: {metric_data.get('score', 'N/A')}")
    
    return result


@pytest.mark.asyncio
async def test_pillar_u(session_id: str):
    """Test Pillar U computation."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING PILLAR U - Usage Efficiency")
    logger.info(f"{'='*60}")
    
    result = await compute_u_score(session_id)
    
    logger.info(f"Pillar U Score: {result.get('score', 'N/A')}")
    logger.info(f"Sub-metrics: {result.get('sub_metrics', {}).keys()}")
    for metric_name, metric_data in result.get('sub_metrics', {}).items():
        logger.info(f"  {metric_name}: {metric_data.get('score', 'N/A')}")
    
    return result


@pytest.mark.asyncio
async def test_pillar_i(session_id: str):
    """Test Pillar I computation."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING PILLAR I - Iteration & Refinement")
    logger.info(f"{'='*60}")
    
    result = await compute_i_score(session_id)
    
    logger.info(f"Pillar I Score: {result.get('score', 'N/A')}")
    logger.info(f"Sub-metrics: {result.get('sub_metrics', {}).keys()}")
    for metric_name, metric_data in result.get('sub_metrics', {}).items():
        logger.info(f"  {metric_name}: {metric_data.get('score', 'N/A')}")
    
    return result


@pytest.mark.asyncio
async def test_pillar_d(session_id: str):
    """Test Pillar D computation."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING PILLAR D - Detection & Validation")
    logger.info(f"{'='*60}")
    
    result = await compute_d_score(session_id)
    
    logger.info(f"Pillar D Score: {result.get('score', 'N/A')}")
    logger.info(f"Sub-metrics: {result.get('sub_metrics', {}).keys()}")
    for metric_name, metric_data in result.get('sub_metrics', {}).items():
        logger.info(f"  {metric_name}: {metric_data.get('score', 'N/A')}")
    
    return result


@pytest.mark.asyncio
async def test_pillar_e(session_id: str):
    """Test Pillar E computation."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING PILLAR E - End Result Quality")
    logger.info(f"{'='*60}")
    
    result = await compute_e_score(session_id)
    
    logger.info(f"Pillar E Score: {result.get('score', 'N/A')}")
    logger.info(f"Sub-metrics: {result.get('sub_metrics', {}).keys()}")
    for metric_name, metric_data in result.get('sub_metrics', {}).items():
        logger.info(f"  {metric_name}: {metric_data.get('score', 'N/A')}")
    
    return result

@pytest.mark.asyncio
async def test_full_evaluation(session_id: str):
    """Test full evaluation pipeline."""
    logger.info(f"\n{'='*60}")
    logger.info("TESTING FULL EVALUATION PIPELINE")
    logger.info(f"{'='*60}")
    
    result = await run_evaluation(session_id)
    
    if result:
        logger.info(f"✓ Evaluation completed successfully")
        logger.info(f"  Composite Q Score: {result.get('composite_q_score', 'N/A')}")
        logger.info(f"  Total Events: {result.get('total_events', 'N/A')}")
        logger.info(f"  Duration: {result.get('session_duration_minutes', 'N/A')} minutes")
        return result
    else:
        logger.error(f"✗ Evaluation failed")
        return None


async def run_all_tests(session_id: str = "test_session_001"):
    """Run all evaluation tests."""
    try:
        logger.info("\n")
        logger.info("╔════════════════════════════════════════════════════════════╗")
        logger.info("║     GUIDE PHASE 3 - EVALUATION ENGINE TEST SUITE          ║")
        logger.info("╚════════════════════════════════════════════════════════════╝")
        
        # Create test events
        logger.info(f"\n[1/8] Creating test session events...")
        event_count = await create_test_session_events(session_id, duration_minutes=60)
        logger.info(f"✓ Created {event_count} test events")
        
        # Test individual pillars
        logger.info(f"\n[2/8] Testing Pillar G...")
        g_result = await test_pillar_g(session_id)
        
        logger.info(f"\n[3/8] Testing Pillar U...")
        u_result = await test_pillar_u(session_id)
        
        logger.info(f"\n[4/8] Testing Pillar I...")
        i_result = await test_pillar_i(session_id)
        
        logger.info(f"\n[5/8] Testing Pillar D...")
        d_result = await test_pillar_d(session_id)
        
        logger.info(f"\n[6/8] Testing Pillar E...")
        e_result = await test_pillar_e(session_id)
        
        # Test full evaluation
        logger.info(f"\n[7/8] Running full evaluation pipeline...")
        eval_result = await test_full_evaluation(session_id)
        
        # Retrieve evaluation
        logger.info(f"\n[8/8] Retrieving stored evaluation...")
        stored = await get_evaluation(session_id)
        if stored:
            logger.info(f"✓ Evaluation retrieved from database")
            logger.info(f"  ID: {stored.get('_id', 'N/A')}")
        else:
            logger.error(f"✗ Failed to retrieve evaluation")
        
        # Summary
        logger.info(f"\n")
        logger.info("╔════════════════════════════════════════════════════════════╗")
        logger.info("║                    TEST SUMMARY                           ║")
        logger.info("╚════════════════════════════════════════════════════════════╝")
        logger.info(f"Session ID: {session_id}")
        logger.info(f"Total Events: {event_count}")
        logger.info(f"\nPillar Scores:")
        logger.info(f"  G (Goal Decomposition): {g_result.get('score', 'N/A')}")
        logger.info(f"  U (Usage Efficiency): {u_result.get('score', 'N/A')}")
        logger.info(f"  I (Iteration & Refinement): {i_result.get('score', 'N/A')}")
        logger.info(f"  D (Detection & Validation): {d_result.get('score', 'N/A')}")
        logger.info(f"  E (End Result Quality): {e_result.get('score', 'N/A')}")
        if eval_result:
            logger.info(f"\nComposite Q Score: {eval_result.get('composite_q_score', 'N/A')}/100")
        logger.info(f"\n✓ All tests completed!")
        
    except Exception as e:
        logger.error(f"✗ Test failed with error: {e}", exc_info=True)


if __name__ == "__main__":
    # Run tests
    asyncio.run(run_all_tests(session_id="test_session_" + datetime.utcnow().strftime("%Y%m%d_%H%M%S")))
