import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.schemas.session_schema import SessionState
from app.services.event_service import log_event
from app.services.session_service import SessionService, sessions_collection


CHAT_LOCK_MINUTES = 5
CHAT_COOLDOWN_SECONDS = 60
MAX_POLICY_VIOLATIONS = 3

_DIRECT_SOLUTION_PATTERNS = [
    r"\bcomplete\s+solution\b",
    r"\bfull\s+solution\b",
    r"\bentire\s+solution\b",
    r"\bgive\s+me\s+all\s+functions\b",
    r"\bwrite\s+all\s+functions\b",
    r"\bcomplete\s+function\b",
    r"\bfull\s+function\b",
    r"\breturn\s+only\s+code\b",
    r"\bjust\s+give\s+code\b",
    r"\bpaste\s+final\s+code\b",
    r"\bsolve\s+this\s+for\s+me\b",
]


class ChatPolicyError(Exception):
    def __init__(self, status_code: int, detail: Dict[str, Any]):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail.get("message", "Chat policy blocked"))


class ChatPolicyService:
    @staticmethod
    def _to_utc(dt: datetime) -> datetime:
        if dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)

    @staticmethod
    def _is_direct_solution_request(prompt: str) -> bool:
        lowered = prompt.lower().strip()
        score = 0
        for pattern in _DIRECT_SOLUTION_PATTERNS:
            if re.search(pattern, lowered):
                score += 1

        # additional intent boosters
        if "complete" in lowered and "code" in lowered:
            score += 1
        if "give me" in lowered and ("function" in lowered or "solution" in lowered):
            score += 1

        return score >= 1

    @staticmethod
    def _get_policy_state(session_doc: Dict[str, Any]) -> Dict[str, Any]:
        policy = session_doc.get("chat_policy") or {}
        started_at = session_doc.get("started_at")
        if started_at:
            started_at = ChatPolicyService._to_utc(started_at)
            chat_enabled_at = policy.get("chat_enabled_at")
            if chat_enabled_at:
                chat_enabled_at = ChatPolicyService._to_utc(chat_enabled_at)
            else:
                chat_enabled_at = started_at + timedelta(minutes=CHAT_LOCK_MINUTES)
        else:
            chat_enabled_at = None

        last_chat_at = policy.get("last_chat_at")
        if last_chat_at:
            last_chat_at = ChatPolicyService._to_utc(last_chat_at)

        return {
            "chat_enabled_at": chat_enabled_at,
            "last_chat_at": last_chat_at,
            "violation_count": int(policy.get("violation_count", 0)),
            "cooldown_seconds": int(policy.get("cooldown_seconds", CHAT_COOLDOWN_SECONDS)),
            "lock_minutes": int(policy.get("lock_minutes", CHAT_LOCK_MINUTES)),
            "terminated_for_policy": bool(policy.get("terminated_for_policy", False)),
        }

    @staticmethod
    def _persist_policy(session_id: str, state: Dict[str, Any]):
        sessions_collection.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "chat_policy": {
                        "chat_enabled_at": state.get("chat_enabled_at"),
                        "last_chat_at": state.get("last_chat_at"),
                        "violation_count": state.get("violation_count", 0),
                        "cooldown_seconds": state.get("cooldown_seconds", CHAT_COOLDOWN_SECONDS),
                        "lock_minutes": state.get("lock_minutes", CHAT_LOCK_MINUTES),
                        "terminated_for_policy": state.get("terminated_for_policy", False),
                    }
                }
            },
        )

    @staticmethod
    def _block(status_code: int, code: str, message: str, **extra):
        detail = {"code": code, "message": message}
        detail.update(extra)
        raise ChatPolicyError(status_code=status_code, detail=detail)

    @staticmethod
    def enforce_pre_chat(session_id: str, prompt: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        session_doc = sessions_collection.find_one({"session_id": session_id})
        if not session_doc:
            ChatPolicyService._block(404, "SESSION_NOT_FOUND", "Session not found.")
            return {}

        if session_doc is None:
            ChatPolicyService._block(404, "SESSION_NOT_FOUND", "Session not found.")
            return {}

        state = ChatPolicyService._get_policy_state(session_doc)
        ChatPolicyService._persist_policy(session_id, state)

        if session_doc.get("state") != SessionState.IN_PROGRESS.value:
            ChatPolicyService._block(
                403,
                "SESSION_NOT_ACTIVE",
                "Chat is available only while session is in progress.",
                session_state=session_doc.get("state"),
            )

        log_event(session_id, "CHAT_REQUEST", {"prompt_text": prompt[:2000]})

        # Rule 1: first 5 minutes lock
        enabled_at = state.get("chat_enabled_at")
        if enabled_at and now < enabled_at:
            wait_seconds = int((enabled_at - now).total_seconds())
            log_event(session_id, "CHAT_BLOCKED_LOCK", {"wait_seconds": wait_seconds})
            ChatPolicyService._block(
                423,
                "CHAT_LOCKED",
                "Chat is locked for the first 5 minutes of the session.",
                wait_seconds=max(wait_seconds, 1),
                session_state=session_doc.get("state"),
            )

        # Rule 2: 1 message per minute
        last_chat_at = state.get("last_chat_at")
        cooldown = state.get("cooldown_seconds", CHAT_COOLDOWN_SECONDS)
        if last_chat_at:
            elapsed = (now - last_chat_at).total_seconds()
            if elapsed < cooldown:
                wait_seconds = int(cooldown - elapsed)
                log_event(session_id, "CHAT_BLOCKED_RATE_LIMIT", {"wait_seconds": wait_seconds})
                ChatPolicyService._block(
                    429,
                    "CHAT_RATE_LIMIT",
                    "Please wait before sending the next message.",
                    wait_seconds=max(wait_seconds, 1),
                    session_state=session_doc.get("state"),
                )

        # Rule 3: direct solution escalation
        if ChatPolicyService._is_direct_solution_request(prompt):
            state["violation_count"] = state.get("violation_count", 0) + 1
            ChatPolicyService._persist_policy(session_id, state)

            if state["violation_count"] >= MAX_POLICY_VIOLATIONS:
                state["terminated_for_policy"] = True
                ChatPolicyService._persist_policy(session_id, state)
                log_event(
                    session_id,
                    "CHAT_POLICY_TERMINATED",
                    {
                        "violation_count": state["violation_count"],
                        "reason": "policy_violation_limit",
                    },
                )
                ChatPolicyService._block(
                    403,
                    "CHAT_POLICY_TERMINATED",
                    "Session terminated due to repeated direct-solution requests.",
                    violation_count=state["violation_count"],
                    terminate_session=True,
                    termination_reason="policy_violation_limit",
                )

            log_event(
                session_id,
                "CHAT_POLICY_WARNING",
                {
                    "violation_count": state["violation_count"],
                    "message": "Direct solution request blocked",
                },
            )
            warning_message = (
                "You cannot ask for direct full solutions or complete function code. "
                "Ask for hints, debugging help, syntax guidance, or small snippets."
            )
            ChatPolicyService._block(
                403,
                "CHAT_POLICY_WARNING",
                warning_message,
                violation_count=state["violation_count"],
                remaining_before_termination=max(0, MAX_POLICY_VIOLATIONS - state["violation_count"]),
            )

        return {
            "session_doc": session_doc,
            "policy_state": state,
            "now": now,
        }

    @staticmethod
    def mark_chat_sent(session_id: str):
        now = datetime.now(timezone.utc)
        session_doc = sessions_collection.find_one({"session_id": session_id})
        if not session_doc:
            return

        state = ChatPolicyService._get_policy_state(session_doc)
        state["last_chat_at"] = now
        ChatPolicyService._persist_policy(session_id, state)
        log_event(session_id, "CHAT_ALLOWED", {"last_chat_at": now.isoformat()})

    @staticmethod
    def terminate_session_for_policy(session_id: str, reason: str = "policy_violation_limit"):
        return SessionService.end_session(
            session_id=session_id,
            reason=reason,
            final_code_snapshot=None,
        )
