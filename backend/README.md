# UrbanCore Backend

FastAPI backend for UrbanCore - Construction Detection & Urban Planning Platform

## Overview

This backend provides a complete pipeline for detecting unauthorized construction using satellite imagery:

1. **User Authentication** - Supabase integration for citizen/builder/municipal login
2. **Location Search** - OpenStreetMap geocoding
3. **Satellite Imagery Export** - Google Earth Engine exports Sentinel-2 imagery (last 5 years)
4. **Construction Detection** - UNet model performs pixel-wise binary classification
5. **Semantic Segmentation** - SAM-3D creates detailed visualizations (buildings, roads, water, etc.)
6. **Visualization** - GeoJSON outputs for interactive map display

## Complete Workflow

### 1. User Login via Citizen Portal

```python
POST /api/v1/auth/register
POST /api/v1/auth/login
```

User credentials are stored in Supabase. The backend proxies authentication requests.

### 2. Location Selection

User selects location via:
- GPS coordinates (current location)
- Search bar (OpenStreetMap Nominatim)

```python
GET /api/v1/locations/search?q=Nashik,%20India
GET /api/v1/locations/search?q=20.0059,73.7912
```

### 3. Analysis Creation

When user confirms location, frontend sends analysis request:

```python
POST /api/v1/analyses
{
  "latitude": 20.0059,
  "longitude": 73.7912,
  "radius_m": 2000,  # 2km radius
  "end_year": 2026   # Will fetch 2021-2026
}
```

**Backend Actions:**
- Creates analysis record with unique ID
- Submits 6 Google Earth Engine export tasks (one per year: 2021-2026)
- Each task exports Sentinel-2 imagery as cloud-optimized GeoTIFF
- Exports are saved to Google Drive folder: `UrbanCore_Data`

**Response:**
```json
{
  "id": "abc-123-def",
  "status": "exporting",
  "years": [2021, 2022, 2023, 2024, 2025, 2026],
  ...
}
```

### 4. Monitor Export Status

Frontend polls for status updates:

```python
GET /api/v1/analyses/{analysis_id}
```

**Status Flow:**
- `queued` → `exporting` → `exports_submitted` → `monitoring_exports` → `exports_completed`

GEE exports typically take 5-15 minutes depending on area size and cloud cover.

### 5. Process Downloaded Imagery

Once exports complete, trigger processing:

```python
POST /api/v1/analyses/{analysis_id}/process
```

**Backend Actions:**

#### a) Download from Google Drive
- Connects to Google Drive API using service account
- Downloads all `.tif` files for the analysis
- Saves to `data/analyses/{analysis_id}/downloads/`

#### b) UNet Inference
For each year (2021-2026):
- Loads GeoTIFF (4 bands: Blue, Green, Red, NIR)
- Normalizes and preprocesses imagery
- Runs through trained UNet model (`outputs/best_unet_urbancore.pth`)
- **Output:** Binary mask where:
  - `1` = Construction detected
  - `0` = No construction
- **Pixel-wise classification** - each pixel is independently classified
- Saves mask as GeoTIFF and converts to GeoJSON polygons

#### c) SAM-3D Semantic Segmentation
For each year:
- Takes original imagery + UNet construction mask
- Classifies pixels into categories:
  - **Building** - Structures detected with higher reflectance
  - **Road** - Paved surfaces with moderate reflectance
  - **Water** - Rivers and water bodies (high NDWI)
  - **Vegetation** - Trees and plants (high NDVI)
  - **Ground** - Bare soil and open areas
- Creates colored GeoJSON for visualization

**Note:** Current implementation uses spectral indices (NDVI, NDWI) as a fallback. Full SAM-3D integration requires the Hugging Face model.

#### d) Generate Comparison Data
- Compares construction across years pixel-by-pixel
- Identifies new construction by comparing masks:
  - Year N: pixel = 0 (no construction)
  - Year N+1: pixel = 1 (construction) → **NEW CONSTRUCTION**
- Calculates statistics:
  - Total construction pixels
  - Construction percentage
  - Per-category breakdown

### 6. Retrieve Results

Get detailed results for a specific year:

```python
GET /api/v1/analyses/{analysis_id}/results/{year}
```

**Response:**
```json
{
  "year": 2026,
  "analysis_id": "abc-123-def",
  "inference": {
    "mask_path": "...",
    "geojson_path": ".../construction.geojson",
    "construction_pixels": 125000,
    "construction_percentage": 15.2,
    "metadata": { "crs": "...", "bounds": [...] }
  },
  "visualization": {
    "geojson_path": ".../visualization.geojson",
    "categories": ["building", "road", "water", "vegetation", "ground"],
    "statistics": {
      "building": { "pixel_count": 50000, "percentage": 6.1 },
      "road": { "pixel_count": 30000, "percentage": 3.6 },
      ...
    }
  }
}
```

### 7. Frontend Visualization

Frontend displays:
- OpenStreetMap base layer
- For each year (2021-2026):
  - GeoJSON overlay showing construction areas
  - Color-coded semantic categories
  - Interactive comparison slider
  - Statistics panel

Users can:
- Toggle between years
- Compare any two years side-by-side
- View construction growth timeline
- Export reports

## Architecture Components

### `main.py`
FastAPI application with endpoints for auth, location search, and analysis.

### `auth.py`
Supabase authentication integration for user registration and login.

### `service.py`
Main orchestration logic for the analysis pipeline.

### `gee_service.py`
Google Earth Engine integration:
- Sentinel-2 imagery filtering and export
- Task monitoring

### `drive_service.py`
Google Drive integration:
- File search in Drive folder
- Download exported GeoTIFFs

### `model_service.py`
UNet model inference:
- Loads trained checkpoint
- Pixel-wise construction detection
- GeoJSON conversion

### `sam3d_service.py`
Semantic segmentation for detailed visualization:
- Multi-class pixel classification
- Category-based visualization
- Statistics calculation

### `config.py`
Application configuration from environment variables.

### `schemas.py`
Pydantic models for request/response validation.

## Configuration

### Required Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_PROJECT_ID=xxx

# Google Earth Engine
GEE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=/path/to/gee_key.json
GOOGLE_DRIVE_FOLDER_ID=xxx
GOOGLE_DRIVE_FOLDER_NAME=UrbanCore_Data

# Model
UNET_CHECKPOINT_PATH=../outputs/best_unet_urbancore.pth
DEVICE=cuda  # or 'cpu'
ENABLE_SAM=true
SAM_3D_MODEL=facebook/sam-3d-body-dinov3
HF_TOKEN=hf_xxx

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Service Account Setup

1. **Google Cloud Project**
   - Create project in Google Cloud Console
   - Enable Earth Engine API
   - Enable Google Drive API

2. **Service Account**
   - Create service account
   - Download JSON key file → save as `gee_key.json`
   - Add to Earth Engine: https://code.earthengine.google.com
   - Share Google Drive folder with service account email

3. **Backend Configuration**
   - Place `gee_key.json` in backend directory
   - Update `GEE_PRIVATE_KEY_PATH` in `.env`

## Running the Backend

### Development (Windows)

```powershell
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Development (Linux/Mac)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# With Docker
docker build -t urbancore-backend .
docker run -p 8000:8000 urbancore-backend

# Or with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Model Details

### UNet Architecture
- **Input:** 4-band Sentinel-2 imagery (Blue, Green, Red, NIR)
- **Output:** Binary segmentation mask (construction vs. no construction)
- **Training:** Trained on labeled satellite imagery
- **Checkpoint:** `outputs/best_unet_urbancore.pth`

### SAM-3D (Planned)
- **Purpose:** Multi-class semantic segmentation
- **Categories:** Building, Road, Water, Vegetation, Ground
- **Model:** `facebook/sam-3d-body-dinov3` (Hugging Face)
- **Current:** Using spectral index fallback (NDVI, NDWI)

## Data Flow

```
User Location → GEE Export → Google Drive → Download → UNet → SAM-3D → GeoJSON → Frontend
     ↓              ↓             ↓             ↓         ↓        ↓          ↓
  (lat,lon)    (Sentinel-2)   (.tif)      (local)   (binary)  (semantic) (visualization)
   + radius     6 years       2km area     storage    mask      classes     layers
```

## File Outputs

For analysis ID `abc-123-def`:

```
data/analyses/abc-123-def/
├── downloads/
│   ├── urbancore_abc-123-def_2021.tif
│   ├── urbancore_abc-123-def_2022.tif
│   └── ...
├── inference/
│   ├── 2021/
│   │   ├── urbancore_abc-123-def_2021_mask.tif
│   │   └── urbancore_abc-123-def_2021_construction.geojson
│   └── ...
└── visualization/
    ├── 2021/
    │   └── urbancore_abc-123-def_2021_visualization.geojson
    └── ...
```

## Troubleshooting

### GEE Export Fails
- Verify service account has Earth Engine access
- Check Google Cloud project quotas
- Ensure coordinates are valid and area isn't too large

### Download Fails
- Verify Drive folder is shared with service account
- Check folder ID matches configuration
- Wait for GEE exports to complete first

### Model Inference Fails
- Ensure model checkpoint exists at configured path
- Check CUDA availability if using GPU
- Verify input GeoTIFF has 4 bands

## Next Steps

1. **Complete SAM-3D Integration** - Replace spectral fallback with actual model
2. **Persistent Storage** - Replace in-memory store with database (PostgreSQL)
3. **File Serving** - Add endpoints to serve GeoJSON files directly
4. **WebSocket Updates** - Real-time status updates instead of polling
5. **Batch Processing** - Process multiple analyses in parallel
6. **Caching** - Cache geocoding and completed analyses

## License

Proprietary - UrbanCore Final Year Project
