"""
═════════════════════════════════════════════════════════════════
Session Service — Session Management Business Logic (Phase 5)
═════════════════════════════════════════════════════════════════

This module handles all session lifecycle management:
- Creating new sessions (hiring manager)
- Candidate onboarding (name entry)
- State transitions (CREATED → IN_PROGRESS → COMPLETED → EVALUATED)
- Fetching session details
- Token budget tracking

Database: MongoDB
Collections used: sessions, token_budgets
"""

from datetime import datetime, timedelta
from typing import Optional, List
import secrets  # For generating secure random session IDs
import asyncio
from bson import ObjectId

from app.database import db
from app.schemas.session_schema import (
    SessionState,
    SessionCreateRequest,
    SessionOnboardingRequest,
    SessionResponse,
    TokenBudgetInfo,
)

# Shortcuts to collections
sessions_collection = db["sessions"]
token_budgets_collection = db["token_budgets"]
judge_cache_collection = db["judge_cache"]  # For caching LLM-as-Judge calls


class SessionService:
    """Business logic for session management"""

    @staticmethod
    def generate_session_id() -> str:
        """
        Generate a unique, unguessable session ID.
        Format: session_{timestamp}_{randomhex}
        Example: session_1710700800_a3f2c8d7e9b1
        """
        timestamp = int(datetime.now().timestamp())
        random_hex = secrets.token_hex(6)
        return f"session_{timestamp}_{random_hex}"

    @staticmethod
    def create_session(request: SessionCreateRequest) -> SessionResponse:
        """
        Hiring manager creates a new session.
        
        Returns a SessionResponse with invite_link that the manager
        can share with the candidate.
        """
        session_id = SessionService.generate_session_id()

        session_doc = {
            "session_id": session_id,
            "state": SessionState.CREATED.value,
            "candidate_name": None,  # Will be filled in during onboarding
            "time_limit_minutes": request.time_limit_minutes,
            "created_at": datetime.now(),
            "started_at": None,
            "submitted_at": None,
            "submission_reason": None,
            # Token budget for this session
            "token_budget": 200000,
            "tokens_used": 0,
            # Session metadata
            "hiring_manager_email": "manager@company.com",  # TODO: Get from auth
        }

        sessions_collection.insert_one(session_doc)

        # Create token budget document
        token_budget_doc = {
            "session_id": session_id,
            "total_budget": 200000,
            "tokens_used": 0,
            "created_at": datetime.now(),
        }
        token_budgets_collection.insert_one(token_budget_doc)

        # Generate invite link
        # In production, this would be the full URL from frontend
        invite_link = f"http://localhost:5173/session/{session_id}"

        return SessionResponse(
            session_id=session_id,
            state=SessionState.CREATED,
            candidate_name=None,
            time_limit_minutes=request.time_limit_minutes,
            created_at=session_doc["created_at"],
            started_at=None,
            submitted_at=None,
            invite_link=invite_link,
        )

    @staticmethod
    def get_session(session_id: str) -> Optional[SessionResponse]:
        """Fetch a session by ID"""
        session_doc = sessions_collection.find_one({"session_id": session_id})

        if not session_doc:
            return None

        # Generate invite link
        invite_link = f"http://localhost:5173/session/{session_id}"
        
        # Ensure created_at has a valid datetime value, default to now if missing
        created_at = session_doc.get("created_at")
        if created_at is None:
            created_at = datetime.now()

        return SessionResponse(
            session_id=session_doc["session_id"],
            state=SessionState(session_doc["state"]),
            candidate_name=session_doc.get("candidate_name"),
            time_limit_minutes=session_doc["time_limit_minutes"],
            created_at=created_at,
            started_at=session_doc.get("started_at"),
            submitted_at=session_doc.get("submitted_at"),
            invite_link=invite_link,
        )

    @staticmethod
    def start_session(request: SessionOnboardingRequest) -> SessionResponse:
        """
        Candidate enters their name and starts working.
        Transitions session from CREATED → IN_PROGRESS.
        """
        session_doc = sessions_collection.find_one(
            {"session_id": request.session_id}
        )

        if not session_doc:
            raise ValueError(f"Session {request.session_id} not found")

        if session_doc["state"] != SessionState.CREATED.value:
            raise ValueError(
                f"Cannot start session in state {session_doc['state']}"
            )

        # Update session: mark as IN_PROGRESS
        now = datetime.now()
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

        # Log SESSION_START event (for Interaction Trace Φ)
        from app.services.event_service import log_event
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": session_doc["time_limit_minutes"],
                    },
                ))
            else:
                loop.run_until_complete(log_event(
                    session_id=request.session_id,
                    event_type="SESSION_START",
                    payload={
                        "candidate_name": request.candidate_name,
                        "time_limit_minutes": session_doc["time_limit_minutes"],
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
        End a session (submitted by candidate, timer expired, or manager termination).
        Transitions session from IN_PROGRESS → COMPLETED.
        
        Manager terminations (reason='terminated_by_manager') can end sessions 
        from any state except EVALUATED (which is final).
        """
        session_doc = sessions_collection.find_one({"session_id": session_id})

        if not session_doc:
            raise ValueError(f"Session {session_id} not found")

        current_state = session_doc["state"]
        
        # Allow manager terminations from any non-final state
        is_manager_termination = reason == "terminated_by_manager"
        
        if current_state == SessionState.EVALUATED.value:
            raise ValueError(f"Cannot end session in final state {current_state}")
        
        if not is_manager_termination and current_state != SessionState.IN_PROGRESS.value:
            raise ValueError(
                f"Cannot end session in state {current_state}"
            )
        
        # Idempotent: if already COMPLETED with same reason, just return it
        if current_state == SessionState.COMPLETED.value and not is_manager_termination:
            return SessionService.get_session(session_id)

        # Update session: mark as COMPLETED
        now = datetime.now()
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

        # Log SESSION_END event (for Interaction Trace Φ)
        from app.services.event_service import log_event
        session_start = session_doc.get("started_at")
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

        return SessionService.get_session(session_id)

    @staticmethod
    def list_sessions(state: Optional[str] = None) -> List[SessionResponse]:
        """
        List all sessions (optionally filter by state).
        Used by hiring manager dashboard.
        """
        query = {}
        if state:
            query["state"] = state

        session_docs = sessions_collection.find(query).sort("created_at", -1)
        sessions = []

        for doc in session_docs:
            try:
                # Handle invalid state values gracefully
                session_state = doc.get("state", "CREATED")
                if session_state not in [s.value for s in SessionState]:
                    session_state = "CREATED"  # Default to CREATED if invalid
                
                # Ensure created_at has a valid datetime value, default to now if missing
                created_at = doc.get("created_at")
                if created_at is None:
                    created_at = datetime.now()
                
                sessions.append(
                    SessionResponse(
                        session_id=doc["session_id"],
                        state=SessionState(session_state),
                        candidate_name=doc.get("candidate_name"),
                        time_limit_minutes=doc.get("time_limit_minutes", 60),
                        created_at=created_at,
                        started_at=doc.get("started_at"),
                        submitted_at=doc.get("submitted_at"),
                        invite_link=f"http://localhost:5173/session/{doc['session_id']}",
                    )
                )
            except Exception as e:
                # Log problematic documents but continue processing others
                print(f"Warning: Failed to process session {doc.get('session_id')}: {str(e)}")
                continue

        return sessions

    @staticmethod
    def get_token_budget(session_id: str) -> TokenBudgetInfo:
        """Get current token budget status for a session"""
        budget_doc = token_budgets_collection.find_one({"session_id": session_id})

        if not budget_doc:
            # Default if not found
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
        """
        Record tokens used in a session.
        Called after each LLM API call.
        """
        token_budgets_collection.update_one(
            {"session_id": session_id},
            {"$inc": {"tokens_used": tokens}},
            upsert=True,
        )

        # Also update the session document
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$inc": {"tokens_used": tokens}},
        )

        return SessionService.get_token_budget(session_id)

    @staticmethod
    def mark_evaluated(session_id: str) -> SessionResponse:
        """
        Mark session as EVALUATED after evaluation pipeline completes.
        Transitions session from COMPLETED → EVALUATED.
        """
        sessions_collection.update_one(
            {"session_id": session_id},
            {"$set": {"state": SessionState.EVALUATED.value}},
        )

        return SessionService.get_session(session_id)
