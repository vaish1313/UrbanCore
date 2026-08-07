"""
Domain Events

Events are the mechanism by which services communicate state changes
without direct coupling. They are published to Redis pub/sub channels
and consumed by interested services.

Design: Events are immutable, carry their own timestamp, and include
the full relevant payload (not just an ID). This avoids "chatty"
event-driven architectures where consumers must make additional calls.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EventType(str, Enum):
    """All domain events published in the UrbanCore platform."""

    # ─── Job Lifecycle ────────────────────────────────────────
    JOB_CREATED = "job.created"
    JOB_STARTED = "job.started"
    JOB_PROGRESS = "job.progress"
    JOB_COMPLETED = "job.completed"
    JOB_FAILED = "job.failed"
    JOB_CANCELLED = "job.cancelled"

    # ─── AI Pipeline ─────────────────────────────────────────
    IMAGERY_FETCHED = "ai.imagery_fetched"
    IMAGERY_PREPROCESSED = "ai.imagery_preprocessed"
    FOOTPRINTS_EXTRACTED = "ai.footprints_extracted"
    SAM_REFINEMENT_COMPLETED = "ai.sam_refinement_completed"
    CHANGE_DETECTION_COMPLETED = "ai.change_detection_completed"

    # ─── GIS Pipeline ────────────────────────────────────────
    TERRAIN_ANALYSIS_COMPLETED = "gis.terrain_analysis_completed"
    COMPLIANCE_CHECK_COMPLETED = "gis.compliance_check_completed"
    ZONES_OVERLAID = "gis.zones_overlaid"

    # ─── Intelligence Pipeline ───────────────────────────────
    REPORT_GENERATION_STARTED = "intelligence.report_started"
    REPORT_GENERATION_COMPLETED = "intelligence.report_completed"


class DomainEvent(BaseModel):
    """
    Base domain event model.

    All events carry:
    - A unique event ID
    - The event type
    - The job ID that triggered this event
    - A timestamp (UTC)
    - The payload (event-specific data)
    """
    event_id: UUID = Field(default_factory=uuid4)
    event_type: EventType
    job_id: UUID
    user_id: UUID | None = None
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    payload: dict[str, Any] = Field(default_factory=dict)
    version: str = "1.0"

    def to_channel(self) -> str:
        """Returns the Redis pub/sub channel name for this event."""
        return f"urbancore:events:{self.job_id}"

    def to_user_channel(self) -> str | None:
        """Returns the user-specific channel (for WebSocket fan-out)."""
        if self.user_id:
            return f"urbancore:user:{self.user_id}:events"
        return None


# ─── Typed Event Factories ────────────────────────────────────

def job_progress_event(
    job_id: UUID,
    user_id: UUID,
    progress: int,
    message: str,
    stage: str,
) -> DomainEvent:
    """Factory for job progress events sent to the frontend via WebSocket."""
    return DomainEvent(
        event_type=EventType.JOB_PROGRESS,
        job_id=job_id,
        user_id=user_id,
        payload={
            "progress": progress,
            "message": message,
            "stage": stage,
        },
    )


def job_completed_event(
    job_id: UUID,
    user_id: UUID,
    footprint_count: int,
    violation_count: int,
    has_report: bool,
) -> DomainEvent:
    """Factory for job completion events."""
    return DomainEvent(
        event_type=EventType.JOB_COMPLETED,
        job_id=job_id,
        user_id=user_id,
        payload={
            "footprint_count": footprint_count,
            "violation_count": violation_count,
            "has_report": has_report,
        },
    )


def job_failed_event(
    job_id: UUID,
    user_id: UUID,
    error: str,
    stage: str,
) -> DomainEvent:
    """Factory for job failure events."""
    return DomainEvent(
        event_type=EventType.JOB_FAILED,
        job_id=job_id,
        user_id=user_id,
        payload={
            "error": error,
            "stage": stage,
        },
    )
