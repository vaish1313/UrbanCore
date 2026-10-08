"""Focused tests for the approved Builder V1 suitability model."""

from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.builder_router import router
from app.suitability_service import (
    calculate_builder_aoi_suitability,
    calculate_overall_score,
    calculate_terrain_score,
    normalize_elevation,
    normalize_flat_land,
    normalize_constraint,
    normalize_roughness,
    normalize_slope,
    piecewise_score,
)


test_app = FastAPI()
test_app.include_router(router, prefix="/api/v1/builder")
client = TestClient(test_app)


def test_slope_piecewise_normalization():
    assert normalize_slope(0) == 100
    assert normalize_slope(5) == 80
    assert normalize_slope(10) == 60
    assert normalize_slope(15) == 40
    assert normalize_slope(25) == 0
    assert normalize_slope(40) == 0


def test_flat_land_normalization_and_clamping():
    assert normalize_flat_land(0) == 0
    assert normalize_flat_land(73.5) == 73.5
    assert normalize_flat_land(100) == 100
    assert normalize_flat_land(-5) == 0
    assert normalize_flat_land(105) == 100


def test_roughness_piecewise_normalization():
    assert normalize_roughness(0) == 100
    assert normalize_roughness(25) == 50
    assert normalize_roughness(37.5) == 25
    assert normalize_roughness(50) == 0
    assert normalize_roughness(75) == 0


def test_constraint_normalization():
    assert normalize_constraint(0) == 100
    assert normalize_constraint(22.5) == 77.5
    assert normalize_constraint(100) == 0
    assert normalize_constraint(125) == 0


def test_final_weighted_score_uses_approved_weights():
    factors = {
        "slope_score": 80.0,
        "flat_land_score": 90.0,
        "roughness_score": 70.0,
        "elevation_score": 60.0,
    }
    terrain = calculate_terrain_score(factors)
    assert terrain == pytest.approx(78.0)
    assert calculate_overall_score(terrain, 80.0) == pytest.approx(78.6)
    assert 0 <= calculate_overall_score(-100, 200) <= 100


def test_elevation_is_relative_to_actual_reference_range():
    assert normalize_elevation(100, 0, 100, 200) == 100
    assert normalize_elevation(50, 0, 100, 200) == 50
    assert normalize_elevation(150, 0, 100, 200) == 50
    assert normalize_elevation(-10, 0, 100, 200) == 0
    assert normalize_elevation(250, 0, 100, 200) == 0


def test_piecewise_rejects_nan_and_inf():
    with pytest.raises(ValueError):
        piecewise_score(float("nan"), ((0, 100), (1, 0)))
    with pytest.raises(ValueError):
        piecewise_score(float("inf"), ((0, 100), (1, 0)))


def test_suitability_endpoint_missing_aoi():
    with patch("app.builder_router.calculate_builder_aoi_suitability", return_value=None):
        response = client.get("/api/v1/builder/aois/does-not-exist/suitability")
    assert response.status_code == 404


def test_suitability_endpoint_exposes_unavailable_constraint_data():
    result = {
        "aoi_id": "test-aoi",
        "overall_score": None,
        "terrain_score": 60.0,
        "constraint_score": None,
        "factors": {
            "slope_score": 60.0,
            "flat_land_score": 70.0,
            "roughness_score": 50.0,
            "elevation_score": 55.0,
            "constraint_score": None,
        },
        "inputs": {
            "mean_slope_deg": 10.0,
            "flat_land_percentage": 70.0,
            "terrain_roughness_m": 25.0,
            "mean_elevation_m": 600.0,
            "restricted_intersection_percentage": None,
        },
        "elevation_reference": {
            "min_elevation": 400.0,
            "median_elevation": 600.0,
            "max_elevation": 900.0,
        },
        "constraint_data_available": False,
        "constraint_status": "UNAVAILABLE",
        "constraint_unavailable_reason": "Restricted-zone intersection could not be assessed because AOI geometry is unavailable.",
        "positive_factors": [],
        "negative_factors": ["Restricted-zone intersection data unavailable; constraint score set to 0"],
        "calculated_at": "2026-01-01T00:00:00+00:00",
    }
    with patch("app.builder_router.calculate_builder_aoi_suitability", return_value=result):
        response = client.get("/api/v1/builder/aois/test-aoi/suitability")
    assert response.status_code == 200
    assert response.json()["constraint_data_available"] is False
    assert response.json()["constraint_status"] == "UNAVAILABLE"
    assert response.json()["constraint_score"] is None
    assert response.json()["overall_score"] is None
    assert response.json()["inputs"]["restricted_intersection_percentage"] is None


def test_suitability_endpoint_rejects_non_finite_inputs():
    with patch(
        "app.builder_router.calculate_builder_aoi_suitability",
        side_effect=ValueError("mean_slope_deg is not finite"),
    ):
        response = client.get("/api/v1/builder/aois/test-aoi/suitability")
    assert response.status_code == 422


def test_suitability_calculation_is_deterministic_for_same_inputs():
    result = {
        "aoi_id": "test-aoi",
        "mean_elevation_m": 600.0,
        "mean_slope_deg": 4.0,
        "flat_land_percentage": 85.0,
        "terrain_roughness_m": 3.5,
    }
    with patch("app.suitability_service._load_aoi_inputs", return_value=result), \
         patch("app.suitability_service.get_nashik_elevation_stats", return_value={
             "min_elevation": 400.0,
             "median_elevation": 600.0,
             "max_elevation": 900.0,
         }), \
         patch("app.suitability_service._restricted_intersection_percentage", return_value=(0.0, True, None)):
        first = calculate_builder_aoi_suitability("test-aoi")
        second = calculate_builder_aoi_suitability("test-aoi")
    assert {key: value for key, value in first.items() if key != "calculated_at"} == {
        key: value for key, value in second.items() if key != "calculated_at"
    }
    assert 0 <= first["overall_score"] <= 100
    assert 0 <= first["terrain_score"] <= 100
    assert 0 <= first["constraint_score"] <= 100
    assert all(0 <= value <= 100 for value in first["factors"].values())
