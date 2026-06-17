from datetime import datetime, timezone
from pydantic import BaseModel, field_validator

class RideHistoryResponse(BaseModel):
    id: str
    ride_id: str
    user_id: str
    user_name: str
    action: str
    timestamp: datetime

    @field_validator('timestamp', mode='after')
    @classmethod
    def ensure_utc_timestamp(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
