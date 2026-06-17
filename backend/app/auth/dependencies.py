from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.users.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Retrieve the current authenticated user from JWT token in the Authorization header."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
        
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

def get_current_user_ws(
    token: str = Query(None),
    db: Session = Depends(get_db)
) -> User:
    """Retrieve the current user from query params, specifically for WebSockets."""
    if not token:
        raise HTTPException(status_code=403, detail="Missing authorization token")
        
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=403, detail="Invalid authorization token")
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=403, detail="User not found")
        
    return user
