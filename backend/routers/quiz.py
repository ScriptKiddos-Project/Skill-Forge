"""
File #32 — routers/quiz.py
POST /quiz/generate  — LLaMA generates 5 MCQs, strict validator, fallback JSON (Item 6)
POST /quiz/submit    — score computation + PASS/REVISE/RETRY adaptive logic
"""

import uuid
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database import get_db
from models.quiz import QuizAttempt

router = APIRouter(prefix="/quiz", tags=["quiz"])

# ── Load fallback quiz bank ───────────────────────────────────────────────────
_FALLBACK_PATH = Path(__file__).parent.parent / "data" / "fallback_quizzes.json"

def _load_fallback_quizzes() -> dict:
    if _FALLBACK_PATH.exists():
        with open(_FALLBACK_PATH) as f:
            return json.load(f)
    return {}

_FALLBACK_QUIZZES = _load_fallback_quizzes()


# ── Strict validator (Item 6) ─────────────────────────────────────────────────
def _validate_quiz(questions) -> bool:
    """5 checks that must all pass. If any fails, we go to fallback."""
    if not isinstance(questions, list):            return False
    if len(questions) != 5:                        return False
    required = {"question", "options", "correct_answer", "explanation", "subtopic"}
    for q in questions:
        if not required.issubset(q.keys()):        return False
        if not isinstance(q["options"], list):     return False
        if len(q["options"]) != 4:                 return False
        if q["correct_answer"] not in ("A", "B", "C", "D"):  return False
        for i, opt in enumerate(q["options"]):
            prefix = f"{chr(65 + i)}) "
            if not str(opt).startswith(prefix):    return False
    return True


def _load_fallback(skill_id: str) -> list:
    """Return pre-written questions for skill_id, or a generic 5-Q set."""
    bank = _FALLBACK_QUIZZES

    # Exact match
    if skill_id in bank:
        return bank[skill_id][:5]

    # Case-insensitive match
    for key, val in bank.items():
        if key.lower() == skill_id.lower():
            return val[:5]

    # Generic placeholder (never reaches production if fallback_quizzes.json is complete)
    return [
        {
            "question": f"What is a key concept in {skill_id}?",
            "options": [
                "A) Supervised learning",
                "B) Random initialization",
                "C) Data preprocessing",
                "D) Model evaluation",
            ],
            "correct_answer": "A",
            "explanation":    "Supervised learning is a foundational concept.",
            "subtopic":       "fundamentals",
        }
    ] * 5


def _build_quiz_prompt(skill_id: str, difficulty: str, role: str) -> str:
    return f"""You are an assessment generator.
Return ONLY a JSON array. No markdown. No explanation. No preamble.
Your entire response must start with [ and end with ]

Generate 5 MCQ questions for: {skill_id} at {difficulty} level for a {role} role.

Each object must have EXACTLY these keys:
  question: string
  options: array of exactly 4 strings starting with 'A) ' 'B) ' 'C) ' 'D) '
  correct_answer: single character, one of: A B C D
  explanation: string (1 sentence)
  subtopic: string (specific sub-concept being tested)
"""


# ── Schemas ───────────────────────────────────────────────────────────────────
class QuizGenerateRequest(BaseModel):
    skill_id:   str
    difficulty: str = "intermediate"
    role:       str = "tech"


class QuizSubmitRequest(BaseModel):
    quiz_id:  str
    answers:  list[str]   # ["A", "C", "B", "D", "A"]


# In-memory quiz store (keyed by quiz_id)
_quiz_store: dict[str, dict] = {}


# ── POST /quiz/generate ───────────────────────────────────────────────────────
@router.post("/generate")
async def generate_quiz(
    req:          QuizGenerateRequest,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Tries LLaMA 3x. If all attempts fail or return invalid JSON, serves fallback.
    Demo never breaks.
    """
    questions = None
    used_fallback = False

    # Try LLM (Member 1's llm.py)
    try:
        from core.llm import generate_json
        prompt = _build_quiz_prompt(req.skill_id, req.difficulty, req.role)
        questions = generate_json(prompt, retries=3)
    except (ImportError, Exception):
        pass  # fall through

    # Validate — if fails, load fallback
    if questions is None or not _validate_quiz(questions):
        questions     = _load_fallback(req.skill_id)
        used_fallback = True

    # Store for submit
    quiz_id = str(uuid.uuid4())
    _quiz_store[quiz_id] = {
        "skill_id":    req.skill_id,
        "difficulty":  req.difficulty,
        "role":        req.role,
        "questions":   questions,
        "user_id":     str(current_user.id),
        "used_fallback": used_fallback,
    }

    return {
        "quiz_id":      quiz_id,
        "skill_id":     req.skill_id,
        "questions":    questions,
        "used_fallback": used_fallback,
    }


# ── POST /quiz/submit ─────────────────────────────────────────────────────────
@router.post("/submit")
async def submit_quiz(
    req:          QuizSubmitRequest,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Scores the quiz, determines PASS / REVISE / RETRY,
    identifies the most-missed subtopic, saves attempt to DB,
    and calls the adaptive engine to update the pathway.
    """
    quiz = _quiz_store.get(req.quiz_id)
    if quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found or expired.")

    if len(req.answers) != 5:
        raise HTTPException(status_code=400, detail="Must submit exactly 5 answers.")

    questions = quiz["questions"]
    user_id   = str(current_user.id)
    skill_id  = quiz["skill_id"]

    # ── Score ─────────────────────────────────────────────────────────────────
    correct = sum(
        1 for q, ans in zip(questions, req.answers)
        if ans.upper() == q["correct_answer"]
    )
    score = correct / 5   # 0.0 – 1.0

    # ── Identify weak subtopics ───────────────────────────────────────────────
    wrong_subtopics = [
        q.get("subtopic", "general concept")
        for q, ans in zip(questions, req.answers)
        if ans.upper() != q["correct_answer"]
    ]
    from collections import Counter
    weak_subtopic = Counter(wrong_subtopics).most_common(1)[0][0] if wrong_subtopics else None

    # ── PASS / REVISE / RETRY ─────────────────────────────────────────────────
    if score >= 0.70:
        action  = "PASS"
        message = f"{skill_id} complete! Your score: {int(score * 100)}%."
    elif score >= 0.40:
        action  = "REVISE"
        message = f"Score {int(score * 100)}%. Review: {weak_subtopic} before retaking."
    else:
        action  = "RETRY"
        message = f"Score {int(score * 100)}%. Simpler resources have been loaded. Try again."

    # ── Save attempt to DB ────────────────────────────────────────────────────
    attempt = QuizAttempt(
        id            = str(uuid.uuid4()),
        user_id       = user_id,
        skill_id      = skill_id,
        questions     = questions,
        answers       = req.answers,
        score         = score,
        action        = action,
        weak_subtopic = weak_subtopic,
        attempted_at  = datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()

    # ── Call adaptive engine to update pathway ─────────────────────────────────
    next_topic = None
    try:
        from core.adaptive_engine import update_pathway_after_quiz
        result = update_pathway_after_quiz(
            user_id=user_id,
            skill_id=skill_id,
            score=score,
            questions=questions,
            answers=req.answers,
            db=db,
        )
        next_topic = result.get("next_topic")
        message    = result.get("message", message)
    except (ImportError, Exception):
        pass   # adaptive engine not ready yet — result still returned

    return {
        "score":         round(score, 2),
        "correct":       correct,
        "total":         5,
        "action":        action,
        "message":       message,
        "next_topic":    next_topic,
        "weak_subtopic": weak_subtopic,
    }