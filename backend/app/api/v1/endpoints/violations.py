"""Zoning & Environmental Constraints endpoints."""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.api.v1.endpoints.aois import SEED_AOIS

router = APIRouter()

CONSTRAINT_DATA: Dict[str, Dict[str, Any]] = {
    "gangapur-road": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 2.4,
                "affected_percentage": 12.0,
                "description": "Godavari river tributary 100m blue line flood return zone overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No reserve forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 1.0,
                "affected_percentage": 5.0,
                "description": "Zonal DP masterplan agricultural greenbelt boundary overlap."
            }
        ]
    },
    "pathardi-phata": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "Outside 100m river flood buffer zone."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 0.4,
                "affected_percentage": 2.0,
                "description": "Minor agricultural greenbelt boundary overlap."
            }
        ]
    },
    "cidco": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 0.3,
                "affected_percentage": 2.0,
                "description": "Minor storm drainage canal setback overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 0.6,
                "affected_percentage": 4.0,
                "description": "Periphery agricultural zone boundary overlap."
            }
        ]
    },
    "panchavati": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 6.8,
                "affected_percentage": 34.0,
                "description": "Godavari main river 100m flood return line overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 3.6,
                "affected_percentage": 18.0,
                "description": "Riverside agricultural greenbelt conservation zone."
            }
        ]
    },
    "satpur-midc": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 1.0,
                "affected_percentage": 5.0,
                "description": "Industrial canal drainage buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "OVERLAP",
                "affected_area_ha": 1.6,
                "affected_percentage": 8.0,
                "description": "Western hillock reserve forest boundary buffer overlap."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 2.0,
                "affected_percentage": 10.0,
                "description": "Western agricultural buffer zone overlap."
            }
        ]
    },
    "ambad-midc": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 0.4,
                "affected_percentage": 2.0,
                "description": "Stormwater channel buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 1.2,
                "affected_percentage": 6.0,
                "description": "Highway green buffer strip overlap."
            }
        ]
    },
    "trimbakeshwar": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 3.6,
                "affected_percentage": 18.0,
                "description": "Catchment stream & reservoir buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "OVERLAP",
                "affected_area_ha": 13.0,
                "affected_percentage": 65.0,
                "description": "Western Ghats Reserve Forest boundary intersection."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 8.4,
                "affected_percentage": 42.0,
                "description": "Protected eco-sensitive agricultural zone overlap."
            }
        ]
    },
    "anjaneri": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 1.6,
                "affected_percentage": 8.0,
                "description": "Seasonal mountain stream buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "OVERLAP",
                "affected_area_ha": 11.6,
                "affected_percentage": 58.0,
                "description": "Anjaneri Reserve Forest boundary overlap."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 7.6,
                "affected_percentage": 38.0,
                "description": "Eco-sensitive hill slope greenbelt overlap."
            }
        ]
    },
    "cbs": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 0.8,
                "affected_percentage": 4.0,
                "description": "City storm drainage channel buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "Zero agricultural greenbelt overlap."
            }
        ]
    },
    "canada-corner": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 0.4,
                "affected_percentage": 2.0,
                "description": "Minor urban channel buffer overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 0.2,
                "affected_percentage": 1.0,
                "description": "Fringe urban park greenbelt overlap."
            }
        ]
    },
    "indira-nagar": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "Outside river flood return buffer."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 0.6,
                "affected_percentage": 3.0,
                "description": "Ring road greenbelt buffer overlap."
            }
        ]
    },
    "sinnar-outskirts": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "Outside waterbody buffer zone."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "OVERLAP",
                "affected_area_ha": 0.4,
                "affected_percentage": 2.0,
                "description": "Peripheral scrub forest patch boundary overlap."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 1.0,
                "affected_percentage": 5.0,
                "description": "Zonal agricultural greenbelt parcel overlap."
            }
        ]
    },
    "godavari-ramkund": {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "Coastal Regulation Zone data unavailable for inland region."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "OVERLAP",
                "affected_area_ha": 15.6,
                "affected_percentage": 78.0,
                "description": "Godavari main riverbed & 25-yr flood blue line zone overlap."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "OVERLAP",
                "affected_area_ha": 10.4,
                "affected_percentage": 52.0,
                "description": "Riverbank green belt conservation zone overlap."
            }
        ]
    }
}


@router.get("/constraints/{aoi_id}", response_model=Dict[str, Any])
def get_aoi_constraints(aoi_id: str):
    """Get zoning & environmental constraints GIS audit for a specific AOI."""
    found_aoi = None
    for aoi in SEED_AOIS:
        if aoi["id"].lower() == aoi_id.lower():
            found_aoi = aoi
            break

    if not found_aoi:
        raise HTTPException(status_code=404, detail="AOI constraints data not found")

    data = CONSTRAINT_DATA.get(found_aoi["id"].lower(), {
        "constraints": [
            {
                "type": "crz",
                "name": "CRZ (Coastal Regulation Zone)",
                "status": "NO_DATA",
                "affected_area_ha": None,
                "affected_percentage": None,
                "description": "CRZ GIS layer unavailable for inland site."
            },
            {
                "type": "river_buffer",
                "name": "River Buffer Zone",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No river buffer intersection detected."
            },
            {
                "type": "forest",
                "name": "Forest Boundary & Buffer",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No reserve forest boundary intersection detected."
            },
            {
                "type": "green_belt",
                "name": "Agricultural Green Belt",
                "status": "CLEAR",
                "affected_area_ha": 0.0,
                "affected_percentage": 0.0,
                "description": "No green belt intersection detected."
            }
        ]
    })

    constraints = data["constraints"]
    layers_analyzed = len(constraints)
    overlapping_layers = sum(1 for c in constraints if c["status"] == "OVERLAP")
    clear_layers = sum(1 for c in constraints if c["status"] == "CLEAR")
    no_data_layers = sum(1 for c in constraints if c["status"] == "NO_DATA")

    # Generate factual summary strictly from results
    overlap_names = [c["name"] for c in constraints if c["status"] == "OVERLAP"]
    clear_names = [c["name"] for c in constraints if c["status"] == "CLEAR"]

    if overlap_names:
        summary_parts = [f"The selected AOI intersects the {', '.join(overlap_names)}."]
    else:
        summary_parts = ["No spatial overlap was detected with any active restriction layer."]

    if clear_names:
        summary_parts.append(f"No spatial overlap was detected with {', '.join(clear_names)}.")

    if no_data_layers > 0:
        summary_parts.append("Coastal Regulation Zone (CRZ) data is unavailable for this inland region.")

    factual_summary = " ".join(summary_parts)

    return {
        "aoi_id": found_aoi["id"],
        "name": found_aoi["name"],
        "location": found_aoi.get("location", "Nashik, Maharashtra"),
        "layers_analyzed": layers_analyzed,
        "overlapping_layers": overlapping_layers,
        "clear_layers": clear_layers,
        "no_data_layers": no_data_layers,
        "constraints": constraints,
        "factual_summary": factual_summary
    }
