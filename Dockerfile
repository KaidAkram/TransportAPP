FROM nikolaik/python-nodejs:python3.11-nodejs20-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt uvicorn aiofiles

COPY backend/ ./backend/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
ENV NEXT_PUBLIC_API_URL=/api/v1
RUN npm ci
RUN npm run build

WORKDIR /app

COPY entrypoint.py .

RUN chmod +x entrypoint.py

EXPOSE $PORT

CMD ["python", "entrypoint.py"]
