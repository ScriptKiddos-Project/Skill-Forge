"""
File #35 — routers/jds.py
GET  /jds/remote   — serves RemoteOK JDs from DB (seeded on startup)
POST /jds/seed     — manually trigger a re-seed (admin use)

Item 5: Single requests.get() replaces all web scraping. Legal, structured, no rate limits.
"""

import uuid
import json
import requests
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database import get_db
from models.remote_jd import RemoteJD

router = APIRouter(prefix="/jds", tags=["jds"])

REMOTEOK_URL = "https://remoteok.com/api"
HEADERS      = {"User-Agent": "SkillForge-HackathonProject/1.0"}

# Offline fallback path — pre-fetched JDs when RemoteOK is down
_SEED_PATH = Path(__file__).parent.parent / "data" / "remote_jds_seed.json"

ROLE_KEYWORDS = {
    "tech":     ["engineer", "developer", "data", "ml", "python", "backend", "frontend", "devops", "cloud"],
    "business": ["manager", "analyst", "product", "marketing", "sales", "operations", "strategy"],
    "ops":      ["logistics", "supply", "warehouse", "operations", "process", "quality", "procurement"],
}


def _infer_role_category(tags: list) -> str:
    tags_text = " ".join(t.lower() for t in tags)
    for role, keywords in ROLE_KEYWORDS.items():
        if any(k in tags_text for k in keywords):
            return role
    return "tech"


def fetch_and_seed_jds(db: Session, limit: int = 20) -> int:
    """
    Fetch from RemoteOK API; fall back to local seed file if unavailable.
    Returns count of JDs seeded.
    """
    jobs_raw = []

    try:
        resp = requests.get(REMOTEOK_URL, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        jobs_raw = resp.json()[1:]    # first item is metadata — skip it
    except Exception:
        # Offline fallback
        if _SEED_PATH.exists():
            with open(_SEED_PATH) as f:
                jobs_raw = json.load(f)

    if not jobs_raw:
        return 0

    seeded = 0
    for job in jobs_raw:
        if seeded >= limit:
            break

        desc = job.get("description", "") or ""
        tags = job.get("tags", []) or []

        if not desc and not tags:
            continue

        # Avoid duplicates — skip if title+company already exists
        title   = job.get("position", "") or job.get("title", "")
        company = job.get("company", "")

        exists = (
            db.query(RemoteJD)
            .filter(RemoteJD.title == title, RemoteJD.company == company)
            .first()
        )
        if exists:
            seeded += 1
            continue

        db.add(RemoteJD(
            id            = str(uuid.uuid4()),
            title         = title,
            company       = company,
            raw_text      = desc,
            skills        = tags,
            role_category = _infer_role_category(tags),
            fetched_at    = datetime.utcnow(),
        ))
        seeded += 1

    db.commit()
    return seeded


# ── GET /jds/remote ───────────────────────────────────────────────────────────
@router.get("/remote")
async def get_remote_jds(
    role:         str = None,         # optional filter: tech | business | ops
    limit:        int = 30,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns JDs from DB. If table is empty, triggers a live seed first.
    """
    query = db.query(RemoteJD)

    if role:
        query = query.filter(RemoteJD.role_category == role)

    jds = query.order_by(RemoteJD.fetched_at.desc()).limit(limit).all()

    # If table is empty, try to seed on-the-fly
    if not jds:
        count = fetch_and_seed_jds(db, limit=20)
        if count > 0:
            jds = query.limit(limit).all()

    return [
        {
            "id":            str(jd.id),
            "title":         jd.title,
            "company":       jd.company,
            "role_category": jd.role_category,
            "skills":        jd.skills or [],
            "preview":       (jd.raw_text or "")[:200],
        }
        for jd in jds
    ]


# ── POST /jds/seed  (manual re-seed) ─────────────────────────────────────────
@router.post("/seed")
async def seed_jds(
    background_tasks: BackgroundTasks,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger a manual re-seed from RemoteOK API."""
    background_tasks.add_task(fetch_and_seed_jds, db, 20)
    return {"message": "JD seed triggered in background."}