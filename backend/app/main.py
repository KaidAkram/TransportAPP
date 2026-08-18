import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, is_sqlite
import app.models # Ensure all models are registered with Base.metadata
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
  print(f"[STARTUP] {settings.PROJECT_NAME} v{settings.VERSION} starting up...")

  # For SQLite: drop all tables and recreate to guarantee schema is up-to-date.
  # create_all() only creates missing tables, it does NOT add missing columns.
  if is_sqlite:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite:////", "/")
    if os.path.exists(db_path):
      print(f"[STARTUP] Removing stale SQLite database: {db_path}")
      os.remove(db_path)
      # Also remove WAL/SHM journal files if present
      for suffix in ("-wal", "-shm", "-journal"):
        journal = db_path + suffix
        if os.path.exists(journal):
          os.remove(journal)

  Base.metadata.create_all(bind=engine)
  print("[STARTUP] All database tables verified and synchronized.")
  yield
  print(f"[SHUTDOWN] {settings.PROJECT_NAME} shutting down...")


app = FastAPI(
  title=settings.PROJECT_NAME,
  version=settings.VERSION,
  description="Backend API RESTful pour la gestion integree du parc, personnel, CRM, maintenance, stock et contrats.",
  openapi_url=f"{settings.API_V1_STR}/openapi.json",
  docs_url=f"{settings.API_V1_STR}/docs",
  redoc_url=f"{settings.API_V1_STR}/redoc",
  lifespan=lifespan,
)

# CORS Middleware Configuration
app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.BACKEND_CORS_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Direct root-level /health endpoint (for load balancers, docker healthchecks, and quick pings)
app.include_router(health_router, prefix="")

# Versioned API routes under /api/v1
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_redirect():
  return {
    "app": settings.PROJECT_NAME,
    "version": settings.VERSION,
    "docs": f"{settings.API_V1_STR}/docs",
    "health": "/health",
  }
