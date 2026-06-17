from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class VehicleBase(BaseModel):
    type: str = Field(..., description="Must be 'car', 'bike', or 'auto'")
    brand: str
    model: str
    registration_number: str
    seat_capacity: int = Field(..., gt=0)

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    type: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    registration_number: Optional[str] = None
    seat_capacity: Optional[int] = Field(None, gt=0)

class VehicleResponse(VehicleBase):
    id: str
    user_id: str
    created_at: datetime

    @field_validator('created_at', mode='after')
    @classmethod
    def ensure_utc_created(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
