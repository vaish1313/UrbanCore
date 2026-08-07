"""
Use Case: Verify Zoning Compliance

Checks each detected building footprint against protected zones
and zoning regulations stored in PostGIS.

Algorithm:
For each footprint:
  1. Query PostGIS for all zones that ST_Intersects(footprint.geometry, zone.geometry)
  2. For each intersecting zone, compute overlap area
  3. Classify violation severity based on zone type and overlap %
  4. Create ComplianceViolation records

Severity classification:
- CRITICAL: Any overlap with PROTECTED/HERITAGE/FOREST/WATER_BODY zones
- HIGH: > 50% overlap with AGRICULTURAL zones
- MEDIUM: Any overlap with AGRICULTURAL zones (< 50%)
- LOW: Minor setback violations
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

logger = logging.getLogger(__name__)

CRITICAL_ZONE_TYPES = {"protected", "heritage", "forest", "water_body"}
AGRICULTURAL_ZONE_TYPE = "agricultural"


@dataclass
class VerifyComplianceInput:
    job_id: UUID


@dataclass
class ComplianceResult:
    footprint_id: UUID
    zone_id: UUID
    zone_type: str
    zone_name: str
    violation_type: str
    severity: str
    overlap_area_sqm: float
    description: str


@dataclass
class VerifyComplianceOutput:
    job_id: UUID
    violations: list[ComplianceResult]
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    compliant_footprint_count: int
    non_compliant_footprint_count: int


class VerifyZoningComplianceUseCase:
    """
    Performs spatial intersection queries to detect compliance violations.
    """

    def __init__(
        self,
        footprint_repo: "IFootprintSpatialRepository",
        zone_repo: "IZoneSpatialRepository",
        violation_repo: "IViolationRepository",
    ) -> None:
        self._footprint_repo = footprint_repo
        self._zone_repo = zone_repo
        self._violation_repo = violation_repo

    async def execute(self, input_: VerifyComplianceInput) -> VerifyComplianceOutput:
        logger.info("Starting compliance check", extra={"job_id": str(input_.job_id)})

        # Get all footprints for this job (latest epoch)
        footprints = await self._footprint_repo.get_latest_by_job(input_.job_id)

        all_violations: list[ComplianceResult] = []
        non_compliant_ids: set[UUID] = set()

        for footprint in footprints:
            # PostGIS spatial query: find all zones intersecting this footprint
            intersecting_zones = await self._zone_repo.find_intersecting(
                footprint.geometry
            )

            for zone, overlap_area_sqm in intersecting_zones:
                severity = self._classify_severity(
                    zone_type=zone.zone_type,
                    overlap_area_sqm=overlap_area_sqm,
                    footprint_area_sqm=footprint.area_sqm or 1.0,
                )

                violation = ComplianceResult(
                    footprint_id=footprint.id,
                    zone_id=zone.id,
                    zone_type=zone.zone_type,
                    zone_name=zone.name,
                    violation_type=self._violation_type(zone.zone_type),
                    severity=severity,
                    overlap_area_sqm=overlap_area_sqm,
                    description=self._describe_violation(zone, overlap_area_sqm, footprint.area_sqm or 0),
                )
                all_violations.append(violation)
                non_compliant_ids.add(footprint.id)

        # Persist violations
        await self._violation_repo.save_batch(input_.job_id, all_violations)

        return VerifyComplianceOutput(
            job_id=input_.job_id,
            violations=all_violations,
            critical_count=sum(1 for v in all_violations if v.severity == "critical"),
            high_count=sum(1 for v in all_violations if v.severity == "high"),
            medium_count=sum(1 for v in all_violations if v.severity == "medium"),
            low_count=sum(1 for v in all_violations if v.severity == "low"),
            compliant_footprint_count=len(footprints) - len(non_compliant_ids),
            non_compliant_footprint_count=len(non_compliant_ids),
        )

    def _classify_severity(
        self, zone_type: str, overlap_area_sqm: float, footprint_area_sqm: float
    ) -> str:
        overlap_pct = overlap_area_sqm / footprint_area_sqm if footprint_area_sqm > 0 else 1.0

        if zone_type in CRITICAL_ZONE_TYPES:
            return "critical"
        elif zone_type == AGRICULTURAL_ZONE_TYPE:
            return "high" if overlap_pct > 0.5 else "medium"
        else:
            return "low"

    def _violation_type(self, zone_type: str) -> str:
        mapping = {
            "protected": "CONSTRUCTION_IN_PROTECTED_ZONE",
            "heritage": "CONSTRUCTION_IN_HERITAGE_ZONE",
            "forest": "CONSTRUCTION_IN_FOREST_ZONE",
            "water_body": "CONSTRUCTION_IN_WATER_BODY",
            "agricultural": "AGRICULTURAL_LAND_ENCROACHMENT",
        }
        return mapping.get(zone_type, "ZONING_VIOLATION")

    def _describe_violation(self, zone: object, overlap_sqm: float, footprint_sqm: float) -> str:
        overlap_pct = (overlap_sqm / footprint_sqm * 100) if footprint_sqm > 0 else 100.0
        return (
            f"Building overlaps {overlap_pct:.1f}% into '{getattr(zone, 'name', '')}' "
            f"({getattr(zone, 'zone_type', '')} zone). Overlap area: {overlap_sqm:.1f} m²."
        )
