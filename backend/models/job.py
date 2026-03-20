import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    # 'pending' | 'running:stage_name' | 'complete' | 'failed'
    status = Column(String, default="pending", nullable=False)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)