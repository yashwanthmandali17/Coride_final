from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Determine if we're using SQLite to apply specific connection arguments
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {"check_same_thread": False} if is_sqlite else {}

# Create database engine with optimized connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_size=15,
    max_overflow=25,
    pool_recycle=1800,
    pool_pre_ping=False
)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for SQLAlchemy models
Base = declarative_base()

def get_db():
    """Dependency generator to yield database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
