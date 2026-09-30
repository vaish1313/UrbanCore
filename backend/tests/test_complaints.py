import pytest
from fastapi.testclient import TestClient
from app.main import app
from sqlalchemy import text
from app.complaints_service import engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_db():
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM complaints"))
    yield
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM complaints"))

def test_submit_complaint():
    response = client.post("/api/v1/complaints", json={
        "citizen_name": "Test Citizen",
        "description": "Test complaint",
        "location_name": "Test Location",
        "latitude": 19.99,
        "longitude": 73.78
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "reference_number" in data
    assert data["reference_number"].startswith("URB-")
    assert data["status"] == "SUBMITTED"
    assert "id" in data
    
    # Store ref for other tests
    ref = data["reference_number"]
    
    # Check municipal list
    list_res = client.get("/api/v1/municipal/complaints")
    assert list_res.status_code == 200
    assert list_res.json()["count"] == 1
    
    # Check detail
    detail_res = client.get(f"/api/v1/municipal/complaints/{ref}")
    assert detail_res.status_code == 200
    assert detail_res.json()["citizen_name"] == "Test Citizen"
    # Ensure it returns geometry
    assert "geometry" in detail_res.json()
    assert detail_res.json()["geometry"]["type"] == "Point"

def test_pdf_receipt():
    response = client.post("/api/v1/complaints", json={
        "citizen_name": "Receipt Citizen",
        "description": "Receipt complaint",
        "location_name": "Receipt Location",
        "latitude": 19.99,
        "longitude": 73.78
    })
    ref = response.json()["reference_number"]
    
    pdf_res = client.get(f"/api/v1/complaints/{ref}/receipt")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert ref in pdf_res.headers["content-disposition"]
    
    # Optional: check if PDF is non-empty bytes
    assert len(pdf_res.content) > 100

def test_municipal_update_status():
    response = client.post("/api/v1/complaints", json={
        "citizen_name": "Status Citizen",
        "description": "Status complaint",
        "location_name": "Status Location",
        "latitude": 19.99,
        "longitude": 73.78
    })
    ref = response.json()["reference_number"]
    
    # Valid status
    patch_res = client.patch(f"/api/v1/municipal/complaints/{ref}/status", json={"status": "Under Review"})
    assert patch_res.status_code == 200
    
    detail_res = client.get(f"/api/v1/municipal/complaints/{ref}")
    assert detail_res.json()["status"] == "Under Review"
    
    # Invalid status
    patch_res_bad = client.patch(f"/api/v1/municipal/complaints/{ref}/status", json={"status": "FAKE_STATUS"})
    assert patch_res_bad.status_code == 400
