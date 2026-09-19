import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze():
    print("Sending POST request to /api/v1/citizen/analyze")
    response = client.post(
        "/api/v1/citizen/analyze",
        json={
            "min_lat": 20.00,
            "min_lon": 73.77,
            "max_lat": 20.015,
            "max_lon": 73.785,
            "years": [2022]
        },
        headers={"Authorization": "Bearer fake_token"} # Note: depends on get_current_user override
    )
    
    print("Response Status:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)

if __name__ == "__main__":
    test_analyze()
