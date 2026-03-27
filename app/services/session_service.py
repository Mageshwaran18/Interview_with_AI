"""
═════════════════════════════════════════════════════════════════
Session Service — Session Management Business Logic (Phase 5+6)
═════════════════════════════════════════════════════════════════

Handles all session lifecycle management:
- Creating new sessions (single or bulk group)
- Candidate onboarding (name entry)
- State transitions (CREATED → IN_PROGRESS → COMPLETED → EVALUATED)
- Window enforcement (start_at / end_at)
- Token budget tracking
- Group session queries

Database: MongoDB
Collections used: sessions, token_budgets, session_groups
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, List
import secrets
import asyncio
import re
import os

from bson import ObjectId

from app.database import db
from app.schemas.session_schema import (
    SessionState,
    SessionCreateRequest,
    SessionOnboardingRequest,
    SessionResponse,
    TokenBudgetInfo,
    BulkSessionCreateRequest,
    BulkSessionCreateResponse,
    PerCandidateResult,
    SessionGroupSummary,
)

# Shortcuts to collections
sessions_collection = db["sessions"]
token_budgets_collection = db["token_budgets"]
judge_cache_collection = db["judge_cache"]
session_groups_collection = db["session_groups"]

FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

# ─── Simple email regex ───
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class WindowNotStartedError(Exception):
    """Session window has not opened yet."""
    def __init__(self, start_at: datetime):
        self.start_at = start_at
        super().__init__(f"Session window opens at {start_at.isoformat()}")


class WindowExpiredError(Exception):
    """Session window has closed."""
    def __init__(self, end_at: datetime):
        self.end_at = end_at
        super().__init__(f"Session window expired at {end_at.isoformat()}")


class SessionService:
    """Business logic for session management"""

    @staticmethod
    def generate_session_id() -> str:
        """
        Generate a unique, unguessable session ID.
        Format: session_{timestamp}_{randomhex}
        """
        timestamp = int(datetime.now().timestamp())
        random_hex = secrets.token_hex(6)
        return f"session_{timestamp}_{random_hex}"

    @staticmethod
    def generate_group_id() -> str:
        """
        Generate a unique group ID for bulk sessions.
        Format: group_{timestamp}_{randomhex}
        """
        timestamp = int(datetime.now().timestamp())
        random_hex = secrets.token_hex(6)
        return f"group_{timestamp}_{random_hex}"

    @staticmethod
    def _build_session_response(doc: dict) -> SessionResponse:
        """Build a SessionResponse from a MongoDB session document."""
        session_id = doc["session_id"]
        invite_link = f"{FRONTEND_BASE_URL}/session/{session_id}"
        created_at = doc.get("created_at") or datetime.now()
        state_str = doc.get("state", "CREATED")
        if state_str not in [s.value for s in SessionState]:
            state_str = "CREATED"
        return SessionResponse(
            session_id=session_id,
            state=SessionState(state_str),
            candidate_name=doc.get("candidate_name"),
            time_limit_minutes=doc.get("time_limit_minutes", 60),
            created_at=created_at,
            started_at=doc.get("started_at"),
            submitted_at=doc.get("submitted_at"),
            invite_link=invite_link,
            group_id=doc.get("group_id"),
            group_name=doc.get("group_name"),
            project_template=doc.get("project_template"),
            start_at=doc.get("start_at"),
            end_at=doc.get("end_at"),
            candidate_email=doc.get("candidate_email"),
        )

    @staticmethod
    def create_session(
        request: SessionCreateRequest,
        *,
        group_id: Optional[str] = None,
        group_name: Optional[str] = None,
        project_template: Optional[str] = None,
        start_at: Optional[datetime] = None,
        end_at: Optional[datetime] = None,
        candidate_email: Optional[str] = None,
        candidate_name: Optional[str] = None,
    ) -> SessionResponse:
        """
        Hiring manager creates a new session.
        Accepts optional group / window metadata for bulk creation.
        """
        session_id = SessionService.generate_session_id()

        session_doc = {
            "session_id": session_id,
            "state": SessionState.CREATED.value,
            "candidate_name": candidate_name,
            "time_limit_minutes": request.time_limit_minutes,
            "created_at": datetime.now(),
            "started_at": None,
            "submitted_at": None,
            "submission_reason": None,
            "token_budget": 200000,
            "tokens_used": 0,
            "hiring_manager_email": "manager@company.com",
            # Group / window metadata
            "group_id": group_id,
            "group_name": group_name,
            "project_template": project_template,
            "start_at": start_at,
            "end_at": end_at,
            "candidate_email": candidate_email,
        }

        sessions_collection.insert_one(session_doc)

        token_budget_doc = {
            "session_id": session_id,
            "total_budget": 200000,
            "tokens_used": 0,
            "created_at": datetime.now(),
        }
        token_budgets_collection.insert_one(token_budget_doc)

        invite_link = f"{FRONTEND_BASE_URL}/session/{session_id}"

        return SessionResponse(
            session_id=session_id,
            state=SessionState.CREATED,
            candidate_name=candidate_name,
            time_limit_minutes=request.time_limit_minutes,
            created_at=session_doc["created_at"],
            started_at=None,
            submitted_at=None,
            invite_link=invite_link,
            group_id=group_id,
            group_name=group_name,
            project_template=project_template,
            start_at=start_at,
            end_at=end_at,
            candidate_email=candidate_email,
        )

    @staticmethod
    def get_session(session_id: str) -> Optional[SessionResponse]:
        """
        Fetch a session by ID.
        Raises WindowNotStartedError / WindowExpiredError if outside validity window.
        """
        doc = sessions_collection.find_one({"session_id": session_id})
        if not doc:
            return None

        # Window enforcement
        start_at = doc.get("start_at")
        end_at = doc.get("end_at")
        tz = start_at.tzinfo if start_at else end_at.tzinfo if end_at else timezone.utc
        now = datetime.now(tz)

        if start_at and now < start_at:
            raise WindowNotStartedError(start_at)
        if end_at and now > end_at:
            raise WindowExpiredError(end_at)

        return SessionService._build_session_response(doc)

    @staticmethod
    def start_session(request: SessionOnboardingRequest) -> SessionResponse:
        """
        Candidate enters their name and starts working.
        Transitions session from CREATED → IN_PROGRESS.
        """
        doc = sessions_collection.find_one({"session_id": request.session_id})

        if not doc:
            raise ValueError(f"Session {request.session_id} not found")

        if doc["state"] != SessionState.CREATED.value:
            raise ValueError(f"Cannot start session in state {doc['state']}")

        # Window enforcement
        start_at = doc.get("start_at")
        end_at = doc.get("end_at")
        tz = start_at.tzinfo if start_at else end_at.tzinfo if end_at else timezone.utc
        now = datetime.now(tz)

        if start_at and now < start_at:
            raise WindowNotStartedError(start_at)
        if end_at and now > end_at:
            raise WindowExpiredError(end_at)

        sessions_collection.update_one(
            {"session_id": request.session_id},
            {
                "$set": {
                    "candidate_name": request.candidate_name,
                    "state": SessionState.IN_PROGRESS.value,
                    "started_at": now,
                }
            },
        )

        from app.services.event_service import log_event
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": doc["time_limit_minutes"],
                    },
                ))
            else:
                loop.run_until_complete(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": doc["time_limit_minutes"],
                    },
                ))
        except Exception as e:
            print(f"Warning: Failed to log SESSION_START event: {e}")

        return SessionService.get_session(request.session_id)

    @staticmethod
    def end_session(
        session_id: str,
        reason: str = "submitted",
        final_code_snapshot: Optional[str] = None,
    ) -> SessionResponse:
        """
        End a session.
        Manager terminations can end from any non-final state.
        """
        doc = sessions_collection.find_one({"session_id": session_id})

        if not doc:
            raise ValueError(f"Session {session_id} not found")

        current_state = doc["state"]
        is_manager_termination = reason == "terminated_by_manager"

        if current_state == SessionState.EVALUATED.value:
            raise ValueError(f"Cannot end session in final state {current_state}")

        if not is_manager_termination and current_state != SessionState.IN_PROGRESS.value:
            raise ValueError(f"Cannot end session in state {current_state}")

        if current_state == SessionState.COMPLETED.value and not is_manager_termination:
            return SessionService._build_session_response(doc)

        start_at = doc.get("start_at")
        end_at = doc.get("end_at")
        tz = start_at.tzinfo if start_at else end_at.tzinfo if end_at else timezone.utc
        now = datetime.now(tz)
        sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "state": SessionState.COMPLETED.value,
                    "submitted_at": now,
                    "submission_reason": reason,
                    "final_code_snapshot": final_code_snapshot,
                }
            },
        )

        from app.services.event_service import log_event
        session_start = doc.get("started_at")
        total_duration = (now - session_start).total_seconds() if session_start else 0

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(log_event(
                    session_id=session_id,
                    event_type="SESSION_END",
                    payload={
                        "reason": reason,
                        "total_duration_seconds": total_duration,
                        "final_code_snapshot": final_code_snapshot,
                    },
                ))
            else:
                loop.run_until_complete(log_event(
                    session_id=session_id,
                    event_type="SESSION_END",
                    payload={
                        "reason": reason,
                        "total_duration_seconds": total_duration,
                        "final_code_snapshot": final_code_snapshot,
                    },
                ))
        except Exception as e:
            print(f"Warning: Failed to log SESSION_END event: {e}")

        # Fetch the updated doc without window enforcement (manager-ended sessions)
        updated_doc = sessions_collection.find_one({"session_id": session_id})
        return SessionService._build_session_response(updated_doc)

    @staticmethod
    def list_sessions(state: Optional[str] = None) -> List[SessionResponse]:
        """List all sessions, optionally filtered by state."""
        query = {}
        if state:
            query["state"] = state

        docs = sessions_collection.find(query).sort("created_at", -1)
        sessions = []

        for doc in docs:
            try:
                sessions.append(SessionService._build_session_response(doc))
            except Exception as e:
                print(f"Warning: Failed to process session {doc.get('session_id')}: {e}")
                continue

        return sessions

    @staticmethod
    def create_sessions_bulk(request: BulkSessionCreateRequest) -> BulkSessionCreateResponse:
        """
        Bulk-create sessions for multiple candidates.

        Validates all rows first (duplicate check, email format, row limit).
        If dry_run=True: returns per-row validation results without touching DB or email.
        If dry_run=False: creates sessions, sends emails, persists group summary.
        """
        from app.services.email_service import send_invite_email

        start_at = request.start_at if request.start_at.tzinfo else request.start_at.replace(tzinfo=timezone.utc)
        end_at = request.end_at if request.end_at.tzinfo else request.end_at.replace(tzinfo=timezone.utc)
        tz = start_at.tzinfo or end_at.tzinfo or timezone.utc
        now = datetime.now(tz)
        results: List[PerCandidateResult] = []

        # ── Top-level validations ──────────────────────────────────────
        errors = []
        if len(request.candidates) == 0:
            errors.append("At least one candidate row is required.")
        if len(request.candidates) > 20:
            errors.append(f"Row limit exceeded: {len(request.candidates)} rows (max 20).")
        if start_at >= end_at:
            errors.append("start_at must be before end_at.")
        if end_at <= now:
            errors.append("end_at must be in the future.")
        if errors:
            raise ValueError("; ".join(errors))

        # ── Per-row validation ─────────────────────────────────────────
        seen_emails: set = set()
        seen_names: set = set()

        for row in request.candidates:
            row_errors = []
            email_lower = row.Gmail.strip().lower()
            name_clean = row.name.strip()

            # Email format
            if not _EMAIL_RE.match(email_lower):
                row_errors.append(f"Invalid email: {row.Gmail}")

            # Duplicate email
            if email_lower in seen_emails:
                row_errors.append(f"Duplicate email: {row.Gmail}")
            else:
                seen_emails.add(email_lower)

            # Duplicate name
            if name_clean.lower() in seen_names:
                row_errors.append(f"Duplicate name: {row.name}")
            else:
                seen_names.add(name_clean.lower())

            if row_errors:
                results.append(PerCandidateResult(
                    name=row.name,
                    email=row.Gmail,
                    status="invalid",
                    error="; ".join(row_errors),
                ))
            else:
                results.append(PerCandidateResult(
                    name=row.name,
                    email=email_lower,
                    status="valid",  # placeholder; updated below if not dry_run
                ))

        valid_count = sum(1 for r in results if r.status == "valid")
        failed_count = sum(1 for r in results if r.status == "invalid")

        # Dry-run: return now without touching DB
        if request.dry_run:
            return BulkSessionCreateResponse(
                group_id=None,
                dry_run=True,
                results=results,
                total=len(results),
                valid=valid_count,
                failed=failed_count,
            )

        # ── Real creation ──────────────────────────────────────────────
        group_id = SessionService.generate_group_id()
        final_results: List[PerCandidateResult] = []

        for row_result in results:
            if row_result.status == "invalid":
                final_results.append(row_result)
                continue

            # Create individual session
            single_request = SessionCreateRequest(
                time_limit_minutes=request.time_limit_minutes
            )
            try:
                session = SessionService.create_session(
                    single_request,
                    group_id=group_id,
                    group_name=request.group_name,
                    project_template=request.project_template,
                    start_at=start_at,
                    end_at=end_at,
                    candidate_email=row_result.email,
                    candidate_name=row_result.name,
                )

                # Send invite email
                email_ok = send_invite_email(
                    to_email=row_result.email,
                    candidate_name=row_result.name,
                    group_name=request.group_name,
                    template=request.project_template,
                    duration_minutes=request.time_limit_minutes,
                    start_at=start_at,
                    end_at=end_at,
                    invite_link=session.invite_link,
                )

                final_results.append(PerCandidateResult(
                    name=row_result.name,
                    email=row_result.email,
                    status="created" if email_ok else "email_failed",
                    session_id=session.session_id,
                    invite_link=session.invite_link,
                    error=None if email_ok else "Session created but invite email failed",
                ))
            except Exception as exc:
                final_results.append(PerCandidateResult(
                    name=row_result.name,
                    email=row_result.email,
                    status="invalid",
                    error=str(exc),
                ))

        # Persist group summary
        created_count = sum(1 for r in final_results if r.status in ("created", "email_failed"))
        failed_final = sum(1 for r in final_results if r.status not in ("created", "email_failed"))

        session_groups_collection.insert_one({
            "group_id": group_id,
            "group_name": request.group_name,
            "project_template": request.project_template,
            "created_at": now,
            "session_count": created_count,
            "start_at": start_at,
            "end_at": end_at,
            "creator_email": "manager@company.com",
        })

        return BulkSessionCreateResponse(
            group_id=group_id,
            dry_run=False,
            results=final_results,
            total=len(final_results),
            valid=created_count,
            failed=failed_final,
        )

    @staticmethod
    def get_session_groups(limit: int = 20) -> List[SessionGroupSummary]:
        """Return recent bulk session groups for the results filter dropdown."""
        docs = session_groups_collection.find().sort("created_at", -1).limit(limit)
        groups = []
        for doc in docs:
            try:
                groups.append(SessionGroupSummary(
                    group_id=doc["group_id"],
                    group_name=doc["group_name"],
                    project_template=doc.get("project_template", ""),
                    created_at=doc["created_at"],
                    session_count=doc.get("session_count", 0),
                    creator_email=doc.get("creator_email"),
                    start_at=doc.get("start_at"),
                    end_at=doc.get("end_at"),
                ))
            except Exception as e:
                print(f"Warning: Failed to parse group doc: {e}")
        return groups

    @staticmethod
    def get_token_budget(session_id: str) -> TokenBudgetInfo:
        """Get current token budget status for a session"""
        budget_doc = token_budgets_collection.find_one({"session_id": session_id})

        if not budget_doc:
            return TokenBudgetInfo(
                total_budget=200000,
                tokens_used=0,
                tokens_remaining=200000,
                percentage_used=0.0,
                warning_threshold_reached=False,
            )

        tokens_used = budget_doc.get("tokens_used", 0)
        total_budget = budget_doc.get("total_budget", 200000)
        tokens_remaining = total_budget - tokens_used
        percentage_used = (tokens_used / total_budget) * 100 if total_budget > 0 else 0
        warning_reached = percentage_used >= 80

        return TokenBudgetInfo(
            total_budget=total_budget,
            tokens_used=tokens_used,
            tokens_remaining=tokens_remaining,
            percentage_used=percentage_used,
            warning_threshold_reached=warning_reached,
        )

    @staticmethod
    def add_tokens(session_id: str, tokens: int) -> TokenBudgetInfo:
        """Record tokens used in a session."""
        token_budgets_collection.update_one(
            {"session_id": session_id},
            {"$inc": {"tokens_used": tokens}},
            upsert=True,
        )
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$inc": {"tokens_used": tokens}},
        )
        return SessionService.get_token_budget(session_id)

    @staticmethod
    def mark_evaluated(session_id: str) -> SessionResponse:
        """Mark session as EVALUATED after evaluation pipeline completes."""
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"state": SessionState.EVALUATED.value}},
        )
        doc = sessions_collection.find_one({"session_id": session_id})
        return SessionService._build_session_response(doc)
