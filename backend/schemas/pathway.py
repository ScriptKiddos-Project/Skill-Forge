from pydantic import BaseModel
from typing import Optional, List, Any
import uuid


class PathwayStep(BaseModel):
    skill: str
    order: int
    stage: str
    status: str
    category: Optional[str] = None
    knowledge_state: float = 0.0
    resources: List[Any] = []
    reasoning: str = ""
    latest_quiz_score: Optional[float] = None
    quiz_attempts: int = 0


class PathwayOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    steps: List[PathwayStep]
    version: int

    class Config:
        from_attributes = True