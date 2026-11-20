# UrbanCore API Contract — Land Change Explorer

Frontend-only discovery of the existing backend. **No backend changes.**

Base URL: `VITE_API_URL` (e.g. `/api/v1` via Vite proxy, or `http://localhost:8000/api/v1`).

---

## Endpoints used by Land Change Explorer

### `GET /health`
- **Response:** `{ status: string, message: string }`

### `GET /locations/search?q={query}`
- **Query:** `q` (2–180 chars)
- **Response:** `GeocodeResult[]`
  ```ts
  { label: string; latitude: number; longitude: number }
  ```
- Used for location chip / Scan target. Analysis records store only lat/lng — no place name.

### `POST /analyses`
- **Body (`AnalysisRequest`):**
  ```ts
  {
    latitude: number;   // -90..90
    longitude: number;  // -180..180
    radius_m?: number;  // default 2000, max 2000
    end_year?: number;  // default current year
  }
  ```
- **Response:** analysis record (see below). Status starts as `"queued"`.
- Years are **always** `[end_year - 5 … end_year]` (6 years). Example for 2026 → `2021…2026`.

### `GET /analyses/{analysis_id}`
- **Response:** full analysis record
  ```ts
  {
    id: string;
    status:
      | "queued" | "checking_cache" | "exporting" | "exports_submitted"
      | "monitoring_exports" | "exports_completed" | "downloading"
      | "processing" | "visualizing" | "completed" | "failed"
      | "queued_for_processing";
    latitude: number;
    longitude: number;
    radius_m: number;
    start_year: number;
    end_year: number;
    years: number[];
    gee_tasks: unknown[];
    downloads: Record<string, string>;
    inference_results: Record<string, InferenceYearResult>;
    visualization_results: Record<string, VisualizationYearResult>;
    error: string | null;
    created_at: string;
    updated_at: string;
  }
  ```

### `InferenceYearResult` (per year key as string, e.g. `"2021"`)
```ts
{
  mask_path: string;           // server filesystem path — not HTTP-accessible
  geojson_path: string;        // server filesystem path
  total_pixels: number;
  construction_pixels: number;
  construction_percentage: number; // 0–100
  metadata?: {
    crs: string;               // e.g. "EPSG:4326"
    transform: number[];       // affine 9-tuple
    bounds: [west, south, east, north];
    width: number;
    height: number;
  };
  compliance?: unknown[];      // optional enrichment
}
```

### `GET /analyses/{id}/results/{year}`
- Requires `status === "completed"`.
- **Response:**
  ```ts
  {
    year: number;
    analysis_id: string;
    inference: InferenceYearResult;
    visualization: VisualizationYearResult | null;
  }
  ```

### `GET /analyses/{id}/geojson/{year}/{file_type}`
- `file_type`: `"inference"` | `"visualization"`
- **Response:** GeoJSON `FeatureCollection`
- **Inference features:**
  ```ts
  {
    type: "Feature";
    geometry: Polygon | MultiPolygon;
    properties: { class: "construction"; value: 1 };
  }
  ```
- Non-built-up is **implicit** (absence of construction polygons). There is no per-cell row/col API.

### `POST /analyses/{id}/process`
- Manual re-process after exports. Not required for normal Scan flow.

---

## How land classes are encoded

| UI label | Backend encoding |
|---|---|
| Non-built-up (open land) | Mask / GeoJSON value `0` or missing construction geometry |
| Existing built-up | Construction present in year **and** previous year |
| New construction | Construction present in year **but not** previous year |

The backend does **not** emit `new` vs `existing` labels. The frontend diffs consecutive years.

Years are **not** fixed to 2017–2024; they follow `end_year - 5 … end_year`.

---

## Scan + location flow

1. Citizen picks a map pin / search result → lat/lng (Nashik area typical: ~20.00, 73.79).
2. Frontend `POST /analyses` with `{ latitude, longitude, radius_m, end_year }`.
3. Poll `GET /analyses/{id}` until `status === "completed"` or `"failed"`.
4. Read `inference_results` for percentages; optionally fetch GeoJSON per year for spatial grid.

---

## Backend gaps (workarounds on frontend only)

1. **No cell grid endpoint** — no `{row,col,class,confidence}` array.  
   **Workaround:** Prefer GeoJSON rasterized into an N×N grid. If GeoJSON fails, derive a deterministic N×N grid from `construction_percentage` (same approach as the prior 2D heatmap).

2. **Cached analyses break GeoJSON security check** — `geojson_path` may point at another analysis id from the inference cache; `GET …/geojson/…` then returns 403/404.  
   **Workaround:** Catch failure and fall back to percentage-derived grid. Stats in `inference_results` remain valid.

3. **Mask GeoTIFF not served over HTTP** — `mask_path` is disk-only.  
   **Workaround:** Use GeoJSON or percentage fallback.

4. **No place-name on analysis** — only lat/lng.  
   **Workaround:** Pass location label from the search/map UI into the explorer chip.

5. **No per-cell height / density / confidence** — only aggregate pixel counts.  
   **Workaround:** Fixed heights per class in the 3D scene.

6. **In-memory analysis store** — restarting the API loses analysis ids.  
   **Workaround:** Re-run Scan; surface Retry on 404.
