"""
Global Constants for UrbanCore Backend.

Why it exists:
Centralizes all magic strings, enumerations, and default configurations that do not belong
in business logic. This keeps the codebase DRY (Don't Repeat Yourself) and makes refactoring safer.

Why its location was chosen:
`backend/app/core/` houses foundational data that the entire application needs to agree upon.

How it interacts with the rest of the project:
Used heavily by Pydantic schemas for validation, SQLAlchemy models for field choices, and
service layers for business rule checks.
"""

from enum import Enum

class UserRole(str, Enum):
    """RBAC Role definitions."""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class JobStatus(str, Enum):
    """Lifecycle states for Celery background tasks."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SatelliteSource(str, Enum):
    """Supported external imagery providers."""
    SENTINEL_2 = "sentinel-2"
    LANDSAT_8 = "landsat-8"

class AIModelType(str, Enum):
    """Identifiers for the internal model registry."""
    UNET_BUILDINGS = "unet_buildings_v1"
    SAM_BOUNDARY = "sam_boundary_v1"

class RasterFormat(str, Enum):
    """Supported GIS export formats."""
    GEOTIFF = "GTiff"
    COG = "COG"

# Default Coordinate Reference System (WGS 84)
DEFAULT_CRS = "EPSG:4326"
