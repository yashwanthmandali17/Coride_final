from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class RatingCreate(BaseModel):
    ride_id: str
    reviewee_id: str
    stars: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class RatingResponse(BaseModel):
    id: str
    ride_id: str
    reviewer_id: str
    reviewee_id: str
    stars: int
    comment: Optional[str] = None
    created_at: datetime

    @field_validator('created_at', mode='after')
    @classmethod
    def ensure_utc_created(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
