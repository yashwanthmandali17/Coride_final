import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ride_id = Column(String(36), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False, index=True)
    passenger_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="pending") # "pending", "accepted", "rejected", "cancelled"
    pickup_location = Column(String(255), nullable=True)
    dropoff_location = Column(String(255), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    ride = relationship("Ride", back_populates="requests")
    passenger = relationship("User", back_populates="requests")

class RideParticipant(Base):
    __tablename__ = "ride_participants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ride_id = Column(String(36), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False) # "driver" or "passenger"
    pickup_location = Column(String(255), nullable=True)
    dropoff_location = Column(String(255), nullable=True)
    confirmed_completion = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint ensures a user isn't duplicated in the same ride
    __table_args__ = (
        UniqueConstraint("ride_id", "user_id", name="uq_ride_user"),
    )

    # Relationships
    ride = relationship("Ride", back_populates="participants")
    user = relationship("User", back_populates="participations")
