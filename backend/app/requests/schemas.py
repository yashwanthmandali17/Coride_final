from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, field_validator
from app.users.schemas import UserResponse
from app.rides.schemas import RideResponse, RideDetailedResponse

class RideRequestCreate(BaseModel):
    ride_id: str
    pickup_location: Optional[str] = None
    dropoff_location: Optional[str] = None

class RideRequestUpdate(BaseModel):
    status: str # "accepted", "rejected", "cancelled"

class RideRequestResponse(BaseModel):
    id: str
    ride_id: str
    passenger_id: str
    status: str
    pickup_location: Optional[str] = None
    dropoff_location: Optional[str] = None
    requested_at: datetime
    passenger: UserResponse
    ride: RideDetailedResponse

    @field_validator('requested_at', mode='after')
    @classmethod
    def ensure_utc_requested(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True

class RideParticipantResponse(BaseModel):
    id: str
    ride_id: str
    user_id: str
    role: str
    pickup_location: Optional[str] = None
    dropoff_location: Optional[str] = None
    joined_at: datetime
    user: UserResponse

    @field_validator('joined_at', mode='after')
    @classmethod
    def ensure_utc_joined(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True
