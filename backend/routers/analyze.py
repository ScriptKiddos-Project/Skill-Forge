"""
File #29 — routers/analyze.py
POST /analyze                       → creates analysis job, returns job_id
GET  /analyze/stream/{job_id}       → SSE: streams stage updates until complete/failed

This is Item 8 from the spec — SSE replaces polling entirely.
"""

import asyncio
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from core.auth import get_current_user
from database import get_db
from models.job import AnalysisJob
from routers.upload import get_file_text

router = APIRouter(prefix="/analyze", tags=["analyze"])


# ── Request / Response Schemas ───────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    resume_id: str      # file_id from POST /upload/resume
    jd_id:     str      # file_id from POST /upload/jd


# ── Stage definitions (shown on AnalyzingPage) ────────────────────────────────
STAGES = [
    "Extracting skills from your resume and job description...",
    "Computing skill gaps with semantic analysis...",
    "Building your dependency-aware learning pathway...",
    "Fetching verified resources for each skill...",
    "Generating reasoning traces...",
]


# ── Background pipeline task ─────────────────────────────────────────────────
async def _run_pipeline(job_id: str, user_id: str, resume_text: str, jd_text: str, db: Session):
    """
    Runs the full analysis pipeline in the background.
    Updates analysis_jobs.status at each stage so the SSE endpoint can stream it.

    NOTE: This calls Member 1's agents. If they're not ready yet,
    the fallback stubs below keep the pipeline working for testing.
    """
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()

        # ── Stage 1: Skill Extraction ──────────────────────────────────────
        job.status = "running:stage_0"
        db.commit()

        try:
            from agents.analyzer import extract_skills_from_texts
            skills = await asyncio.get_event_loop().run_in_executor(
                None, extract_skills_from_texts, resume_text, jd_text
            )
        except ImportError:
            # Stub — Member 1 hasn't built analyzer yet
            await asyncio.sleep(1.5)
            skills = {
                "resume_skills": [{"name": "Python", "level": "intermediate", "confidence": 0.9, "category": "programming_language"}],
                "jd_skills":     [{"name": "ML Fundamentals", "required_level": "intermediate", "category": "ml_ai"}],
            }

        # ── Stage 2: Gap Analysis ──────────────────────────────────────────
        job.status = "running:stage_1"
        db.commit()

        try:
            from agents.evaluator import compute_gap
            gap_result = await asyncio.get_event_loop().run_in_executor(
                None, compute_gap, skills["resume_skills"], skills["jd_skills"]
            )
        except ImportError:
            await asyncio.sleep(1.5)
            gap_result = {"gap_skills": [{"name": "ML Fundamentals", "knowledge_state": 0.22, "priority": 1, "category": "ml_ai"}]}

        # ── Stage 3: Pathway Build ────────────────────────────────────────
        job.status = "running:stage_2"
        db.commit()

        try:
            from agents.architect import build_pathway
            pathway = await build_pathway(
                gap_result["gap_skills"],
                user_id=user_id,
                db=db,
            )
        except ImportError:
            await asyncio.sleep(2)
            pathway = {"steps": [{"skill": "ML Fundamentals", "order": 0, "stage": "Intermediate",
                                   "status": "active", "category": "ml_ai", "knowledge_state": 0.22,
                                   "resources": [], "reasoning": "", "latest_quiz_score": None, "quiz_attempts": 0}]}

        # ── Stage 4: Fetch Resources ───────────────────────────────────────
        job.status = "running:stage_3"
        db.commit()
        await asyncio.sleep(0.5)   # resources fetched inside architect already

        # ── Stage 5: Reasoning Traces ──────────────────────────────────────
        job.status = "running:stage_4"
        db.commit()
        await asyncio.sleep(0.5)   # explainer runs inside architect already

        # ── Save skill profile + pathway to DB ───────────────────────────
        from models.skill_profile import SkillProfile
        from models.pathway import Pathway

        # Upsert skill profile
        profile = db.query(SkillProfile).filter(SkillProfile.user_id == user_id).first()
        if profile:
            profile.resume_skills = skills["resume_skills"]
            profile.jd_skills     = skills["jd_skills"]
            profile.gap_skills    = gap_result["gap_skills"]
        else:
            db.add(SkillProfile(
                id=str(uuid.uuid4()),
                user_id=user_id,
                resume_skills=skills["resume_skills"],
                jd_skills=skills["jd_skills"],
                gap_skills=gap_result["gap_skills"],
            ))

        # Upsert pathway
        existing = db.query(Pathway).filter(Pathway.user_id == user_id).first()
        if existing:
            existing.steps      = pathway["steps"]
            existing.version    = (existing.version or 0) + 1
            existing.updated_at = datetime.utcnow()
        else:
            db.add(Pathway(
                id=str(uuid.uuid4()),
                user_id=user_id,
                version=1,
                steps=pathway["steps"],
                updated_at=datetime.utcnow(),
            ))

        db.commit()
        job.status = "complete"
        db.commit()

    except Exception as e:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error  = str(e)
            db.commit()


# ── POST /analyze ─────────────────────────────────────────────────────────────
@router.post("")
async def start_analysis(
    req:              AnalyzeRequest,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates an analysis job and kicks off the pipeline in the background.
    Returns job_id immediately so the frontend can open the SSE stream.
    """
    # Validate file IDs exist
    resume_text = get_file_text(req.resume_id)
    jd_text     = get_file_text(req.jd_id)

    # Create DB record
    job = AnalysisJob(
        id=str(uuid.uuid4()),
        user_id=str(current_user.id),
        status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Kick off background pipeline
    background_tasks.add_task(
        _run_pipeline,
        job.id,
        str(current_user.id),
        resume_text,
        jd_text,
        db,
    )

    return {"job_id": job.id}


# ── GET /analyze/stream/{job_id}  (SSE) ──────────────────────────────────────
@router.get("/stream/{job_id}")
async def stream_analysis(
    job_id:       str,
    current_user= Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events endpoint.
    Streams one event per pipeline stage as it completes.
    Frontend's AnalyzingPage.jsx subscribes to this via EventSource.
    """

    async def event_generator():
        sent_stages = set()
        timeout     = 120   # 2-minute max wait
        elapsed     = 0
        poll_interval = 1.0

        while elapsed < timeout:
            job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()

            if job is None:
                data = json.dumps({"stage": "Error: job not found", "done": True, "error": "Job not found"})
                yield f"data: {data}\n\n"
                return

            # Parse current stage index from status string like "running:stage_2"
            if job.status.startswith("running:stage_"):
                try:
                    idx = int(job.status.split("stage_")[1])
                except (IndexError, ValueError):
                    idx = 0

                # Send all stages up to current (catches up if polling was slow)
                for i in range(idx + 1):
                    if i not in sent_stages and i < len(STAGES):
                        data = json.dumps({"stage": STAGES[i], "index": i, "done": False})
                        yield f"data: {data}\n\n"
                        sent_stages.add(i)

            elif job.status == "complete":
                # Send any unsent stages
                for i in range(len(STAGES)):
                    if i not in sent_stages:
                        data = json.dumps({"stage": STAGES[i], "index": i, "done": False})
                        yield f"data: {data}\n\n"

                data = json.dumps({"stage": "Complete", "index": len(STAGES), "done": True, "error": None})
                yield f"data: {data}\n\n"
                return

            elif job.status == "failed":
                data = json.dumps({"stage": "Analysis failed", "done": True, "error": job.error or "Unknown error"})
                yield f"data: {data}\n\n"
                return

            await asyncio.sleep(poll_interval)
            elapsed += poll_interval

        # Timeout
        data = json.dumps({"stage": "Timeout", "done": True, "error": "Analysis timed out after 2 minutes."})
        yield f"data: {data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",          # disables nginx buffering
            "Connection":        "keep-alive",
        },
    )