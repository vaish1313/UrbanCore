import type { FeatureCollection, GridCell, InferenceYearResult, YearGrid } from "@/api/types";

const DEFAULT_SIZE = 40;

type Ring = number[][];
type PolygonCoords = Ring[];

function pointInRing(x: number, y: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, coords: PolygonCoords): boolean {
  if (!coords.length) return false;
  if (!pointInRing(lng, lat, coords[0])) return false;
  for (let h = 1; h < coords.length; h++) {
    if (pointInRing(lng, lat, coords[h])) return false;
  }
  return true;
}

function collectPolygons(fc: FeatureCollection): PolygonCoords[] {
  const polys: PolygonCoords[] = [];
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === "Polygon") {
      polys.push(g.coordinates as PolygonCoords);
    } else if (g.type === "MultiPolygon") {
      for (const p of g.coordinates as PolygonCoords[]) {
        polys.push(p);
      }
    }
  }
  return polys;
}

function boundsFromMeta(
  inference: InferenceYearResult | undefined,
  lat: number,
  lng: number,
  radiusM: number,
): [number, number, number, number] {
  if (inference?.metadata?.bounds) {
    return inference.metadata.bounds;
  }
  // Approximate degrees from meters near equator/Nashik
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat];
}

/**
 * Rasterize construction polygons into a binary occupancy grid for one year.
 */
export function occupancyFromGeoJson(
  fc: FeatureCollection,
  bounds: [number, number, number, number],
  size: number,
): boolean[] {
  const [west, south, east, north] = bounds;
  const polys = collectPolygons(fc);
  const out = new Array<boolean>(size * size).fill(false);
  if (!polys.length) return out;

  for (let row = 0; row < size; row++) {
    const lat = north - ((row + 0.5) / size) * (north - south);
    for (let col = 0; col < size; col++) {
      const lng = west + ((col + 0.5) / size) * (east - west);
      let hit = false;
      for (const poly of polys) {
        if (pointInPolygon(lng, lat, poly)) {
          hit = true;
          break;
        }
      }
      out[row * size + col] = hit;
    }
  }
  return out;
}

/**
 * Diff consecutive year occupancy → land / existing / new grids.
 */
export function buildGridsFromGeoJson(opts: {
  years: number[];
  geojsonByYear: Record<number, FeatureCollection>;
  inference: Record<string, InferenceYearResult>;
  latitude: number;
  longitude: number;
  radius_m: number;
  size?: number;
}): YearGrid[] | null {
  const size = opts.size ?? DEFAULT_SIZE;
  const sorted = [...opts.years].sort((a, b) => a - b);
  if (!sorted.every((y) => opts.geojsonByYear[y])) return null;

  // Prefer first year with metadata bounds
  const sampleInf = opts.inference[String(sorted[0])];
  const bounds = boundsFromMeta(
    sampleInf,
    opts.latitude,
    opts.longitude,
    opts.radius_m,
  );

  const occupancy = new Map<number, boolean[]>();
  for (const year of sorted) {
    occupancy.set(year, occupancyFromGeoJson(opts.geojsonByYear[year], bounds, size));
  }

  // Require at least some construction cells; else treat as unusable
  const anyBuilt = sorted.some((y) => occupancy.get(y)?.some(Boolean));
  if (!anyBuilt) return null;

  return sorted.map((year, yearIdx) => {
    const cur = occupancy.get(year)!;
    const prev = yearIdx > 0 ? occupancy.get(sorted[yearIdx - 1])! : null;
    const cells: GridCell[] = [];

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const idx = row * size + col;
        const built = cur[idx];
        const wasBuilt = prev ? prev[idx] : false;
        let cls: GridCell["class"] = "land";
        let height = 0.05;
        if (built && wasBuilt) {
          cls = "existing";
          height = 0.55 + ((idx * 17) % 35) / 100;
        } else if (built && !wasBuilt) {
          cls = "new";
          height = 0.95;
        }
        cells.push({ row, col, class: cls, height });
      }
    }

    const inf = opts.inference[String(year)];
    const builtCount = cur.filter(Boolean).length;
    return {
      year,
      cells,
      rows: size,
      cols: size,
      builtUpPct: inf?.construction_percentage ?? (builtCount / (size * size)) * 100,
      constructionPixels: inf?.construction_pixels ?? builtCount,
      totalPixels: inf?.total_pixels ?? size * size,
      source: "geojson" as const,
    };
  });
}
