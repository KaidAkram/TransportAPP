import os
import glob as globmod
import sqlite3
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, is_sqlite
import app.models
from app.api.v1.router import api_v1_router
from app.api.v1.health import router as health_router


def _find_sqlite_db():
    """Find the actual SQLite database file from the DATABASE_URL."""
    url = settings.DATABASE_URL
    for prefix in ["sqlite:////", "sqlite:///"]:
        if url.startswith(prefix):
            return url[len(prefix):]
    return url


def _delete_sqlite_files(db_path):
    """Delete the DB file and all journal/WAL/SHM companions."""
    for pattern in [db_path, db_path + "-*", db_path + "-*.*"]:
        for f in globmod.glob(pattern):
            try:
                os.remove(f)
                print(f"[STARTUP] Deleted: {f}")
            except OSError:
                pass


def _drop_all_tables_raw(db_path):
    """Use raw sqlite3 to drop every table — bypasses SQLAlchemy engine entirely."""
    if not os.path.exists(db_path):
        print(f"[STARTUP] No DB file at {db_path}, fresh start.")
        return
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        tables = [row[0] for row in cursor.fetchall()]
        if tables:
            conn.execute("PRAGMA foreign_keys = OFF")
            for t in tables:
                conn.execute(f'DROP TABLE IF EXISTS "{t}"')
            conn.execute("PRAGMA foreign_keys = ON")
            conn.commit()
            print(f"[STARTUP] Raw sqlite3 dropped {len(tables)} tables: {tables}")
        else:
            print("[STARTUP] No tables found in existing DB.")
        conn.close()
    except Exception as e:
        print(f"[STARTUP] Raw sqlite3 drop error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[STARTUP] {settings.PROJECT_NAME} v{settings.VERSION} starting up...")
    print(f"[STARTUP] DATABASE_URL = {settings.DATABASE_URL}")

    if is_sqlite:
        db_path = _find_sqlite_db()
        print(f"[STARTUP] Resolved DB path: {db_path}")
        _delete_sqlite_files(db_path)
        _drop_all_tables_raw(db_path)

    Base.metadata.create_all(bind=engine)
    print("[STARTUP] All database tables created successfully.")
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
