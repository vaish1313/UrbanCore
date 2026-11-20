import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import type { AnalysisRecord, YearGrid } from "@/api/types";
import { buildGridsFromGeoJson } from "@/lib/gridFromGeojson";
import { buildGridsFromStats } from "@/lib/gridFromStats";
import { useLandChangeStore } from "@/store/landChangeStore";

const TERMINAL = new Set(["completed", "failed"]);
const POLL_MS = 4000;

export type ExplorerPhase =
  | "idle"
  | "scanning"
  | "loading"
  | "ready"
  | "empty"
  | "error";

interface Options {
  analysisId?: string | null | undefined;
  locationLabel?: string | undefined;
  /** When true, calling scan() POSTs a new analysis using lat/lng from the loaded record or overrides */
  scanCoords?: { latitude: number; longitude: number; radius_m?: number } | null | undefined;
}

export function useLandChangeAnalysis({
  analysisId: externalId,
  locationLabel,
  scanCoords,
}: Options) {
  const [analysisId, setAnalysisId] = useState<string | null>(externalId ?? null);
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [grids, setGrids] = useState<YearGrid[]>([]);
  const [phase, setPhase] = useState<ExplorerPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const cacheRef = useRef<Map<string, YearGrid[]>>(new Map());
  const setYears = useLandChangeStore((s) => s.setYears);

  useEffect(() => {
    if (externalId) setAnalysisId(externalId);
  }, [externalId]);

  const buildGrids = useCallback(async (analysis: AnalysisRecord) => {
    const cacheKey = analysis.id;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setGrids(cached);
      setYears(cached.map((g) => g.year));
      return;
    }

    const years = [...analysis.years].sort((a, b) => a - b);
    const inference = analysis.inference_results ?? {};

    // Try GeoJSON spatial grid first
    const geojsonByYear: Record<number, Awaited<ReturnType<typeof api.getGeoJson>>> = {};
    let geoOk = true;
    await Promise.all(
      years.map(async (year) => {
        try {
          geojsonByYear[year] = await api.getGeoJson(analysis.id, year, "inference");
        } catch {
          geoOk = false;
        }
      }),
    );

    let built: YearGrid[] | null = null;
    if (geoOk) {
      built = buildGridsFromGeoJson({
        years,
        geojsonByYear,
        inference,
        latitude: analysis.latitude,
        longitude: analysis.longitude,
        radius_m: analysis.radius_m,
      });
    }

    if (!built) {
      built = buildGridsFromStats({
        years,
        inference,
        latitude: analysis.latitude,
        longitude: analysis.longitude,
      });
    }

    cacheRef.current.set(cacheKey, built);
    setGrids(built);
    setYears(built.map((g) => g.year));
  }, [setYears]);

  const load = useCallback(
    async (id: string) => {
      setPhase("loading");
      setError(null);
      try {
        const analysis = await api.getAnalysis(id);
        setRecord(analysis);

        if (analysis.status === "failed") {
          setPhase("error");
          setError(analysis.error || "Analysis failed");
          return;
        }

        if (!TERMINAL.has(analysis.status)) {
          setPhase("scanning");
          return;
        }

        if (analysis.status === "completed") {
          const hasInference =
            analysis.years?.length > 0 &&
            Object.keys(analysis.inference_results ?? {}).length > 0;
          if (!hasInference) {
            setPhase("empty");
            return;
          }
          await buildGrids(analysis);
          setPhase("ready");
        }
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Failed to load analysis");
      }
    },
    [buildGrids],
  );

  // Initial + polling while in progress
  useEffect(() => {
    if (!analysisId) {
      setPhase("idle");
      return;
    }
    void load(analysisId);
  }, [analysisId, load]);

  useEffect(() => {
    if (!analysisId || phase !== "scanning") return;
    const t = window.setInterval(() => void load(analysisId), POLL_MS);
    return () => clearInterval(t);
  }, [analysisId, phase, load]);

  const scan = useCallback(async () => {
    const coords =
      scanCoords ??
      (record
        ? {
            latitude: record.latitude,
            longitude: record.longitude,
            radius_m: record.radius_m,
          }
        : null);

    if (!coords) {
      setError("No location selected to scan");
      setPhase("error");
      return;
    }

    setScanning(true);
    setError(null);
    setPhase("scanning");
    try {
      const created = await api.createAnalysis({
        latitude: coords.latitude,
        longitude: coords.longitude,
        radius_m: coords.radius_m ?? 2000,
        end_year: new Date().getFullYear(),
      });
      cacheRef.current.delete(created.id);
      setAnalysisId(created.id);
      setRecord(created);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }, [scanCoords, record]);

  const retry = useCallback(() => {
    if (analysisId) void load(analysisId);
    else void scan();
  }, [analysisId, load, scan]);

  const year = useLandChangeStore((s) => s.year);
  const currentGrid = useMemo(
    () => grids.find((g) => g.year === year) ?? grids[grids.length - 1] ?? null,
    [grids, year],
  );

  const stats = useMemo(() => {
    if (!grids.length || !currentGrid) {
      return { builtUpPct: 0, newCells: 0, totalChangeSinceStart: 0 };
    }
    const first = grids[0];
    const newCells = currentGrid.cells.filter((c) => c.class === "new").length;
    const totalChangeSinceStart = Math.max(
      0,
      currentGrid.builtUpPct - (first?.builtUpPct ?? 0),
    );
    return {
      builtUpPct: currentGrid.builtUpPct,
      newCells,
      totalChangeSinceStart,
    };
  }, [grids, currentGrid]);

  const resolvedLabel =
    locationLabel ||
    (record
      ? `${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}`
      : "Nashik, Maharashtra");

  return {
    analysisId,
    record,
    grids,
    currentGrid,
    phase,
    error,
    scanning,
    stats,
    locationLabel: resolvedLabel,
    scan,
    retry,
    load,
  };
}
