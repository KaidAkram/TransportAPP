from fastapi import APIRouter
from app.core.config import settings
from app.core.database import check_db_connection

router = APIRouter(tags=["Health & Status"])


@router.get("/health", summary="Health Check")
def health_check():
  """
  Returns 200 OK with server health, metadata, and database ping status.
  """
  db_status = check_db_connection()
  return {
    "status": "ok",
    "app": settings.PROJECT_NAME,
    "version": settings.VERSION,
    "database": db_status,
  }
