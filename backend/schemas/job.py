from pydantic import BaseModel
import uuid


class AnalyzeRequest(BaseModel):
    resume_id: str
    jd_id: str


class AnalyzeResponse(BaseModel):
    job_id: uuid.UUID


class JobStatusResponse(BaseModel):
    job_id: uuid.UUID
    status: str
    error: str | None = None