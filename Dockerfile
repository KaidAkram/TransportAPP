# 1. Final runtime image with both Node and Python
FROM nikolaik/python-nodejs:python3.11-nodejs20-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt uvicorn aiofiles

# Copy backend
COPY backend/ ./backend/

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
