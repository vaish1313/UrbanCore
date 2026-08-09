from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel

class AOIListResponse(BaseModel):
    id: UUID
    aoi_id_code: str
    name: str
    category: str
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    latest_change_pct: Optional[float] = None
    
    model_config = {"from_attributes": True}

class AOIDetailResponse(AOIListResponse):
    years_available: List[int]

class ClassificationResponse(BaseModel):
    aoi_id: str
    year: int
    mask_url: Optional[str] = None
    built_up_pct: Optional[float] = None
    status: str

class ChangeResponse(BaseModel):
    aoi_id: str
    year_before: int
    year_after: int
    change_mask_url: Optional[str] = None
    change_pct: Optional[float] = None
    new_construction_area_sqm: Optional[float] = None
    status: str

class HotspotItem(BaseModel):
    aoi_id: str
    name: str
    change_pct: Optional[float] = None
