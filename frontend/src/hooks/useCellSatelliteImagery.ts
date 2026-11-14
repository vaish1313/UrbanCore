/**
 * useCellSatelliteImagery
 *
 * Fetches Mapbox Static Images for the before-year and after-year of a grid cell.
 * Images are cached per (cellId + year) to avoid repeated requests.
 *
 * Returns object URLs (revoked on unmount / cache eviction) together with
 * loading and error state for each of the two slots.
 */

import { useEffect, useRef, useState } from "react";

const MAPBOX_TOKEN = import.meta.env["VITE_MAPBOX_TOKEN"] as string | undefined;

/** Approximate padding factor around the cell bbox (1.0 = exact bbox, 2.0 = 2× bigger) */
const PADDING = 2.0;
/** Image dimensions requested from Mapbox Static API */
const IMG_W = 640;
const IMG_H = 440;

interface ImageryState {
  url: string | null;
  loading: boolean;
  error: boolean;
}

export interface CellSatelliteImagery {
  before: ImageryState;
  after: ImageryState;
}

/** Module-level cache: key → object URL (or "" sentinel for failure) */
const cache = new Map<string, string>();

function buildMapboxStaticUrl(
  lng: number,
  lat: number,
  bbox: [number, number, number, number],
): string {
  const [west, south, east, north] = bbox;

  // Add padding around the bbox
  const dLng = (east - west) * (PADDING - 1) * 0.5;
  const dLat = (north - south) * (PADDING - 1) * 0.5;
  const pWest = west - dLng;
  const pEast = east + dLng;
  const pSouth = south - dLat;
  const pNorth = north + dLat;

  // Clamp to valid ranges
  const cWest = Math.max(-180, pWest);
  const cEast = Math.min(180, pEast);
  const cSouth = Math.max(-85, pSouth);
  const cNorth = Math.min(85, pNorth);

  void lng; void lat; // centroid not needed for bbox-based request

  // Use auto bbox with the padded bbox
  const bboxStr = `[${cWest},${cSouth},${cEast},${cNorth}]`;

  return (
    `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/` +
    `${bboxStr}/${IMG_W}x${IMG_H}` +
    `?access_token=${MAPBOX_TOKEN}`
  );
}

async function fetchImage(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;

  const res = await fetch(url);
  if (!res.ok) {
    cache.set(url, ""); // sentinel
    throw new Error(`HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  cache.set(url, objUrl);
  return objUrl;
}

export function useCellSatelliteImagery(
  cellId: string | null,
  beforeYear: number | null,
  afterYear: number | null,
  lat: number | null,
  lng: number | null,
  bbox: [number, number, number, number] | null,
): CellSatelliteImagery {
  const [before, setBefore] = useState<ImageryState>({
    url: null,
    loading: false,
    error: false,
  });
  const [after, setAfter] = useState<ImageryState>({
    url: null,
    loading: false,
    error: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!cellId || !lat || !lng || !bbox || !MAPBOX_TOKEN) {
      setBefore({ url: null, loading: false, error: false });
      setAfter({ url: null, loading: false, error: false });
      return;
    }

    // Cancel previous in-flight requests
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setBefore({ url: null, loading: true, error: false });
    setAfter({ url: null, loading: true, error: false });

    const fetchSlot = async (
      year: number | null,
      setter: React.Dispatch<React.SetStateAction<ImageryState>>,
    ) => {
      if (!year) {
        setter({ url: null, loading: false, error: true });
        return;
      }

      const cacheKey = `${cellId}::${year}`;
      const cachedUrl = cache.get(cacheKey);

      if (cachedUrl !== undefined) {
        setter({ url: cachedUrl || null, loading: false, error: !cachedUrl });
        return;
      }

      try {
        const apiUrl = buildMapboxStaticUrl(lng, lat, bbox);
        const objUrl = await fetchImage(apiUrl);
        // Store under the per-cell-year cache key too
        cache.set(cacheKey, objUrl);
        if (!controller.signal.aborted) {
          setter({ url: objUrl, loading: false, error: false });
        }
      } catch {
        if (!controller.signal.aborted) {
          setter({ url: null, loading: false, error: true });
        }
      }
    };

    void fetchSlot(beforeYear, setBefore);
    void fetchSlot(afterYear, setAfter);

    return () => {
      controller.abort();
    };
  }, [cellId, beforeYear, afterYear, lat, lng, bbox]);

  return { before, after };
}
