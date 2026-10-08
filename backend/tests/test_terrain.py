"""Tests for Builder terrain metric storage and retrieval."""

from datetime import datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy import text

from app.builder_service import engine
from app.builder_router import router


terrain_test_app = FastAPI()
terrain_test_app.include_router(router, prefix="/api/v1/builder")
client = TestClient(terrain_test_app)

SAMPLE_TERRAIN = {
    "aoi_id": "test-aoi-alpha",
    "mean_elevation_m": 600.0,
    "min_elevation_m": 590.0,
    "max_elevation_m": 610.0,
    "mean_slope_deg": 4.0,
    "max_slope_deg": 8.0,
    "flat_land_percentage": 85.0,
    "terrain_roughness_m": 3.5,
    "dem_source": "Nashik_DEM_GLO30.tif",
    "calculated_at": datetime.now(timezone.utc).isoformat(),
}


def test_terrain_api_response_structure():
    with patch("app.builder_router.get_builder_aoi_terrain", return_value=SAMPLE_TERRAIN):
        response = client.get("/api/v1/builder/aois/test-aoi-alpha/terrain")
    assert response.status_code == 200
    assert set(SAMPLE_TERRAIN) == set(response.json())


def test_terrain_api_missing_aoi_returns_404():
    with patch("app.builder_router.get_builder_aoi_terrain", return_value=None), \
         patch("app.builder_router.get_builder_aoi_by_id", return_value=None):
        response = client.get("/api/v1/builder/aois/does-not-exist/terrain")
    assert response.status_code == 404


def test_terrain_metric_ranges():
    assert SAMPLE_TERRAIN["min_elevation_m"] <= SAMPLE_TERRAIN["mean_elevation_m"] <= SAMPLE_TERRAIN["max_elevation_m"]
    assert 0 <= SAMPLE_TERRAIN["mean_slope_deg"] <= SAMPLE_TERRAIN["max_slope_deg"]
    assert 0 <= SAMPLE_TERRAIN["flat_land_percentage"] <= 100
    assert SAMPLE_TERRAIN["terrain_roughness_m"] >= 0


def test_terrain_aoi_id_is_unique_and_upsert_is_idempotent():
    schema = "\n".join(
        line for line in open("data/builder/builder_terrain_schema.sql", encoding="utf-8")
        if not line.lstrip().startswith("--")
    )
    statements = [statement.strip() for statement in schema.split(";") if statement.strip()]
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
        aoi_id = conn.execute(text("SELECT id FROM builder_aois ORDER BY id LIMIT 1")).scalar()
        assert aoi_id is not None
        existing = conn.execute(
            text("""
                SELECT aoi_id, mean_elevation_m, min_elevation_m, max_elevation_m,
                       mean_slope_deg, max_slope_deg, flat_land_percentage,
                       terrain_roughness_m, dem_source
                FROM builder_aoi_terrain WHERE aoi_id = :aoi_id
            """),
            {"aoi_id": aoi_id},
        ).mappings().one()
        params = dict(existing)
        upsert = text("""
            INSERT INTO builder_aoi_terrain
                (aoi_id, mean_elevation_m, min_elevation_m, max_elevation_m,
                 mean_slope_deg, max_slope_deg, flat_land_percentage,
                 terrain_roughness_m, dem_source)
            VALUES (:aoi_id, :mean_elevation_m, :min_elevation_m, :max_elevation_m,
                    :mean_slope_deg, :max_slope_deg, :flat_land_percentage,
                    :terrain_roughness_m, :dem_source)
            ON CONFLICT (aoi_id) DO NOTHING
        """)
        conn.execute(upsert, params)
        conn.execute(upsert, params)
        count = conn.execute(text("SELECT COUNT(*) FROM builder_aoi_terrain WHERE aoi_id = :aoi_id"), {"aoi_id": aoi_id}).scalar()
        assert count == 1
