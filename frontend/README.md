# UrbanCore Frontend

TanStack Start + React + TypeScript client for the UrbanCore API.

## Land Change Explorer

Citizen Intelligence now includes a **Land Change Explorer** — a mobile-first 3D grid of built-up vs non-built-up change, driven by the real analysis API.

- Three.js (`@react-three/fiber`) + `InstancedMesh`
- Year scrubber / play, Auto-rotate, Changes only, 3D / Top view
- Typed API client + zod validation (`src/api`)
- Contract: [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md)

## Prerequisites

- Node.js 20+
- Backend running at `http://localhost:8000` (`python start.py` in `backend/`)

## Setup

```sh
cd UrbanCore/frontend
npm install
```

Create / edit `.env`:

```env
VITE_API_URL=/api/v1
VITE_USE_MOCK=false
VITE_MAPBOX_TOKEN=your_mapbox_token
```

`VITE_API_URL=/api/v1` uses the Vite dev proxy (see `vite.config.ts`) so the browser stays same-origin. For production builds pointed straight at the API, set the full URL, e.g. `https://api.example.com/api/v1`.

`VITE_USE_MOCK=true` enables the isolated mock layer in `src/api/mock.ts`. Leave it `false` for real backend data.

## Run

```sh
# Terminal 1 — backend
cd UrbanCore/backend
python start.py

# Terminal 2 — frontend
cd UrbanCore/frontend
npm run dev
```

Open the Citizen workspace, drop a pin (or search), run Analyse, then use the Land Change Explorer when the run completes.

## Verify (against real backend)

1. **Year slider** — scrubbing changes extruded blocks; play advances ~1s/year.
2. **Changes only** — dims everything except new-construction cells vs the previous year.
3. **Top view** — camera tweens to a flat orthographic-style view (matches the 2D square grid).
4. **Scan** — posts `POST /api/v1/analyses` and polls until complete.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite / TanStack Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Notes

- Backend is **read-only** for this feature. Gaps (no cell API, cached GeoJSON path mismatch) are listed in `docs/API_CONTRACT.md` with frontend workarounds.
- Analysis records are in-memory on the API — restarting the backend invalidates old analysis IDs; re-run Scan.
