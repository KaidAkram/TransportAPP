from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all models are registered with Base.metadata
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables are created on startup
    print(f"[STARTUP] {settings.PROJECT_NAME} v{settings.VERSION} starting up...")
    Base.metadata.create_all(bind=engine)
    print("[STARTUP] All database tables verified and synchronized.")
    yield
    # Shutdown
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
