from pydantic import BaseModel, EmailStr
from typing import Literal
import uuid


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Literal["tech", "business", "ops"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    user: UserOut