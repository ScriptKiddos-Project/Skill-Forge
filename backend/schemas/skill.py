from pydantic import BaseModel
from typing import Optional


class SkillItem(BaseModel):
    name: str
    level: Optional[str] = None
    confidence: Optional[float] = None
    category: Optional[str] = None


class JDSkillItem(BaseModel):
    name: str
    required_level: Optional[str] = None
    category: Optional[str] = None


class GapSkillItem(BaseModel):
    name: str
    priority: Optional[int] = None
    knowledge_state: float = 0.0
    category: Optional[str] = None