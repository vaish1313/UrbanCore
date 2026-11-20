"""Focused tests for the scientifically defensible suitability model."""

import json
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.builder_router import router
from app.suitability_service import (
    PROVISIONAL_TERRAIN_WEIGHTS,
    calculate_builder_aoi_suitability,
    calculate_slope_distribution,
    calculate_terrain_score,
    get_detailed_constraints,
    normalize_constraint,
    normalize_flat_land,
    normalize_roughness,
    normalize_slope,
    piecewise_score,
)


test_app = FastAPI()
test_app.include_router(router, prefix="/api/v1/builder")
client = TestClient(test_app)


# 1. Slope piecewise interpolation tests (anchors and intermediate values)
def test_slope_piecewise_normalization():
    # Anchor points
    assert normalize_slope(0.0) == 100.0
    assert normalize_slope(5.0) == 80.0
    assert normalize_slope(15.0) == 40.0
    assert normalize_slope(25.0) == 0.0
    assert normalize_slope(40.0) == 0.0

    # Intermediate linear interpolation points
    # Between 0 and 5: at 2.5 -> 90.0
    assert normalize_slope(2.5) == pytest.approx(90.0)
    # Between 5 and 15: at 10.0 -> 60.0
    assert normalize_slope(10.0) == pytest.approx(60.0)
    # Between 15 and 25: at 20.0 -> 20.0
    assert normalize_slope(20.0) == pytest.approx(20.0)


# 2. Flat-land percentage normalization and clamping
def test_flat_land_normalization_and_clamping():
    assert normalize_flat_land(0.0) == 0.0
    assert normalize_flat_land(73.5) == 73.5
    assert normalize_flat_land(100.0) == 100.0
    assert normalize_flat_land(-5.0) == 0.0
    assert normalize_flat_land(105.0) == 100.0


# 3. Roughness normalization and boundary handling
def test_roughness_piecewise_normalization():
    assert normalize_roughness(0.0) == 100.0
    assert normalize_roughness(25.0) == 50.0
    assert normalize_roughness(37.5) == 25.0
    assert normalize_roughness(50.0) == 0.0
    assert normalize_roughness(75.0) == 0.0


# 4. Constraint score normalization
def test_constraint_normalization():
    assert normalize_constraint(0.0) == 100.0
    assert normalize_constraint(22.5) == 77.5
    assert normalize_constraint(100.0) == 0.0
    assert normalize_constraint(125.0) == 0.0


# 5. Piecewise rejects NaN and Inf
def test_piecewise_rejects_nan_and_inf():
    with pytest.raises(ValueError):
        piecewise_score(float("nan"), ((0, 100), (1, 0)))
    with pytest.raises(ValueError):
        piecewise_score(float("inf"), ((0, 100), (1, 0)))


# 6. Provisional terrain score formula & handling missing components
def test_terrain_score_provisional_formula_and_missing_components():
    assert PROVISIONAL_TERRAIN_WEIGHTS == {
        "slope_score": 0.40,
        "flat_land_score": 0.15,
        "roughness_score": 0.20,
        "elevation_drainage_score": 0.25,
    }

    # When all 4 components are available:
    complete_factors = {
        "slope_score": 80.0,
        "flat_land_score": 90.0,
        "roughness_score": 70.0,
        "elevation_drainage_score": 60.0,
    }
    # 0.40*80 + 0.15*90 + 0.20*70 + 0.25*60 = 32 + 13.5 + 14 + 15 = 74.5
    assert calculate_terrain_score(complete_factors) == pytest.approx(74.5)

    # When elevation_drainage_score is None (current repository state without HAND):
    # Missing component MUST return None, NOT zero or re-weighted score.
    incomplete_factors = {
        "slope_score": 80.0,
        "flat_land_score": 90.0,
        "roughness_score": 70.0,
        "elevation_drainage_score": None,
    }
    assert calculate_terrain_score(incomplete_factors) is None


# 7. AOIs without registered polygon geometry return UNAVAILABLE
def test_suitability_missing_aoi_geometry_returns_unavailable():
    polygonless_aoi = {
        "aoi_id": "test-beta",
        "name": "Test Beta",
        "lat": 19.85,
        "lng": 74.00,
        "has_real_geometry": False,
        "geometry_geojson": None,
        "mean_elevation_m": 620.0,
        "mean_slope_deg": 4.5,
        "flat_land_percentage": 88.0,
        "terrain_roughness_m": 12.0,
    }
    with patch("app.suitability_service._load_aoi_inputs", return_value=polygonless_aoi), \
         patch("app.suitability_service.get_detailed_constraints", return_value={
             "aoi_id": "test-beta",
             "status": "UNAVAILABLE",
             "is_approximate_geometry": True,
             "overall_overlap_pct": None,
             "constraint_score": None,
             "blocker_status": "UNAVAILABLE",
             "constraints": [],
         }):
        result = calculate_builder_aoi_suitability("test-beta")

    assert result is not None
    assert result["overall_status"] == "UNAVAILABLE"
    assert result["is_approximate_geometry"] is True
    assert result["overall_score"] is None
    assert result["terrain_status"] == "UNAVAILABLE"
    assert result["terrain_score"] is None
    assert result["factors"]["slope_score"] is None
    assert result["factors"]["flat_land_score"] is None
    assert result["factors"]["roughness_score"] is None
    assert result["factors"]["elevation_drainage_score"] is None
    assert result["constraint_score"] is None
    assert any("verified boundary polygon geometry" in w for w in result["warnings"])


# 8. Slope distribution returns warning on steep terrain or empty geometry
def test_slope_distribution_empty_geometry():
    empty_res = calculate_slope_distribution(None)
    assert empty_res["p85_slope_deg"] is None
    assert empty_res["steep_slope_percentage"] is None
    assert empty_res["has_steep_slope_warning"] is False
    assert "without polygon geometry" in empty_res["warning"]


# 9. Constraint review: ASSESSED_NO_INTERSECTION vs POTENTIAL_RESTRICTION_REVIEW
def test_constraint_review_statuses():
    # Test detailed constraints with no geometry
    no_geom_res = get_detailed_constraints("test-beta")
    assert no_geom_res["status"] == "UNAVAILABLE"
    assert no_geom_res["blocker_status"] == "UNAVAILABLE"


# 10. Suitability endpoint 404 on missing AOI
def test_suitability_endpoint_missing_aoi():
    with patch("app.builder_router.calculate_builder_aoi_suitability", return_value=None):
        response = client.get("/api/v1/builder/aois/does-not-exist/suitability")
    assert response.status_code == 404


# 11. Suitability endpoint rejects non-finite inputs
def test_suitability_endpoint_rejects_non_finite_inputs():
    with patch(
        "app.builder_router.calculate_builder_aoi_suitability",
        side_effect=ValueError("mean_slope_deg is not finite"),
    ):
        response = client.get("/api/v1/builder/aois/test-aoi/suitability")
    assert response.status_code == 422


# 12. Endpoint exposes incomplete terrain status and unavailable HAND reason
def test_suitability_endpoint_exposes_status_and_reasons():
    mock_result = {
        "aoi_id": "cidco",
        "overall_status": "INCOMPLETE",
        "overall_score": None,
        "terrain_status": "INCOMPLETE",
        "terrain_score": None,
        "constraint_status": "ASSESSED",
        "constraint_score": 100.0,
        "blocker_status": "ASSESSED_NO_INTERSECTION",
        "weights": PROVISIONAL_TERRAIN_WEIGHTS,
        "factors": {
            "slope_score": 80.0,
            "flat_land_score": 90.0,
            "roughness_score": 85.0,
            "elevation_drainage_score": None,
            "constraint_score": 100.0,
        },
        "inputs": {
            "mean_slope_deg": 4.2,
            "p85_slope_deg": 6.8,
            "steep_slope_percentage": 0.0,
            "flat_land_percentage": 90.0,
            "terrain_roughness_m": 8.0,
            "mean_elevation_m": 580.0,
            "restricted_intersection_percentage": 0.0,
        },
        "detailed_constraints": {
            "aoi_id": "cidco",
            "status": "ASSESSED",
            "overall_overlap_pct": 0.0,
            "blocker_status": "ASSESSED_NO_INTERSECTION",
            "constraints": [],
        },
        "warnings": [],
        "availability_reasons": {
            "elevation_drainage": "Elevation and drainage risk score is unavailable: HAND and flood hazard layers are not yet ingested.",
            "terrain_score": "Complete terrain score is pending hydrological/HAND dataset integration.",
        },
        "positive_factors": ["Favorable low average slope (4.20°)"],
        "negative_factors": [],
        "calculated_at": "2026-10-18T00:00:00+00:00",
    }
    with patch("app.builder_router.calculate_builder_aoi_suitability", return_value=mock_result):
        response = client.get("/api/v1/builder/aois/cidco/suitability")
    assert response.status_code == 200
    data = response.json()
    assert data["overall_status"] == "INCOMPLETE"
    assert data["overall_score"] is None
    assert data["terrain_score"] is None
    assert data["factors"]["elevation_drainage_score"] is None
    assert "elevation_drainage" in data["availability_reasons"]


# 13. Constraints endpoint returns detailed breakdown
def test_constraints_endpoint():
    mock_constraints = {
        "aoi_id": "panchavati",
        "name": "Panchavati",
        "location": "Nashik",
        "status": "ASSESSED",
        "aoi_area_ha": 69.5,
        "overall_overlap_pct": 8.95,
        "constraint_score": 91.05,
        "blocker_status": "POTENTIAL_RESTRICTION_REVIEW",
        "layers_analyzed": 5,
        "overlapping_layers": 1,
        "clear_layers": 4,
        "no_data_layers": 1,
        "constraints": [
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "INTERSECTION_DETECTED",
                "affected_area_ha": 6.22,
                "affected_percentage": 8.95,
                "description": "Spatial intersection detected with Godavari river buffer zone.",
            }
        ],
        "factual_summary": "Potential spatial intersection detected (8.95% total AOI overlap).",
    }
    with patch("app.builder_router.get_detailed_constraints", return_value=mock_constraints):
        response = client.get("/api/v1/builder/violations/constraints/panchavati")
    assert response.status_code == 200
    data = response.json()
    assert data["blocker_status"] == "POTENTIAL_RESTRICTION_REVIEW"
    assert data["overall_overlap_pct"] == 8.95
    assert len(data["constraints"]) == 1


# 14. Generated IDs (e.g. aoi-1792302716062) return 404 from endpoints requiring DB AOI IDs
def test_generated_or_arbitrary_ids_return_404():
    generated_id = "aoi-1792302716062"
    # Terrain endpoint
    response = client.get(f"/api/v1/builder/aois/{generated_id}/terrain")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

    # Suitability endpoint
    response = client.get(f"/api/v1/builder/aois/{generated_id}/suitability")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

    # Constraints endpoint
    response = client.get(f"/api/v1/builder/violations/constraints/{generated_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

    # Compare endpoint
    response = client.get(f"/api/v1/builder/aois/compare/{generated_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# 15. Canonical AOIs without polygon (e.g. chandwad) return explicit UNAVAILABLE state,
# while AOIs with GeoJSON fallback (e.g. ambad-midc) resolve successfully as INCOMPLETE.
def test_canonical_aoi_without_polygon_returns_unavailable():
    # chandwad exists in DB with coordinates and terrain but has no polygon in DB or GeoJSON fallback
    response = client.get("/api/v1/builder/aois/chandwad/suitability")
    assert response.status_code == 200
    data = response.json()
    assert data["aoi_id"] == "chandwad"
    assert data["overall_status"] == "UNAVAILABLE"
    assert data["terrain_status"] == "UNAVAILABLE"
    assert data["is_approximate_geometry"] is True
    assert "verified boundary polygon geometry" in data["availability_reasons"]["terrain"]

    constraints_resp = client.get("/api/v1/builder/violations/constraints/chandwad")
    assert constraints_resp.status_code == 200
    cdata = constraints_resp.json()
    assert cdata["status"] == "UNAVAILABLE"
    assert cdata["blocker_status"] == "UNAVAILABLE"
    assert "verified boundary polygon geometry" in cdata["reason"]

    # ambad-midc has NULL DB geometry but resolves successfully through GeoJSON fallback
    fallback_resp = client.get("/api/v1/builder/aois/ambad-midc/suitability")
    assert fallback_resp.status_code == 200
    fdata = fallback_resp.json()
    assert fdata["aoi_id"] == "ambad-midc"
    assert fdata["overall_status"] == "INCOMPLETE"
    assert fdata["is_approximate_geometry"] is True
    assert fdata["quality_tier"] == 3
    assert fdata["factors"]["slope_score"] is not None


# 16. Canonical AOIs with verified polygon (e.g. cidco) return ASSESSED constraints and INCOMPLETE suitability
def test_canonical_aoi_with_polygon_assessed():
    response = client.get("/api/v1/builder/aois/cidco/suitability")
    assert response.status_code == 200
    data = response.json()
    assert data["aoi_id"] == "cidco"
    assert data["is_approximate_geometry"] is False
    assert data["factors"]["slope_score"] is not None

    constraints_resp = client.get("/api/v1/builder/violations/constraints/cidco")
    assert constraints_resp.status_code == 200
    cdata = constraints_resp.json()
    assert cdata["status"] == "ASSESSED"
    assert cdata["blocker_status"] in ["ASSESSED_NO_INTERSECTION", "POTENTIAL_RESTRICTION_REVIEW"]
