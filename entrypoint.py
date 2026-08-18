"""Entrypoint — no bash, no CRLF issues, guaranteed fresh DB schema."""
import os
import subprocess
import sys
import time
import urllib.request

APP_DIR = "/app"
BACKEND_DIR = "/app/backend"
FRONTEND_DIR = "/app/frontend"

# ── 1. Delete every .db file under /app (brute force) ──────────────
for root, _dirs, files in os.walk(APP_DIR):
    for f in files:
        if f.endswith(".db") or ".db-" in f:
            path = os.path.join(root, f)
            try:
                os.remove(path)
                print(f"[entrypoint] Deleted {path}")
            except OSError:
                pass

# ── 2. Create a fresh schema BEFORE starting uvicorn ───────────────
print("[entrypoint] Creating database schema...")
schema_result = subprocess.run(
    [sys.executable, "-c", (
        "import sys; sys.path.insert(0, '.'), "
        "from app.core.database import engine, Base, is_sqlite, "
        "import app.models, "
        "Base.metadata.drop_all(bind=engine) if is_sqlite else None, "
        "Base.metadata.create_all(bind=engine), "
        "print('[schema] Tables created.')"
    )],
    cwd=BACKEND_DIR,
    capture_output=True, text=True,
)
print(schema_result.stdout)
if schema_result.returncode != 0:
    print(f"[entrypoint] Schema creation stderr: {schema_result.stderr}")

# ── 3. Start FastAPI backend (background) ──────────────────────────
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app",
     "--host", "0.0.0.0", "--port", "8080"],
    cwd=BACKEND_DIR,
)

# ── 4. Wait for backend health ─────────────────────────────────────
print("[entrypoint] Waiting for backend…")
for _ in range(30):
    try:
        urllib.request.urlopen("http://localhost:8080/health", timeout=2)
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
