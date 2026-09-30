import json
from app.compliance_service import check_compliance

# Use a polygon inside Nashik that definitely overlaps with a river/forest
test_polygon = {
    "type": "Polygon",
    "coordinates": [[[73.7, 19.9], [73.8, 19.9], [73.8, 20.0], [73.7, 20.0], [73.7, 19.9]]]
}

try:
    result = check_compliance(test_polygon)
    print("SUCCESS")
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"FAILED: {e}")
