"""
UrbanCore Geometry Resolver.

Implements prioritized multi-tier geometry resolution for the Builder Dashboard:
1. Canonical database geometry (builder_aois.geometry).
2. Safely matched feature from nashik_30_aoi_boundaries_complete.geojson (preserving quality tier and boundary metadata).
3. Coordinate-based point analysis within Copernicus DEM coverage.
4. Explanatory unresolvable response when required analysis truly cannot be performed.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Any, Optional
from dataclasses import dataclass, asdict

from sqlalchemy import text
from .builder_service import engine

GEOJSON_PATH = Path(__file__).resolve().parents[1] / "data" / "builder" / "nashik_30_aoi_boundaries_complete.geojson"

DEM_MIN_LON = 73.2490
DEM_MAX_LON = 74.9349
DEM_MIN_LAT = 19.5757
DEM_MAX_LAT = 20.8734


@dataclass
class ResolvedGeometry:
    source: str                  # "canonical_database" | "geojson_fallback" | "coordinate_point" | "unresolvable"
    geometry: Optional[dict]     # GeoJSON geometry dict (Polygon, MultiPolygon, Point) or None
    quality_tier: int            # 1, 2, 3, or 4
    boundary_status: str         # "verified_database_polygon" | "census_village_exact" | "census_village_locality" | "census_unit_candidate" | "census_village_containing" | "aoi_box_only" | "point_screening" | "outside_dem_extent" | "unresolvable"
    is_real_boundary: bool       # True for verified DB polygons and Tier 1/2 real village units
    is_approximate: bool         # True for Tier 3/4 and Point screening
    is_database_geometry: bool   # True strictly for database geometries
    matched_id: Optional[str]    # ID of matched feature or AOI
    matched_name: Optional[str]  # Name of matched feature or AOI
    area_km2: Optional[float]    # Area in square kilometres
    note: str                    # Human-readable explanation / provenance
    lat: Optional[float] = None  # Centroid latitude
    lng: Optional[float] = None  # Centroid longitude

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def clean_key(s: Optional[str]) -> str:
    """Normalize string for fuzzy matching (lowercase alphanumeric only)."""
    if not s:
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())


class GeometryResolver:
    """Thread-safe geometry resolver with priority-based lookups."""

    def __init__(self, geojson_path: Path = GEOJSON_PATH):
        self.geojson_path = geojson_path
        self._load_geojson()

    def _load_geojson(self) -> None:
        if not self.geojson_path.exists():
            self.features_by_aoi_id = {}
            self.features_by_clean_name = {}
            self.all_features = []
            return

        with open(self.geojson_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.all_features = data.get("features", [])
        self.features_by_aoi_id = {}
        self.features_by_clean_name = {}

        for feat in self.all_features:
            props = feat.get("properties", {})
            gid = props.get("aoi_id")
            name = props.get("aoi_name")
            if gid:
                self.features_by_aoi_id[gid.upper()] = feat
                self.features_by_aoi_id[gid.lower()] = feat
            if name:
                ck = clean_key(name)
                self.features_by_clean_name[ck] = feat
                # Stripped suffixes for common colloquial names
                for suffix in ["midc", "road", "corridor", "town", "colony", "zone", "belt", "highway"]:
                    if ck.endswith(suffix):
                        base = ck[:-len(suffix)]
                        if base and base not in self.features_by_clean_name:
                            self.features_by_clean_name[base] = feat

        # Explicit canonical database slug to GeoJSON feature aoi_id
        self.canonical_slug_map = {
            "cbs": "AOI_01",
            "canada-corner": "AOI_02",
            "panchavati": "AOI_04",
            "gangapur-road": "AOI_06",
            "pathardi-phata": "AOI_08",
            "indira-nagar": "AOI_09",
            "cidco": "AOI_10",
            "satpur-midc": "AOI_13",
            "ambad-midc": "AOI_14",
            "dindori": "AOI_17",
            "mhasrul": "AOI_17",
            "ozar-airport": "AOI_18",
            "sinnar-outskirts": "AOI_20",
            "godavari-ramkund": "AOI_22",
            "trimbakeshwar": "AOI_25",
            "anjaneri": "AOI_26",
        }

    def resolve(
        self,
        aoi_id: Optional[str] = None,
        name: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        db_geometry: Optional[Union[dict, str]] = None,
        db_queried: bool = False,
    ) -> ResolvedGeometry:
        """Resolve geometry according to the 4-tier priority hierarchy."""
        db_record = None

        # Priority 1: Check canonical database geometry
        if db_geometry is not None:
            geom = json.loads(db_geometry) if isinstance(db_geometry, str) else db_geometry
            return ResolvedGeometry(
                source="canonical_database",
                geometry=geom,
                quality_tier=1,
                boundary_status="verified_database_polygon",
                is_real_boundary=True,
                is_approximate=False,
                is_database_geometry=True,
                matched_id=aoi_id,
                matched_name=name,
                area_km2=None,
                note="Verified canonical database boundary polygon.",
                lat=lat,
                lng=lng,
            )

        if aoi_id and not db_queried:
            query = text("""
                SELECT id, name, lat, lng,
                       ST_AsGeoJSON(geometry) AS geometry,
                       ST_Area(geometry::geography) / 1000000.0 AS area_km2
                FROM builder_aois
                WHERE id = :aoi_id
            """)
            try:
                with engine.connect() as conn:
                    db_record = conn.execute(query, {"aoi_id": aoi_id}).fetchone()
            except Exception:
                db_record = None

            if db_record and db_record.geometry:
                geom = json.loads(db_record.geometry)
                return ResolvedGeometry(
                    source="canonical_database",
                    geometry=geom,
                    quality_tier=1,
                    boundary_status="verified_database_polygon",
                    is_real_boundary=True,
                    is_approximate=False,
                    is_database_geometry=True,
                    matched_id=db_record.id,
                    matched_name=db_record.name,
                    area_km2=round(float(db_record.area_km2), 3) if db_record.area_km2 else None,
                    note="Verified canonical database boundary polygon.",
                    lat=db_record.lat,
                    lng=db_record.lng,
                )

        # Fallback coordinates from DB record if available
        if db_record and (lat is None or lng is None):
            lat = db_record.lat
            lng = db_record.lng

        # Priority 2: Safely matched feature from 30 AOI complete GeoJSON
        target_feat = None
        if aoi_id:
            if aoi_id in self.canonical_slug_map:
                target_feat = self.features_by_aoi_id.get(self.canonical_slug_map[aoi_id])
            if not target_feat:
                target_feat = self.features_by_aoi_id.get(aoi_id.upper())
            if not target_feat:
                target_feat = self.features_by_clean_name.get(clean_key(aoi_id))

        if not target_feat and name:
            target_feat = self.features_by_clean_name.get(clean_key(name))

        if target_feat:
            props = target_feat.get("properties", {})
            tier = int(props.get("data_quality_tier", 3))
            status = props.get("boundary_status", "provisional")
            is_real = bool(props.get("is_real_boundary", False))
            is_approx = bool(tier in (3, 4) or not is_real)
            note = props.get("note") or props.get("match_note") or f"Tier {tier} fallback geometry from complete GeoJSON dataset."

            return ResolvedGeometry(
                source="geojson_fallback",
                geometry=target_feat.get("geometry"),
                quality_tier=tier,
                boundary_status=status,
                is_real_boundary=is_real,
                is_approximate=is_approx,
                is_database_geometry=False,
                matched_id=props.get("aoi_id"),
                matched_name=props.get("aoi_name"),
                area_km2=round(float(props.get("area_km2", 0.0)), 3) if props.get("area_km2") else None,
                note=note,
                lat=lat if lat is not None else props.get("centroid_lat"),
                lng=lng if lng is not None else props.get("centroid_lon"),
            )

        # Priority 3: Coordinate-based point screening (within Copernicus DEM coverage)
        if lat is not None and lng is not None:
            if DEM_MIN_LON <= lng <= DEM_MAX_LON and DEM_MIN_LAT <= lat <= DEM_MAX_LAT:
                return ResolvedGeometry(
                    source="coordinate_point",
                    geometry={"type": "Point", "coordinates": [lng, lat]},
                    quality_tier=4,
                    boundary_status="point_screening",
                    is_real_boundary=False,
                    is_approximate=True,
                    is_database_geometry=False,
                    matched_id=aoi_id or "point",
                    matched_name=name or (db_record.name if db_record else "Point Location"),
                    area_km2=None,
                    note="Preliminary point-based DEM screening. Authoritative site assessment requires surveyed parcel boundary polygon.",
                    lat=lat,
                    lng=lng,
                )
            else:
                return ResolvedGeometry(
                    source="unresolvable",
                    geometry=None,
                    quality_tier=4,
                    boundary_status="outside_dem_extent",
                    is_real_boundary=False,
                    is_approximate=True,
                    is_database_geometry=False,
                    matched_id=aoi_id,
                    matched_name=name or (db_record.name if db_record else "Unknown Location"),
                    area_km2=None,
                    note=(
                        f"Location coordinates ({lat:.4f}°N, {lng:.4f}°E) are outside the surveyed "
                        f"Nashik Copernicus DEM coverage (Lon {DEM_MIN_LON}°–{DEM_MAX_LON}°, Lat {DEM_MIN_LAT}°–{DEM_MAX_LAT}°)."
                    ),
                    lat=lat,
                    lng=lng,
                )

        # Priority 4: Clear explanation when analysis truly cannot be performed
        return ResolvedGeometry(
            source="unresolvable",
            geometry=None,
            quality_tier=4,
            boundary_status="unresolvable",
            is_real_boundary=False,
            is_approximate=True,
            is_database_geometry=False,
            matched_id=aoi_id,
            matched_name=name or (db_record.name if db_record else "Unknown Location"),
            area_km2=None,
            note="No spatial polygon geometry or valid geographic coordinates available for this location.",
            lat=None,
            lng=None,
        )


# Global singleton instance
geometry_resolver = GeometryResolver()
