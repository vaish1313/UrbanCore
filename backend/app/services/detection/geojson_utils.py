"""
Utility functions for GeoJSON formatting.
"""
from typing import Dict, List

def format_as_geojson_feature_collection(buildings: List[Dict], year: int) -> Dict:
    """
    Format a list of building dictionaries as a GeoJSON FeatureCollection.
    
    Args:
        buildings: List of building dictionaries containing geometry and properties
        year: The year of detection
        
    Returns:
        GeoJSON FeatureCollection dict
    """
    features = []
    
    for idx, bldg in enumerate(buildings):
        feature = {
            "type": "Feature",
            "id": f"bldg_{year}_{idx}",
            "geometry": bldg["geometry"],
            "properties": {
                "year": year,
                "area_sqm": bldg.get("area_sqm"),
                "centroid_lat": bldg.get("centroid_lat"),
                "centroid_lon": bldg.get("centroid_lon"),
                "perimeter_m": bldg.get("perimeter_m"),
                "is_new": bldg.get("is_new", False)
            }
        }
        features.append(feature)
        
    return {
        "type": "FeatureCollection",
        "features": features
    }

def format_change_detection_geojson(changes: Dict) -> Dict:
    """
    Format change detection results into GeoJSON FeatureCollections.
    
    Args:
        changes: Output from ChangeDetector.detect_changes
        
    Returns:
        Dict with GeoJSON FeatureCollections for new, removed, and expanded buildings
    """
    to_year = changes["to_year"]
    from_year = changes["from_year"]
    
    new_features = []
    for idx, bldg in enumerate(changes["new_buildings"]):
        new_features.append({
            "type": "Feature",
            "id": f"new_{to_year}_{idx}",
            "geometry": bldg["geometry"],
            "properties": {
                "status": "new",
                "year_detected": to_year,
                "area_sqm": bldg.get("area_sqm")
            }
        })
        
    removed_features = []
    for idx, bldg in enumerate(changes["removed_buildings"]):
        removed_features.append({
            "type": "Feature",
            "id": f"demolished_{to_year}_{idx}",
            "geometry": bldg["geometry"],
            "properties": {
                "status": "demolished",
                "year_detected_missing": to_year,
                "last_seen_year": from_year,
                "area_sqm": bldg.get("area_sqm")
            }
        })
        
    return {
        "new_buildings": {
            "type": "FeatureCollection",
            "features": new_features
        },
        "demolished_buildings": {
            "type": "FeatureCollection",
            "features": removed_features
        }
    }
