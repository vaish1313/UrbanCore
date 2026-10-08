"""
tests/test_builder.py
=====================
Test suite for Builder Dashboard AOI backend.

Covers:
  - AOI listing (GET /api/v1/builder/aois)
  - Search/filter (name, category, status)
  - GeoJSON geometry field
  - Empty result behaviour (unknown filter)
  - Database error handling
  - No duplicate AOIs (idempotent seed)
  - Single AOI retrieval (GET /api/v1/builder/aois/{id})
  - 404 for unknown AOI
  - Neighbourhood comparison (GET /api/v1/aois/compare/{id})
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.builder_service import engine, get_builder_aois, get_builder_aoi_by_id

client = TestClient(app)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

# Minimal AOI records for seeding the test database
SEED_AOIS = [
    {
        "id": "test-aoi-alpha",
        "name": "Test AOI Alpha",
        "location": "Nashik, Maharashtra",
        "village": "Alpha Village",
        "taluka": "Nashik",
        "district": "Nashik",
        "category": "residential",
        "status": "green",
        "lat": 20.00,
        "lng": 73.76,
        "map_x": 40,
        "map_y": 50,
        "geometry": json.dumps({"type": "Polygon", "coordinates": [[[73.75, 20.01], [73.77, 20.01], [73.77, 19.99], [73.75, 19.99], [73.75, 20.01]]]}),
        "suitability_score": 82,
        "accessibility_score": 90,
        "water_availability_score": 75,
        "environmental_risk_score": 70,
        "development_potential_score": 85,
        "elevation": 600.0,
        "slope": 5.0,
        "roughness": "Flat",
        "flat_land_percent": 85.0,
        "readiness": "HIGH",
        "flood_zone_overlap_pct": 5.0,
        "forest_boundary_overlap_pct": 0.0,
        "green_belt_overlap_pct": 3.0,
        "protected_area_overlap_pct": 0.0,
        "environmental_restriction": "Low",
        "estimated_construction_area_sqm": 10000.0,
        "summary": "Test Alpha AOI summary.",
    },
    {
        "id": "test-aoi-beta",
        "name": "Test AOI Beta",
        "location": "Nashik, Maharashtra",
        "village": "Beta Village",
        "taluka": "Sinnar",
        "district": "Nashik",
        "category": "industrial",
        "status": "red",
        "lat": 19.85,
        "lng": 74.00,
        "map_x": 85,
        "map_y": 90,
        "geometry": None,
        "suitability_score": 60,
        "accessibility_score": 70,
        "water_availability_score": 55,
        "environmental_risk_score": 65,
        "development_potential_score": 72,
        "elevation": 650.0,
        "slope": 3.0,
        "roughness": "Open Plateau",
        "flat_land_percent": 92.0,
        "readiness": "HIGH",
        "flood_zone_overlap_pct": 0.0,
        "forest_boundary_overlap_pct": 2.0,
        "green_belt_overlap_pct": 5.0,
        "protected_area_overlap_pct": 0.0,
        "environmental_restriction": "Low",
        "estimated_construction_area_sqm": 50000.0,
        "summary": "Test Beta AOI summary.",
    },
]

SEED_AOI_INSERT = """
    INSERT INTO builder_aois (
        id, name, location, village, taluka, district, category, status,
        lat, lng, map_x, map_y, geometry,
        suitability_score, accessibility_score, water_availability_score,
        environmental_risk_score, development_potential_score,
        elevation, slope, roughness, flat_land_percent, readiness,
        flood_zone_overlap_pct, forest_boundary_overlap_pct,
        green_belt_overlap_pct, protected_area_overlap_pct,
        environmental_restriction, estimated_construction_area_sqm, summary
    ) VALUES (
        :id, :name, :location, :village, :taluka, :district, :category, :status,
        :lat, :lng, :map_x, :map_y,
        CASE WHEN :geometry IS NOT NULL
             THEN ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326)
             ELSE NULL END,
        :suitability_score, :accessibility_score, :water_availability_score,
        :environmental_risk_score, :development_potential_score,
        :elevation, :slope, :roughness, :flat_land_percent, :readiness,
        :flood_zone_overlap_pct, :forest_boundary_overlap_pct,
        :green_belt_overlap_pct, :protected_area_overlap_pct,
        :environmental_restriction, :estimated_construction_area_sqm, :summary
    )
    ON CONFLICT (id) DO NOTHING
"""

SEED_HISTORY = [
    {"aoi_id": "test-aoi-alpha", "year": 2021, "buildings_count": 100, "built_up_change_pct": 0.0},
    {"aoi_id": "test-aoi-alpha", "year": 2025, "buildings_count": 140, "built_up_change_pct": 40.0},
    {"aoi_id": "test-aoi-beta",  "year": 2021, "buildings_count": 50,  "built_up_change_pct": 0.0},
    {"aoi_id": "test-aoi-beta",  "year": 2025, "buildings_count": 100, "built_up_change_pct": 100.0},
]


@pytest.fixture(autouse=True)
def clean_and_seed_db():
    """Remove test rows before each test, seed minimal data, clean up after."""
    test_ids = [a["id"] for a in SEED_AOIS]

    with engine.begin() as conn:
        # Clean
        conn.execute(
            text("DELETE FROM builder_aoi_construction_history WHERE aoi_id = ANY(:ids)"),
            {"ids": test_ids},
        )
        conn.execute(
            text("DELETE FROM builder_aois WHERE id = ANY(:ids)"),
            {"ids": test_ids},
        )
        # Seed AOIs
        for aoi in SEED_AOIS:
            conn.execute(text(SEED_AOI_INSERT), aoi)
        # Seed history
        for h in SEED_HISTORY:
            conn.execute(
                text("""
                    INSERT INTO builder_aoi_construction_history
                        (aoi_id, year, buildings_count, built_up_change_pct)
                    VALUES (:aoi_id, :year, :buildings_count, :built_up_change_pct)
                    ON CONFLICT (aoi_id, year) DO NOTHING
                """),
                h,
            )

    yield

    with engine.begin() as conn:
        conn.execute(
            text("DELETE FROM builder_aoi_construction_history WHERE aoi_id = ANY(:ids)"),
            {"ids": test_ids},
        )
        conn.execute(
            text("DELETE FROM builder_aois WHERE id = ANY(:ids)"),
            {"ids": test_ids},
        )


# ---------------------------------------------------------------------------
# Tests: GET /api/v1/builder/aois
# ---------------------------------------------------------------------------

def test_list_aois_returns_results():
    """Endpoint returns at least the 2 seeded test AOIs."""
    response = client.get("/api/v1/builder/aois")
    assert response.status_code == 200
    data = response.json()
    assert "aois" in data
    assert "count" in data
    assert data["count"] >= 2

    ids = {a["id"] for a in data["aois"]}
    assert "test-aoi-alpha" in ids
    assert "test-aoi-beta" in ids


def test_list_aois_response_structure():
    """Each AOI has the fields expected by the frontend AOI type."""
    response = client.get("/api/v1/builder/aois")
    assert response.status_code == 200
    aois = response.json()["aois"]

    for aoi in aois:
        assert "id" in aoi
        assert "name" in aoi
        assert "category" in aoi
        assert "status" in aoi
        assert "coords" in aoi
        assert "lat" in aoi["coords"]
        assert "lng" in aoi["coords"]
        assert "suitabilityScore" in aoi
        assert "terrain" in aoi
        assert "elevation" in aoi["terrain"]
        assert "slope" in aoi["terrain"]
        assert "flatLandPercent" in aoi["terrain"]
        assert "readiness" in aoi["terrain"]
        assert "constraints" in aoi
        assert "floodZoneOverlapPercent" in aoi["constraints"]
        assert "forestBoundaryOverlapPercent" in aoi["constraints"]
        assert "environmentalRestriction" in aoi["constraints"]
        assert "constructionHistory" in aoi


def test_list_aois_geojson_geometry():
    """The AOI that has a Polygon geometry returns valid GeoJSON."""
    response = client.get("/api/v1/builder/aois")
    aois = {a["id"]: a for a in response.json()["aois"]}

    alpha = aois["test-aoi-alpha"]
    assert alpha["geometry"] is not None
    assert alpha["geometry"]["type"] == "Polygon"
    assert isinstance(alpha["geometry"]["coordinates"], list)

    # AOI without geometry returns None
    beta = aois["test-aoi-beta"]
    assert beta["geometry"] is None


def test_list_aois_construction_history_attached():
    """Construction history is present and correctly structured."""
    response = client.get("/api/v1/builder/aois")
    aois = {a["id"]: a for a in response.json()["aois"]}

    alpha = aois["test-aoi-alpha"]
    assert len(alpha["constructionHistory"]) == 2
    entry = alpha["constructionHistory"][0]
    assert "year" in entry
    assert "buildingsCount" in entry
    assert "builtUpChangePercent" in entry


def test_search_filter_by_name():
    """Search=alpha returns only matching AOI."""
    response = client.get("/api/v1/builder/aois?search=alpha")
    assert response.status_code == 200
    data = response.json()
    ids = [a["id"] for a in data["aois"]]
    assert "test-aoi-alpha" in ids
    # beta should NOT appear
    assert "test-aoi-beta" not in ids


def test_search_filter_by_village():
    """Search on village name works correctly."""
    response = client.get("/api/v1/builder/aois?search=Beta+Village")
    assert response.status_code == 200
    ids = [a["id"] for a in response.json()["aois"]]
    assert "test-aoi-beta" in ids
    assert "test-aoi-alpha" not in ids


def test_filter_by_category():
    """Category filter returns only matching AOIs."""
    response = client.get("/api/v1/builder/aois?category=industrial")
    assert response.status_code == 200
    aois = response.json()["aois"]
    ids = [a["id"] for a in aois]
    assert "test-aoi-beta" in ids
    assert "test-aoi-alpha" not in ids


def test_filter_by_status():
    """Status filter returns only matching AOIs."""
    response = client.get("/api/v1/builder/aois?status=green")
    assert response.status_code == 200
    ids = [a["id"] for a in response.json()["aois"]]
    assert "test-aoi-alpha" in ids
    assert "test-aoi-beta" not in ids


def test_empty_result_for_unknown_filter():
    """An unknown search value returns an empty list, not an error."""
    response = client.get("/api/v1/builder/aois?search=zzz_nonexistent_place_xyz")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    assert data["aois"] == []


def test_pagination_limit():
    """limit=1 returns exactly 1 AOI."""
    response = client.get("/api/v1/builder/aois?limit=1")
    assert response.status_code == 200
    data = response.json()
    assert len(data["aois"]) == 1
    assert data["count"] == 1


def test_no_duplicate_aois():
    """
    Seeding the same AOI twice does not create duplicate rows
    (ON CONFLICT DO UPDATE / DO NOTHING).
    """
    with engine.begin() as conn:
        for aoi in SEED_AOIS:
            conn.execute(text(SEED_AOI_INSERT), aoi)

    response = client.get("/api/v1/builder/aois?search=test-aoi-alpha")
    ids = [a["id"] for a in response.json()["aois"]]
    assert ids.count("test-aoi-alpha") == 1


# ---------------------------------------------------------------------------
# Tests: GET /api/v1/builder/aois/{aoi_id}
# ---------------------------------------------------------------------------

def test_get_aoi_by_id_found():
    """Fetching a known AOI by ID returns 200 with full data."""
    response = client.get("/api/v1/builder/aois/test-aoi-alpha")
    assert response.status_code == 200
    aoi = response.json()
    assert aoi["id"] == "test-aoi-alpha"
    assert aoi["name"] == "Test AOI Alpha"
    assert aoi["geometry"]["type"] == "Polygon"
    assert len(aoi["constructionHistory"]) == 2


def test_get_aoi_by_id_not_found():
    """Fetching an unknown AOI returns 404."""
    response = client.get("/api/v1/builder/aois/does-not-exist-ever")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Tests: GET /api/v1/aois/compare/{aoi_id}
# ---------------------------------------------------------------------------

def test_compare_aoi_returns_structure():
    """Compare endpoint returns selected_aoi, nearest_aois, observations."""
    response = client.get("/api/v1/aois/compare/test-aoi-alpha")
    assert response.status_code == 200
    data = response.json()
    assert "selected_aoi" in data
    assert "nearest_aois" in data
    assert "observations" in data
    assert data["selected_aoi"]["id"] == "test-aoi-alpha"
    assert data["selected_aoi"]["is_selected"] is True
    assert isinstance(data["observations"], list)
    assert len(data["observations"]) > 0


def test_compare_aoi_not_found():
    """Compare endpoint returns 404 for unknown AOI."""
    response = client.get("/api/v1/aois/compare/unknown-aoi-id")
    assert response.status_code == 404


def test_compare_neighbour_metrics():
    """Each neighbour item contains the comparison fields the frontend needs."""
    response = client.get("/api/v1/aois/compare/test-aoi-alpha")
    assert response.status_code == 200
    for item in [response.json()["selected_aoi"]] + response.json()["nearest_aois"]:
        assert "id" in item
        assert "name" in item
        assert "distance_km" in item
        assert "suitability_score" in item
        assert "flood_zone_percent" in item
        assert "construction_growth_percent" in item
        assert "avg_slope" in item


# ---------------------------------------------------------------------------
# Tests: Database error handling
# ---------------------------------------------------------------------------

def test_list_aois_db_error_returns_500():
    """If the database query raises, the API returns 500."""
    with patch("app.builder_service.engine") as mock_engine:
        mock_conn = MagicMock()
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)
        mock_conn.execute.side_effect = Exception("DB connection lost")
        mock_engine.connect.return_value = mock_conn

        response = client.get("/api/v1/builder/aois")
        assert response.status_code == 500


def test_get_aoi_by_id_db_error_returns_500():
    """If the database raises during single-AOI fetch, the API returns 500."""
    with patch("app.builder_service.engine") as mock_engine:
        mock_conn = MagicMock()
        mock_conn.__enter__ = MagicMock(return_value=mock_conn)
        mock_conn.__exit__ = MagicMock(return_value=False)
        mock_conn.execute.side_effect = Exception("Timeout")
        mock_engine.connect.return_value = mock_conn

        response = client.get("/api/v1/builder/aois/test-aoi-alpha")
        assert response.status_code == 500
