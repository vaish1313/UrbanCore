"""AOI management endpoints."""
from fastapi import APIRouter
router = APIRouter()

# Full implementation would include:
# - POST / - Create AOI (upload GeoJSON/Shapefile, draw polygon)
# - GET /{aoi_id} - Get AOI details
# - GET /project/{project_id} - List AOIs for project
# - DELETE /{aoi_id} - Delete AOI
