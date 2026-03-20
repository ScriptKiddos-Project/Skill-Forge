import uuid
from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from database import Base


class SkillProfile(Base):
    __tablename__ = "skill_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    # [{name, level, confidence, category}]
    resume_skills = Column(JSONB, default=list)
    # [{name, required_level, category}]
    jd_skills = Column(JSONB, default=list)
    # [{name, priority, knowledge_state, category}]
    gap_skills = Column(JSONB, default=list)