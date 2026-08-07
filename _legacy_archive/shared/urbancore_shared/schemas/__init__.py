"""
Shared Pydantic v2 Schemas

These schemas define the data contract between all UrbanCore services.
They are the ONLY way services communicate about domain entities.

Design principles:
- All schemas use UUID ids (never integers)
- All geometries are GeoJSON-compatible dicts (EPSG:4326 / WGS84)
- All timestamps are ISO 8601 UTC strings
- Enums are string-based for JSON serialization compatibility
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

# ─── Enums ───────────────────────────────────────────────────


class UserRole(str, Enum):
    """RBAC roles. Must match DB enum public.user_role."""
    CITIZEN = "citizen"
    OWNER = "owner"
    BUILDER = "builder"
    MUNICIPAL = "municipal"
    ADMIN = "admin"


class JobStatus(str, Enum):
    """Analysis job lifecycle states."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ChangeType(str, Enum):
    """Type of detected change between imagery epochs."""
    NEW_CONSTRUCTION = "new_construction"
    DEMOLISHED = "demolished"
    MODIFIED = "modified"
    NO_CHANGE = "no_change"


class ZoneType(str, Enum):
    """Land use / protected zone classification."""
    PROTECTED = "protected"
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    AGRICULTURAL = "agricultural"
    INDUSTRIAL = "industrial"
    MIXED_USE = "mixed_use"
    HERITAGE = "heritage"
    FOREST = "forest"
    WATER_BODY = "water_body"


class ViolationSeverity(str, Enum):
    """Compliance violation severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SuitabilityClass(str, Enum):
    """Land suitability classification."""
    UNSUITABLE = "unsuitable"
    MARGINAL = "marginal"
    SUITABLE = "suitable"
    HIGHLY_SUITABLE = "highly_suitable"


class ReportFormat(str, Enum):
    """Supported report output formats."""
    JSON = "json"
    PDF = "pdf"
    HTML = "html"


# ─── Base ────────────────────────────────────────────────────

class BaseSchema(BaseModel):
    """Base schema with shared configuration for all UrbanCore schemas."""
    model_config = ConfigDict(
        from_attributes=True,      # Allow ORM model conversion
        use_enum_values=True,       # Serialize enums as values
        populate_by_name=True,
    )


# ─── Geometry ────────────────────────────────────────────────

class GeoJSONPolygon(BaseModel):
    """GeoJSON Polygon geometry (WGS84 / EPSG:4326)."""
    type: str = Field(default="Polygon", pattern="^Polygon$")
    coordinates: list[list[list[float]]]


class GeoJSONPoint(BaseModel):
    """GeoJSON Point geometry (WGS84 / EPSG:4326)."""
    type: str = Field(default="Point", pattern="^Point$")
    coordinates: list[float] = Field(min_length=2, max_length=3)


class GeoJSONMultiPolygon(BaseModel):
    """GeoJSON MultiPolygon geometry (WGS84 / EPSG:4326)."""
    type: str = Field(default="MultiPolygon", pattern="^MultiPolygon$")
    coordinates: list[list[list[list[float]]]]


# ─── Analysis Schemas ────────────────────────────────────────

class AnalysisJobSchema(BaseSchema):
    """Schema for an analysis job entity."""
    id: UUID
    user_id: UUID
    project_id: UUID | None = None
    name: str
    description: str | None = None
    aoi: GeoJSONPolygon
    epochs: list[str]
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    error_message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class CreateAnalysisJobSchema(BaseSchema):
    """Schema for creating a new analysis job."""
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    aoi: GeoJSONPolygon
    epochs: list[str] = Field(min_length=1, max_length=5)
    metadata: dict[str, Any] = Field(default_factory=dict)


class FootprintSchema(BaseSchema):
    """Schema for a detected building footprint."""
    id: UUID
    job_id: UUID
    geometry: GeoJSONPolygon
    confidence: float = Field(ge=0.0, le=1.0)
    source_epoch: str
    area_sqm: float | None = None
    perimeter_m: float | None = None
    model_version: str
    refined_by_sam: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ChangeRecordSchema(BaseSchema):
    """Schema for a detected change between epochs."""
    id: UUID
    job_id: UUID
    footprint_before_id: UUID | None = None
    footprint_after_id: UUID | None = None
    change_type: ChangeType
    location: GeoJSONPoint | None = None
    delta_area_sqm: float | None = None
    epoch_before: str | None = None
    epoch_after: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# ─── Compliance Schemas ──────────────────────────────────────

class ZoneSchema(BaseSchema):
    """Schema for a land use / protected zone."""
    id: UUID
    name: str
    zone_type: ZoneType
    geometry: GeoJSONMultiPolygon
    source_dataset: str
    jurisdiction: str | None = None
    effective_date: str | None = None
    expiry_date: str | None = None
    restrictions: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class ComplianceViolationSchema(BaseSchema):
    """Schema for a detected zoning compliance violation."""
    id: UUID
    job_id: UUID
    footprint_id: UUID
    zone_id: UUID
    violation_type: str
    severity: ViolationSeverity
    overlap_area_sqm: float | None = None
    description: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# ─── Terrain Schemas ─────────────────────────────────────────

class TerrainProfileSchema(BaseSchema):
    """Schema for DEM-derived terrain analysis results."""
    id: UUID
    job_id: UUID
    aoi: GeoJSONPolygon
    dem_source: str = "SRTM-30m"
    # Elevation (metres)
    elev_min_m: float | None = None
    elev_max_m: float | None = None
    elev_mean_m: float | None = None
    elev_std_m: float | None = None
    # Slope (degrees)
    slope_min_deg: float | None = None
    slope_max_deg: float | None = None
    slope_mean_deg: float | None = None
    slope_std_deg: float | None = None
    # Roughness (terrain ruggedness index)
    roughness_mean: float | None = None
    roughness_max: float | None = None
    # Derived suitability
    suitability_score: float | None = Field(default=None, ge=0.0, le=1.0)
    suitability_class: SuitabilityClass | None = None
    # Raster asset URLs
    slope_raster_url: str | None = None
    hillshade_raster_url: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# ─── Intelligence Schemas ────────────────────────────────────

class ReportSectionSchema(BaseSchema):
    """A single section within a generated report."""
    section_id: str
    title: str
    content: str
    data: dict[str, Any] = Field(default_factory=dict)
    order: int


class ReportSchema(BaseSchema):
    """Schema for a generated analysis report."""
    id: UUID
    job_id: UUID
    user_id: UUID
    user_role: UserRole
    format: ReportFormat
    sections: list[ReportSectionSchema]
    file_url: str | None = None
    token_cost: int | None = None
    model_used: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime


class PolicyDocumentSchema(BaseSchema):
    """Schema for an ingested urban policy document."""
    id: UUID
    title: str
    jurisdiction: str
    document_type: str
    source_url: str | None = None
    effective_date: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


# ─── Pagination ──────────────────────────────────────────────

T = TypeVar("T")


class PagedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    items: list[T]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_pages: int

    @classmethod
    def create(
        cls,
        items: list[T],
        total: int,
        page: int,
        page_size: int,
    ) -> "PagedResponse[T]":
        import math
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if page_size > 0 else 0,
        )
