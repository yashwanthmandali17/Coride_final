from typing import Dict, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List of active WebSockets (supports multiple tabs/devices)
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a JSON payload to all active connections of a specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    # Connection might be dead, handled during disconnection
                    pass

    def send_notification(self, user_id: str, notification: dict):
        """Synchronously queue sending a notification payload using asyncio."""
        import asyncio
        payload = {
            "type": "notification",
            "data": notification
        }
        # Run async delivery on the running loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(self.send_personal_message(payload, user_id))
        except RuntimeError:
            # No running event loop (e.g. testing)
            pass

    async def broadcast_to_ride(self, ride_id: str, sender_id: str, message_data: dict, db):
        """Broadcast a message to all active participants of a ride (excluding the sender)."""
        from app.requests.models import RideParticipant
        from app.notifications.service import create_notification
        
        # Get all participants in this ride
        participants = db.query(RideParticipant).filter(RideParticipant.ride_id == ride_id).all()
        
        payload = {
            "type": "chat",
            "data": message_data
        }
        
        for participant in participants:
            if participant.user_id != sender_id:
                # 1. Send real-time chat WS payload if they are currently inside the chat room
                await self.send_personal_message(payload, participant.user_id)
                
                # 2. Save a database notification so they get a notification count and bell icon alert
                sender_name = message_data.get("sender_name", "A ride member")
                content_preview = message_data.get("content", "")
                if len(content_preview) > 50:
                    content_preview = content_preview[:47] + "..."
                    
                create_notification(
                    db=db,
                    user_id=participant.user_id,
                    title=f"New message from {sender_name}",
                    message=content_preview,
                    ride_id=ride_id,
                    commit=True
                )

ws_manager = ConnectionManager()
