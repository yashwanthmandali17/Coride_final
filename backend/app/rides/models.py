import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Ride(Base):
    __tablename__ = "rides"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(String(36), ForeignKey("vehicles.id", ondelete="RESTRICT"), nullable=False, index=True)
    source = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    source_lat = Column(Float, nullable=False)
    source_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    departure_time = Column(DateTime(timezone=True), nullable=False, index=True)
    seats_available = Column(Integer, nullable=False)
    auto_cost = Column(Float, nullable=False)
    final_cost = Column(Float, nullable=False)
    status = Column(String(20), default="published", index=True) # "published", "started", "completed", "cancelled"
    route_h3_indexes = Column(JSON, default=list) # Stores the H3 grid array for waypoint matching
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # Relationships
    owner = relationship("User", back_populates="published_rides")
    vehicle = relationship("Vehicle", back_populates="rides")
    requests = relationship("RideRequest", back_populates="ride", cascade="all, delete-orphan")
    participants = relationship("RideParticipant", back_populates="ride", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="ride", cascade="all, delete-orphan")
    history_logs = relationship("RideHistory", back_populates="ride", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="ride", cascade="all, delete-orphan")
