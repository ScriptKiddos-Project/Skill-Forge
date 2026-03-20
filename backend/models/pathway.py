import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class Pathway(Base):
    __tablename__ = "pathways"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    version = Column(Integer, default=1)
    # [{skill, order, stage, status, category, knowledge_state,
    #   resources[], reasoning, latest_quiz_score, quiz_attempts}]
    steps = Column(JSONB, default=list)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)