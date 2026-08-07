"""
UrbanCore Shared Package

Provides shared Pydantic schemas, domain events, exceptions, and utilities
that are used across all UrbanCore microservices (AI, GIS, Intelligence).

This package acts as the interface contract between services.
Services MUST NOT import from each other — only from this shared package.
"""

from urbancore_shared.schemas import (
    AnalysisJobSchema,
    FootprintSchema,
    ChangeRecordSchema,
    ZoneSchema,
    ComplianceViolationSchema,
    TerrainProfileSchema,
    ReportSchema,
    PagedResponse,
)
from urbancore_shared.events import DomainEvent, EventType
from urbancore_shared.exceptions import (
    UrbanCoreError,
    ValidationError,
    NotFoundError,
    InferenceError,
    StorageError,
    ComplianceCheckError,
)

__version__ = "0.1.0"
__all__ = [
    "AnalysisJobSchema",
    "FootprintSchema",
    "ChangeRecordSchema",
    "ZoneSchema",
    "ComplianceViolationSchema",
    "TerrainProfileSchema",
    "ReportSchema",
    "PagedResponse",
    "DomainEvent",
    "EventType",
    "UrbanCoreError",
    "ValidationError",
    "NotFoundError",
    "InferenceError",
    "StorageError",
    "ComplianceCheckError",
]
