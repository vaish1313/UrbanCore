"""
Database base configuration.
Import all models here for Alembic auto-generation.
"""
from app.db.base_class import Base

# Import all models to register them with Base
from app.models.user import User
from app.models.project import Project
from app.models.aoi import AOI
from app.models.image import SatelliteImage
from app.models.prediction import Prediction
from app.models.building import Building, BuildingChange
from app.models.violation import Violation, ViolationType
from app.models.terrain import TerrainAnalysis
from app.models.report import Report
from app.models.complaint import Complaint
from app.models.notification import Notification
from app.models.log import SystemLog, JobLog
from app.models.area_cache import AreaCache, CacheStatus

__all__ = [
    "Base",
    "User",
    "Project",
    "AOI",
    "SatelliteImage",
    "Prediction",
    "Building",
    "BuildingChange",
    "Violation",
    "ViolationType",
    "TerrainAnalysis",
    "Report",
    "Complaint",
    "Notification",
    "SystemLog",
    "JobLog",
    "AreaCache",
    "CacheStatus",
]
