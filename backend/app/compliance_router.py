from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict
from .compliance_service import check_compliance
from .config import settings

router = APIRouter(prefix="/compliance", tags=["compliance"])

class ComplianceRequest(BaseModel):
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry (Polygon, MultiPolygon, etc.)")

@router.post("/check")
async def api_check_compliance(request: ComplianceRequest):
    """
    Check if a proposed construction geometry intersects with any restricted zones
    (Forests, Rivers, Lakes, Waterbodies, Highways).
    """
    result = check_compliance(request.geometry)
    return result
