#!/bin/bash
# Start FastAPI backend in the background on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &

# Start Next.js frontend on Render's required PORT
cd frontend
npm run start -- -p $PORT
