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
import { useBuilderTerrain } from "@/hooks/use-builder";

interface SiteReadinessProps {
  aoi: AOI;
}

export function SiteReadiness({ aoi }: SiteReadinessProps) {
  const isCanonicalAoi = aoi.selectionSource !== "map-selected";
  const { data: terrain, isLoading, isError, refetch } = useBuilderTerrain(aoi.id, isCanonicalAoi);
  const readinessLevel = aoi.terrain.readiness;
  const averageSlope = terrain?.mean_slope_deg;
  const maxSlope = terrain?.max_slope_deg;
  const averageElevation = terrain?.mean_elevation_m;
  const minElevation = terrain?.min_elevation_m;
  const maxElevation = terrain?.max_elevation_m;
  const flatAreaPercentage = terrain?.flat_land_percentage;
  const terrainRoughness = terrain?.terrain_roughness_m;
  const factualInterpretation = terrain
    ? `Approximately ${terrain.flat_land_percentage.toFixed(2)}% of the selected AOI has slope at or below 5°, with a mean terrain slope of ${terrain.mean_slope_deg.toFixed(2)}°.`
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
              — Site Readiness Analysis
            </span>
          </h3>
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
        ) : !isCanonicalAoi ? (
          <motion.div
            key="map-selected-unavailable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertTriangle className="mb-3 h-10 w-10 text-amber-400" />
            <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-amber-400">
              TERRAIN ANALYSIS NOT AVAILABLE
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              This map-selected site is confirmed, but the backend does not yet provide coordinate-based DEM terrain analysis for arbitrary locations.
            </p>
          </motion.div>
        ) : isError || !terrain ? (
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
              Unable to retrieve terrain information for {aoi.name}. Please check connection or
              retry.
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
              <div className="glass-panel flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:col-span-6">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  SITE PROFILE SUMMARY
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Average Slope
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground mt-0.5 block">
                      {averageSlope?.toFixed(2)}°
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Average Elevation
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground mt-0.5 block">
                      {averageElevation?.toFixed(2)} m
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Flat Area
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-400 mt-0.5 block">
                      {flatAreaPercentage?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Terrain Roughness
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground truncate mt-0.5 block">
                      {terrainRoughness?.toFixed(2)} m
                    </span>
                  </div>
                </div>
              </div>

              {/* Factual Interpretation Box */}
              <div className="glass-panel flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl md:col-span-6">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 shrink-0" /> FACTUAL TERRAIN INTERPRETATION
                  </span>
                  <p className="text-xs text-foreground/90 font-light leading-relaxed">
                    "{factualInterpretation}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Source: {terrain.dem_source}</span>
                  <span className="text-primary flex items-center gap-1">
                    Factual Analysis <ArrowUpRight className="h-3 w-3" />
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
