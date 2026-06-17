import uuid
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    profile_photo = Column(String(500), nullable=True)
    average_rating = Column(Float, default=0.00)
    reliability_score = Column(Float, default=100.00)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    published_rides = relationship("Ride", back_populates="owner", cascade="all, delete-orphan")
    requests = relationship("RideRequest", back_populates="passenger", cascade="all, delete-orphan")
    participations = relationship("RideParticipant", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
