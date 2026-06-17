from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    name: str
    email: EmailStr
    profile_photo: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_photo: Optional[str] = None

class UserResponse(UserBase):
    id: str
    average_rating: float
    reliability_score: float
    created_at: datetime

    @field_validator('created_at', mode='after')
    @classmethod
    def ensure_utc_created(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
