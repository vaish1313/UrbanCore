import pytest
import os
import json
from unittest.mock import patch, mock_open, MagicMock
from app.service import enrich_with_compliance

def test_enrich_compliance_with_wgs84():
    mock_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.7, 19.9], [73.8, 19.9], [73.8, 20.0], [73.7, 20.0], [73.7, 19.9]]]
                }
            }
        ]
    }
    
    result = {
        "geojson_path": "/fake/path.geojson",
        "construction_pixels": 100,
        "metadata": {
            "crs": "EPSG:4326"
        }
    }
    
    with patch('os.path.exists', return_value=True):
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_geojson))):
            with patch('app.service.check_compliance') as mock_check:
                mock_check.return_value = {
                    "potential_violation": True,
                    "summary": {"FOREST": 1}
                }
                
                enrich_with_compliance(result, 2024, "test_analysis_id")
                
                assert len(result["compliance"]) == 1
                assert result["compliance"][0]["potential_violation"] is True
                assert result["compliance"][0]["polygon_index"] == 0
                assert result["compliance"][0]["year"] == 2024
                
                # Check that check_compliance was called
                mock_check.assert_called_once()
                args, _ = mock_check.call_args
                geom = args[0]
                assert geom["type"] == "Polygon"
                assert geom["coordinates"][0][0] == (73.7, 19.9)

def test_enrich_compliance_with_reprojection():
    mock_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    # Some coordinate in EPSG:32643
                    "coordinates": [[[350000, 2200000], [350100, 2200000], [350100, 2200100], [350000, 2200100], [350000, 2200000]]]
                }
            }
        ]
    }
    
    result = {
        "geojson_path": "/fake/path.geojson",
        "construction_pixels": 100,
        "metadata": {
            "crs": "EPSG:32643"
        }
    }
    
    with patch('os.path.exists', return_value=True):
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_geojson))):
            with patch('app.service.check_compliance') as mock_check:
                mock_check.return_value = {
                    "potential_violation": False,
                    "summary": {}
                }
                
                enrich_with_compliance(result, 2024, "test_analysis_id")
                
                # Check that check_compliance was called
                mock_check.assert_called_once()
                args, _ = mock_check.call_args
                geom = args[0]
                assert geom["type"] == "Polygon"
                
                # Verify reprojection occurred (coordinates changed)
                # Not doing an exact mathematical assertion, just ensuring it changed to approx WGS84 range
                x, y = geom["coordinates"][0][0]
                assert 70 < x < 80, f"Expected x to be ~73-75 but got {x}"
                assert 18 < y < 22, f"Expected y to be ~19-21 but got {y}"

def test_enrich_compliance_missing_crs():
    result = {
        "geojson_path": "/fake/path.geojson",
        "construction_pixels": 100,
        "metadata": {}
    }
    
    with patch('os.path.exists', return_value=True):
        enrich_with_compliance(result, 2024, "test_analysis_id")
        
        assert result["compliance"] == []

def test_enrich_compliance_multiple_polygons():
    mock_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[73.7, 19.9], [73.8, 19.9], [73.8, 20.0], [73.7, 20.0], [73.7, 19.9]]]
                }
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[74.0, 20.0], [74.1, 20.0], [74.1, 20.1], [74.0, 20.1], [74.0, 20.0]]]
                }
            }
        ]
    }
    
    result = {
        "geojson_path": "/fake/path.geojson",
        "construction_pixels": 100,
        "metadata": {
            "crs": "EPSG:4326"
        }
    }
    
    with patch('os.path.exists', return_value=True):
        with patch('builtins.open', mock_open(read_data=json.dumps(mock_geojson))):
            with patch('app.service.check_compliance') as mock_check:
                # Return violation for first, no violation for second
                mock_check.side_effect = [
                    {"potential_violation": True, "summary": {"FOREST": 1}},
                    {"potential_violation": False, "summary": {}}
                ]
                
                enrich_with_compliance(result, 2024, "test_analysis_id")
                
                assert len(result["compliance"]) == 1
                assert result["compliance"][0]["polygon_index"] == 0
                assert mock_check.call_count == 2
