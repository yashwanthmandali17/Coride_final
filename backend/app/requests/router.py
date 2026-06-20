from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.requests.models import RideRequest, RideParticipant
from app.rides.models import Ride
from app.history.models import RideHistory
from app.users.models import User
from app.requests.schemas import RideRequestCreate, RideRequestUpdate, RideRequestResponse, RideParticipantResponse
from app.auth.dependencies import get_current_user
from app.notifications.service import create_notification

def shorten_address(address: str) -> str:
    if not address:
        return ""
    parts = [p.strip() for p in address.split(",") if p.strip()]
    return ", ".join(parts[:2]) if len(parts) >= 2 else address

router = APIRouter(prefix="/requests", tags=["requests"])

@router.post("", response_model=RideRequestResponse, status_code=status.HTTP_201_CREATED)
def request_ride(
    payload: RideRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.id == payload.ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
        
    if ride.status != "published":
        raise HTTPException(status_code=400, detail="This ride is no longer accepting requests.")
        
    # Verify the ride has not already departed/completed
    if ride.departure_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Cannot book a ride that has already departed.")
        
    if ride.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot request a ride that you published.")
        
    if ride.seats_available <= 0:
        raise HTTPException(status_code=400, detail="No seats available on this ride.")
        
    # Check if a pending or accepted request already exists
    existing = db.query(RideRequest).filter(
        RideRequest.ride_id == ride.id,
        RideRequest.passenger_id == current_user.id,
        RideRequest.status.in_(["pending", "accepted"])
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending or accepted request for this ride.")

    db_request = RideRequest(
        ride_id=ride.id,
        passenger_id=current_user.id,
        status="pending",
        pickup_location=payload.pickup_location,
        dropoff_location=payload.dropoff_location
    )
    db.add(db_request)
    
    # Audit log
    audit_log = RideHistory(
        ride_id=ride.id,
        user_id=current_user.id,
        action="Request Sent"
    )
    db.add(audit_log)
    
    # Notify Driver
    if payload.pickup_location and payload.dropoff_location:
        notif_msg = f"{current_user.name} has requested to join your ride from {shorten_address(payload.pickup_location)} to {shorten_address(payload.dropoff_location)}."
    else:
        notif_msg = f"{current_user.name} has requested to join your ride from {shorten_address(ride.source)} to {shorten_address(ride.destination)}."

    create_notification(
        db=db,
        user_id=ride.owner_id,
        title="New Ride Request",
        message=notif_msg,
        ride_id=ride.id,
        commit=False
    )
    
    db.commit()
    db.refresh(db_request)
    return db_request

@router.put("/{request_id}", response_model=RideRequestResponse)
def update_request_status(
    request_id: str,
    payload: RideRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request_obj = db.query(RideRequest).filter(RideRequest.id == request_id).first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Ride request not found.")
        
    ride = request_obj.ride
    passenger = request_obj.passenger
    
    if payload.status not in ["accepted", "rejected", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid request status.")
        
    if payload.status in ["accepted", "rejected"]:
        # Only ride owner (driver) can accept/reject
        if ride.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the driver can accept or reject requests.")
            
        if request_obj.status != "pending":
            raise HTTPException(status_code=400, detail=f"Cannot update request that is already {request_obj.status}.")
            
        if payload.status == "accepted":
            if ride.seats_available <= 0:
                raise HTTPException(status_code=400, detail="No seats available to accept this request.")
                
            request_obj.status = "accepted"
            ride.seats_available -= 1
            
            # Add passenger to participants list
            participant = RideParticipant(
                ride_id=ride.id,
                user_id=passenger.id,
                role="passenger",
                pickup_location=request_obj.pickup_location,
                dropoff_location=request_obj.dropoff_location
            )
            db.add(participant)
            
            # Audit log
            audit_log = RideHistory(
                ride_id=ride.id,
                user_id=current_user.id,
                action="Request Accepted"
            )
            db.add(audit_log)
            
            # Notify Passenger
            create_notification(
                db=db,
                user_id=passenger.id,
                title="Request Accepted!",
                message=f"Your request for the ride from {shorten_address(ride.source)} to {shorten_address(ride.destination)} was accepted.",
                ride_id=ride.id,
                commit=False
            )
            
        elif payload.status == "rejected":
            request_obj.status = "rejected"
            
            # Audit log
            audit_log = RideHistory(
                ride_id=ride.id,
                user_id=current_user.id,
                action="Request Rejected"
            )
            db.add(audit_log)
            
            # Notify Passenger
            create_notification(
                db=db,
                user_id=passenger.id,
                title="Request Rejected",
                message=f"Your request for the ride from {shorten_address(ride.source)} to {shorten_address(ride.destination)} was rejected.",
                ride_id=ride.id,
                commit=False
            )
            
    elif payload.status == "cancelled":
        # Can be cancelled by passenger or by the driver (ride owner)
        is_passenger = request_obj.passenger_id == current_user.id
        is_driver = ride.owner_id == current_user.id
        
        if not (is_passenger or is_driver):
            raise HTTPException(status_code=403, detail="You cannot cancel this request.")
            
        if request_obj.status == "cancelled":
            raise HTTPException(status_code=400, detail="Request is already cancelled.")
            
        old_status = request_obj.status
        request_obj.status = "cancelled"
        
        if old_status == "accepted":
            # Reclaim seat
            ride.seats_available += 1
            
            # Remove passenger from participants
            participant = db.query(RideParticipant).filter(
                RideParticipant.ride_id == ride.id,
                RideParticipant.user_id == request_obj.passenger_id
            ).first()
            if participant:
                db.delete(participant)
                
        # Audit log
        audit_log = RideHistory(
            ride_id=ride.id,
            user_id=current_user.id,
            action="Request Cancelled" if is_passenger else "Passenger Removed"
        )
        db.add(audit_log)
        
        # Notify appropriate party
        if is_passenger:
            # Notify Driver
            create_notification(
                db=db,
                user_id=ride.owner_id,
                title="Request Cancelled",
                message=f"{current_user.name} has cancelled their request/seat for the ride to {shorten_address(ride.destination)}.",
                ride_id=ride.id,
                commit=False
            )
        else:
            # Driver cancelled passenger's request. Notify Passenger.
            reason_str = f" Reason: {payload.cancellation_reason}" if payload.cancellation_reason else ""
            create_notification(
                db=db,
                user_id=request_obj.passenger_id,
                title="Booking Cancelled by Driver",
                message=f"The driver has cancelled your booking for the ride from {shorten_address(ride.source)} to {shorten_address(ride.destination)}.{reason_str}",
                ride_id=ride.id,
                commit=False
            )
        
    db.commit()
    db.refresh(request_obj)
    return request_obj

@router.get("/my-requests", response_model=List[RideRequestResponse])
def get_my_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Find any requests where the ride is "published" but past departure time
    past_requests = db.query(RideRequest).join(Ride).filter(
        RideRequest.passenger_id == current_user.id,
        Ride.status == "published",
        Ride.departure_time < now
    ).all()
    if past_requests:
        for req in past_requests:
            req.ride.status = "abandoned"
        db.commit()

    return db.query(RideRequest).filter(RideRequest.passenger_id == current_user.id).all()

@router.get("/incoming", response_model=List[RideRequestResponse])
def get_incoming_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Find any incoming requests where the ride is "published" but past departure time
    past_incoming = db.query(RideRequest).join(Ride).filter(
        Ride.owner_id == current_user.id,
        Ride.status == "published",
        Ride.departure_time < now
    ).all()
    if past_incoming:
        for req in past_incoming:
            req.ride.status = "abandoned"
        db.commit()

    return db.query(RideRequest).join(Ride).filter(Ride.owner_id == current_user.id).all()

@router.get("/rides/{ride_id}/participants", response_model=List[RideParticipantResponse])
def get_ride_participants(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is a participant of this ride
    is_part = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.user_id == current_user.id
    ).first()
    
    if not is_part:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a participant (driver or passenger) to view other participants."
        )
        
    participants = db.query(RideParticipant).filter(RideParticipant.ride_id == ride_id).all()
    for p in participants:
        if p.role == "passenger":
            req = db.query(RideRequest).filter(
                RideRequest.ride_id == ride_id,
                RideRequest.passenger_id == p.user_id,
                RideRequest.status == "accepted"
            ).first()
            if req:
                p.request_id = req.id
            else:
                p.request_id = None
        else:
            p.request_id = None
    return participants

@router.post("/rides/{ride_id}/complete")
def confirm_ride_completion(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
        
    if ride.status not in ["published", "started"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete a ride in status {ride.status}.")
        
    participant = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="You are not a participant of this ride.")
        
    if participant.confirmed_completion:
        return {"detail": "You have already confirmed completion for this ride."}
        
    participant.confirmed_completion = True
    db.flush()
    
    # Audit log
    audit = RideHistory(
        ride_id=ride.id,
        user_id=current_user.id,
        action=f"Completion Confirmed by {participant.role.capitalize()}"
    )
    db.add(audit)
    
    # Notify others in the ride
    other_participants = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.user_id != current_user.id
    ).all()
    
    for op in other_participants:
        create_notification(
            db=db,
            user_id=op.user_id,
            title="Completion Confirmed",
            message=f"{current_user.name} ({participant.role}) has confirmed the completion of the ride.",
            ride_id=ride.id,
            commit=False
        )
        
    # Check if double-party conditions are met to transition ride to 'completed'
    # Condition: Driver has confirmed AND (at least one passenger has confirmed OR there are no passengers)
    driver_confirmed = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.role == "driver",
        RideParticipant.confirmed_completion == True
    ).first() is not None
    
    passengers = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.role == "passenger"
    ).all()
    
    passenger_confirmed = any(p.confirmed_completion for p in passengers) if passengers else True
    
    if driver_confirmed and passenger_confirmed:
        ride.status = "completed"
        
        # Log final complete
        final_audit = RideHistory(
            ride_id=ride.id,
            user_id=ride.owner_id,
            action="Ride Completed"
        )
        db.add(final_audit)
        
        # Recalculate driver's reliability score
        completed_count = db.query(Ride).filter(
            Ride.owner_id == ride.owner_id,
            Ride.status == "completed"
        ).count()
        
        cancelled_count = db.query(Ride).filter(
            Ride.owner_id == ride.owner_id,
            Ride.status == "cancelled"
        ).count()
        
        # Current one is already set to completed in session, so count is correct after commit
        total = completed_count + cancelled_count
        if total > 0:
            driver = db.query(User).filter(User.id == ride.owner_id).first()
            if driver:
                driver.reliability_score = round((completed_count / total) * 100.0, 2)
                
    db.commit()
    return {"detail": "Completion confirmed.", "ride_status": ride.status}
