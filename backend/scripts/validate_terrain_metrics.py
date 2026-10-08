"""Validate stored Builder AOI terrain metrics."""

from __future__ import annotations

import math

from sqlalchemy import create_engine, text

from app.config import settings


METRICS = [
    "mean_elevation_m",
    "min_elevation_m",
    "max_elevation_m",
    "mean_slope_deg",
    "max_slope_deg",
    "flat_land_percentage",
    "terrain_roughness_m",
]


def make_engine():
    database_url = settings.database_url
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    return create_engine(database_url, pool_pre_ping=True)


def main() -> None:
    engine = make_engine()
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT aoi_id, mean_elevation_m, min_elevation_m, max_elevation_m,
                   mean_slope_deg, max_slope_deg, flat_land_percentage,
                   terrain_roughness_m
            FROM builder_aoi_terrain
            ORDER BY aoi_id
        """)).fetchall()

    errors: list[str] = []
    if len(rows) != 30:
        errors.append(f"expected exactly 30 terrain records, found {len(rows)}")
    for row in rows:
        values = {name: getattr(row, name) for name in METRICS}
        if any(value is None or not math.isfinite(float(value)) for value in values.values()):
            errors.append(f"{row.aoi_id}: missing or non-finite metric")
            continue
        if not (row.min_elevation_m <= row.mean_elevation_m <= row.max_elevation_m):
            errors.append(f"{row.aoi_id}: elevation ordering invalid")
        if row.mean_slope_deg < 0 or row.max_slope_deg < row.mean_slope_deg:
            errors.append(f"{row.aoi_id}: slope range invalid")
        if not 0 <= row.flat_land_percentage <= 100:
            errors.append(f"{row.aoi_id}: flat-land percentage invalid")
        if row.terrain_roughness_m < 0:
            errors.append(f"{row.aoi_id}: roughness invalid")

    print(f"terrain_records: {len(rows)}")
    for name in METRICS:
        values = [float(getattr(row, name)) for row in rows if getattr(row, name) is not None]
        if values:
            print(f"{name}: min={min(values):.6f}, max={max(values):.6f}, mean={sum(values) / len(values):.6f}")
    if errors:
        print("VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print("VALIDATION PASSED: 30 AOIs, complete finite metrics, valid ranges")


if __name__ == "__main__":
    main()
