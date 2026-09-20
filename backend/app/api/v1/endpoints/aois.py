"""AOI management endpoints."""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Any, Dict

router = APIRouter()

# Seed AOI dataset for Nashik
SEED_AOIS: List[Dict[str, Any]] = [
    {
        "id": "gangapur-road",
        "name": "Gangapur Road",
        "location": "Nashik, Maharashtra",
        "category": "residential",
        "latitude": 20.0094,
        "longitude": 73.7635,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7585, 20.0124],
                    [73.7685, 20.0124],
                    [73.7685, 20.0064],
                    [73.7585, 20.0064],
                    [73.7585, 20.0124]
                ]
            ]
        },
        "suitability_score": 82,
        "terrain_roughness": "Moderately Undulating"
    },
    {
        "id": "pathardi-phata",
        "name": "Pathardi Phata",
        "location": "Nashik, Maharashtra",
        "category": "residential",
        "latitude": 19.9512,
        "longitude": 73.7712,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7662, 19.9542],
                    [73.7762, 19.9542],
                    [73.7762, 19.9482],
                    [73.7662, 19.9482],
                    [73.7662, 19.9542]
                ]
            ]
        },
        "suitability_score": 88,
        "terrain_roughness": "Flat Plains"
    },
    {
        "id": "cidco",
        "name": "CIDCO",
        "location": "Nashik, Maharashtra",
        "category": "residential",
        "latitude": 19.9685,
        "longitude": 73.7548,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7498, 19.9715],
                    [73.7598, 19.9715],
                    [73.7598, 19.9655],
                    [73.7498, 19.9655],
                    [73.7498, 19.9715]
                ]
            ]
        },
        "suitability_score": 79,
        "terrain_roughness": "Gently Sloped"
    },
    {
        "id": "panchavati",
        "name": "Panchavati",
        "location": "Nashik, Maharashtra",
        "category": "commercial",
        "latitude": 20.0091,
        "longitude": 73.7924,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7874, 20.0121],
                    [73.7974, 20.0121],
                    [73.7974, 20.0061],
                    [73.7874, 20.0061],
                    [73.7874, 20.0121]
                ]
            ]
        },
        "suitability_score": 68,
        "terrain_roughness": "Undulating Riverbank"
    },
    {
        "id": "satpur-midc",
        "name": "Satpur MIDC",
        "location": "Nashik, Maharashtra",
        "category": "industrial",
        "latitude": 20.0012,
        "longitude": 73.7314,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7264, 20.0042],
                    [73.7364, 20.0042],
                    [73.7364, 19.9982],
                    [73.7264, 19.9982],
                    [73.7264, 20.0042]
                ]
            ]
        },
        "suitability_score": 76,
        "terrain_roughness": "Industrial Plateau"
    },
    {
        "id": "ambad-midc",
        "name": "Ambad MIDC",
        "location": "Nashik, Maharashtra",
        "category": "industrial",
        "latitude": 19.9388,
        "longitude": 73.7422,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7372, 19.9418],
                    [73.7472, 19.9418],
                    [73.7472, 19.9358],
                    [73.7372, 19.9358],
                    [73.7372, 19.9418]
                ]
            ]
        },
        "suitability_score": 84,
        "terrain_roughness": "Flat Industrial Zone"
    },
    {
        "id": "trimbakeshwar",
        "name": "Trimbakeshwar",
        "location": "Nashik, Maharashtra",
        "category": "protected",
        "latitude": 19.9384,
        "longitude": 73.5312,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.5262, 19.9414],
                    [73.5362, 19.9414],
                    [73.5362, 19.9354],
                    [73.5262, 19.9354],
                    [73.5262, 19.9414]
                ]
            ]
        },
        "suitability_score": 45,
        "terrain_roughness": "Mountainous Terrain"
    },
    {
        "id": "anjaneri",
        "name": "Anjaneri",
        "location": "Nashik, Maharashtra",
        "category": "protected",
        "latitude": 19.9255,
        "longitude": 73.5841,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.5791, 19.9285],
                    [73.5891, 19.9285],
                    [73.5891, 19.9225],
                    [73.5791, 19.9225],
                    [73.5791, 19.9285]
                ]
            ]
        },
        "suitability_score": 52,
        "terrain_roughness": "Hilly Reserve"
    },
    {
        "id": "cbs",
        "name": "CBS (Central Bus Stand)",
        "location": "Nashik, Maharashtra",
        "category": "commercial",
        "latitude": 20.0001,
        "longitude": 73.7845,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7795, 20.0031],
                    [73.7895, 20.0031],
                    [73.7895, 19.9971],
                    [73.7795, 19.9971],
                    [73.7795, 20.0031]
                ]
            ]
        },
        "suitability_score": 74,
        "terrain_roughness": "Urban Core"
    },
    {
        "id": "canada-corner",
        "name": "Canada Corner",
        "location": "Nashik, Maharashtra",
        "category": "commercial",
        "latitude": 20.0035,
        "longitude": 73.7788,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7738, 20.0065],
                    [73.7838, 20.0065],
                    [73.7838, 20.0005],
                    [73.7738, 20.0005],
                    [73.7738, 20.0065]
                ]
            ]
        },
        "suitability_score": 78,
        "terrain_roughness": "Flat Urban"
    },
    {
        "id": "indira-nagar",
        "name": "Indira Nagar",
        "location": "Nashik, Maharashtra",
        "category": "residential",
        "latitude": 19.9754,
        "longitude": 73.7789,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7739, 19.9784],
                    [73.7839, 19.9784],
                    [73.7839, 19.9724],
                    [73.7739, 19.9724],
                    [73.7739, 19.9784]
                ]
            ]
        },
        "suitability_score": 86,
        "terrain_roughness": "Gently Undulating"
    },
    {
        "id": "sinnar-outskirts",
        "name": "Sinnar Outskirts",
        "location": "Nashik, Maharashtra",
        "category": "industrial",
        "latitude": 19.8455,
        "longitude": 74.0012,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.9962, 19.8485],
                    [74.0062, 19.8485],
                    [74.0062, 19.8425],
                    [73.9962, 19.8425],
                    [73.9962, 19.8485]
                ]
            ]
        },
        "suitability_score": 81,
        "terrain_roughness": "Open Plateau"
    },
    {
        "id": "godavari-ramkund",
        "name": "Godavari River (Ramkund)",
        "location": "Nashik, Maharashtra",
        "category": "protected",
        "latitude": 20.0078,
        "longitude": 73.7911,
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [73.7861, 20.0108],
                    [73.7961, 20.0108],
                    [73.7961, 20.0048],
                    [73.7861, 20.0048],
                    [73.7861, 20.0108]
                ]
            ]
        },
        "suitability_score": 38,
        "terrain_roughness": "River Floodplain"
    }
]

@router.get("/compare/{aoi_id}", response_model=Dict[str, Any])
def get_aoi_comparison(aoi_id: str):
    """Compare selected AOI with the 4 geographically nearest neighboring AOIs."""
    import math

    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2.0) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2.0) ** 2
        )
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 1)

    # Detailed metrics dictionary aggregated from Modules 2–5
    AOI_METRICS = {
        "gangapur-road": {"suitability_score": 82, "flood_zone_percentage": 12.0, "construction_growth_percentage": 36.6, "average_slope": 8.4},
        "pathardi-phata": {"suitability_score": 88, "flood_zone_percentage": 0.0, "construction_growth_percentage": 114.2, "average_slope": 4.2},
        "cidco": {"suitability_score": 79, "flood_zone_percentage": 2.0, "construction_growth_percentage": 20.0, "average_slope": 5.1},
        "panchavati": {"suitability_score": 68, "flood_zone_percentage": 34.0, "construction_growth_percentage": 12.1, "average_slope": 9.8},
        "satpur-midc": {"suitability_score": 76, "flood_zone_percentage": 5.0, "construction_growth_percentage": 27.6, "average_slope": 6.8},
        "ambad-midc": {"suitability_score": 84, "flood_zone_percentage": 2.0, "construction_growth_percentage": 45.2, "average_slope": 4.0},
        "trimbakeshwar": {"suitability_score": 45, "flood_zone_percentage": 18.0, "construction_growth_percentage": 11.0, "average_slope": 22.5},
        "anjaneri": {"suitability_score": 52, "flood_zone_percentage": 8.0, "construction_growth_percentage": 24.4, "average_slope": 18.2},
        "cbs": {"suitability_score": 74, "flood_zone_percentage": 4.0, "construction_growth_percentage": 5.0, "average_slope": 3.2},
        "canada-corner": {"suitability_score": 78, "flood_zone_percentage": 2.0, "construction_growth_percentage": 9.7, "average_slope": 3.8},
        "indira-nagar": {"suitability_score": 86, "flood_zone_percentage": 0.0, "construction_growth_percentage": 33.3, "average_slope": 4.8},
        "sinnar-outskirts": {"suitability_score": 81, "flood_zone_percentage": 0.0, "construction_growth_percentage": 192.3, "average_slope": 3.5},
        "godavari-ramkund": {"suitability_score": 38, "flood_zone_percentage": 78.0, "construction_growth_percentage": 7.3, "average_slope": 12.0}
    }

    found_aoi = None
    for aoi in SEED_AOIS:
        if aoi["id"].lower() == aoi_id.lower():
            found_aoi = aoi
            break

    if not found_aoi:
        raise HTTPException(status_code=404, detail="Selected AOI for comparison not found")

    target_lat = found_aoi.get("latitude", 20.0)
    target_lng = found_aoi.get("longitude", 73.7)

    target_metrics = AOI_METRICS.get(found_aoi["id"].lower(), {
        "suitability_score": found_aoi.get("suitability_score", 80),
        "flood_zone_percentage": 5.0,
        "construction_growth_percentage": 20.0,
        "average_slope": 5.0
    })

    selected_data = {
        "id": found_aoi["id"],
        "name": found_aoi["name"],
        "location": found_aoi.get("location", "Nashik, Maharashtra"),
        "distance_km": 0.0,
        "suitability_score": target_metrics["suitability_score"],
        "flood_zone_percentage": target_metrics["flood_zone_percentage"],
        "construction_growth_percentage": target_metrics["construction_growth_percentage"],
        "average_slope": target_metrics["average_slope"]
    }

    # Calculate geographic distances to all other AOIs
    candidates = []
    for aoi in SEED_AOIS:
        if aoi["id"].lower() == found_aoi["id"].lower():
            continue
        
        c_lat = aoi.get("latitude", 20.0)
        c_lng = aoi.get("longitude", 73.7)
        dist = haversine_km(target_lat, target_lng, c_lat, c_lng)
        
        m = AOI_METRICS.get(aoi["id"].lower(), {
            "suitability_score": aoi.get("suitability_score", 70),
            "flood_zone_percentage": 5.0,
            "construction_growth_percentage": 15.0,
            "average_slope": 5.0
        })
        
        candidates.append({
            "id": aoi["id"],
            "name": aoi["name"],
            "location": aoi.get("location", "Nashik, Maharashtra"),
            "distance_km": dist,
            "suitability_score": m["suitability_score"],
            "flood_zone_percentage": m["flood_zone_percentage"],
            "construction_growth_percentage": m["construction_growth_percentage"],
            "average_slope": m["average_slope"]
        })

    # Sort ascending by spatial distance
    candidates.sort(key=lambda x: x["distance_km"])
    nearest_neighbors = candidates[:4]

    # Dynamic neutral factual observations
    nearest_first = nearest_neighbors[0] if nearest_neighbors else None
    lower_flood_count = sum(1 for n in nearest_neighbors if n["flood_zone_percentage"] < selected_data["flood_zone_percentage"])
    avg_neighbor_slope = round(sum(n["average_slope"] for n in nearest_neighbors) / max(1, len(nearest_neighbors)), 1)

    obs = []
    if nearest_first:
        obs.append(f"The selected site ({found_aoi['name']}) is {nearest_first['distance_km']} km from {nearest_first['name']}, its nearest comparison area.")
    obs.append(f"Among the 4 nearest areas, {lower_flood_count} have a lower flood zone overlap percentage than the selected site ({selected_data['flood_zone_percentage']}%).")
    obs.append(f"The selected site's average terrain slope is {selected_data['average_slope']}°, compared to a neighbor average slope of {avg_neighbor_slope}°.")

    return {
        "selected_aoi": selected_data,
        "neighbors": nearest_neighbors,
        "total_neighbors_found": len(nearest_neighbors),
        "factual_observations": obs
    }


@router.get("/search", response_model=Dict[str, Any])
def search_aois(q: Optional[str] = Query(None)):
    """Search AOIs by name or location (case-insensitive partial match)."""
    if not q or not q.strip():
        return {"results": SEED_AOIS[:6]}

    query_str = q.strip().lower()
    matching = [
        aoi for aoi in SEED_AOIS
        if query_str in aoi["name"].lower() or query_str in aoi["location"].lower() or query_str in aoi["category"].lower()
    ]
    return {"results": matching}

@router.get("/{aoi_id}", response_model=Dict[str, Any])
def get_aoi_detail(aoi_id: str):
    """Get single AOI details by ID."""
    for aoi in SEED_AOIS:
        if aoi["id"].lower() == aoi_id.lower():
            return aoi
    raise HTTPException(status_code=404, detail="AOI not found")

@router.get("/", response_model=List[Dict[str, Any]])
def list_aois():
    """List all available AOIs."""
    return SEED_AOIS

