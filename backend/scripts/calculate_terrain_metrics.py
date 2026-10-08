"""Calculate DEM-derived terrain metrics for the existing Builder AOIs."""

from __future__ import annotations

import json
import math
import warnings
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import geometry_mask, geometry_window
from rasterio.windows import Window
from rasterio.warp import transform_geom
from shapely.geometry import Point, shape
from sqlalchemy import create_engine, text

from app.config import settings


ROOT = Path(__file__).resolve().parents[2]
DEM_PATH = ROOT / "backend" / "data" / "dem" / "processed" / "Nashik_DEM_GLO30.tif"
SCHEMA_PATH = ROOT / "backend" / "data" / "builder" / "builder_terrain_schema.sql"
DEM_SOURCE = "Nashik_DEM_GLO30.tif"
FLAT_SLOPE_THRESHOLD_DEG = 5.0

UPSERT = text("""
    INSERT INTO builder_aoi_terrain (
        aoi_id, mean_elevation_m, min_elevation_m, max_elevation_m,
        mean_slope_deg, max_slope_deg, flat_land_percentage,
        terrain_roughness_m, dem_source, calculated_at
    ) VALUES (
        :aoi_id, :mean_elevation_m, :min_elevation_m, :max_elevation_m,
        :mean_slope_deg, :max_slope_deg, :flat_land_percentage,
        :terrain_roughness_m, :dem_source, NOW()
    )
    ON CONFLICT (aoi_id) DO UPDATE SET
        mean_elevation_m = EXCLUDED.mean_elevation_m,
        min_elevation_m = EXCLUDED.min_elevation_m,
        max_elevation_m = EXCLUDED.max_elevation_m,
        mean_slope_deg = EXCLUDED.mean_slope_deg,
        max_slope_deg = EXCLUDED.max_slope_deg,
        flat_land_percentage = EXCLUDED.flat_land_percentage,
        terrain_roughness_m = EXCLUDED.terrain_roughness_m,
        dem_source = EXCLUDED.dem_source,
        calculated_at = NOW()
""")


def make_engine():
    database_url = settings.database_url
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    return create_engine(database_url, pool_pre_ping=True)


def apply_schema(engine) -> None:
    sql = "\n".join(line for line in SCHEMA_PATH.read_text(encoding="utf-8").splitlines() if not line.lstrip().startswith("--"))
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


def finite_metrics(values: np.ndarray, slopes: np.ndarray, roughness: np.ndarray) -> dict:
    valid = np.isfinite(values) & np.isfinite(slopes) & np.isfinite(roughness)
    if not valid.any():
        raise ValueError("AOI contains no valid DEM pixels")
    elevations = values[valid]
    slope_values = slopes[valid]
    roughness_values = roughness[valid]
    metrics = {
        "mean_elevation_m": float(np.mean(elevations)),
        "min_elevation_m": float(np.min(elevations)),
        "max_elevation_m": float(np.max(elevations)),
        "mean_slope_deg": float(np.mean(slope_values)),
        "max_slope_deg": float(np.max(slope_values)),
        "flat_land_percentage": float(np.mean(slope_values <= FLAT_SLOPE_THRESHOLD_DEG) * 100.0),
        "terrain_roughness_m": float(np.mean(roughness_values)),
    }
    if not all(math.isfinite(v) for v in metrics.values()):
        raise ValueError("calculated metrics contain NaN or Inf")
    return metrics


def main() -> None:
    engine = make_engine()
    apply_schema(engine)

    with rasterio.open(DEM_PATH) as dem:
        data = dem.read(1).astype(np.float64)
        valid_dem = np.isfinite(data)
        if dem.nodata is not None:
            valid_dem &= data != dem.nodata
        data[~valid_dem] = np.nan

        # The DEM is in metres, so gradients use the raster's metre resolution.
        xres, yres = dem.res
        with np.errstate(invalid="ignore", divide="ignore"):
            dzdy, dzdx = np.gradient(data, yres, xres)
            slope = np.degrees(np.arctan(np.sqrt(dzdx * dzdx + dzdy * dzdy)))

        # 3x3 local elevation range. The padded sliding window is a view, so
        # only the resulting min/max arrays are materialised.
        padded = np.pad(data, 1, mode="constant", constant_values=np.nan)
        windows = np.lib.stride_tricks.sliding_window_view(padded, (3, 3))
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            local_min = np.nanmin(windows, axis=(-2, -1))
            local_max = np.nanmax(windows, axis=(-2, -1))
        roughness = local_max - local_min

        with engine.connect() as conn:
            aois = conn.execute(text("""
                SELECT id, lat, lng, ST_AsGeoJSON(geometry) AS geometry
                FROM builder_aois
                ORDER BY id
            """)).fetchall()

        succeeded = 0
        failures: list[tuple[str, str]] = []
        print(f"Processing {len(aois)} Builder AOIs from {DEM_PATH}")
        print(f"FLAT_SLOPE_THRESHOLD_DEG={FLAT_SLOPE_THRESHOLD_DEG}")

        for aoi in aois:
            try:
                used_centroid_fallback = not aoi.geometry
                source_geometry = json.loads(aoi.geometry) if aoi.geometry else Point(float(aoi.lng), float(aoi.lat)).__geo_interface__
                dem_geometry = transform_geom("EPSG:4326", dem.crs, source_geometry)
                window = geometry_window(dem, [dem_geometry], boundless=False)
                row_start = max(0, int(window.row_off))
                col_start = max(0, int(window.col_off))
                row_stop = min(dem.height, row_start + int(window.height))
                col_stop = min(dem.width, col_start + int(window.width))
                local_window = Window(col_start, row_start, col_stop - col_start, row_stop - row_start)
                local_transform = dem.window_transform(local_window)
                local_shape = (row_stop - row_start, col_stop - col_start)
                inside = geometry_mask(
                    [dem_geometry],
                    out_shape=local_shape,
                    transform=local_transform,
                    invert=True,
                )
                values = data[row_start:row_stop, col_start:col_stop][inside]
                slopes = slope[row_start:row_stop, col_start:col_stop][inside]
                local_roughness = roughness[row_start:row_stop, col_start:col_stop][inside]
                metrics = finite_metrics(values, slopes, local_roughness)
                with engine.begin() as conn:
                    conn.execute(UPSERT, {"aoi_id": aoi.id, **metrics, "dem_source": DEM_SOURCE})
                succeeded += 1
                fallback_note = " [centroid fallback]" if used_centroid_fallback else ""
                print(
                    f"[OK] {aoi.id}{fallback_note}: "
                    f"elev={metrics['mean_elevation_m']:.2f} m, "
                    f"slope={metrics['mean_slope_deg']:.2f} deg, "
                    f"flat={metrics['flat_land_percentage']:.2f}%, "
                    f"roughness={metrics['terrain_roughness_m']:.2f} m"
                )
            except Exception as exc:
                failures.append((aoi.id, str(exc)))
                print(f"[FAIL] {aoi.id}: {exc}")

    print(f"Summary: {succeeded}/{len(aois)} AOIs succeeded; {len(failures)} failed")
    if failures:
        print("Failures:")
        for aoi_id, message in failures:
            print(f"  - {aoi_id}: {message}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
