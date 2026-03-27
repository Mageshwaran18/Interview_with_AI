"""
═════════════════════════════════════════════════════════════════
Group Session Tests — Unit Tests for Bulk Session Feature
═════════════════════════════════════════════════════════════════

Tests:
1. Dry-run validation: valid rows, invalid emails, duplicates, row limit
2. Real bulk create: sessions persisted, group summary saved
3. Window enforcement: WindowNotStartedError, WindowExpiredError
4. get_session_groups: returns group summaries
"""

import pytest
from datetime import datetime, timedelta

from app.services.session_service import (
    SessionService,
    WindowNotStartedError,
    WindowExpiredError,
)
from app.schemas.session_schema import (
    BulkCandidateRow,
    BulkSessionCreateRequest,
    SessionCreateRequest,
    SessionOnboardingRequest,
)
from app.database import db


@pytest.fixture(autouse=True)
def cleanup():
    """Clean up all test data after each test."""
    yield
    db["sessions"].delete_many({"group_id": {"$exists": True}})
    db["session_groups"].delete_many({})
    db["token_budgets"].delete_many({})
    db["events"].delete_many({})


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────
def _future_window():
    """Return (start_at, end_at) with a window 1 hour from now to 3 hours from now."""
    now = datetime.now()
    return now + timedelta(hours=1), now + timedelta(hours=3)


def _active_window():
    """Return (start_at, end_at) covering right now."""
    now = datetime.now()
    return now - timedelta(hours=1), now + timedelta(hours=2)


def _bulk_request(candidates, dry_run=False, expired=False):
    start, end = _active_window()
    if expired:
        start = datetime.now() - timedelta(hours=3)
        end = datetime.now() - timedelta(hours=1)
    return BulkSessionCreateRequest(
        group_name="Test Group",
        time_limit_minutes=60,
        project_template="Library Management System",
        start_at=start,
        end_at=end,
        candidates=candidates,
        dry_run=dry_run,
    )


# ─────────────────────────────────────────────────────────────────────────────
# 1. Dry-run validation
# ─────────────────────────────────────────────────────────────────────────────

class TestDryRunValidation:

    def test_dry_run_all_valid(self):
        """All valid rows → all statuses 'valid', no DB write."""
        candidates = [
            BulkCandidateRow(name="Alice Smith", Gmail="alice@example.com"),
            BulkCandidateRow(name="Bob Jones", Gmail="bob@example.com"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=True))

        assert result.dry_run is True
        assert result.group_id is None          # No group created in dry-run
        assert result.valid == 2
        assert result.failed == 0
        for r in result.results:
            assert r.status == "valid"

        # Confirm no sessions persisted
        assert db["sessions"].count_documents({"group_name": "Test Group"}) == 0

    def test_dry_run_invalid_email(self):
        """Invalid email format shows up as 'invalid' in dry-run."""
        candidates = [
            BulkCandidateRow(name="Carol White", Gmail="not-an-email"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=True))

        assert result.failed == 1
        assert result.results[0].status == "invalid"
        assert "Invalid email" in result.results[0].error

    def test_dry_run_duplicate_email(self):
        """Duplicate email in same batch → second row marked invalid."""
        candidates = [
            BulkCandidateRow(name="Dave Green", Gmail="dave@example.com"),
            BulkCandidateRow(name="David Green", Gmail="dave@example.com"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=True))

        assert result.failed == 1  # Second Dave
        statuses = [r.status for r in result.results]
        assert "invalid" in statuses

    def test_dry_run_duplicate_name(self):
        """Duplicate name in same batch → second row marked invalid."""
        candidates = [
            BulkCandidateRow(name="Eve Adams", Gmail="eve1@example.com"),
            BulkCandidateRow(name="Eve Adams", Gmail="eve2@example.com"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=True))

        assert result.failed == 1

    def test_row_limit_exceeded(self):
        """More than 20 rows → ValueError."""
        candidates = [
            BulkCandidateRow(name=f"Person {i}", Gmail=f"person{i}@example.com")
            for i in range(21)
        ]
        with pytest.raises(ValueError, match="Row limit exceeded"):
            SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=True))

    def test_empty_candidates_raises(self):
        """Zero candidates → ValueError."""
        with pytest.raises(ValueError, match="At least one candidate"):
            SessionService.create_sessions_bulk(_bulk_request([], dry_run=True))

    def test_start_after_end_raises(self):
        """start_at >= end_at → ValueError."""
        now = datetime.now()
        req = BulkSessionCreateRequest(
            group_name="Bad Window",
            time_limit_minutes=60,
            project_template="Library Management System",
            start_at=now + timedelta(hours=3),
            end_at=now + timedelta(hours=1),
            candidates=[BulkCandidateRow(name="Frank Black", Gmail="f@example.com")],
            dry_run=True,
        )
        with pytest.raises(ValueError, match="start_at must be before end_at"):
            SessionService.create_sessions_bulk(req)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Real bulk create
# ─────────────────────────────────────────────────────────────────────────────

class TestBulkCreate:

    def test_real_create_persists_sessions(self):
        """dry_run=False creates sessions in DB and returns a group_id."""
        candidates = [
            BulkCandidateRow(name="Grace Lee", Gmail="grace@example.com"),
            BulkCandidateRow(name="Heidi Park", Gmail="heidi@example.com"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=False))

        assert result.dry_run is False
        assert result.group_id is not None
        assert result.group_id.startswith("group_")
        assert result.valid == 2
        assert result.failed == 0

        # Sessions should exist in DB
        for r in result.results:
            assert r.session_id is not None
            doc = db["sessions"].find_one({"session_id": r.session_id})
            assert doc is not None
            assert doc["group_id"] == result.group_id

    def test_real_create_persists_group_summary(self):
        """Group summary is written to session_groups collection."""
        candidates = [BulkCandidateRow(name="Ivan Petrov", Gmail="ivan@example.com")]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=False))

        group_doc = db["session_groups"].find_one({"group_id": result.group_id})
        assert group_doc is not None
        assert group_doc["group_name"] == "Test Group"
        assert group_doc["session_count"] == 1

    def test_partial_invalid_rows_dont_block_valid(self):
        """Rows with invalid emails are skipped; valid rows still get created."""
        candidates = [
            BulkCandidateRow(name="Julia Chen", Gmail="julia@example.com"),
            BulkCandidateRow(name="Karl Mayer", Gmail="not-valid-email"),
        ]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=False))

        assert result.valid == 1
        assert result.failed == 1


# ─────────────────────────────────────────────────────────────────────────────
# 3. Window enforcement
# ─────────────────────────────────────────────────────────────────────────────

class TestWindowEnforcement:

    def test_get_session_not_started(self):
        """WindowNotStartedError raised when now < start_at."""
        future_start, future_end = _future_window()
        req = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(
            req, start_at=future_start, end_at=future_end
        )

        with pytest.raises(WindowNotStartedError) as exc_info:
            SessionService.get_session(session.session_id)

        assert exc_info.value.start_at == future_start

    def test_get_session_expired(self):
        """WindowExpiredError raised when now > end_at."""
        past_start = datetime.now() - timedelta(hours=3)
        past_end = datetime.now() - timedelta(hours=1)

        req = SessionCreateRequest(time_limit_minutes=60)
        # Insert manually since create_session would also enforce window on fetch
        from app.database import db as _db
        from app.schemas.session_schema import SessionState
        import secrets
        sid = f"session_test_{secrets.token_hex(4)}"
        _db["sessions"].insert_one({
            "session_id": sid,
            "state": SessionState.CREATED.value,
            "candidate_name": None,
            "time_limit_minutes": 60,
            "created_at": datetime.now(),
            "started_at": None,
            "submitted_at": None,
            "start_at": past_start,
            "end_at": past_end,
        })

        with pytest.raises(WindowExpiredError) as exc_info:
            SessionService.get_session(sid)

        assert exc_info.value.end_at == past_end
        _db["sessions"].delete_one({"session_id": sid})

    def test_no_window_no_enforcement(self):
        """Session without start/end window is always accessible."""
        req = SessionCreateRequest(time_limit_minutes=60)
        session = SessionService.create_session(req)

        fetched = SessionService.get_session(session.session_id)
        assert fetched is not None
        assert fetched.session_id == session.session_id


# ─────────────────────────────────────────────────────────────────────────────
# 4. get_session_groups
# ─────────────────────────────────────────────────────────────────────────────

class TestSessionGroups:

    def test_get_session_groups_returns_list(self):
        """After bulk create, get_session_groups returns the group."""
        candidates = [BulkCandidateRow(name="Lena Fox", Gmail="lena@example.com")]
        result = SessionService.create_sessions_bulk(_bulk_request(candidates, dry_run=False))

        groups = SessionService.get_session_groups()
        group_ids = [g.group_id for g in groups]
        assert result.group_id in group_ids

    def test_get_session_groups_empty(self):
        """No groups → empty list (not an error)."""
        groups = SessionService.get_session_groups()
        assert isinstance(groups, list)
