"""
File #31 — routers/resources.py
GET /resources/{skill_id}   — returns top resources for a skill from FAISS catalog
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database import get_db

router = APIRouter(prefix="/resources", tags=["resources"])

# Hardcoded fallback catalog — used when Member 1's curator agent isn't ready yet
_FALLBACK_CATALOG: dict[str, list] = {
    "ML Fundamentals": [
        {"title": "ML Crash Course", "platform": "Google", "type": "course", "duration": "15 hrs",
         "url": "https://developers.google.com/machine-learning/crash-course", "difficulty": "beginner"},
        {"title": "Andrew Ng ML Specialization", "platform": "Coursera", "type": "course", "duration": "34 hrs",
         "url": "https://www.coursera.org/specializations/machine-learning-introduction", "difficulty": "intermediate"},
        {"title": "Hands-On ML with Scikit-Learn", "platform": "OReilly", "type": "book", "duration": "20 hrs",
         "url": "https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/", "difficulty": "intermediate"},
    ],
    "Deep Learning": [
        {"title": "Deep Learning Specialization", "platform": "Coursera", "type": "course", "duration": "40 hrs",
         "url": "https://www.coursera.org/specializations/deep-learning", "difficulty": "intermediate"},
        {"title": "Fast.ai Practical Deep Learning", "platform": "fast.ai", "type": "course", "duration": "25 hrs",
         "url": "https://course.fast.ai", "difficulty": "intermediate"},
        {"title": "d2l.ai — Dive into Deep Learning", "platform": "d2l.ai", "type": "book", "duration": "30 hrs",
         "url": "https://d2l.ai", "difficulty": "advanced"},
    ],
    "NLP": [
        {"title": "NLP with Transformers", "platform": "HuggingFace", "type": "course", "duration": "15 hrs",
         "url": "https://huggingface.co/learn/nlp-course", "difficulty": "intermediate"},
        {"title": "CS224N: NLP with Deep Learning", "platform": "Stanford", "type": "course", "duration": "30 hrs",
         "url": "https://web.stanford.edu/class/cs224n/", "difficulty": "advanced"},
    ],
    "Python": [
        {"title": "Python for Everybody", "platform": "Coursera", "type": "course", "duration": "8 hrs",
         "url": "https://www.coursera.org/specializations/python", "difficulty": "beginner"},
        {"title": "Real Python Tutorials", "platform": "RealPython", "type": "tutorial", "duration": "10 hrs",
         "url": "https://realpython.com", "difficulty": "intermediate"},
    ],
    "MLOps": [
        {"title": "MLOps Specialization", "platform": "Coursera", "type": "course", "duration": "16 hrs",
         "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops", "difficulty": "intermediate"},
        {"title": "Full Stack Deep Learning", "platform": "FSDL", "type": "course", "duration": "20 hrs",
         "url": "https://fullstackdeeplearning.com/course/2022/", "difficulty": "advanced"},
    ],
    "SQL": [
        {"title": "Mode SQL Tutorial", "platform": "Mode Analytics", "type": "tutorial", "duration": "5 hrs",
         "url": "https://mode.com/sql-tutorial/", "difficulty": "beginner"},
        {"title": "SQLZoo", "platform": "SQLZoo", "type": "interactive", "duration": "4 hrs",
         "url": "https://sqlzoo.net", "difficulty": "beginner"},
    ],
    "Statistics": [
        {"title": "Statistics with Python", "platform": "Coursera", "type": "course", "duration": "12 hrs",
         "url": "https://www.coursera.org/specializations/statistics-with-python", "difficulty": "intermediate"},
    ],
}


@router.get("/{skill_id}")
async def get_resources(
    skill_id:     str,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns top-3 resources for a skill.
    Tries Member 1's Curator agent first; falls back to hardcoded catalog.
    """
    try:
        from agents.curator import fetch_resources
        resources = fetch_resources(skill_id, top_k=3)
        if resources:
            return {"skill_id": skill_id, "resources": resources}
    except (ImportError, Exception):
        pass  # fall through to catalog

    # Fuzzy match against fallback catalog
    resources = _FALLBACK_CATALOG.get(skill_id)
    if not resources:
        # Try case-insensitive match
        for key, val in _FALLBACK_CATALOG.items():
            if key.lower() == skill_id.lower():
                resources = val
                break

    if not resources:
        resources = [
            {
                "title":      f"Search: {skill_id}",
                "platform":   "Google",
                "type":       "search",
                "duration":   "varies",
                "url":        f"https://www.google.com/search?q={skill_id}+tutorial",
                "difficulty": "beginner",
            }
        ]

    return {"skill_id": skill_id, "resources": resources[:3]}