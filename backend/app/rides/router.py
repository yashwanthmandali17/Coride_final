from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.rides.models import Ride
from app.vehicles.models import Vehicle
from app.requests.models import RideParticipant
from app.history.models import RideHistory
from app.rides.schemas import RideCreate, RideUpdate, RideDetailedResponse
from app.auth.dependencies import get_current_user
from app.users.models import User
from app.rides.matching import haversine_distance, match_rides

router = APIRouter(prefix="/rides", tags=["rides"])

def calculate_auto_cost(s_lat: float, s_lng: float, d_lat: float, d_lng: float, vehicle_type: str, capacity: int) -> float:
    """Estimate the cost per seat using the Haversine distance, mileage, and standard fuel price."""
    # Compute route distance proxy (straight line distance * 1.3 for winding roads)
    distance_km = haversine_distance(s_lat, s_lng, d_lat, d_lng) * 1.3
    
    # Mileage: car ~ 12 km/L, auto ~ 25 km/L, bike ~ 40 km/L
    if vehicle_type == "car":
        mileage = 12.0
    elif vehicle_type == "auto":
        mileage = 25.0
    else:
        mileage = 40.0
    fuel_price = 100.0 # standard currency unit per liter (e.g. INR)
    
    trip_cost = (distance_km / mileage) * fuel_price
    
    # Cost per seat (prevent division by zero)
    seats = max(capacity, 1)
    cost_per_seat = trip_cost / seats
    return round(cost_per_seat, 2)

@router.post("", response_model=RideDetailedResponse, status_code=status.HTTP_201_CREATED)
def publish_ride(
    payload: RideCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify departure time is in the future
    if payload.departure_time <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Departure time must be in the future."
        )

    # Verify vehicle ownership
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == payload.vehicle_id,
        Vehicle.user_id == current_user.id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found or does not belong to you."
        )
        
    if payload.seats_available > vehicle.seat_capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Seats available cannot exceed the vehicle's capacity of {vehicle.seat_capacity}."
        )

    # Calculate auto cost
    auto_cost = calculate_auto_cost(
        payload.source_lat, payload.source_lng,
        payload.destination_lat, payload.destination_lng,
        vehicle.type, vehicle.seat_capacity
    )

    db_ride = Ride(
        owner_id=current_user.id,
        vehicle_id=payload.vehicle_id,
        source=payload.source,
        destination=payload.destination,
        source_lat=payload.source_lat,
        source_lng=payload.source_lng,
        destination_lat=payload.destination_lat,
        destination_lng=payload.destination_lng,
        departure_time=payload.departure_time,
        seats_available=payload.seats_available,
        auto_cost=auto_cost,
        final_cost=payload.final_cost if payload.final_cost is not None else auto_cost,
        status="published"
    )
    
    db.add(db_ride)
    db.commit()
    db.refresh(db_ride)

    # Automatically add driver as a participant
    driver_participant = RideParticipant(
        ride_id=db_ride.id,
        user_id=current_user.id,
        role="driver"
    )
    db.add(driver_participant)
    
    # Audit log
    audit_log = RideHistory(
        ride_id=db_ride.id,
        user_id=current_user.id,
        action="Ride Published"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(db_ride)
    return db_ride

@router.get("", response_model=List[RideDetailedResponse])
def search_and_match_rides(
    s_lat: Optional[float] = Query(None),
    s_lng: Optional[float] = Query(None),
    d_lat: Optional[float] = Query(None),
    d_lng: Optional[float] = Query(None),
    preferred_time: Optional[datetime] = Query(None),
    radius: Optional[float] = Query(5.0),
    db: Session = Depends(get_db)
):
    """
    Search rides. If coordinates are provided, returns matching rides sorted by radius.
    Otherwise, returns all active rides.
    """
    if s_lat is not None and s_lng is not None and d_lat is not None and d_lng is not None:
        matched = match_rides(
            db=db,
            s_lat=s_lat,
            s_lng=s_lng,
            d_lat=d_lat,
            d_lng=d_lng,
            preferred_time=preferred_time,
            radius_km=radius
        )
        return [item[0] for item in matched]
        
    # Default: return all upcoming published rides
    now = datetime.now(timezone.utc)
    return db.query(Ride).filter(
        Ride.status == "published",
        Ride.departure_time >= now
    ).order_by(Ride.departure_time.asc()).all()

@router.get("/my-rides", response_model=List[RideDetailedResponse])
def get_my_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all rides published by the current user.
    """
    return db.query(Ride).filter(Ride.owner_id == current_user.id).order_by(Ride.departure_time.desc()).all()

@router.get("/{ride_id}", response_model=RideDetailedResponse)
def get_ride_details(
    ride_id: str,
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found."
        )
    return ride

@router.put("/{ride_id}", response_model=RideDetailedResponse)
def update_ride_details(
    ride_id: str,
    payload: RideUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND,
            detail="Ride not found."
        )
        
    if ride.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the ride publisher can modify it."
        )
        
    if payload.seats_available is not None:
        ride.seats_available = payload.seats_available
        
    if payload.final_cost is not None:
        ride.final_cost = payload.final_cost
        
    if payload.status is not None:
        if payload.status not in ["published", "started", "completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid ride status.")
            
        old_status = ride.status
        ride.status = payload.status
        
        # Log status transition
        audit_log = RideHistory(
            ride_id=ride.id,
            user_id=current_user.id,
            action=f"Ride {payload.status.capitalize()}"
        )
        db.add(audit_log)
        
        # Penalty calculation for cancelling rides
        if payload.status == "cancelled" and old_status in ["published", "started"]:
            # Check if there were any passengers with accepted requests
            passenger_count = db.query(RideParticipant).filter(
                RideParticipant.ride_id == ride.id,
                RideParticipant.role == "passenger"
            ).count()
            
            if passenger_count > 0:
                # Driver penalized: update reliability score
                # Reliability = Completed / (Completed + Cancelled) * 100
                # Let's count driver's past rides
                completed = db.query(Ride).filter(
                    Ride.owner_id == current_user.id,
                    Ride.status == "completed"
                ).count()
                
                cancelled = db.query(Ride).filter(
                    Ride.owner_id == current_user.id,
                    Ride.status == "cancelled"
                ).count()
                
                # Note: We include current cancel in count since we set it above.
                total = completed + cancelled
                if total > 0:
                    current_user.reliability_score = round((completed / total) * 100.0, 2)
                    
    db.commit()
    db.refresh(ride)
    return ride
