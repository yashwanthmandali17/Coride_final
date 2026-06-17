import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class RideHistory(Base):
    __tablename__ = "ride_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ride_id = Column(String(36), ForeignKey("rides.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False) # e.g. "Ride Published", "Request Sent", etc.
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    ride = relationship("Ride", back_populates="history_logs")
    user = relationship("User")
