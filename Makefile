.PHONY: dev test lint format build-up down migrate

# -----------------
# Docker Operations
# -----------------
build-up:
	docker-compose up --build -d

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# -----------------
# Backend Operations
# -----------------
dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:
	cd backend && alembic upgrade head

makemigrations:
	cd backend && alembic revision --autogenerate -m "auto"

test:
	pytest tests/

# -----------------
# Frontend Operations
# -----------------
dev-frontend:
	cd frontend && npm run dev

# -----------------
# Utilities
# -----------------
lint:
	ruff check .
	cd frontend && npm run lint

format:
	ruff format .
