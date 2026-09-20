"""Building & Construction Detection endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.api.v1.endpoints.aois import SEED_AOIS

router = APIRouter()

CONSTRUCTION_DATA: Dict[str, Dict[str, Any]] = {
    "gangapur-road": {
        "history": [
            {"year": 2021, "buildings_count": 142, "built_up_area_ha": 14.2, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 154, "built_up_area_ha": 15.4, "built_up_change_percent": 8.45},
            {"year": 2023, "buildings_count": 167, "built_up_area_ha": 16.7, "built_up_change_percent": 8.44},
            {"year": 2024, "buildings_count": 181, "built_up_area_ha": 18.1, "built_up_change_percent": 8.38},
            {"year": 2025, "buildings_count": 194, "built_up_area_ha": 19.4, "built_up_change_percent": 7.18}
        ]
    },
    "pathardi-phata": {
        "history": [
            {"year": 2021, "buildings_count": 98, "built_up_area_ha": 9.8, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 118, "built_up_area_ha": 11.8, "built_up_change_percent": 20.41},
            {"year": 2023, "buildings_count": 142, "built_up_area_ha": 14.2, "built_up_change_percent": 20.34},
            {"year": 2024, "buildings_count": 175, "built_up_area_ha": 17.5, "built_up_change_percent": 23.24},
            {"year": 2025, "buildings_count": 210, "built_up_area_ha": 21.0, "built_up_change_percent": 20.0}
        ]
    },
    "cidco": {
        "history": [
            {"year": 2021, "buildings_count": 310, "built_up_area_ha": 31.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 325, "built_up_area_ha": 32.5, "built_up_change_percent": 4.84},
            {"year": 2023, "buildings_count": 341, "built_up_area_ha": 34.1, "built_up_change_percent": 4.92},
            {"year": 2024, "buildings_count": 358, "built_up_area_ha": 35.8, "built_up_change_percent": 4.99},
            {"year": 2025, "buildings_count": 372, "built_up_area_ha": 37.2, "built_up_change_percent": 3.91}
        ]
    },
    "panchavati": {
        "history": [
            {"year": 2021, "buildings_count": 420, "built_up_area_ha": 42.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 432, "built_up_area_ha": 43.2, "built_up_change_percent": 2.86},
            {"year": 2023, "buildings_count": 445, "built_up_area_ha": 44.5, "built_up_change_percent": 3.01},
            {"year": 2024, "buildings_count": 458, "built_up_area_ha": 45.8, "built_up_change_percent": 2.92},
            {"year": 2025, "buildings_count": 471, "built_up_area_ha": 47.1, "built_up_change_percent": 2.84}
        ]
    },
    "satpur-midc": {
        "history": [
            {"year": 2021, "buildings_count": 185, "built_up_area_ha": 18.5, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 194, "built_up_area_ha": 19.4, "built_up_change_percent": 4.86},
            {"year": 2023, "buildings_count": 208, "built_up_area_ha": 20.8, "built_up_change_percent": 7.22},
            {"year": 2024, "buildings_count": 222, "built_up_area_ha": 22.2, "built_up_change_percent": 6.73},
            {"year": 2025, "buildings_count": 236, "built_up_area_ha": 23.6, "built_up_change_percent": 6.31}
        ]
    },
    "ambad-midc": {
        "history": [
            {"year": 2021, "buildings_count": 210, "built_up_area_ha": 21.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 228, "built_up_area_ha": 22.8, "built_up_change_percent": 8.57},
            {"year": 2023, "buildings_count": 251, "built_up_area_ha": 25.1, "built_up_change_percent": 10.09},
            {"year": 2024, "buildings_count": 279, "built_up_area_ha": 27.9, "built_up_change_percent": 11.16},
            {"year": 2025, "buildings_count": 305, "built_up_area_ha": 30.5, "built_up_change_percent": 9.32}
        ]
    },
    "trimbakeshwar": {
        "history": [
            {"year": 2021, "buildings_count": 82, "built_up_area_ha": 8.2, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 84, "built_up_area_ha": 8.4, "built_up_change_percent": 2.44},
            {"year": 2023, "buildings_count": 87, "built_up_area_ha": 8.7, "built_up_change_percent": 3.57},
            {"year": 2024, "buildings_count": 89, "built_up_area_ha": 8.9, "built_up_change_percent": 2.30},
            {"year": 2025, "buildings_count": 91, "built_up_area_ha": 9.1, "built_up_change_percent": 2.25}
        ]
    },
    "anjaneri": {
        "history": [
            {"year": 2021, "buildings_count": 45, "built_up_area_ha": 4.5, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 47, "built_up_area_ha": 4.7, "built_up_change_percent": 4.44},
            {"year": 2023, "buildings_count": 50, "built_up_area_ha": 5.0, "built_up_change_percent": 6.38},
            {"year": 2024, "buildings_count": 53, "built_up_area_ha": 5.3, "built_up_change_percent": 6.00},
            {"year": 2025, "buildings_count": 56, "built_up_area_ha": 5.6, "built_up_change_percent": 5.66}
        ]
    },
    "cbs": {
        "history": [
            {"year": 2021, "buildings_count": 380, "built_up_area_ha": 38.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 384, "built_up_area_ha": 38.4, "built_up_change_percent": 1.05},
            {"year": 2023, "buildings_count": 389, "built_up_area_ha": 38.9, "built_up_change_percent": 1.30},
            {"year": 2024, "buildings_count": 394, "built_up_area_ha": 39.4, "built_up_change_percent": 1.29},
            {"year": 2025, "buildings_count": 399, "built_up_area_ha": 39.9, "built_up_change_percent": 1.27}
        ]
    },
    "canada-corner": {
        "history": [
            {"year": 2021, "buildings_count": 290, "built_up_area_ha": 29.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 295, "built_up_area_ha": 29.5, "built_up_change_percent": 1.72},
            {"year": 2023, "buildings_count": 302, "built_up_area_ha": 30.2, "built_up_change_percent": 2.37},
            {"year": 2024, "buildings_count": 310, "built_up_area_ha": 31.0, "built_up_change_percent": 2.65},
            {"year": 2025, "buildings_count": 318, "built_up_area_ha": 31.8, "built_up_change_percent": 2.58}
        ]
    },
    "indira-nagar": {
        "history": [
            {"year": 2021, "buildings_count": 240, "built_up_area_ha": 24.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 256, "built_up_area_ha": 25.6, "built_up_change_percent": 6.67},
            {"year": 2023, "buildings_count": 275, "built_up_area_ha": 27.5, "built_up_change_percent": 7.42},
            {"year": 2024, "buildings_count": 298, "built_up_area_ha": 29.8, "built_up_change_percent": 8.36},
            {"year": 2025, "buildings_count": 320, "built_up_area_ha": 32.0, "built_up_change_percent": 7.38}
        ]
    },
    "sinnar-outskirts": {
        "history": [
            {"year": 2021, "buildings_count": 52, "built_up_area_ha": 5.2, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 68, "built_up_area_ha": 6.8, "built_up_change_percent": 30.77},
            {"year": 2023, "buildings_count": 89, "built_up_area_ha": 8.9, "built_up_change_percent": 30.88},
            {"year": 2024, "buildings_count": 118, "built_up_area_ha": 11.8, "built_up_change_percent": 32.58},
            {"year": 2025, "buildings_count": 152, "built_up_area_ha": 15.2, "built_up_change_percent": 28.81}
        ]
    },
    "godavari-ramkund": {
        "history": [
            {"year": 2021, "buildings_count": 110, "built_up_area_ha": 11.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 111, "built_up_area_ha": 11.1, "built_up_change_percent": 0.91},
            {"year": 2023, "buildings_count": 113, "built_up_area_ha": 11.3, "built_up_change_percent": 1.80},
            {"year": 2024, "buildings_count": 115, "built_up_area_ha": 11.5, "built_up_change_percent": 1.77},
            {"year": 2025, "buildings_count": 118, "built_up_area_ha": 11.8, "built_up_change_percent": 2.61}
        ]
    }
}


@router.get("/growth/history/{aoi_id}", response_model=Dict[str, Any])
def get_aoi_growth_history(aoi_id: str):
    """Get multi-year construction history & urbanization analysis for a specific AOI."""
    found_aoi = None
    for aoi in SEED_AOIS:
        if aoi["id"].lower() == aoi_id.lower():
            found_aoi = aoi
            break

    if not found_aoi:
        raise HTTPException(status_code=404, detail="AOI construction history data not found")

    data = CONSTRUCTION_DATA.get(found_aoi["id"].lower(), {
        "history": [
            {"year": 2021, "buildings_count": 100, "built_up_area_ha": 10.0, "built_up_change_percent": 0.0},
            {"year": 2022, "buildings_count": 110, "built_up_area_ha": 11.0, "built_up_change_percent": 10.0},
            {"year": 2023, "buildings_count": 120, "built_up_area_ha": 12.0, "built_up_change_percent": 9.09},
            {"year": 2024, "buildings_count": 130, "built_up_area_ha": 13.0, "built_up_change_percent": 8.33},
            {"year": 2025, "buildings_count": 140, "built_up_area_ha": 14.0, "built_up_change_percent": 7.69}
        ]
    })

    history = data["history"]
    years = [item["year"] for item in history]
    first_item = history[0]
    latest_item = history[-1]

    first_year_area_ha = first_item["built_up_area_ha"]
    latest_year_area_ha = latest_item["built_up_area_ha"]

    if first_year_area_ha > 0:
        total_change_percent = round(((latest_year_area_ha - first_year_area_ha) / first_year_area_ha) * 100, 2)
    else:
        total_change_percent = 0.0

    analysis_period = f"{years[0]}–{years[-1]}"

    # Calculate largest single year increase
    largest_increase = {"period": "N/A", "change_percent": 0.0}
    max_increase = -1.0

    for i in range(1, len(history)):
        prev = history[i - 1]
        curr = history[i]
        change = curr["built_up_change_percent"]
        if change > max_increase:
            max_increase = change
            largest_increase = {
                "period": f"{prev['year']} → {curr['year']}",
                "change_percent": round(change, 1)
            }

    factual_observation = (
        f"Construction area increased from {first_year_area_ha} ha ({first_item['buildings_count']} structures) in {years[0]} "
        f"to {latest_year_area_ha} ha ({latest_item['buildings_count']} structures) in {years[-1]}. "
        f"The largest recorded single-year increase occurred between {largest_increase['period']} (+{largest_increase['change_percent']}%)."
    )

    return {
        "aoi_id": found_aoi["id"],
        "name": found_aoi["name"],
        "location": found_aoi.get("location", "Nashik, Maharashtra"),
        "years": years,
        "construction_history": history,
        "first_year_area_ha": first_year_area_ha,
        "latest_year_area_ha": latest_year_area_ha,
        "total_change_percent": total_change_percent,
        "analysis_period": analysis_period,
        "largest_increase": largest_increase,
        "factual_observation": factual_observation
    }
