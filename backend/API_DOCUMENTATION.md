# UrbanCore API Documentation

Base URL: `http://localhost:8000` (development)

API Version: `v1`

All API endpoints are prefixed with `/api/v1`

## Authentication

### Register New User

**Endpoint:** `POST /api/v1/auth/register`

**Description:** Register a new user account with Supabase.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "address": "123 Main St, City, Country",
  "role": "CITIZEN"
}
```

**Fields:**
- `email` (required): Valid email address
- `password` (required): Minimum 8 characters
- `full_name` (required): User's full name
- `phone` (optional): Contact phone number
- `address` (optional): Physical address
- `role` (required): One of `CITIZEN`, `BUILDER`, `MUNICIPAL_CORP`

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St, City, Country",
    "role": "CITIZEN"
  }
}
```

**Error Responses:**
- `202`: Account created but email confirmation required
- `400`: Invalid request (validation error)
- `409`: Email already registered
- `503`: Supabase not configured

---

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "CITIZEN"
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `503`: Supabase not configured

**Usage:**
Include the access token in subsequent requests:
```
Authorization: Bearer <access_token>
```

---

## Location Services

### Search Locations

**Endpoint:** `GET /api/v1/locations/search`

**Description:** Search for locations using OpenStreetMap Nominatim. Supports place names and direct coordinates.

**Query Parameters:**
- `q` (required): Search query (2-180 characters)

**Examples:**
```
GET /api/v1/locations/search?q=Nashik, India
GET /api/v1/locations/search?q=20.0059, 73.7912
GET /api/v1/locations/search?q=Times Square, New York
```

**Success Response (200):**
```json
[
  {
    "label": "Nashik, Maharashtra, India",
    "latitude": 19.997454,
    "longitude": 73.789803
  },
  {
    "label": "Nashik District, Maharashtra, India",
    "latitude": 20.2500,
    "longitude": 73.8000
  }
]
```

**Coordinate Input Response:**
```json
[
  {
    "label": "20.005900, 73.791200",
    "latitude": 20.0059,
    "longitude": 73.7912
  }
]
```

**Error Responses:**
- `400`: Invalid query (too short/long)
- `502`: Nominatim service unavailable

---

## Analysis Pipeline

### Create Analysis

**Endpoint:** `POST /api/v1/analyses`

**Description:** Create a new construction detection analysis. Submits Earth Engine export tasks for satellite imagery from the last 5 years.

**Request Body:**
```json
{
  "latitude": 20.0059,
  "longitude": 73.7912,
  "radius_m": 2000,
  "end_year": 2026
}
```

**Fields:**
- `latitude` (required): Center latitude (-90 to 90)
- `longitude` (required): Center longitude (-180 to 180)
- `radius_m` (optional): Radius in meters (100-2000, default: 2000)
- `end_year` (optional): End year for analysis (default: current year)

**Note:** Analysis will cover years from `(end_year - 5)` to `end_year` inclusive.

**Success Response (200):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "queued",
  "latitude": 20.0059,
  "longitude": 73.7912,
  "radius_m": 2000,
  "start_year": 2021,
  "end_year": 2026,
  "years": [2021, 2022, 2023, 2024, 2025, 2026],
  "gee_tasks": [],
  "downloads": {},
  "inference_results": {},
  "visualization_results": {},
  "error": null,
  "created_at": "2026-09-21T10:30:00.000Z",
  "updated_at": "2026-09-21T10:30:00.000Z"
}
```

**Process Flow:**
1. Analysis record created with unique ID
2. Background task starts immediately
3. GEE export tasks submitted for each year
4. Status updates as processing progresses

---

### Get Analysis Status

**Endpoint:** `GET /api/v1/analyses/{analysis_id}`

**Description:** Get current status and results of an analysis.

**Path Parameters:**
- `analysis_id`: UUID of the analysis

**Example:**
```
GET /api/v1/analyses/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Success Response (200):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "exports_submitted",
  "latitude": 20.0059,
  "longitude": 73.7912,
  "radius_m": 2000,
  "start_year": 2021,
  "end_year": 2026,
  "years": [2021, 2022, 2023, 2024, 2025, 2026],
  "gee_tasks": [
    {
      "year": 2021,
      "filename": "urbancore_a1b2c3d4_2021.tif",
      "gee_task_id": "GEE_TASK_ID_1",
      "status": "submitted",
      "drive_folder": "UrbanCore_Data"
    },
    ...
  ],
  "downloads": {},
  "inference_results": {},
  "visualization_results": {},
  "error": null,
  "message": "GEE exports submitted. Check back in 5-15 minutes.",
  "created_at": "2026-09-21T10:30:00.000Z",
  "updated_at": "2026-09-21T10:31:30.000Z"
}
```

**Status Values:**
| Status | Description |
|--------|-------------|
| `queued` | Analysis created, not yet started |
| `exporting` | Submitting Earth Engine export tasks |
| `exports_submitted` | Export tasks submitted to GEE |
| `monitoring_exports` | Waiting for exports to complete |
| `exports_completed` | GeoTIFFs ready in Google Drive |
| `downloading` | Downloading files from Drive |
| `processing` | Running UNet inference |
| `visualizing` | Creating SAM-3D visualizations |
| `completed` | Analysis finished successfully |
| `failed` | An error occurred (check `error` field) |

**Error Responses:**
- `404`: Analysis not found

**Polling:**
Poll this endpoint every 30-60 seconds to check progress:
```javascript
const checkStatus = async (analysisId) => {
  const response = await fetch(`/api/v1/analyses/${analysisId}`);
  const data = await response.json();
  
  if (data.status === 'completed') {
    // Process results
  } else if (data.status === 'failed') {
    // Handle error
    console.error(data.error);
  } else {
    // Still processing, check again later
    setTimeout(() => checkStatus(analysisId), 30000);
  }
};
```

---

### Trigger Processing

**Endpoint:** `POST /api/v1/analyses/{analysis_id}/process`

**Description:** Manually trigger download and processing of exported imagery. Call this after confirming GEE exports are complete.

**Path Parameters:**
- `analysis_id`: UUID of the analysis

**Example:**
```
POST /api/v1/analyses/a1b2c3d4-e5f6-7890-abcd-ef1234567890/process
```

**Success Response (200):**
```json
{
  "message": "Processing started",
  "analysis_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "queued_for_processing"
}
```

**Error Responses:**
- `404`: Analysis not found
- `400`: Cannot process (wrong status)

**Requirements:**
- Analysis status must be `exports_completed` or `failed`
- GeoTIFF files must be available in Google Drive

**What This Does:**
1. Downloads GeoTIFF files from Google Drive
2. Runs UNet inference for construction detection
3. Generates SAM-3D semantic segmentation
4. Creates GeoJSON visualization files
5. Updates analysis status to `completed`

---

### Get Year Results

**Endpoint:** `GET /api/v1/analyses/{analysis_id}/results/{year}`

**Description:** Get detailed results for a specific year.

**Path Parameters:**
- `analysis_id`: UUID of the analysis
- `year`: Year to retrieve (must be in analysis year range)

**Example:**
```
GET /api/v1/analyses/a1b2c3d4-e5f6-7890-abcd-ef1234567890/results/2026
```

**Success Response (200):**
```json
{
  "year": 2026,
  "analysis_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "inference": {
    "mask_path": "data/analyses/a1b2c3d4/inference/2026/urbancore_a1b2c3d4_2026_mask.tif",
    "geojson_path": "data/analyses/a1b2c3d4/inference/2026/urbancore_a1b2c3d4_2026_construction.geojson",
    "total_pixels": 1000000,
    "construction_pixels": 152000,
    "construction_percentage": 15.2,
    "metadata": {
      "crs": "EPSG:32643",
      "transform": [...],
      "bounds": [...],
      "width": 1000,
      "height": 1000
    }
  },
  "visualization": {
    "geojson_path": "data/analyses/a1b2c3d4/visualization/2026/urbancore_a1b2c3d4_2026_visualization.geojson",
    "categories": ["building", "road", "water", "vegetation", "ground"],
    "statistics": {
      "building": {
        "pixel_count": 61000,
        "percentage": 6.1
      },
      "road": {
        "pixel_count": 36000,
        "percentage": 3.6
      },
      "water": {
        "pixel_count": 12000,
        "percentage": 1.2
      },
      "vegetation": {
        "pixel_count": 350000,
        "percentage": 35.0
      },
      "ground": {
        "pixel_count": 541000,
        "percentage": 54.1
      }
    }
  }
}
```

**Error Responses:**
- `404`: Analysis or year not found
- `400`: Analysis not completed yet

**Using the Results:**

The GeoJSON files can be loaded directly into map libraries:

```javascript
// Leaflet example
const constructionLayer = L.geoJSON(constructionData, {
  style: (feature) => ({
    color: feature.properties.color,
    weight: 2,
    fillOpacity: 0.5
  })
}).addTo(map);

// React Leaflet example
<GeoJSON 
  data={visualizationData}
  style={(feature) => ({
    color: feature.properties.color,
    fillOpacity: 0.6
  })}
/>
```

---

## Health Check

### Health Status

**Endpoint:** `GET /health`

**Description:** Check if the API is running.

**Success Response (200):**
```json
{
  "status": "ok",
  "message": "UrbanCore API is running"
}
```

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `202`: Accepted (e.g., email confirmation required)
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid credentials)
- `404`: Not Found
- `409`: Conflict (e.g., duplicate email)
- `502`: Bad Gateway (external service error)
- `503`: Service Unavailable

**Error Response Format:**
```json
{
  "detail": "Error message describing what went wrong"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Implement rate limiting per IP/user
- Use Redis for distributed rate limiting
- Set reasonable limits (e.g., 10 analyses per hour)

---

## CORS

CORS is enabled for configured origins (see `CORS_ORIGINS` in `.env`).

Default allowed origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)

---

## Complete Workflow Example

### 1. User Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@example.com",
    "password": "secure123",
    "full_name": "Jane Citizen",
    "role": "CITIZEN"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@example.com",
    "password": "secure123"
  }'
```

### 3. Search Location
```bash
curl "http://localhost:8000/api/v1/locations/search?q=Nashik,%20India"
```

### 4. Create Analysis
```bash
curl -X POST http://localhost:8000/api/v1/analyses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "latitude": 20.0059,
    "longitude": 73.7912,
    "radius_m": 2000,
    "end_year": 2026
  }'
```

### 5. Monitor Status
```bash
# Poll every 30 seconds
curl http://localhost:8000/api/v1/analyses/ANALYSIS_ID
```

### 6. Trigger Processing (after exports complete)
```bash
curl -X POST http://localhost:8000/api/v1/analyses/ANALYSIS_ID/process \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Get Results
```bash
curl http://localhost:8000/api/v1/analyses/ANALYSIS_ID/results/2026
```

---

## Interactive Documentation

Visit these URLs when the server is running:

- **Swagger UI:** http://localhost:8000/docs
  - Interactive API testing interface
  - Try out endpoints directly from browser
  
- **ReDoc:** http://localhost:8000/redoc
  - Clean, readable API documentation
  - Better for reference

---

## WebSocket Support (Future)

Future versions may include WebSocket support for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/analyses/ANALYSIS_ID');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Status update:', update.status);
};
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
class UrbanCoreClient {
  private baseUrl = 'http://localhost:8000/api/v1';
  private token: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async createAnalysis(lat: number, lon: number, radius = 2000) {
    const response = await fetch(`${this.baseUrl}/analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        radius_m: radius,
        end_year: new Date().getFullYear()
      })
    });
    return response.json();
  }

  async getAnalysis(id: string) {
    const response = await fetch(`${this.baseUrl}/analyses/${id}`);
    return response.json();
  }

  async pollUntilComplete(id: string, interval = 30000): Promise<any> {
    while (true) {
      const analysis = await this.getAnalysis(id);
      
      if (analysis.status === 'completed') {
        return analysis;
      } else if (analysis.status === 'failed') {
        throw new Error(analysis.error);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}
```

### Python

```python
import requests
import time

class UrbanCoreClient:
    def __init__(self, base_url='http://localhost:8000/api/v1'):
        self.base_url = base_url
        self.token = None
    
    def login(self, email, password):
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        )
        data = response.json()
        self.token = data['access_token']
        return data
    
    def create_analysis(self, lat, lon, radius=2000):
        response = requests.post(
            f'{self.base_url}/analyses',
            json={
                'latitude': lat,
                'longitude': lon,
                'radius_m': radius,
                'end_year': 2026
            },
            headers={'Authorization': f'Bearer {self.token}'}
        )
        return response.json()
    
    def get_analysis(self, analysis_id):
        response = requests.get(f'{self.base_url}/analyses/{analysis_id}')
        return response.json()
    
    def poll_until_complete(self, analysis_id, interval=30):
        while True:
            analysis = self.get_analysis(analysis_id)
            
            if analysis['status'] == 'completed':
                return analysis
            elif analysis['status'] == 'failed':
                raise Exception(analysis['error'])
            
            time.sleep(interval)
```

---

## Support

For questions or issues:
1. Check the README.md for setup instructions
2. Review GEE_SETUP.md for Earth Engine configuration
3. Check server logs for detailed error messages
4. Verify all environment variables are configured correctly
