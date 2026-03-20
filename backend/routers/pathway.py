"""
File #30 — routers/pathway.py
GET /pathway/{user_id}    — returns full pathway steps, JWT-verified (Item 7)
PATCH /pathway/{user_id}  — updates a single step's status (used after quiz by adaptive engine)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user, verify_user_access
from database import get_db
from models.pathway import Pathway

router = APIRouter(prefix="/pathway", tags=["pathway"])


# ── GET /pathway/{user_id} ────────────────────────────────────────────────────
@router.get("/{user_id}")
async def get_pathway(
    user_id:      str,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the user's learning pathway.
    JWT subject MUST match path user_id — prevents horizontal privilege escalation.
    """
    # Item 7: authorization check
    verify_user_access(user_id, current_user)

    pathway = db.query(Pathway).filter(Pathway.user_id == user_id).first()

    if pathway is None:
        raise HTTPException(
            status_code=404,
            detail="No pathway found. Please complete onboarding first."
        )

    return {
        "user_id": user_id,
        "version": pathway.version,
        "steps":   pathway.steps or [],
        "updated_at": pathway.updated_at.isoformat() if pathway.updated_at else None,
    }


# ── PATCH /pathway/{user_id}/step/{skill_id} ─────────────────────────────────
class StepUpdate(BaseModel):
    status:            Optional[str]  = None   # active | complete | revise | retry | locked
    latest_quiz_score: Optional[float] = None
    quiz_attempts:     Optional[int]   = None
    resources_done:    Optional[list]  = None


@router.patch("/{user_id}/step/{skill_id}")
async def update_pathway_step(
    user_id:      str,
    skill_id:     str,
    body:         StepUpdate,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partial update of a single step — called by adaptive_engine after quiz submit.
    Uses row-level lock to prevent race conditions.
    """
    verify_user_access(user_id, current_user)

    with db.begin_nested():
        # Row-level lock
        pathway = (
            db.query(Pathway)
            .filter(Pathway.user_id == user_id)
            .with_for_update()
            .first()
        )

        if pathway is None:
            raise HTTPException(status_code=404, detail="Pathway not found.")

        steps = list(pathway.steps or [])
        step  = next((s for s in steps if s["skill"] == skill_id), None)

        if step is None:
            raise HTTPException(status_code=404, detail=f"Step '{skill_id}' not in pathway.")

        if body.status            is not None: step["status"]            = body.status
        if body.latest_quiz_score is not None: step["latest_quiz_score"] = body.latest_quiz_score
        if body.quiz_attempts     is not None: step["quiz_attempts"]     = body.quiz_attempts
        if body.resources_done    is not None: step["resources_done"]    = body.resources_done

        # JSONB mutation — reassign so SQLAlchemy detects the change
        pathway.steps   = steps
        pathway.version = (pathway.version or 1) + 1

    db.commit()
    return {"message": f"Step '{skill_id}' updated.", "version": pathway.version}