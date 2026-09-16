"""
API v1 router aggregation.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    projects,
    aois,
    satellite,
    detection,
    violations,
    terrain,
    reports,
    complaints,
    notifications,
    admin
)


api_router = APIRouter()

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# User management
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Project management
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])

# Area of Interest (AOI)
api_router.include_router(aois.router, prefix="/aois", tags=["AOIs"])

# Satellite imagery
api_router.include_router(satellite.router, prefix="/satellite", tags=["Satellite"])

# Building detection
api_router.include_router(detection.router, prefix="/detection", tags=["Detection"])

# Violation detection
api_router.include_router(violations.router, prefix="/violations", tags=["Violations"])

# Terrain analysis
api_router.include_router(terrain.router, prefix="/terrain", tags=["Terrain"])

# Reports
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])

# Complaints
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])

# Notifications
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Admin panel
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
