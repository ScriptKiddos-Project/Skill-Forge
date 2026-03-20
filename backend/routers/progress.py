"""
File #33 — routers/progress.py
GET /progress/{user_id}   — quiz history, completion %, estimated days (Item 7 auth)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.auth import get_current_user, verify_user_access
from database import get_db
from models.quiz import QuizAttempt
from models.pathway import Pathway

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/{user_id}")
async def get_progress(
    user_id:      str,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns:
    - completed skills list
    - score_history (per skill over attempts — for ScoreTimeline chart)
    - pct (% of pathway complete)
    - est_days (estimated days remaining)
    - attempts_table (for ProgressPage table display)
    """
    # Item 7: JWT subject must match user_id
    verify_user_access(user_id, current_user)

    # ── Quiz attempts ─────────────────────────────────────────────────────────
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.attempted_at)
        .all()
    )

    attempts_table = [
        {
            "skill":         a.skill_id,
            "date":          a.attempted_at.isoformat(),
            "score":         round(a.score, 2),
            "action":        a.action,
            "weak_subtopic": a.weak_subtopic,
        }
        for a in attempts
    ]

    # Score history grouped by skill (for Recharts line chart)
    from collections import defaultdict
    skill_scores: dict = defaultdict(list)
    for a in attempts:
        skill_scores[a.skill_id].append({
            "date":   a.attempted_at.strftime("%b %d"),
            "score":  round(a.score * 100, 1),
            "action": a.action,
        })

    score_history = [
        {"skill": skill, "attempts": attempts_list}
        for skill, attempts_list in skill_scores.items()
    ]

    # ── Pathway completion ────────────────────────────────────────────────────
    pathway = db.query(Pathway).filter(Pathway.user_id == user_id).first()
    steps   = pathway.steps if pathway else []

    total_steps     = len(steps)
    completed_steps = [s for s in steps if s.get("status") == "complete"]
    pct             = round(len(completed_steps) / total_steps * 100, 1) if total_steps else 0

    # ── Estimated completion days ──────────────────────────────────────────────
    # Uses average days between first attempt and PASS for each completed skill
    pass_attempts = [a for a in attempts if a.action == "PASS"]
    avg_days_per_skill = 4  # default

    if len(pass_attempts) >= 2:
        first_dt = pass_attempts[0].attempted_at
        last_dt  = pass_attempts[-1].attempted_at
        days_elapsed = max((last_dt - first_dt).days, 1)
        avg_days_per_skill = max(1, days_elapsed / len(pass_attempts))

    remaining_count = total_steps - len(completed_steps)
    est_days        = round(remaining_count * avg_days_per_skill)

    return {
        "user_id":         user_id,
        "total_steps":     total_steps,
        "completed_count": len(completed_steps),
        "pct":             pct,
        "est_days":        est_days,
        "score_history":   score_history,
        "attempts_table":  attempts_table,
        "completed":       [s["skill"] for s in completed_steps],
    }