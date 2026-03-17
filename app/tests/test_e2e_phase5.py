"""
═════════════════════════════════════════════════════════════════
E2E Testing for Phase 5 — Session Lifecycle & Resilience
═════════════════════════════════════════════════════════════════

Comprehensive end-to-end testing for Phase 5 deliverables:
1. Session lifecycle (CREATED → IN_PROGRESS → COMPLETED → EVALUATED)
2. Token budget tracking (warnings at 80%, cut-off at 100%)
3. Partial evaluation handling (pillar reweighting)
4. Full workflow validation (manager → candidate → evaluation)

Test Classes:
- TestE2ESessionLifecycle: Complete workflow from creation to evaluation
- TestE2ETokenBudget: Token budget thresholds and warnings
- TestE2EPartialEvaluation: Pillar reweighting logic
- TestE2EMockIntegration: State machine validation

Database: Uses real MongoDB collections (auto-cleaned after tests)
"""

import pytest
from datetime import datetime
from typing import Optional

# Backend imports
from app.services.session_service import SessionService
from app.services.evaluation_service import reweight_pillars
from app.schemas.session_schema import (
    SessionState,
    SessionCreateRequest,
    SessionOnboardingRequest,
    TokenBudgetInfo,
)
from app.schemas.evaluation_schema import PillarScore
from app.database import db


# ═══════════════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════════════

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data after each test"""
    yield
    # Delete all test sessions
    sessions_collection = db["sessions"]
    token_budgets_collection = db["token_budgets"]
    events_collection = db["events"]
    sessions_collection.delete_many({})
    token_budgets_collection.delete_many({})
    events_collection.delete_many({})


# ═══════════════════════════════════════════════════════════════════════════
# Test Class 1: Session Lifecycle
# ═══════════════════════════════════════════════════════════════════════════

class TestE2ESessionLifecycle:
    """End-to-end testing of complete session workflow"""

    def test_e2e_complete_workflow(self):
        """
        Full workflow test:
        1. Manager creates session
        2. Candidate enters name and starts
        3. Candidate codes, saves, and tests
        4. Session ends with final code
        5. Evaluation triggered
        """
        # ─────────────────────────────────────────────────────────────
        # Step 1: Hiring manager creates session
        # ─────────────────────────────────────────────────────────────
        
        create_request = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(create_request)
        session_id = session.session_id

        # Verify: Session created in CREATED state
        assert session.state == SessionState.CREATED
        assert session.time_limit_minutes == 60
        assert session.candidate_name is None

        # Verify: Token budget created
        budget = SessionService.get_token_budget(session_id)
        assert budget.total_budget == 200000
        assert budget.tokens_used == 0
        assert budget.percentage_used == 0.0

        # Verify: Invite link generated
        assert session.invite_link is not None
        assert f"/session/{session_id}" in session.invite_link


        # ─────────────────────────────────────────────────────────────
        # Step 2: Candidate starts session
        # ─────────────────────────────────────────────────────────────
        
        candidate_name = "Alice"
        onboarding_request = SessionOnboardingRequest(
            session_id=session_id,
            candidate_name=candidate_name
        )
        SessionService.start_session(onboarding_request)

        db_session = SessionService.get_session(session_id)
        assert db_session is not None, "Session should exist after start"
        assert db_session.state == SessionState.IN_PROGRESS
        assert db_session.candidate_name == candidate_name
        assert db_session.started_at is not None


        # ─────────────────────────────────────────────────────────────
        # Step 3: Simulate candidate work (code save, token usage)
        # ─────────────────────────────────────────────────────────────
        
        # Mock: Candidate types code and submits
        # Mock: LLM API call uses 250 tokens
        SessionService.add_tokens(session_id, 250)

        budget = SessionService.get_token_budget(session_id)
        assert budget.tokens_used == 250
        assert budget.percentage_used > 0.1  # ~0.125%


        # ─────────────────────────────────────────────────────────────
        # Step 4: End session with final code
        # ─────────────────────────────────────────────────────────────
        
        final_code = """
def add_book(title, author, isbn):
    if isbn not in books:
        books[isbn] = {"title": title, "author": author}
    return True
"""
        
        SessionService.end_session(
            session_id, 
            reason="submitted", 
            final_code_snapshot=final_code
        )

        db_session = SessionService.get_session(session_id)
        assert db_session is not None, "Session should exist after end"
        assert db_session.state == SessionState.COMPLETED
        assert db_session.submitted_at is not None


        # ─────────────────────────────────────────────────────────────
        # Step 5: Mark as evaluated
        # ─────────────────────────────────────────────────────────────
        
        SessionService.mark_evaluated(session_id)

        db_session = SessionService.get_session(session_id)
        assert db_session is not None, "Session should exist after mark evaluated"
        assert db_session.state == SessionState.EVALUATED


        # ─────────────────────────────────────────────────────────────
        # Step 6: Verify events were logged
        # ─────────────────────────────────────────────────────────────
        
        events_collection = db["events"]
        events = list(events_collection.find({"session_id": session_id}))
        
        # Should have: SESSION_START, CODE_SAVE (implicit), TOKEN_USAGE, TEST_RUN, SESSION_END
        assert len(events) >= 2  # At minimum: SESSION_START and SESSION_END


# ═══════════════════════════════════════════════════════════════════════════
# Test Class 2: Token Budget
# ═══════════════════════════════════════════════════════════════════════════

class TestE2ETokenBudget:
    """Token budget threshold and warning tests"""

    def test_token_budget_warnings(self):
        """Verify 80% warning threshold"""
        create_request = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(create_request)
        session_id = session.session_id

        # Use 75% of budget (150K tokens)
        large_token_usage = 150000
        SessionService.add_tokens(session_id, large_token_usage)

        budget = SessionService.get_token_budget(session_id)
        assert budget.tokens_used == 150000
        assert budget.percentage_used >= 75.0

        # Use another 15K (now at 82.5%)
        additional = 15000
        SessionService.add_tokens(session_id, additional)

        budget = SessionService.get_token_budget(session_id)
        assert budget.tokens_used == 165000
        assert budget.percentage_used >= 80.0
        assert budget.warning_threshold_reached is True


    def test_token_budget_hard_cutoff(self):
        """Verify 100% exhaustion"""
        create_request = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(create_request)
        session_id = session.session_id

        # Use all 200K tokens
        SessionService.add_tokens(session_id, 200000)

        budget = SessionService.get_token_budget(session_id)
        assert budget.tokens_used == 200000
        assert budget.percentage_used == 100.0


# ═══════════════════════════════════════════════════════════════════════════
# Test Class 3: Partial Evaluation
# ═══════════════════════════════════════════════════════════════════════════

class TestE2EPartialEvaluation:
    """Partial evaluation and pillar reweighting tests"""

    def test_pillar_reweighting(self):
        """Test reweighting when pillar unavailable"""
        # Simulate: D unavailable, others available
        available_pillars = {
            "G": True,
            "U": True,
            "I": True,
            "D": False,  # Unavailable
            "E": True,
        }

        reweighted = reweight_pillars(available_pillars)

        # D should be 0
        assert reweighted["D"] == 0.0

        # Others should be > 0 and increased from original
        original_weight = 0.20  # Default for G, I, E
        for pillar in ["G", "U", "I", "E"]:
            assert reweighted[pillar] > original_weight, f"{pillar} not increased"

        # Total should be ~1.0
        total = sum(reweighted.values())
        assert abs(total - 1.0) < 0.001, f"Total {total} not close to 1.0"


# ═══════════════════════════════════════════════════════════════════════════
# Test Class 4: State Machine
# ═══════════════════════════════════════════════════════════════════════════

class TestE2EMockIntegration:
    """State machine and integration tests"""

    def test_session_state_machine(self):
        """Verify 4-state transitions"""
        # Create session
        create_request = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(create_request)
        session_id = session.session_id
        assert session.state == SessionState.CREATED

        # Transition to IN_PROGRESS
        onboarding_request = SessionOnboardingRequest(
            session_id=session_id,
            candidate_name="TestCandidate"
        )
        SessionService.start_session(onboarding_request)
        session = SessionService.get_session(session_id)
        assert session is not None, "Session should exist after start"
        assert session.state == SessionState.IN_PROGRESS

        # Transition to COMPLETED
        SessionService.end_session(session_id)
        session = SessionService.get_session(session_id)
        assert session is not None, "Session should exist after end"
        assert session.state == SessionState.COMPLETED

        # Transition to EVALUATED
        SessionService.mark_evaluated(session_id)
        session = SessionService.get_session(session_id)
        assert session is not None, "Session should exist after mark evaluated"
        assert session.state == SessionState.EVALUATED
