import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False) # "car", "bike", or "auto"
    brand = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    registration_number = Column(String(50), unique=True, nullable=False)
    seat_capacity = Column(Integer, nullable=False)
    rc_url = Column(Text, nullable=True)
    rc_expiry = Column(String(10), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="vehicles")
    rides = relationship("Ride", back_populates="vehicle")
