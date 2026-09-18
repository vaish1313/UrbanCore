from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.complaint import ComplaintStatus

class ComplaintBase(BaseModel):
    bbox_key: str
    area_name: str
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    description: str
    satellite_evidence_year: int
    construction_type: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdateStatus(BaseModel):
    status: ComplaintStatus
    notes: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: UUID
    submitted_by_id: Optional[int] = None
    status: ComplaintStatus
    municipal_notes: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
