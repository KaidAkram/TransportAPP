import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[STARTUP] {settings.PROJECT_NAME} v{settings.VERSION} starting up...")
    Base.metadata.create_all(bind=engine)
    print("[STARTUP] Tables ready.")
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
from fastapi.staticfiles import StaticFiles

assets_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "assets"))
os.makedirs(assets_path, exist_ok=True)
app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

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
