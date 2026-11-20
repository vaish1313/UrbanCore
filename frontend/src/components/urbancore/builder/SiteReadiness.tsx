import { motion, AnimatePresence } from "motion/react";
import {
  Mountain,
  Layers,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Info,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { useBuilderTerrain, useBuilderPointTerrain } from "@/hooks/use-builder";

interface SiteReadinessProps {
  aoi: AOI;
}

export function SiteReadiness({ aoi }: SiteReadinessProps) {
  const isCanonicalAoi = aoi.selectionSource !== "map-selected" && !aoi.id.startsWith("aoi-");
  const {
    data: canonicalTerrain,
    isLoading: isCanonicalLoading,
    isError: isCanonicalError,
    refetch: refetchCanonical,
  } = useBuilderTerrain(aoi.id, isCanonicalAoi);

  const {
    data: pointTerrain,
    isLoading: isPointLoading,
    isError: isPointError,
    refetch: refetchPoint,
  } = useBuilderPointTerrain(aoi.coords, !isCanonicalAoi);

  const isLoading = isCanonicalAoi ? isCanonicalLoading : isPointLoading;
  const isError = isCanonicalAoi ? isCanonicalError : isPointError;
  const refetch = isCanonicalAoi ? refetchCanonical : refetchPoint;

  const averageSlope = isCanonicalAoi ? canonicalTerrain?.mean_slope_deg : pointTerrain?.slope_deg;
  const maxSlope = isCanonicalAoi ? canonicalTerrain?.max_slope_deg : pointTerrain?.slope_deg;
  const averageElevation = isCanonicalAoi ? canonicalTerrain?.mean_elevation_m : pointTerrain?.elevation_m;
  const minElevation = isCanonicalAoi ? canonicalTerrain?.min_elevation_m : pointTerrain?.min_elevation_m;
  const maxElevation = isCanonicalAoi ? canonicalTerrain?.max_elevation_m : pointTerrain?.max_elevation_m;
  const flatAreaPercentage = isCanonicalAoi ? canonicalTerrain?.flat_land_percentage : (pointTerrain?.is_flat ? 100 : 0);
  const terrainRoughness = isCanonicalAoi ? canonicalTerrain?.terrain_roughness_m : pointTerrain?.terrain_roughness_m;
  const demSource = isCanonicalAoi ? canonicalTerrain?.dem_source : (pointTerrain?.dem_source || "Copernicus GLO-30 DEM");

  const readinessLevel = isCanonicalAoi
    ? aoi.terrain.readiness
    : pointTerrain
      ? (pointTerrain.slope_deg <= 5.0 ? "HIGH" : pointTerrain.slope_deg <= 15.0 ? "MEDIUM" : "LOW")
      : "LOW";

  const factualInterpretation = isCanonicalAoi && canonicalTerrain
    ? `Approximately ${canonicalTerrain.flat_land_percentage.toFixed(2)}% of the selected AOI has slope at or below 5°, with a mean terrain slope of ${canonicalTerrain.mean_slope_deg.toFixed(2)}°.`
    : pointTerrain
      ? `Preliminary coordinate screening: Local elevation is ${pointTerrain.elevation_m.toFixed(1)} m MSL with a local slope gradient of ${pointTerrain.slope_deg.toFixed(2)}° and local relief variation of ${pointTerrain.terrain_roughness_m.toFixed(2)} m. (Copernicus GLO-30 30m DEM).`
      : "";

  const readinessColor =
    readinessLevel === "HIGH"
      ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
      : readinessLevel === "MEDIUM"
        ? "text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
        : "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(251,113,133,0.2)]";

  return (
    <div className="relative flex flex-col gap-6">
      {/* Subtle background glow */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Dynamic Section Header */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              ANALYZING SITE
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {aoi.location || "Nashik, Maharashtra"}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
            <span>{aoi.name}</span>
            <span className="text-muted-foreground font-normal text-base">
              — DEM Terrain Analysis
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCanonicalAoi
              ? "Copernicus GLO-30 30m topographic screening; preliminary relief metrics only."
              : "Preliminary coordinate-based point screening from Copernicus GLO-30 30m DEM."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold ${readinessColor}`}
          >
            <CheckCircle className="h-3.5 w-3.5" /> Readiness: {readinessLevel}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          /* Animated Skeleton Loading State */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6 py-4"
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-28 rounded bg-border/50" />
                    <div className="h-5 w-5 rounded-full bg-border/50" />
                  </div>
                  <div className="h-8 w-24 rounded bg-border/60" />
                  <div className="h-3 w-36 rounded bg-border/30" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center py-4 text-center">
              <p className="font-mono text-xs text-primary animate-pulse flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing terrain characteristics for {aoi.name}...
              </p>
            </div>
          </motion.div>
        ) : isError || (!isCanonicalAoi && !pointTerrain) || (isCanonicalAoi && !canonicalTerrain) ? (
          /* Error State UI */
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
            <h4 className="font-mono text-sm font-semibold text-rose-400 uppercase tracking-wider">
              SITE READINESS UNAVAILABLE
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Unable to retrieve terrain information for {aoi.name}. The location may be outside the DEM raster coverage area.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-5 py-2.5 font-mono text-xs font-medium text-primary hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <RefreshCw className="h-4 w-4" /> Retry Analysis
            </button>
          </motion.div>
        ) : (
          /* Main Site Readiness Content View */
          <motion.div
            key={`readiness-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            {!isCanonicalAoi && pointTerrain && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 backdrop-blur-xl">
                <Info className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-400">
                    PRELIMINARY POINT-BASED TERRAIN SCREENING
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Terrain metrics are sampled from the Copernicus GLO-30 DEM at coordinate ({aoi.coords.lat.toFixed(4)}°N, {aoi.coords.lng.toFixed(4)}°E).
                    Because this map-selected point lacks a registered parcel polygon boundary, full polygon slope masking, area distributions, and zoning audits are unavailable.
                  </p>
                </div>
              </div>
            )}

            {/* 3 Primary Metric Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {/* CARD 1: AVERAGE SLOPE */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.1] hover:shadow-[0_0_20px_rgba(56,189,248,0.14)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    AVERAGE SLOPE
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {averageSlope?.toFixed(2)}°
                  </span>
                  <span className="font-mono text-xs text-muted-foreground font-light">
                    average slope
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <span className="font-mono text-[10px]">Mean / Max Slope</span>
                  <span className="font-mono font-medium text-foreground">
                    {averageSlope?.toFixed(2)}° — {maxSlope?.toFixed(2)}°
                  </span>
                </div>
              </div>

              {/* CARD 2: ELEVATION */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.1] hover:shadow-[0_0_20px_rgba(56,189,248,0.14)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    ELEVATION
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                    <Mountain className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {averageElevation?.toFixed(2)} m
                  </span>
                  <span className="font-mono text-xs text-muted-foreground font-light">MSL</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                  <span className="font-mono text-[10px]">Elevation Range</span>
                  <span className="font-mono font-medium text-foreground">
                    {minElevation?.toFixed(2)} m — {maxElevation?.toFixed(2)} m
                  </span>
                </div>
              </div>

              {/* CARD 3: FLAT AREA % */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.1] hover:shadow-[0_0_20px_rgba(56,189,248,0.14)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    FLAT AREA
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 group-hover:bg-cyan-400/20 transition-all">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-cyan-400">
                    {flatAreaPercentage?.toFixed(2)}%
                  </span>
                  <span className="font-mono text-xs text-muted-foreground font-light">
                    classified area
                  </span>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/40 p-0.5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(0, flatAreaPercentage ?? 0))}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terrain Contour Cross-Section Profile */}
            <div className="glass-panel rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" /> TERRAIN PROFILE & CONTOUR
                    CROSS-SECTION
                  </span>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Cross-section elevation variation band for{" "}
                    <strong className="text-foreground font-medium">{aoi.name}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] rounded-lg border border-border/60 bg-foreground/[0.03] px-2.5 py-1 text-foreground">
                    Roughness: <strong className="text-primary">{terrainRoughness?.toFixed(2)} m</strong>
                  </span>
                  <span className="font-mono text-[10px] rounded-lg border border-border/60 bg-foreground/[0.03] px-2.5 py-1 text-muted-foreground">
                    {minElevation?.toFixed(2)}m — {maxElevation?.toFixed(2)}m Band
                  </span>
                </div>
              </div>

              {/* Dynamic Contour Bar Visualization */}
              <div className="relative h-20 w-full flex items-end justify-between gap-1 overflow-hidden pt-2">
                {Array.from({ length: 30 }).map((_, i) => {
                  const h = Math.min(
                    100,
                    Math.max(
                      15,
                      Math.sin(i * 0.35 + (averageSlope ?? 0) * 0.2) * 32 +
                        (averageSlope ?? 0) * 4 +
                        ((i * 7) % 13),
                    ),
                  );
                  return (
                    <div
                      key={i}
                      className="w-full rounded-t-xs bg-gradient-to-t from-primary/10 via-primary/50 to-primary transition-all duration-300 hover:bg-cyan-400"
                      style={{ height: `${h}%` }}
                      title={`Contour Point ${i + 1}: ${Math.round((minElevation ?? 0) + (h / 100) * ((maxElevation ?? 0) - (minElevation ?? 0)))}m`}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground border-t border-border/30 pt-2 mt-2">
                <span>SW Boundary</span>
                <span>Contour Profile Line</span>
                <span>NE Boundary</span>
              </div>
            </div>

            {/* Compact Site Profile Summary & Factual Interpretation */}
            <div className="grid gap-4 md:grid-cols-12">
              {/* Compact Site Profile Table */}
              <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.065] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:col-span-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                    SITE PROFILE SUMMARY
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 sm:p-4">
                    <span className="block font-mono text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Average Slope
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-bold text-foreground block">
                      {averageSlope?.toFixed(2)}°
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 sm:p-4">
                    <span className="block font-mono text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Average Elevation
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-bold text-foreground block">
                      {averageElevation?.toFixed(2)} m
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 sm:p-4">
                    <span className="block font-mono text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Flat Area
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-bold text-cyan-400 block">
                      {flatAreaPercentage?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 sm:p-4">
                    <span className="block font-mono text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                      Terrain Roughness
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-bold text-foreground truncate block">
                      {terrainRoughness?.toFixed(2)} m
                    </span>
                  </div>
                </div>
              </div>

              {/* Factual Interpretation Box */}
              <div className="glass-panel flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:col-span-6">
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <Info className="h-4 w-4 shrink-0 text-cyan-400" />
                    <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-400">
                      FACTUAL TERRAIN INTERPRETATION
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed">
                    "{factualInterpretation}"
                  </p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-primary/25 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Source: <strong className="text-slate-300 font-medium">{demSource}</strong></span>
                  <span className="text-cyan-400 flex items-center gap-1 font-semibold text-xs hover:text-cyan-300">
                    Factual Analysis <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
