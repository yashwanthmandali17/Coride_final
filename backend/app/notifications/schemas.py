from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, field_validator

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    read_status: bool = False
    ride_id: Optional[str] = None
    created_at: datetime

    @field_validator('created_at', mode='after')
    @classmethod
    def ensure_utc_created(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
