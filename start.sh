#!/bin/bash
set -e

# Remove any stale database at runtime (belt-and-suspenders with Dockerfile RUN rm)
rm -f /app/etransport.db /app/etransport.db-wal /app/etransport.db-shm /app/etransport.db-journal

# Start FastAPI backend in the background on port 8080
cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 &

# Wait for backend to be ready
echo "Waiting for backend to start..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  sleep 1
done

# Start Next.js frontend on Render's required PORT
cd /app/frontend
npm run start -- -p $PORT
