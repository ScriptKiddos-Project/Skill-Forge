"""
File #34 — routers/chat.py
POST /chat   — stateful mentor chat, accepts last 6 messages as history (Item 3)
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database import get_db

router = APIRouter(prefix="/chat", tags=["chat"])


# ── Schema ────────────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role:    str    # "user" | "mentor"
    content: str

    class Config:
        extra = "allow"   # ← ignore extra fields like timestamp


class ChatRequest(BaseModel):
    message: str
    user_id: str
    history: list[ChatMessage] = []   # last 6 messages from Zustand


# ── POST /chat ────────────────────────────────────────────────────────────────
@router.post("")
async def chat(
    req:          ChatRequest,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Passes message + last 6 history messages to LLaMA via Member 1's mentor agent.
    Falls back to a helpful stub if mentor agent isn't ready yet.
    """
    # Security: user_id in body must match JWT subject
    if str(current_user.id) != str(req.user_id):
        raise HTTPException(status_code=403, detail="user_id does not match token.")

    # Try Member 1's stateful mentor agent
    try:
        from agents.mentor import chat as mentor_chat
        response = mentor_chat(
            message=req.message,
            history=[m.dict() for m in req.history[-6:]],
            user_id=req.user_id,
            db=db,
        )
        return {"response": response, "source": "llm"}

    except (ImportError, Exception) as e:
        # Graceful stub — gives useful answers until mentor.py is ready
        stub_response = _stub_mentor(req.message, req.history)
        return {"response": stub_response, "source": "stub"}


def _stub_mentor(message: str, history: list) -> str:
    """
    Simple keyword-based stub responses.
    Keeps the frontend fully functional while Member 1 builds mentor.py.
    """
    msg_lower = message.lower()

    if any(w in msg_lower for w in ("hello", "hi", "hey")):
        return "Hi! I'm your SkillForge mentor. Ask me anything about your learning pathway, current topic, or quiz results."

    if any(w in msg_lower for w in ("what", "explain", "tell me", "what is")):
        return ("Great question! Once the full AI mentor is connected, I'll give you a detailed, "
                "context-aware answer referencing your pathway and recent quiz performance. "
                "For now — keep exploring your resources and take the quiz when ready!")

    if any(w in msg_lower for w in ("quiz", "score", "revise", "retry", "pass")):
        return ("For quiz-related questions: a PASS means ≥70%, REVISE means 40–69% with a specific weak subtopic identified, "
                "and RETRY means <40% — simpler resources will be loaded automatically. "
                "Focus on the weak subtopic shown on your REVISE screen.")

    if any(w in msg_lower for w in ("resource", "course", "learn", "study")):
        return ("Check your Topic page for curated resources. Each resource has an estimated duration. "
                "Mark resources as done when complete — that unlocks the 'Take Quiz' button.")

    if any(w in msg_lower for w in ("prerequisite", "order", "why", "before")):
        return ("Your learning order is determined by a dependency graph (DAG). "
                "Each skill has prerequisites — you won't unlock Deep Learning until ML Fundamentals is complete. "
                "Check the Graph View on the Pathway page to see the full dependency tree.")

    return ("I'm your learning mentor — I understand your pathway, quiz scores, and weak areas. "
            "The full AI-powered version of me will give personalized answers. "
            "Is there a specific topic or concept I can help clarify?")