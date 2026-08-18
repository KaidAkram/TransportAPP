"""Entrypoint — schema creation + seed + start servers."""
import os
import subprocess
import sys
import time
import traceback
import urllib.request

APP_DIR = "/app"
BACKEND_DIR = "/app/backend"
FRONTEND_DIR = "/app/frontend"

# ── 1. Delete every .db file under /app (brute force) ──────────────
print("[entrypoint] Cleaning old database files...")
for root, _dirs, files in os.walk(APP_DIR):
    for f in files:
        if f.endswith(".db") or ".db-" in f:
            path = os.path.join(root, f)
            try:
                os.remove(path)
                print(f"[entrypoint] Deleted {path}")
            except OSError:
                pass

# ── 2. Create schema + seed (in-process, full error visibility) ───
sys.path.insert(0, BACKEND_DIR)

try:
    print("[entrypoint] Loading app modules...")
    from app.core.config import settings
    print(f"[entrypoint] DATABASE_URL = {settings.DATABASE_URL}")

    from app.core.database import engine, Base, is_sqlite
    import app.models

    print("[entrypoint] Dropping all tables (SQLite)...")
    if is_sqlite:
        Base.metadata.drop_all(bind=engine)

    print("[entrypoint] Creating all tables...")
    Base.metadata.create_all(bind=engine)

    print("[entrypoint] Tables created successfully.")

    # ── Seed demo data ─────────────────────────────────────────────
    print("[entrypoint] Running seed_data...")
    from seed_data import seed_database
    seed_database(settings.DATABASE_URL)

    print("[entrypoint] Schema + seed complete.")

except Exception:
    print("[entrypoint] FATAL ERROR during schema/seed:")
    traceback.print_exc()

# ── 3. Start FastAPI backend (background) ──────────────────────────
print("[entrypoint] Starting backend...")
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app",
     "--host", "0.0.0.0", "--port", "8080"],
    cwd=BACKEND_DIR,
)

# ── 4. Wait for backend health ─────────────────────────────────────
print("[entrypoint] Waiting for backend...")
for _ in range(30):
    try:
        urllib.request.urlopen("http://localhost:8080/api/v1/health", timeout=2)
        print("[entrypoint] Backend is ready!")
        break
    except Exception:
        time.sleep(1)
else:
    print("[entrypoint] Backend did not become ready in 30s")

# ── 5. Start Next.js frontend (foreground) ─────────────────────────
port = os.environ.get("PORT", "3000")
os.chdir(FRONTEND_DIR)
os.execvp("npm", ["npm", "run", "start", "--", "-p", port])
