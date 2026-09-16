"""
Project schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProjectBase(BaseModel):
    """Base project schema."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_year: Optional[int] = Field(None, ge=2000, le=2100)
    end_year: Optional[int] = Field(None, ge=2000, le=2100)


class ProjectCreate(ProjectBase):
    """Schema for project creation."""
    pass


class ProjectUpdate(BaseModel):
    """Schema for project update."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_year: Optional[int] = Field(None, ge=2000, le=2100)
    end_year: Optional[int] = Field(None, ge=2000, le=2100)


class ProjectInDB(ProjectBase):
    """Project schema with database fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    status: str
    owner_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None


class ProjectResponse(ProjectInDB):
    """Project response schema."""
    pass


class ProjectListResponse(BaseModel):
    """Project list response."""
    total: int
    projects: list[ProjectResponse]


class ProjectStatistics(BaseModel):
    """Project statistics."""
    total_buildings: int
    new_buildings: int
    removed_buildings: int
    expanded_buildings: int
    total_violations: int
    violations_by_severity: dict[str, int]
    total_area_sqm: float
    years_analyzed: list[int]
