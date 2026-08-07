"""
Repository Interfaces (Ports) — AI Service Domain

These abstract base classes define WHAT the domain needs from persistence,
without specifying HOW it is stored. Infrastructure adapters implement these.

This is the Port side of Ports & Adapters (Hexagonal Architecture).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities import AnalysisJob, ChangeRecord, Footprint, ImageryScene


class IAnalysisJobRepository(ABC):
    """Port for persisting and retrieving analysis jobs."""

    @abstractmethod
    async def get_by_id(self, job_id: UUID) -> AnalysisJob | None: ...

    @abstractmethod
    async def save(self, job: AnalysisJob) -> AnalysisJob: ...

    @abstractmethod
    async def update_status(
        self,
        job_id: UUID,
        status: str,
        progress: int | None = None,
        error_message: str | None = None,
    ) -> None: ...


class IFootprintRepository(ABC):
    """Port for persisting and retrieving building footprints."""

    @abstractmethod
    async def save_batch(self, footprints: list[Footprint]) -> list[Footprint]: ...

    @abstractmethod
    async def get_by_job_id(self, job_id: UUID, epoch: str | None = None) -> list[Footprint]: ...

    @abstractmethod
    async def update(self, footprint: Footprint) -> Footprint: ...


class IChangeRecordRepository(ABC):
    """Port for persisting and retrieving change detection records."""

    @abstractmethod
    async def save_batch(self, records: list[ChangeRecord]) -> list[ChangeRecord]: ...

    @abstractmethod
    async def get_by_job_id(self, job_id: UUID) -> list[ChangeRecord]: ...


class IImageryRepository(ABC):
    """Port for persisting imagery scene metadata."""

    @abstractmethod
    async def save(self, scene: ImageryScene) -> ImageryScene: ...

    @abstractmethod
    async def get_by_job_epoch(self, job_id: UUID, epoch: str) -> ImageryScene | None: ...
