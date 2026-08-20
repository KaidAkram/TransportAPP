from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.core.database import check_db_connection, SessionLocal

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


@router.get("/stats", summary="Database Record Counts")
def db_stats():
  db = SessionLocal()
  try:
    tables = [
      "vehicules", "employes", "partenaires", "contrats", "cautions",
      "pieces", "interventions", "factures", "documents",
      "depenses_vehicules", "constats", "contacts", "crm_notes",
      "mouvements_stock", "receptions", "avenants", "permis",
    ]
    counts = {}
    for t in tables:
      try:
        r = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
        counts[t] = r
      except Exception:
        counts[t] = "error"
    return {"counts": counts, "total": sum(v for v in counts.values() if isinstance(v, int))}
  finally:
    db.close()
