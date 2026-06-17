from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.auth.dependencies import get_current_user_ws, get_current_user
from app.users.models import User
from app.requests.models import RideParticipant
from app.chat.models import ChatMessage
from app.chat.ws_manager import ws_manager
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessageResponse(BaseModel):
    id: str
    ride_id: str
    sender_id: str
    sender_name: str
    content: str
    timestamp: datetime

    @field_validator('timestamp', mode='after')
    @classmethod
    def ensure_utc_timestamp(cls, v: datetime) -> datetime:
        if v and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True

@router.get("/{ride_id}/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    ride_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify participation
    participant = db.query(RideParticipant).filter(
        RideParticipant.ride_id == ride_id,
        RideParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant of this ride."
        )
        
    messages = db.query(ChatMessage).filter(ChatMessage.ride_id == ride_id).order_by(ChatMessage.timestamp.asc()).all()
    
    # Map messages to include sender name
    mapped_messages = []
    for msg in messages:
        sender_name = db.query(User.name).filter(User.id == msg.sender_id).scalar() or "Unknown"
        mapped_messages.append({
            "id": msg.id,
            "ride_id": msg.ride_id,
            "sender_id": msg.sender_id,
            "sender_name": sender_name,
            "content": msg.content,
            "timestamp": msg.timestamp
        })
        
    return mapped_messages

@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str = Query(...)
):
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Authenticate user
        user_id = decode_access_token(token)
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user_id_val = user.id
    finally:
        db.close() # Close session immediately!
        
    # 2. Add to WebSocket manager
    await ws_manager.connect(user_id_val, websocket)
    
    try:
        while True:
            # Keep the connection alive, waiting for any client keep-alives
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id_val, websocket)
    except Exception as e:
        ws_manager.disconnect(user_id_val, websocket)
        print(f"WS Notification Exception: {e}")

@router.websocket("/ws/{ride_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    ride_id: str,
    token: str = Query(...)
):
    # We resolve dependencies manually because FastAPI websockets handle Depends differently
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        # 1. Authenticate user
        user_id = decode_access_token(token)
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # 2. Check ride participation
        participant = db.query(RideParticipant).filter(
            RideParticipant.ride_id == ride_id,
            RideParticipant.user_id == user.id
        ).first()
        
        if not participant:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user_id_val = user.id
        user_name_val = user.name
    finally:
        db.close() # Close session immediately!
        
    # 3. Add to WebSocket manager
    await ws_manager.connect(user_id_val, websocket)
    
    try:
        while True:
            # Wait for message from user
            data = await websocket.receive_text()
            
            # Message structure is simple text or a json string containing content
            content = data.strip()
            if not content:
                continue
                
            # Open a new short-lived DB session for storing the message and broadcasting
            from app.core.database import SessionLocal
            db_session = SessionLocal()
            try:
                chat_msg = ChatMessage(
                    ride_id=ride_id,
                    sender_id=user_id_val,
                    content=content
                )
                db_session.add(chat_msg)
                db_session.commit()
                db_session.refresh(chat_msg)
                
                # Broadcast to all other participants
                msg_payload = {
                    "id": chat_msg.id,
                    "ride_id": chat_msg.ride_id,
                    "sender_id": chat_msg.sender_id,
                    "sender_name": user_name_val,
                    "content": chat_msg.content,
                    "timestamp": chat_msg.timestamp.isoformat()
                }
                await ws_manager.broadcast_to_ride(ride_id, user_id_val, msg_payload, db_session)
            finally:
                db_session.close() # Close session immediately!
                
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id_val, websocket)
    except Exception as e:
        ws_manager.disconnect(user_id_val, websocket)
        print(f"WS Exception: {e}")
