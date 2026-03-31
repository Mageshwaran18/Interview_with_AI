from datetime import datetime
from fastapi import HTTPException, status
from bson import ObjectId

from app.database import dsa_sessions_collection


PHASE_ORDER = ["intuition", "algorithm", "complexity", "coding", "followup", "completed"]


def get_next_phase(current_phase: str) -> str:
    try:
        idx = PHASE_ORDER.index(current_phase)
        return PHASE_ORDER[idx + 1]
    except (ValueError, IndexError):
        return "completed"


def start_dsa_session(user_email: str, payload):
    session_doc = {
        "user_email": user_email,
        "problem_source": payload.problem_source,
        "problem_title": payload.problem_title,
        "problem_statement": payload.problem_statement,
        "problem_constraints": payload.problem_constraints,
        "difficulty": payload.difficulty,
        "current_phase": "intuition",
        "phase_status": {
            "intuition": "pending",
            "algorithm": "pending",
            "complexity": "pending",
            "coding": "pending",
            "followup": "pending",
        },
        "attempts": {
            "intuition": 0,
            "algorithm": 0,
            "complexity": 0,
            "coding": 0,
            "followup": 0,
        },
        "feedback_log": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }

    result = dsa_sessions_collection.insert_one(session_doc)

    return {
        "session_id": str(result.inserted_id),
        "problem_title": payload.problem_title,
        "current_phase": "intuition",
        "message": "DSA interview session started successfully",
    }


def get_session_by_id(session_id: str, user_email: str):
    session = dsa_sessions_collection.find_one({
        "_id": ObjectId(session_id),
        "user_email": user_email
    })

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    return {
        "session_id": str(session["_id"]),
        "user_email": session["user_email"],
        "problem_title": session["problem_title"],
        "problem_statement": session["problem_statement"],
        "problem_constraints": session.get("problem_constraints", "No explicit constraints provided."),
        "current_phase": session["current_phase"],
        "phase_status": session["phase_status"],
        "attempts": session["attempts"],
        "feedback_log": session["feedback_log"],
    }


def evaluate_phase_answer(session_id: str, user_email: str, answer: str):
    session = dsa_sessions_collection.find_one({
        "_id": ObjectId(session_id),
        "user_email": user_email
    })

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    current_phase = session["current_phase"]

    if current_phase == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This session is already completed"
        )

    session["attempts"][current_phase] += 1
    normalized_answer = answer.strip().lower()

    # TEMP LOGIC FOR V1
    # We will replace this with LLM evaluation in next step
    phase_passed = len(normalized_answer) >= 20

    if phase_passed:
        session["phase_status"][current_phase] = "passed"
        next_phase = get_next_phase(current_phase)
        session["current_phase"] = next_phase
        feedback = f"You passed the {current_phase} phase."
    else:
        session["phase_status"][current_phase] = "needs_retry"
        next_phase = current_phase
        feedback = f"Your {current_phase} answer is not sufficient yet. Please try again."

    session["feedback_log"].append({
        "phase": current_phase,
        "answer": answer,
        "phase_passed": phase_passed,
        "feedback": feedback,
        "timestamp": datetime.utcnow().isoformat()
    })

    session["updated_at"] = datetime.utcnow()

    dsa_sessions_collection.update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "current_phase": session["current_phase"],
                "phase_status": session["phase_status"],
                "attempts": session["attempts"],
                "feedback_log": session["feedback_log"],
                "updated_at": session["updated_at"],
            }
        }
    )

    return {
        "session_id": str(session["_id"]),
        "current_phase": session["current_phase"],
        "phase_passed": phase_passed,
        "feedback": feedback,
        "next_phase": None if next_phase == current_phase else next_phase,
        "attempts_used": session["attempts"][current_phase],
    }


def request_help_for_phase(session_id: str, user_email: str, user_message: str):
    session = dsa_sessions_collection.find_one({
        "_id": ObjectId(session_id),
        "user_email": user_email
    })

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )

    current_phase = session["current_phase"]

    help_text = (
        f"Help requested for {current_phase} phase. "
        f"Do not reveal full solution yet. Give only a small hint."
    )

    session["feedback_log"].append({
        "phase": current_phase,
        "answer": user_message,
        "phase_passed": False,
        "feedback": help_text,
        "timestamp": datetime.utcnow().isoformat(),
        "type": "help_request"
    })

    dsa_sessions_collection.update_one(
        {"_id": session["_id"]},
        {"$set": {"feedback_log": session["feedback_log"], "updated_at": datetime.utcnow()}}
    )

    return {
        "session_id": str(session["_id"]),
        "current_phase": current_phase,
        "phase_passed": False,
        "feedback": help_text,
        "next_phase": None,
        "attempts_used": session["attempts"][current_phase],
    }