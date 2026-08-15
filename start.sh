#!/bin/bash
# Start FastAPI backend in the background on port 8080
# We must run it from the backend directory so 'app' module is found
cd /app/backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 &

# Start Next.js frontend on Render's required PORT
cd /app/frontend
npm run start -- -p $PORT
