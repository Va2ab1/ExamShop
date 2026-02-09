# Multi-stage build for ExamShop

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend setup
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production

# Stage 3: Final image
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY backend/ ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy frontend build to backend public folder
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

# Expose port
EXPOSE 3000

# Set working directory to backend
WORKDIR /app/backend

# Start server
CMD ["node", "server.js"]
