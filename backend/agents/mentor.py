from sqlalchemy.orm import Session
from core import llm

MENTOR_PROMPT = """You are a learning mentor for SkillForge.
You know this learner:
- Role: {role}
- Current topic: {current_skill}
- Completed skills: {completed}
- Latest quiz score: {latest_score}
- Weak area flagged: {weak_subtopic}

Conversation so far:
{history}

User: {message}
Mentor (be specific, reference their pathway):"""


def chat(message: str, history: list[dict], user_id: str, db: Session) -> str:
    """
    Generate a context-aware mentor reply using LLaMA 3.1 via Groq.

    Injects:
    - User profile (role, current topic, completed skills, quiz score, weak area)
    - Last 6 messages from chat history

    Args:
        message:  The user's latest message.
        history:  List of {role, content} dicts from the frontend.
        user_id:  UUID of the current user.
        db:       SQLAlchemy session.

    Returns:
        LLaMA-generated mentor response string.
    """
    profile = _get_user_profile(user_id, db)
    pathway_ctx = _get_pathway_context(user_id, db)

    # Format last 6 messages as readable thread
    history_str = "\n".join(
        f"{h['role'].capitalize()}: {h['content']}"
        for h in history[-6:]
    )

    prompt = MENTOR_PROMPT.format(
        role=profile.get("role", "professional"),
        current_skill=pathway_ctx.get("current_skill", "your first topic"),
        completed=", ".join(pathway_ctx.get("completed", [])) or "none yet",
        latest_score=_fmt_score(pathway_ctx.get("latest_score")),
        weak_subtopic=pathway_ctx.get("weak_subtopic") or "none identified",
        history=history_str,
        message=message,
    )

    response = llm.generate(prompt)
    return response.strip() if response else _fallback_reply(message)


# ------------------------------------------------------------------ #
# DB helpers
# ------------------------------------------------------------------ #

def _get_user_profile(user_id: str, db: Session) -> dict:
    from models.user import User
    from models.skill_profile import SkillProfile

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    return {"role": getattr(user, "role", "tech")}


def _get_pathway_context(user_id: str, db: Session) -> dict:
    from models.pathway import Pathway
    from backend.models.quiz import QuizAttempt

    pathway_row = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    if not pathway_row or not pathway_row.steps:
        return {}

    steps = pathway_row.steps
    completed = [s["skill"] for s in steps if s.get("status") == "complete"]

    # Current active/revise/retry step
    active = next(
        (s for s in steps if s.get("status") in ("active", "revise", "retry")),
        None,
    )
    current_skill = active["skill"] if active else "all topics complete"

    # Most recent quiz attempt
    latest_attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .first()
    )
    latest_score = getattr(latest_attempt, "score", None)
    weak_subtopic = getattr(latest_attempt, "weak_subtopic", None)

    return {
        "current_skill": current_skill,
        "completed": completed,
        "latest_score": latest_score,
        "weak_subtopic": weak_subtopic,
    }


def _fmt_score(score: float | None) -> str:
    if score is None:
        return "no quiz taken yet"
    return f"{int(score * 100)}%"


def _fallback_reply(message: str) -> str:
    return (
        "I'm here to help you with your learning journey. "
        "Could you rephrase your question so I can give you the most useful guidance?"
    )
