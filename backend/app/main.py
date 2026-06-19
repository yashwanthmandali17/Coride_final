from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine

# Import all models to ensure they are registered with Base.metadata
from app.users.models import User
from app.vehicles.models import Vehicle
from app.rides.models import Ride
from app.requests.models import RideRequest, RideParticipant
from app.chat.models import ChatMessage
from app.notifications.models import Notification
from app.ratings.models import Rating
from app.history.models import RideHistory

# Initialize tables (SQLite auto-creation, safe on PostgreSQL)
Base.metadata.create_all(bind=engine)

# Schema migration: Add ride_id to notifications if it doesn't exist
from sqlalchemy import inspect, text
try:
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("users")]
        if "driving_license_url" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN driving_license_url TEXT;"))
        if "driving_license_expiry" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN driving_license_expiry VARCHAR(10);"))

    if "vehicles" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("vehicles")]
        if "rc_url" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE vehicles ADD COLUMN rc_url TEXT;"))
        if "rc_expiry" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE vehicles ADD COLUMN rc_expiry VARCHAR(10);"))

    if "notifications" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("notifications")]
        if "ride_id" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE notifications ADD COLUMN ride_id VARCHAR(36);"))
    
    if "rides" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("rides")]
        if "route_h3_indexes" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE rides ADD COLUMN route_h3_indexes JSON;"))

    if "ride_requests" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("ride_requests")]
        if "pickup_location" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE ride_requests ADD COLUMN pickup_location VARCHAR(255);"))
                conn.execute(text("ALTER TABLE ride_requests ADD COLUMN dropoff_location VARCHAR(255);"))

    if "ride_participants" in inspector.get_table_names():
        columns = [col["name"] for col in inspector.get_columns("ride_participants")]
        if "pickup_location" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE ride_participants ADD COLUMN pickup_location VARCHAR(255);"))
                conn.execute(text("ALTER TABLE ride_participants ADD COLUMN dropoff_location VARCHAR(255);"))

except Exception as e:
    print(f"Database schema migration warning: {e}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Backend API for CoRide college project - a modular ride-sharing monolith platform"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to allowed Vercel URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register domain routers
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.vehicles.router import router as vehicles_router
from app.rides.router import router as rides_router
from app.requests.router import router as requests_router
from app.chat.router import router as chat_router
from app.notifications.router import router as notifications_router
from app.ratings.router import router as ratings_router
from app.history.router import router as history_router

app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(vehicles_router, prefix="/api")
app.include_router(rides_router, prefix="/api")
app.include_router(requests_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(ratings_router, prefix="/api")
app.include_router(history_router, prefix="/api")

@app.get("/")
def get_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
