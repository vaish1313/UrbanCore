import pytest
from fastapi.testclient import TestClient
from app.main import app
import os
from unittest.mock import patch, MagicMock

client = TestClient(app)

# Helper function to generate a polygon
def make_polygon(coords):
    return {
        "type": "Polygon",
        "coordinates": coords
    }

@pytest.fixture
def mock_db_check():
    with patch('app.compliance_router.check_compliance') as mock_check:
        yield mock_check

def test_no_intersection(mock_db_check):
    mock_db_check.return_value = {
        "potential_violation": False,
        "restricted_zone_intersection": False,
        "summary": {"FOREST": 0, "RIVER": 0, "LAKE": 0, "WATERBODY": 0, "HIGHWAY": 0},
        "intersections": []
    }
    
    response = client.post("/api/v1/compliance/check", json={
        "geometry": make_polygon([[[73.7, 19.9], [73.71, 19.9], [73.71, 19.91], [73.7, 19.91], [73.7, 19.9]]])
    })
    
    assert response.status_code == 200
    assert response.json()["potential_violation"] is False
    assert response.json()["restricted_zone_intersection"] is False

def test_forest_intersection(mock_db_check):
    mock_db_check.return_value = {
        "potential_violation": True,
        "restricted_zone_intersection": True,
        "summary": {"FOREST": 1, "RIVER": 0, "LAKE": 0, "WATERBODY": 0, "HIGHWAY": 0},
        "intersections": [{"zone_type": "FOREST", "source_dataset": "nashik_forests.geojson", "source_feature_id": "f_1", "intersection_area_sqm": 500}]
    }
    
    response = client.post("/api/v1/compliance/check", json={
        "geometry": make_polygon([[[73.7, 19.9], [73.71, 19.9], [73.71, 19.91], [73.7, 19.91], [73.7, 19.9]]])
    })
    
    assert response.status_code == 200
    assert response.json()["potential_violation"] is True
    assert response.json()["summary"]["FOREST"] == 1

def test_water_intersection(mock_db_check):
    mock_db_check.return_value = {
        "potential_violation": True,
        "restricted_zone_intersection": True,
        "summary": {"FOREST": 0, "RIVER": 1, "LAKE": 1, "WATERBODY": 0, "HIGHWAY": 0},
        "intersections": [
            {"zone_type": "RIVER", "source_dataset": "nashik_rivers.geojson", "source_feature_id": "r_1", "intersection_area_sqm": 100},
            {"zone_type": "LAKE", "source_dataset": "nashik_lakes.geojson", "source_feature_id": "l_1", "intersection_area_sqm": 200}
        ]
    }
    
    response = client.post("/api/v1/compliance/check", json={
        "geometry": make_polygon([[[73.7, 19.9], [73.71, 19.9], [73.71, 19.91], [73.7, 19.91], [73.7, 19.9]]])
    })
    
    assert response.status_code == 200
    assert response.json()["summary"]["RIVER"] == 1
    assert response.json()["summary"]["LAKE"] == 1

def test_highway_intersection(mock_db_check):
    mock_db_check.return_value = {
        "potential_violation": True,
        "restricted_zone_intersection": True,
        "summary": {"FOREST": 0, "RIVER": 0, "LAKE": 0, "WATERBODY": 0, "HIGHWAY": 1},
        "intersections": [
            {"zone_type": "HIGHWAY", "source_dataset": "nashik_highways.geojson", "source_feature_id": "h_1", "intersection_area_sqm": 50}
        ]
    }
    
    response = client.post("/api/v1/compliance/check", json={
        "geometry": make_polygon([[[73.7, 19.9], [73.71, 19.9], [73.71, 19.91], [73.7, 19.91], [73.7, 19.9]]])
    })
    
    assert response.status_code == 200
    assert response.json()["summary"]["HIGHWAY"] == 1

@patch('app.compliance_router.check_compliance')
def test_invalid_geometry(mock_check):
    # This shouldn't even hit the service due to Pydantic validation, or the service will raise HTTP 400
    response = client.post("/api/v1/compliance/check", json={
        "geometry": {"type": "InvalidType", "coordinates": []}
    })
    # Our API service expects a valid GeoJSON-like dict. If the service is called, it returns 400.
    from fastapi import HTTPException
    mock_check.side_effect = HTTPException(status_code=400, detail="Unsupported geometry type: InvalidType")
    
    response = client.post("/api/v1/compliance/check", json={
        "geometry": {"type": "InvalidType", "coordinates": []}
    })
    
    assert response.status_code == 400
    assert "Unsupported geometry type" in response.json()["detail"]

def test_loader_duplicate_protection():
    # Verify the loader script syntax uses ON CONFLICT DO NOTHING
    loader_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'restricted_zones', 'load_restricted_zones.py')
    with open(loader_path, 'r') as f:
        content = f.read()
        assert 'ON CONFLICT (source_dataset, source_feature_id) DO NOTHING' in content
