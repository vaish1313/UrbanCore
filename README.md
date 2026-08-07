# UrbanCore

UrbanCore is a scalable, AI-powered geospatial decision support platform.

## Architecture

This repository uses a **Modular Monolith** pattern:
- **Backend:** FastAPI (Python 3.11+), Celery, SQLAlchemy
- **Frontend:** React + TypeScript + Vite
- **Database:** PostgreSQL + PostGIS
- **Cache / Broker:** Redis
- **AI/ML:** PyTorch, U-Net, Segment Anything
- **Geospatial:** GDAL, Rasterio, Shapely

## Quickstart

1. **Environment:** Copy `.env.example` to `.env` and fill in your secrets.
2. **Start Services:**
   ```bash
   make build-up
   ```
3. **Database Migrations:**
   ```bash
   make migrate
   ```

## Development

The backend code is unified under `pyproject.toml`.
- Run `make dev-backend` to start FastAPI on port 8000.
- Run `make dev-frontend` to start Vite on port 3000.
