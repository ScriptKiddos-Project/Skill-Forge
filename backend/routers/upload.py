"""
File #28 — routers/upload.py
POST /upload/resume  — accepts PDF, validates MIME + size, extracts text via PyMuPDF
POST /upload/jd      — same, OR accepts plain JSON text body
"""

import uuid
import fitz  # PyMuPDF
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from core.auth import get_current_user
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/upload", tags=["upload"])

# ── Constants ────────────────────────────────────────────────────────────────
MAX_FILE_BYTES  = 10 * 1024 * 1024          # 10 MB
ALLOWED_MIMES   = {"application/pdf", "application/x-pdf"}

# In-memory store (per process).
# In production use Redis or DB — for hackathon this is fine.
_file_store: dict[str, str] = {}


def _validate_and_extract(upload: UploadFile) -> str:
    """Validate MIME type + size, extract text via PyMuPDF, return extracted text."""
    # ── MIME check ─────────────────────────────────────────────────────────────
    if upload.content_type not in ALLOWED_MIMES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files accepted. Got: {upload.content_type}"
        )

    # ── Read & size check ──────────────────────────────────────────────────────
    data = upload.file.read()
    if len(data) > MAX_FILE_BYTES:
        size_mb = len(data) / 1024 / 1024
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({size_mb:.1f} MB). Maximum is 10 MB."
        )

    # ── PyMuPDF text extraction ────────────────────────────────────────────────
    try:
        doc  = fitz.open(stream=data, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="PDF appears to be a scanned image with no extractable text. Please use a text-based PDF."
        )

    return text.strip()


# ── POST /upload/resume ──────────────────────────────────────────────────────
@router.post("/resume")
async def upload_resume(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Upload a resume PDF.
    Returns a file_id that is passed to POST /analyze.
    """
    text    = _validate_and_extract(file)
    file_id = str(uuid.uuid4())
    _file_store[file_id] = text

    return {
        "file_id":     file_id,
        "filename":    file.filename,
        "char_count":  len(text),
        "preview":     text[:300],      # first 300 chars for frontend preview
    }


# ── POST /upload/jd ──────────────────────────────────────────────────────────
class JDTextBody(BaseModel):
    text: str


@router.post("/jd")
async def upload_jd(
    file: Optional[UploadFile] = File(None),
    body: Optional[JDTextBody] = None,
    current_user=Depends(get_current_user),
):
    """
    Upload a JD either as a PDF file OR as plain JSON text body.
    Frontend sends multipart for PDF, JSON for paste / RemoteOK selection.
    """
    if file and file.filename:
        # ── PDF upload path ────────────────────────────────────────────────────
        text = _validate_and_extract(file)
    elif body and body.text.strip():
        # ── Paste / RemoteOK text path ─────────────────────────────────────────
        text = body.text.strip()
    else:
        raise HTTPException(status_code=400, detail="Provide either a PDF file or a JSON body with 'text'.")

    file_id = str(uuid.uuid4())
    _file_store[file_id] = text

    return {
        "file_id":    file_id,
        "char_count": len(text),
        "preview":    text[:300],
    }


# ── Internal helper used by analyze.py ───────────────────────────────────────
def get_file_text(file_id: str) -> str:
    """Retrieve extracted text for a file_id. Raises 404 if expired/missing."""
    text = _file_store.get(file_id)
    if text is None:
        raise HTTPException(
            status_code=404,
            detail=f"File ID '{file_id}' not found or expired. Please re-upload."
        )
    return text