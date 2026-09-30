import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.municipal_service import get_municipal_cases, update_municipal_case_status
from app.service import enrich_with_compliance
from sqlalchemy import text
from app.municipal_service import engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    # Clean up municipal_cases before each test
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM municipal_cases"))
    yield
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM municipal_cases"))

def test_no_case_created_for_clean_polygon():
    # Mock result dictionary simulating a clean polygon
    result = {
        "geojson_path": None,  # Skip reading file for this unit test
        "construction_pixels": 100,
        "metadata": {"crs": "EPSG:4326"}
    }
    
    # We will mock the feature collection explicitly to avoid file read
    import os
    import tempfile
    import json
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".geojson") as tf:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.0, 19.0], [73.01, 19.0], [73.01, 19.01], [73.0, 19.01], [73.0, 19.0]]]
                }
            }]
        }, tf)
        temp_path = tf.name
        
    result["geojson_path"] = temp_path
    
    try:
        # Mocking check_compliance to return a clean result
        from unittest.mock import patch
        with patch('app.service.check_compliance') as mock_check:
            mock_check.return_value = {
                "potential_violation": False,
                "summary": {},
                "intersections": []
            }
            
            enrich_with_compliance(result, 2024, "test_clean_analysis")
            
        cases = get_municipal_cases()
        assert len(cases) == 0
    finally:
        os.remove(temp_path)

def test_case_created_for_violation():
    result = {
        "construction_pixels": 100,
        "metadata": {"crs": "EPSG:4326"}
    }
    
    import os
    import tempfile
    import json
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".geojson") as tf:
        json.dump({
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.0, 19.0], [73.01, 19.0], [73.01, 19.01], [73.0, 19.01], [73.0, 19.0]]]
                }
            }]
        }, tf)
        temp_path = tf.name
        
    result["geojson_path"] = temp_path
    
    try:
        from unittest.mock import patch
        with patch('app.service.check_compliance') as mock_check:
            mock_check.return_value = {
                "potential_violation": True,
                "summary": {"FOREST": 1},
                "intersections": [{"zone_type": "FOREST"}]
            }
            
            enrich_with_compliance(result, 2024, "test_violation_analysis")
            
        cases = get_municipal_cases()
        assert len(cases) == 1
        case = cases[0]
        assert case["analysis_id"] == "test_violation_analysis"
        assert case["year"] == 2024
        assert case["polygon_index"] == 0
        assert case["status"] == "NEEDS_REVIEW"
        
        # Test Duplicate analysis/polygon idempotency
        with patch('app.service.check_compliance') as mock_check:
            mock_check.return_value = {
                "potential_violation": True,
                "summary": {"FOREST": 2},
                "intersections": [{"zone_type": "FOREST"}]
            }
            # Run it again
            enrich_with_compliance(result, 2024, "test_violation_analysis")
            
        cases = get_municipal_cases()
        assert len(cases) == 1  # Still 1, just updated
        
    finally:
        os.remove(temp_path)

def test_api_list_cases():
    # Insert a case first
    from app.municipal_service import persist_municipal_cases
    persist_municipal_cases("test_api_analysis", 2025, [{
        "potential_violation": True,
        "polygon_index": 5,
        "summary": {},
        "intersections": [],
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.0, 19.0], [73.01, 19.0], [73.01, 19.01], [73.0, 19.01], [73.0, 19.0]]]
        }
    }])
    
    response = client.get("/api/v1/municipal/cases")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["cases"]) == 1
    
    case_id = data["cases"][0]["id"]
    
    # Test GET case by id
    response = client.get(f"/api/v1/municipal/cases/{case_id}")
    assert response.status_code == 200
    assert response.json()["id"] == case_id
    assert response.json()["geometry"]["type"] == "Polygon"

def test_api_update_status():
    # Insert a case first
    from app.municipal_service import persist_municipal_cases
    persist_municipal_cases("test_update_analysis", 2025, [{
        "potential_violation": True,
        "polygon_index": 1,
        "summary": {},
        "intersections": [],
        "geometry": {
            "type": "Point",
            "coordinates": [73.0, 19.0]
        }
    }])
    
    cases = get_municipal_cases()
    case_id = cases[0]["id"]
    
    response = client.patch(f"/api/v1/municipal/cases/{case_id}/status", json={"status": "REVIEWED"})
    assert response.status_code == 200
    
    # Verify status changed
    response = client.get(f"/api/v1/municipal/cases/{case_id}")
    assert response.json()["status"] == "REVIEWED"
    
    # Invalid status
    response = client.patch(f"/api/v1/municipal/cases/{case_id}/status", json={"status": "INVALID_STATUS"})
    assert response.status_code == 400
