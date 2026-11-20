# UrbanCore

> AI-powered urban intelligence platform for satellite-based land change detection, builder site suitability, and municipal compliance management — built for Nashik, Maharashtra.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
  - [Citizen Dashboard](#-citizen-dashboard)
  - [Builder Dashboard](#-builder-dashboard)
  - [Municipal Dashboard](#-municipal-dashboard)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)

---

## Overview

UrbanCore is a full-stack geospatial intelligence platform that combines satellite imagery, AI inference, and interactive 3D visualisation to serve three distinct user roles:

| Role | Purpose |
|---|---|
| **Citizen** | Detect new construction near a pinned location using satellite AI analysis |
| **Builder** | Evaluate land parcels for terrain suitability, zoning constraints and regulatory risk |
| **Municipal Corporation** | Track, review and act on construction compliance cases and citizen complaints |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)            │
│  TanStack Router · Three.js · Mapbox GL · Tailwind   │
└────────────────────┬────────────────────────────────┘
                     │  REST  /api/v1
┌────────────────────▼────────────────────────────────┐
│               Backend (FastAPI + Python)              │
│  GEE · UNet Inference · PostGIS · SQLite · Supabase  │
└─────────────────────────────────────────────────────┘
```

---

## Features

### 🏘 Citizen Dashboard

**Interactive Map & Location Search**
- Search any location by name (geocoded via backend) or drop a pin on a Mapbox satellite map
- Auto-detects and highlights the selected area

**Satellite Analysis Pipeline**
- Submit a 2 km radius analysis around any coordinates
- Backend submits Google Earth Engine (GEE) export tasks for 6 years of Sentinel-2 imagery
- Real-time progress tracking through 9 pipeline stages: `queued → exporting → downloading → processing → completed`
- UNet deep learning model runs inference to classify each grid cell as: **Non-built-up**, **Existing construction**, or **New construction**

**Land Change Explorer** *(the main UI feature)*
- Interactive 3D block grid rendered with Three.js / `@react-three/fiber` using `InstancedMesh`
- Each cell is extruded by its built-up height score; colour-coded by class (green / orange / red)
- **Year timeline slider** — scrub or auto-play through 2021–2026; grid updates live
- **Changes only mode** — dims unchanged cells, highlights only new construction
- **3D / Top view toggle** — smooth camera tween between perspective and orthographic
- **Auto-rotate** — continuous orbit animation with pause on interaction
- **Click any red block** to open the detail panel
- **Before/After satellite comparison** — drag slider to compare real Mapbox satellite imagery between two years
- **Show on Map** — flies a Mapbox map to the exact cell location with a red polygon overlay and popup
- **Cell list** — searchable, sortable list of all new construction cells with detection year and height
- **Stats strip** — Built-up %, New Construction Cells count, Total Change since start year

**Complaint / Report System**
- Citizens can file a concern directly from the Land Change Explorer
- Generates a reference number and downloadable PDF receipt

---

### 🏗 Builder Dashboard

**AOI (Area of Interest) Browser**
- Lists all 30 pre-loaded Nashik AOIs with search, category filter (`residential / commercial / industrial / protected / highway / dam`) and status filter (`green / yellow / red`)
- Each AOI card shows name, village, area, suitability score and status badge

**Terrain Analysis**
- Powered by Copernicus GLO-30 DEM raster (30 m resolution)
- Metrics per AOI: mean elevation, min/max elevation, mean slope, max slope, flat-land %, terrain roughness
- Arbitrary coordinate lookup — enter any lat/lng and get instant terrain metrics

**Land Suitability Scoring**
- 3-component weighted score (slope 40%, flat-land 15%, roughness 20%)
- Drainage/flood risk component is explicitly marked `UNAVAILABLE` (no fabricated scores)
- Warnings when localized steep slopes exist even if mean is low
- Overall `GREEN / YELLOW / RED` verdict with detailed breakdown

**Zoning & Regulatory Constraints**
- True PostGIS geodesic intersection against constraint layers: `RIVER`, `FOREST`, `HIGHWAY`, `LAKE`, `WATERBODY`
- Returns intersection area in hectares and % overlap per layer
- Status: `ASSESSED_NO_INTERSECTION`, `POTENTIAL_RESTRICTION_REVIEW`, or `CONFIRMED_BLOCKER`

**Construction History**
- 5-year timeline of construction activity per AOI
- Visual chart of built-up change over time

**Site Readiness Report**
- Consolidated PDF-style report combining terrain, constraints, suitability and history

---

### 🏛 Municipal Dashboard

**Compliance Cases**
- Lists all municipal compliance cases with pagination, status filter and year filter
- Statuses: `pending_review`, `under_investigation`, `notice_issued`, `resolved`, `closed`
- Case detail view with full metadata, coordinates and evidence

**Case Status Management**
- Municipal officers can update case status directly from the dashboard
- Full audit trail of status changes

**Complaints Management**
- View all citizen-submitted complaints
- Filter by status, search by reference number or location
- Update complaint status and add resolution notes

**District Map**
- Interactive Mapbox map of all AOIs and cases across Nashik
- Colour-coded markers by status

**Encroachment Tracker**
- Dedicated view for encroachment-type cases with map overlay

**Heatmap**
- Construction activity heatmap across the district

**Legal & Export**
- Export case data
- Legal documentation view

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| TanStack Router | File-based routing |
| Vite 8 | Build tool & dev server |
| Three.js / `@react-three/fiber` | 3D grid rendering |
| `react-map-gl` + Mapbox GL | Interactive maps |
| Tailwind CSS | Styling |
| `motion/react` (Framer Motion) | Animations |
| Zustand | Global state (land change store) |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python 3.11+ | Runtime |
| Google Earth Engine (GEE) | Satellite imagery export |
| UNet (PyTorch) | Land classification inference |
| Rasterio + NumPy | DEM / raster processing |
| PostGIS / SQLAlchemy | Geospatial database |
| SQLite | Local development fallback |
| Supabase | Auth & cloud database |
| Google Cloud Storage | Satellite imagery storage |
| ReportLab | PDF generation |

---

## Project Structure

```
UrbanCore/
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                  # Typed API client + Zod schemas
│   │   ├── components/
│   │   │   ├── land-change/      # Land Change Explorer components
│   │   │   └── urbancore/        # Citizen / Builder / Municipal UI
│   │   ├── hooks/                # Custom React hooks
│   │   ├── routes/               # TanStack file-based routes
│   │   │   ├── builder/          # Builder dashboard pages
│   │   │   └── municipal/        # Municipal dashboard pages
│   │   ├── scene/                # Three.js 3D scene components
│   │   └── store/                # Zustand stores
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + analysis endpoints
│   │   ├── auth.py               # Register / login
│   │   ├── service.py            # Analysis pipeline orchestration
│   │   ├── gee_service.py        # Google Earth Engine integration
│   │   ├── model_service.py      # UNet inference
│   │   ├── terrain_service.py    # DEM / slope analysis
│   │   ├── suitability_service.py# Land suitability scoring
│   │   ├── builder_router.py     # Builder API endpoints
│   │   ├── municipal_router.py   # Municipal cases API
│   │   └── complaints_router.py  # Citizen complaints API
│   └── data/
│       ├── dem/                  # Copernicus GLO-30 DEM raster
│       └── builder/              # Nashik AOI GeoJSON boundaries
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL with PostGIS extension (or SQLite for local dev)
- Google Earth Engine service account (for live satellite analysis)
- Mapbox account (for interactive maps)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# Start the server
python start.py
# or: uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env — at minimum set VITE_MAPBOX_TOKEN

# Start dev server
npm run dev
```

Open `http://localhost:8080` in your browser.

---

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_URL=/api/v1
VITE_USE_MOCK=false
VITE_MAPBOX_TOKEN=your_mapbox_public_token
```

> `VITE_API_URL=/api/v1` uses the Vite dev proxy so the browser stays same-origin.  
> `VITE_USE_MOCK=true` enables the offline mock layer — no backend needed.

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/urbancore
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GEE_SERVICE_ACCOUNT_EMAIL=your_gee_service_account@project.iam.gserviceaccount.com
GEE_PRIVATE_KEY_PATH=app/gee_key.json
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id
GCS_BUCKET_NAME=your_gcs_bucket
```

> Never commit `.env` files. Add them to `.gitignore`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Login and get token |
| `GET` | `/api/v1/locations/search?q=` | Geocode a location name |
| `POST` | `/api/v1/analyses` | Submit a new satellite analysis |
| `GET` | `/api/v1/analyses/{id}` | Poll analysis status |
| `GET` | `/api/v1/analyses/{id}/results/{year}` | Get per-year inference results |
| `GET` | `/api/v1/analyses/{id}/geojson/{year}/{type}` | Download GeoJSON for a year |
| `GET` | `/api/v1/builder/aois` | List all builder AOIs |
| `GET` | `/api/v1/builder/aois/{id}` | Get a single AOI |
| `GET` | `/api/v1/builder/terrain/coordinate?lat=&lng=` | Terrain metrics for any coordinate |
| `GET` | `/api/v1/builder/violations/constraints/{id}` | Zoning constraint intersections |
| `GET` | `/api/v1/municipal/cases` | List municipal compliance cases |
| `GET` | `/api/v1/municipal/cases/{id}` | Get case detail |
| `PATCH` | `/api/v1/municipal/cases/{id}/status` | Update case status |
| `POST` | `/api/v1/complaints` | Submit a citizen complaint |
| `GET` | `/api/v1/complaints/{id}/receipt` | Download PDF receipt |

Full interactive API docs available at `http://localhost:8000/docs` when backend is running.

---

## Screenshots

| Citizen — Land Change Explorer | Builder — Suitability Score |
|---|---|
| 3D grid with red new-construction blocks | Terrain + constraint breakdown |

| Municipal — Compliance Cases | Show on Map |
|---|---|
| Case list with status filters | Mapbox satellite map with cell polygon |

---

<div align="center">
  <sub>Built for Nashik, Maharashtra · Final Year Project · UrbanCore Team</sub>
</div>
