#!/usr/bin/env python3
"""Entrypoint script — avoids bash CRLF issues on Windows dev machines."""
import os
import subprocess
import sys
import time
import urllib.request

# 1) Delete stale SQLite DB files if present (absolute path from render.yaml)
for db_name in ["etransport.db", "etransport.db-wal", "etransport.db-shm", "etransport.db-journal"]:
    for base in ["/app", "/app/backend"]:
        p = os.path.join(base, db_name)
        if os.path.exists(p):
            os.remove(p)
            print(f"[entrypoint] Removed stale file: {p}")

# 2) Start FastAPI backend in background
backend = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app",
     "--host", "0.0.0.0", "--port", "8080"],
    cwd="/app/backend",
)

# 3) Wait for backend health
print("[entrypoint] Waiting for backend…")
for _ in range(30):
    try:
        urllib.request.urlopen("http://localhost:8080/health", timeout=2)
        print("[entrypoint] Backend is ready!")
        break
    except Exception:
        time.sleep(1)
else:
    print("[entrypoint] Backend did not become ready in 30s, starting frontend anyway")

# 4) Start Next.js frontend (foreground — keeps container alive)
port = os.environ.get("PORT", "3000")
os.chdir("/app/frontend")
os.execvp("npm", ["npm", "run", "start", "--", "-p", port])
