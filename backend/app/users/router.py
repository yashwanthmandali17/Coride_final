from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.users.models import User
from app.users.schemas import UserResponse, UserUpdate, CurrentUserResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=CurrentUserResponse)
def read_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=CurrentUserResponse)
def update_current_user_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.profile_photo is not None:
        current_user.profile_photo = payload.profile_photo
    if payload.driving_license_url is not None:
        current_user.driving_license_url = None if payload.driving_license_url == "" else payload.driving_license_url
    if payload.driving_license_expiry is not None:
        current_user.driving_license_expiry = None if payload.driving_license_expiry == "" else payload.driving_license_expiry
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
