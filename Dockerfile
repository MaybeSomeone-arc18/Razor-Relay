# Stage 1: Build the Next.js frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the FastAPI backend
FROM python:3.11-slim
WORKDIR /app

# Refresh OS CA bundle to remove distrusted eMudhra/Comodo roots (Debian DLA-4845-1, eMudhra incident Oct 2026)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy frontend static export to static directory
COPY --from=frontend-builder /app/frontend/out ./static

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
