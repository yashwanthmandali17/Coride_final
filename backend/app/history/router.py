from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.history.models import RideHistory
from app.requests.models import RideParticipant
from app.users.models import User
from app.history.schemas import RideHistoryResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/{ride_id}", response_model=List[RideHistoryResponse])
def get_ride_history(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user is a participant of this ride to see history
    participant = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view the history of this ride."
        )
        
    logs = db.query(RideHistory).filter(RideHistory.ride_id == ride_id).order_by(RideHistory.timestamp.asc()).all()
    
    mapped_logs = []
    for log in logs:
        user_name = db.query(User.name).filter(User.id == log.user_id).scalar() or "System"
        mapped_logs.append({
            "id": log.id,
            "ride_id": log.ride_id,
            "user_id": log.user_id,
            "user_name": user_name,
            "action": log.action,
            "timestamp": log.timestamp
        })
        
    return mapped_logs
