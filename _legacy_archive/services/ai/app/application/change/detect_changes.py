"""
Use Case: Detect Construction Changes Between Epochs

Compares footprints detected in two imagery epochs to identify:
- NEW_CONSTRUCTION: footprint exists in after but not before
- DEMOLISHED: footprint exists in before but not after
- MODIFIED: footprint exists in both but geometry changed significantly

Algorithm:
- For each "after" footprint, check IoU against all "before" footprints
- If max IoU > threshold → MODIFIED (if area delta is significant) else NO_CHANGE
- If no match found → NEW_CONSTRUCTION
- Unmatched "before" footprints → DEMOLISHED
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

import shapely
from shapely.geometry import shape

from app.domain.entities import ChangeRecord, ChangeType, Footprint
from app.domain.repositories import IChangeRecordRepository, IFootprintRepository

logger = logging.getLogger(__name__)

# A footprint is considered "matched" if IoU > this threshold
IOU_MATCH_THRESHOLD = 0.3

# A matched footprint is considered "modified" if area delta > this %
AREA_DELTA_THRESHOLD_PCT = 0.15


@dataclass
class DetectChangesInput:
    job_id: UUID
    epoch_before: str
    epoch_after: str


@dataclass
class DetectChangesOutput:
    changes: list[ChangeRecord]
    new_count: int
    demolished_count: int
    modified_count: int
    no_change_count: int


class DetectConstructionChangesUseCase:
    """
    Compares footprints between epochs to produce a ChangeRecord set.
    Pure business logic — no infrastructure dependencies.
    """

    def __init__(
        self,
        footprint_repo: IFootprintRepository,
        change_repo: IChangeRecordRepository,
    ) -> None:
        self._footprint_repo = footprint_repo
        self._change_repo = change_repo

    async def execute(self, input_: DetectChangesInput) -> DetectChangesOutput:
        logger.info(
            "Starting change detection",
            extra={
                "job_id": str(input_.job_id),
                "before": input_.epoch_before,
                "after": input_.epoch_after,
            },
        )

        before_footprints = await self._footprint_repo.get_by_job_id(
            input_.job_id, epoch=input_.epoch_before
        )
        after_footprints = await self._footprint_repo.get_by_job_id(
            input_.job_id, epoch=input_.epoch_after
        )

        changes = self._compute_changes(
            before_footprints,
            after_footprints,
            input_.job_id,
            input_.epoch_before,
            input_.epoch_after,
        )

        saved = await self._change_repo.save_batch(changes)

        new_count = sum(1 for c in saved if c.change_type == ChangeType.NEW_CONSTRUCTION)
        demolished_count = sum(1 for c in saved if c.change_type == ChangeType.DEMOLISHED)
        modified_count = sum(1 for c in saved if c.change_type == ChangeType.MODIFIED)
        no_change_count = sum(1 for c in saved if c.change_type == ChangeType.NO_CHANGE)

        logger.info(
            f"Change detection complete: +{new_count} new, -{demolished_count} demolished, "
            f"~{modified_count} modified",
            extra={"job_id": str(input_.job_id)},
        )

        return DetectChangesOutput(
            changes=saved,
            new_count=new_count,
            demolished_count=demolished_count,
            modified_count=modified_count,
            no_change_count=no_change_count,
        )

    def _compute_changes(
        self,
        before: list[Footprint],
        after: list[Footprint],
        job_id: UUID,
        epoch_before: str,
        epoch_after: str,
    ) -> list[ChangeRecord]:
        """IoU-based change detection algorithm."""
        before_shapes = {fp.id: shape(fp.geometry) for fp in before}
        after_shapes = {fp.id: shape(fp.geometry) for fp in after}

        matched_before_ids: set[UUID] = set()
        changes: list[ChangeRecord] = []

        for after_fp in after:
            after_geom = after_shapes[after_fp.id]
            best_iou = 0.0
            best_before_fp: Footprint | None = None

            for before_fp in before:
                before_geom = before_shapes[before_fp.id]
                try:
                    iou = self._compute_iou(after_geom, before_geom)
                except Exception:
                    continue

                if iou > best_iou:
                    best_iou = iou
                    best_before_fp = before_fp

            if best_iou >= IOU_MATCH_THRESHOLD and best_before_fp is not None:
                matched_before_ids.add(best_before_fp.id)
                # Determine if it's a significant modification
                area_delta = (after_fp.area_sqm or 0) - (best_before_fp.area_sqm or 0)
                area_delta_pct = (
                    abs(area_delta) / (best_before_fp.area_sqm or 1)
                )

                change_type = (
                    ChangeType.MODIFIED
                    if area_delta_pct > AREA_DELTA_THRESHOLD_PCT
                    else ChangeType.NO_CHANGE
                )

                changes.append(
                    ChangeRecord(
                        job_id=job_id,
                        change_type=change_type,
                        footprint_before_id=best_before_fp.id,
                        footprint_after_id=after_fp.id,
                        location=self._centroid_geojson(after_geom),
                        delta_area_sqm=area_delta,
                        epoch_before=epoch_before,
                        epoch_after=epoch_after,
                    )
                )
            else:
                # No matching "before" footprint — new construction
                changes.append(
                    ChangeRecord(
                        job_id=job_id,
                        change_type=ChangeType.NEW_CONSTRUCTION,
                        footprint_before_id=None,
                        footprint_after_id=after_fp.id,
                        location=self._centroid_geojson(after_geom),
                        delta_area_sqm=after_fp.area_sqm,
                        epoch_before=epoch_before,
                        epoch_after=epoch_after,
                    )
                )

        # Unmatched "before" footprints → demolished
        for before_fp in before:
            if before_fp.id not in matched_before_ids:
                before_geom = before_shapes[before_fp.id]
                changes.append(
                    ChangeRecord(
                        job_id=job_id,
                        change_type=ChangeType.DEMOLISHED,
                        footprint_before_id=before_fp.id,
                        footprint_after_id=None,
                        location=self._centroid_geojson(before_geom),
                        delta_area_sqm=-(before_fp.area_sqm or 0),
                        epoch_before=epoch_before,
                        epoch_after=epoch_after,
                    )
                )

        return changes

    @staticmethod
    def _compute_iou(geom_a: shapely.Geometry, geom_b: shapely.Geometry) -> float:
        """Compute Intersection over Union for two Shapely geometries."""
        intersection = geom_a.intersection(geom_b).area
        union = geom_a.union(geom_b).area
        if union == 0:
            return 0.0
        return intersection / union

    @staticmethod
    def _centroid_geojson(geom: shapely.Geometry) -> dict:
        """Return GeoJSON Point for the centroid of a geometry."""
        c = geom.centroid
        return {"type": "Point", "coordinates": [c.x, c.y]}
