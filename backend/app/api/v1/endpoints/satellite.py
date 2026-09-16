"""Satellite imagery endpoints."""
from fastapi import APIRouter
router = APIRouter()

# Full implementation would include:
# - POST /download - Trigger satellite download task
# - GET /images/{project_id} - List satellite images
# - GET /status/{task_id} - Check download status
