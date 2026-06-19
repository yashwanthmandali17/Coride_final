from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.ratings.models import Rating
from app.rides.models import Ride
from app.requests.models import RideParticipant
from app.users.models import User
from app.ratings.schemas import RatingCreate, RatingResponse
from app.auth.dependencies import get_current_user
from app.notifications.service import create_notification

router = APIRouter(prefix="/ratings", tags=["ratings"])

@router.post("", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def submit_rating(
    payload: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Verify ride exists and is completed
    ride = db.query(Ride).filter(Ride.id == payload.ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.status != "completed":
        raise HTTPException(status_code=400, detail="Reviews can only be submitted for completed rides.")

    # 2. Check that reviewer is not self
    if payload.reviewee_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot rate yourself.")

    # 3. Verify reviewer is participant of the ride
    reviewer_part = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride.id,
        RideParticipant.user_id == current_user.id
    ).first()
    if not reviewer_part:
        raise HTTPException(status_code=403, detail="You did not participate in this ride.")

    # 4. Verify reviewee is participant of the ride
    reviewee_part = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride.id,
        RideParticipant.user_id == payload.reviewee_id
    ).first()
    if not reviewee_part:
        raise HTTPException(status_code=400, detail="The reviewee was not a participant in this ride.")

    # 5. Check if review already submitted
    existing = db.query(Rating).filter(
        Rating.ride_id == ride.id,
        Rating.reviewer_id == current_user.id,
        Rating.reviewee_id == payload.reviewee_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already rated this user for this ride.")

    # 6. Create Rating
    db_rating = Rating(
        ride_id=ride.id,
        reviewer_id=current_user.id,
        reviewee_id=payload.reviewee_id,
        stars=payload.stars,
        comment=payload.comment
    )
    db.add(db_rating)

    # 7. Recalculate average rating of reviewee
    avg_stars = db.query(func.avg(Rating.stars)).filter(
        Rating.reviewee_id == payload.reviewee_id
    ).scalar()
    
    reviewee = db.query(User).filter(User.id == payload.reviewee_id).first()
    if reviewee and avg_stars is not None:
        reviewee.average_rating = round(float(avg_stars), 2)

    # 8. Notify reviewee
    create_notification(
        db=db,
        user_id=payload.reviewee_id,
        title="New Rating Received",
        message=f"You received a {payload.stars}-star rating from a ride member.",
        commit=False
    )
    
    db.commit()
    db.refresh(db_rating)
    return db_rating
