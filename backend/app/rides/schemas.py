from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from app.users.schemas import UserResponse
from app.vehicles.schemas import VehicleResponse

class RideBase(BaseModel):
    source: str
    destination: str
    source_lat: float
    source_lng: float
    destination_lat: float
    destination_lng: float
    departure_time: datetime
    seats_available: int = Field(..., ge=0)
    final_cost: float = Field(..., ge=0.00)
    vehicle_id: str

    @field_validator('departure_time', mode='after')
    @classmethod
    def ensure_utc_departure(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class RideCreate(RideBase):
    seats_available: int = Field(..., gt=0)

class RideUpdate(BaseModel):
    seats_available: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None # "published", "started", "completed", "cancelled"
    final_cost: Optional[float] = Field(None, ge=0.00)
    cancellation_reason: Optional[str] = None

class RideResponse(RideBase):
    id: str
    owner_id: str
    auto_cost: float
    status: str
    created_at: datetime

    @field_validator('created_at', mode='after')
    @classmethod
    def ensure_utc_created(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True

class RideDetailedResponse(RideResponse):
    owner: UserResponse
    vehicle: VehicleResponse

    class Config:
        from_attributes = True
