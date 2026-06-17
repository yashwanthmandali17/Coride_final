from sqlalchemy.orm import Session
from app.notifications.models import Notification

def create_notification(db: Session, user_id: str, title: str, message: str, ride_id: str = None) -> Notification:
    """Create a database notification for a user and trigger real-time dispatch."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        read_status=False,
        ride_id=ride_id
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    # Proactively broadcast using our WebSocket manager (imported inline to prevent circular dependencies)
    try:
        from app.chat.ws_manager import ws_manager
        ws_manager.send_notification(user_id, {
            "id": notif.id,
            "title": notif.title,
            "message": notif.message,
            "read_status": notif.read_status,
            "ride_id": notif.ride_id,
            "created_at": notif.created_at.isoformat() if notif.created_at else None
        })
    except Exception as e:
        print(f"Failed to broadcast notification: {e}")
        
    return notif
