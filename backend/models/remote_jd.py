import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class RemoteJD(Base):
    __tablename__ = "remote_jds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    raw_text = Column(Text, default="")
    skills = Column(JSONB, default=list)
    role_category = Column(String, default="tech")  # 'tech' | 'business' | 'ops'
    fetched_at = Column(DateTime, default=datetime.utcnow)