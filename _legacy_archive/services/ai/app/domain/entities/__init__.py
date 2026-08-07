"""
Domain Entities — AI Service

Pure Python dataclasses representing the core domain concepts.
NO SQLAlchemy, NO Pydantic, NO FastAPI — just plain domain objects.

This is the inner layer of Clean Architecture.
Business rules live here, never in infrastructure adapters.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ChangeType(str, Enum):
    NEW_CONSTRUCTION = "new_construction"
    DEMOLISHED = "demolished"
    MODIFIED = "modified"
    NO_CHANGE = "no_change"


@dataclass
class AnalysisJob:
    """
    The central aggregate root for an analysis request.

    An AnalysisJob orchestrates:
    1. Imagery fetching for each epoch
    2. U-Net footprint extraction
    3. SAM boundary refinement
    4. Change detection between epochs
    """
    id: UUID
    user_id: UUID
    aoi: dict[str, Any]          # GeoJSON Polygon (WGS84)
    epochs: list[str]            # e.g. ['2022-Q1', '2024-Q1']
    status: JobStatus = JobStatus.PENDING
    progress: int = 0            # 0-100
    error_message: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def start(self) -> None:
        """Transition job to processing state."""
        if self.status != JobStatus.PENDING:
            raise ValueError(f"Cannot start job in status {self.status}")
        self.status = JobStatus.PROCESSING

    def update_progress(self, progress: int, message: str = "") -> None:
        """Update job progress (0-100)."""
        if not (0 <= progress <= 100):
            raise ValueError("Progress must be between 0 and 100")
        self.progress = progress
        if message:
            self.metadata["last_progress_message"] = message

    def complete(self) -> None:
        """Transition job to completed state."""
        self.status = JobStatus.COMPLETED
        self.progress = 100

    def fail(self, error: str) -> None:
        """Transition job to failed state."""
        self.status = JobStatus.FAILED
        self.error_message = error


@dataclass
class Footprint:
    """
    A detected building footprint from U-Net inference.

    Represents the output of the segmentation model for a single
    building polygon within an imagery epoch.
    """
    id: UUID = field(default_factory=uuid4)
    job_id: UUID = field(default=None)  # type: ignore
    geometry: dict[str, Any] = field(default_factory=dict)  # GeoJSON Polygon
    confidence: float = 0.0              # Model confidence [0, 1]
    source_epoch: str = ""
    model_version: str = ""
    refined_by_sam: bool = False
    area_sqm: float | None = None
    perimeter_m: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self) -> None:
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError(f"Confidence must be in [0, 1], got {self.confidence}")

    def mark_sam_refined(self, new_geometry: dict[str, Any]) -> None:
        """Update geometry after SAM boundary refinement."""
        self.geometry = new_geometry
        self.refined_by_sam = True


@dataclass
class ChangeRecord:
    """
    A detected change between two imagery epochs.

    Tracks construction events: new buildings appearing,
    existing buildings being demolished, or significant modifications.
    """
    id: UUID = field(default_factory=uuid4)
    job_id: UUID = field(default=None)  # type: ignore
    change_type: ChangeType = ChangeType.NO_CHANGE
    footprint_before_id: UUID | None = None
    footprint_after_id: UUID | None = None
    location: dict[str, Any] | None = None   # GeoJSON Point (centroid)
    delta_area_sqm: float | None = None       # Positive=growth, Negative=shrinkage
    epoch_before: str | None = None
    epoch_after: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def is_significant(self) -> bool:
        """
        A change is significant if it involves actual construction activity.
        Used to filter noise from the change detection pipeline.
        """
        return self.change_type in {ChangeType.NEW_CONSTRUCTION, ChangeType.DEMOLISHED}


@dataclass
class ImageryScene:
    """
    A downloaded and preprocessed satellite imagery scene.

    Represents a Sentinel-2 GeoTIFF scene for a specific epoch and AOI,
    stored in object storage after preprocessing.
    """
    id: UUID = field(default_factory=uuid4)
    job_id: UUID = field(default=None)  # type: ignore
    epoch: str = ""
    storage_key: str = ""               # MinIO object key
    bucket: str = ""
    bands: list[str] = field(default_factory=list)  # e.g. ['B02', 'B03', 'B04', 'B08']
    resolution_m: int = 10              # Spatial resolution in metres
    crs: str = "EPSG:4326"
    cloud_coverage_pct: float | None = None
    acquisition_date: datetime | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
