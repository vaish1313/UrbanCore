import time
import requests
from loguru import logger

API_URL = "http://localhost:8000/api/v1"

def register_user():
    # Attempt to register
    user_data = {
        "email": f"testuser_{int(time.time())}@example.com",
        "password": "Password123!",
        "full_name": "Test User",
        "role": "CITIZEN"
    }
    logger.info(f"Registering user {user_data['email']}")
    r = requests.post(f"{API_URL}/auth/register", json=user_data)
    r.raise_for_status()
    token = r.json()["access_token"]
    return token

def poll_analyze(token, bbox):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "min_lat": bbox[0],
        "min_lon": bbox[1],
        "max_lat": bbox[2],
        "max_lon": bbox[3],
        "years": [2022, 2023]
    }
    
    logger.info("Submitting analyze request...")
    r = requests.post(f"{API_URL}/citizen/analyze", json=payload, headers=headers)
    r.raise_for_status()
    resp = r.json()
    
    logger.info("Initial response timeline:")
    for yr in resp["timeline"]:
        logger.info(f"Year {yr['year']}: Status={yr['status']}, from_cache={yr['from_cache']}")
    
    # Poll until all years are COMPLETED or FAILED
    max_retries = 30
    for i in range(max_retries):
        time.sleep(10)
        logger.info(f"Polling ({i+1}/{max_retries})...")
        try:
            r = requests.post(f"{API_URL}/citizen/analyze", json=payload, headers=headers)
            r.raise_for_status()
            resp = r.json()
            
            statuses = [yr['status'] for yr in resp['timeline']]
            logger.info(f"Current statuses: {statuses}")
            if all(s in ["COMPLETED", "FAILED"] for s in statuses):
                break
        except requests.exceptions.ConnectionError as e:
            logger.warning(f"Connection error during polling, retrying... {e}")
            continue
            
    return resp

def run_integration_test():
    token = register_user()
    
    # Tiny bbox in Nashik (approx 2km)
    # The analyze endpoint requires approx 0.018 lat/lon diff
    bbox = [19.990, 73.780, 20.008, 73.798]
    
    # First run (Cache miss)
    logger.info("--- TEST 1: First Run (Cache Miss) ---")
    final_resp = poll_analyze(token, bbox)
    
    for yr in final_resp["timeline"]:
        if yr["status"] == "FAILED":
            logger.error(f"Pipeline failed for year {yr['year']}")
        else:
            logger.info(f"Year {yr['year']} built_up_pct: {yr.get('built_up_pct')}")
    
    # Second run (Cache hit)
    logger.info("--- TEST 2: Second Run (Cache Hit) ---")
    start_time = time.time()
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "min_lat": bbox[0],
        "min_lon": bbox[1],
        "max_lat": bbox[2],
        "max_lon": bbox[3],
        "years": [2022, 2023]
    }
    r = requests.post(f"{API_URL}/citizen/analyze", json=payload, headers=headers)
    r.raise_for_status()
    hit_resp = r.json()
    duration = time.time() - start_time
    
    logger.info(f"Cache hit response time: {duration:.2f}s")
    for yr in hit_resp["timeline"]:
        logger.info(f"Year {yr['year']}: Status={yr['status']}, from_cache={yr['from_cache']}")
        assert yr['from_cache'] is True, "Expected from_cache to be True on second request!"
        
    logger.info("Integration test complete.")

if __name__ == "__main__":
    run_integration_test()
