import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
from models import User, SkillProfile, Pathway, QuizAttempt, AnalysisJob, RemoteJD
from database import Base
from routers import auth as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all DB tables
    Base.metadata.create_all(bind=engine)

    # Preload spaCy model
    try:
        import spacy
        spacy.load("en_core_web_sm")
        print("[startup] spaCy model loaded")
    except Exception as e:
        print(f"[startup] spaCy load failed: {e}")

    # Build FAISS index
    try:
        from agents.retriever import build_index
        build_index()
        print("[startup] FAISS index ready")
    except Exception as e:
        print(f"[startup] FAISS index skipped: {e}")

    # Load skill graph
    try:
        from core.skill_graph import get_skill_graph
        skill_graph = get_skill_graph()
        print(f"[startup] Skill graph loaded: {len(skill_graph.graph.nodes)} nodes")
    except Exception as e:
        print(f"[startup] Skill graph load failed: {e}")

    yield


app = FastAPI(
    title="SkillForge API",
    description="Autonomous Skill Intelligence & Adaptive Learning Engine",
    version="4.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers — Phase 1 only includes auth. Others wired in later phases.
app.include_router(auth_router.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "skillforge"}