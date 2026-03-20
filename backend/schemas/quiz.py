from pydantic import BaseModel
from typing import Literal, List, Optional
import uuid


class QuizRequest(BaseModel):
    skill_id: str
    difficulty: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    role: Literal["tech", "business", "ops"] = "tech"


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: Literal["A", "B", "C", "D"]
    explanation: str
    subtopic: str


class QuizGenerateResponse(BaseModel):
    quiz_id: uuid.UUID
    questions: List[QuizQuestion]


class QuizSubmitRequest(BaseModel):
    quiz_id: uuid.UUID
    answers: List[str]


class QuizSubmitResponse(BaseModel):
    score: float
    action: Literal["PASS", "REVISE", "RETRY"]
    message: str
    next_topic: Optional[str] = None
    weak_subtopic: Optional[str] = None