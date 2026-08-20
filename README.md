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
# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
