from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.vehicles.models import Vehicle
from app.vehicles.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, PrivateVehicleResponse
from app.auth.dependencies import get_current_user
from app.users.models import User

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

@router.post("", response_model=PrivateVehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.type not in ["car", "bike", "auto"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle type must be 'car', 'bike', or 'auto'."
        )
    
    # Check registration number uniqueness
    existing = db.query(Vehicle).filter(Vehicle.registration_number == payload.registration_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A vehicle with this registration number is already registered."
        )

    db_vehicle = Vehicle(
        user_id=current_user.id,
        type=payload.type,
        brand=payload.brand,
        model=payload.model,
        registration_number=payload.registration_number,
        seat_capacity=payload.seat_capacity,
        rc_url=payload.rc_url,
        rc_expiry=payload.rc_expiry
    )
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

@router.get("", response_model=List[PrivateVehicleResponse])
def list_my_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Vehicle).filter(Vehicle.user_id == current_user.id).all()

@router.get("/{vehicle_id}", response_model=PrivateVehicleResponse)
def get_vehicle_details(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found."
        )
    # Check ownership
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this vehicle."
        )
    return vehicle

@router.put("/{vehicle_id}", response_model=PrivateVehicleResponse)
def update_vehicle(
    vehicle_id: str,
    payload: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found."
        )
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this vehicle."
        )
        
    if payload.type is not None:
        if payload.type not in ["car", "bike", "auto"]:
            raise HTTPException(status_code=400, detail="Vehicle type must be 'car', 'bike', or 'auto'.")
        vehicle.type = payload.type
        
    if payload.brand is not None:
        vehicle.brand = payload.brand
    if payload.model is not None:
        vehicle.model = payload.model
    if payload.seat_capacity is not None:
        vehicle.seat_capacity = payload.seat_capacity
        
    if payload.registration_number is not None:
        # Check registration unique
        existing = db.query(Vehicle).filter(
            Vehicle.registration_number == payload.registration_number,
            Vehicle.id != vehicle.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Registration number already in use.")
        vehicle.registration_number = payload.registration_number
        
    if payload.rc_url is not None:
        vehicle.rc_url = None if payload.rc_url == "" else payload.rc_url
    if payload.rc_expiry is not None:
        vehicle.rc_expiry = None if payload.rc_expiry == "" else payload.rc_expiry
        
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found."
        )
    if vehicle.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this vehicle."
        )
    db.delete(vehicle)
    db.commit()
    return None
