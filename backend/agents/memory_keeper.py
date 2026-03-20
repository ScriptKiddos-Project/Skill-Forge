from sqlalchemy.orm import Session
from core import adaptive_engine


def record_quiz_result(
    user_id: str,
    skill_id: str,
    quiz_id: str,
    score: float,
    questions: list[dict],
    user_answers: list[str],
    db: Session,
) -> dict:
    """
    Persist quiz attempt and apply PASS/REVISE/RETRY logic to the pathway.

    1. Save the QuizAttempt row.
    2. Delegate pathway mutation to adaptive_engine (with row-level lock).
    3. Return action, message, next_topic, weak_subtopic.
    """
    from backend.models.quiz import QuizAttempt

    # Determine outcome via the core adaptive engine
    outcome = adaptive_engine.update_pathway_after_quiz(
        user_id=user_id,
        skill_id=skill_id,
        score=score,
        questions=questions,
        user_answers=user_answers,
        db=db,
    )

    # Persist the quiz attempt record
    attempt = QuizAttempt(
        user_id=user_id,
        skill_id=skill_id,
        quiz_id=quiz_id,
        questions=questions,
        answers=user_answers,
        score=round(score, 4),
        action=outcome["action"],
        weak_subtopic=outcome.get("weak_subtopic"),
    )
    db.add(attempt)
    db.commit()

    return outcome


def mark_resource_done(
    user_id: str,
    skill_id: str,
    resource_id: str,
    db: Session,
) -> dict:
    """
    Mark a specific resource as completed within a pathway step.

    Mutates the JSONB 'steps' array in-place and persists.
    Returns the updated step.
    """
    from models.pathway import Pathway

    row = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    if not row:
        raise ValueError(f"No pathway for user {user_id}")

    steps = row.steps
    step = next((s for s in steps if s["skill"] == skill_id), None)
    if not step:
        raise ValueError(f"Skill '{skill_id}' not found in pathway")

    for resource in step.get("resources", []):
        if resource.get("id") == resource_id:
            resource["done"] = True
            break

    row.steps = steps
    db.add(row)
    db.commit()

    return step


def get_progress_summary(user_id: str, db: Session) -> dict:
    """
    Compute a progress summary for the ProgressPage.

    Returns:
        completed:      list of completed skill names
        score_history:  list of {skill, score, action, date} from quiz attempts
        pct:            completion percentage (0–100)
        est_days:       estimated days to finish remaining skills
    """
    from models.pathway import Pathway
    from backend.models.quiz import QuizAttempt
    import datetime

    row = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    steps = row.steps if row else []

    completed = [s["skill"] for s in steps if s.get("status") == "complete"]
    total = len(steps)
    pct = round(len(completed) / total * 100) if total > 0 else 0

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at.asc())
        .all()
    )

    score_history = [
        {
            "skill": a.skill_id,
            "score": a.score,
            "action": a.action,
            "weak_subtopic": a.weak_subtopic,
            "date": a.attempted_at.strftime("%Y-%m-%d") if a.attempted_at else None,
        }
        for a in attempts
    ]

    # Estimate remaining days
    est_days = _estimate_days(steps, attempts)

    return {
        "completed": completed,
        "score_history": score_history,
        "pct": pct,
        "est_days": est_days,
    }


def _estimate_days(steps: list[dict], attempts) -> int:
    """
    Estimate days to completion based on average time per completed skill.
    Falls back to 4 days per skill if no history.
    """
    completed_skills = [s for s in steps if s.get("status") == "complete"]
    remaining = len([s for s in steps if s.get("status") != "complete"])

    if not completed_skills or not attempts:
        return remaining * 4  # default 4 days per skill

    # Use first and last attempt timestamps to estimate pace
    import datetime
    first_ts = getattr(attempts[0], "attempted_at", None)
    last_ts = getattr(attempts[-1], "attempted_at", None)

    if first_ts and last_ts and len(completed_skills) > 0:
        days_elapsed = max((last_ts - first_ts).days, 1)
        avg_days = days_elapsed / len(completed_skills)
    else:
        avg_days = 4

    return round(remaining * avg_days)
