import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, is_sqlite
import app.models
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
  print(f"[STARTUP] {settings.PROJECT_NAME} v{settings.VERSION} starting up...")

  if is_sqlite:
    from sqlalchemy import text, inspect as sqla_inspect
    try:
      with engine.connect() as conn:
        inspector = sqla_inspect(engine)
        tables = inspector.get_table_names()
        if tables:
          for table in tables:
            try:
              conn.execute(text(f"DROP TABLE IF EXISTS [{table}]"))
            except Exception:
              pass
          conn.commit()
          print(f"[STARTUP] Dropped {len(tables)} stale tables.")
    except Exception as e:
      print(f"[STARTUP] Drop tables warning: {e}")

  Base.metadata.create_all(bind=engine)
  print("[STARTUP] All database tables created fresh.")
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

app.add_middleware(
  CORSMiddleware,
  allow_origins=settings.BACKEND_CORS_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(health_router, prefix="")
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_redirect():
  return {
    "app": settings.PROJECT_NAME,
    "version": settings.VERSION,
    "docs": f"{settings.API_V1_STR}/docs",
    "health": "/health",
  }
