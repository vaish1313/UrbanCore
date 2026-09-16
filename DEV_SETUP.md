# Development Setup (Without Docker)

Since Docker is not installed on your system, you can run the project components individually for development.

## Prerequisites Installed ✅
- Python 3.12.8
- Node.js 20.18.0

## Required Services (Need to Install)

### 1. PostgreSQL with PostGIS
Download and install PostgreSQL from: https://www.postgresql.org/download/windows/
- Include PostGIS extension during installation
- Default port: 5432

### 2. Redis
Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
- Or use Memurai (Redis alternative): https://www.memurai.com/

## Quick Start (Development Mode)

### Option 1: Run Frontend Only (Recommended for Now)

The frontend can connect to a mock API or run in demo mode.

```powershell
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

### Option 2: Run Backend (Requires PostgreSQL + Redis)

1. **Install Python dependencies:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. **Configure environment:**
```powershell
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run migrations:**
```powershell
# After PostgreSQL is set up
alembic upgrade head
```

4. **Run backend:**
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

## Recommended: Install Docker Desktop

For the complete experience, install Docker Desktop for Windows:
https://www.docker.com/products/docker-desktop/

After installation:
```powershell
docker-compose up -d
```

This will start all services automatically!

## Current Status

✅ Python installed
✅ Node.js installed  
❌ Docker not installed
❌ PostgreSQL not installed
❌ Redis not installed

## Next Steps

1. **For quick demo**: Run frontend only
2. **For full development**: Install PostgreSQL, Redis, and run both frontend + backend
3. **For production-like environment**: Install Docker Desktop and use docker-compose
