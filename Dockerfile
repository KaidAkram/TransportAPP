# 1. Build the Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Next.js API calls will route to the backend port internally
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm run build

# 2. Build the FastAPI backend and serve the Next.js static files
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install uvicorn aiofiles

# Copy backend code
COPY backend/ ./backend/

# Copy frontend static build to serve via FastAPI? No, wait. 
# FastAPI won't magically serve Next.js unless we configure it.
# Actually, if we just want a monolith, it's easier to run both Node and Python concurrently.

# 3. Final runtime image with both Node and Python
FROM nikolaik/python-nodejs:python3.11-nodejs20-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt uvicorn

# Copy backend
COPY backend/ ./backend/

# Remove any stale database from cached layers — schema is created on startup
RUN rm -f /app/etransport.db /app/backend/etransport.db

# Install frontend dependencies and build
COPY frontend/ ./frontend/
WORKDIR /app/frontend
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm ci
RUN npm run build

WORKDIR /app
COPY start.sh .
RUN chmod +x start.sh

EXPOSE $PORT

CMD ["./start.sh"]
