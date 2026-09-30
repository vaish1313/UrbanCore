"""
Backend startup script with verbose logging
"""
import sys
import time
import os

# Set UTF-8 encoding for Windows console
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8')

print("=" * 60)
print("UrbanCore Backend Starting...")
print("=" * 60)

print("\n[1/5] Loading configuration...")
start = time.time()
from app.config import settings
print(f"    [OK] Configuration loaded ({time.time() - start:.2f}s)")

print("\n[2/5] Initializing Google Earth Engine...")
start = time.time()
from app.gee_service import gee_service
print(f"    [OK] GEE initialized ({time.time() - start:.2f}s)")

print("\n[3/5] Initializing Google Cloud Storage...")
start = time.time()
from app.gcs_service import gcs_service
print(f"    [OK] GCS initialized ({time.time() - start:.2f}s)")

print("\n[4/5] Loading U-Net model...")
start = time.time()
from app.model_service import model_service
print(f"    [OK] Model service ready ({time.time() - start:.2f}s)")

print("\n[5/5] Starting FastAPI application...")
start = time.time()
from app.main import app
print(f"    [OK] FastAPI app created ({time.time() - start:.2f}s)")

print("\n" + "=" * 60)
print("[SUCCESS] All services initialized successfully!")
print("=" * 60)
print("\nStarting Uvicorn server on http://0.0.0.0:8000")
print("API Documentation: http://localhost:8000/docs")
print("=" * 60 + "\n")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
