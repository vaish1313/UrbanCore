"""Violation detection endpoints."""
from fastapi import APIRouter
router = APIRouter()

# Full implementation would include:
# - POST /check - Check violations for project
# - GET /{project_id} - List violations
# - GET /building/{building_id} - Get violations for building
# - PUT /{violation_id}/confirm - Confirm violation
# - PUT /{violation_id}/resolve - Mark violation as resolved
