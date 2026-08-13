# ============================================
# Frontend Dockerfile — Next.js 16 + React 19
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose Next.js default port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application in development mode for live reload
CMD ["npm", "run", "dev"]
