from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.base import Base

# Engine configuration with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """Verifies active connectivity to the PostgreSQL / Supabase database."""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            if row and row[0] == 1:
                return {
                    "connected": True,
                    "message": "Database connection successfully established.",
                }
            return {
                "connected": False,
                "message": "Unexpected response from database ping query.",
            }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "message": "Failed to connect to database.",
        }
