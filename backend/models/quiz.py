import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    skill_id = Column(String, nullable=False)
    questions = Column(JSONB, default=list)
    answers = Column(JSONB, default=list)
    score = Column(Float, nullable=False)
    action = Column(String, nullable=False)       # 'PASS' | 'REVISE' | 'RETRY'
    weak_subtopic = Column(String, nullable=True)  # populated on REVISE
    attempted_at = Column(DateTime, default=datetime.utcnow)