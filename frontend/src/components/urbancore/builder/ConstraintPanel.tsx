import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Check,
  Loader2,
  RefreshCw,
  MapPin,
  FileCheck2,
  Info,
  AlertCircle,
} from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { useBuilderConstraints, type DetailedConstraintItem } from "@/hooks/use-builder";

interface ConstraintPanelProps {
  aoi: AOI;
}

export type ConstraintStatus = "CLEAR" | "OVERLAP" | "NO_DATA" | "UNKNOWN";

export function ConstraintPanel({ aoi }: ConstraintPanelProps) {
  const isCanonicalAoi = aoi.selectionSource !== "map-selected" && !aoi.id.startsWith("aoi-");
  const { data: backendData, isLoading, isError, refetch } = useBuilderConstraints(aoi.id, isCanonicalAoi);

  // Active layer toggles
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({
    river_buffer: true,
    forest: true,
    highway: true,
    waterbody: true,
  });

  const toggleLayer = (type: string) => {
    setActiveToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  if (!isCanonicalAoi) {
    return (
      <div className="relative flex flex-col gap-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
            ZONING AUDIT UNAVAILABLE FOR MAP-SELECTED POINT
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Zoning and environmental constraint assessments are computed using PostGIS polygonal
          intersections with official surveyed boundaries. Arbitrary map coordinates without
          registered polygon boundaries cannot be audited for zoning constraints.
        </p>
      </div>
    );
  }

  const isPolygonMissing = backendData?.status === "UNAVAILABLE";
  const isApproximateBbox = backendData?.is_approximate_geometry || !aoi.geometry;
  const constraintsList: DetailedConstraintItem[] = (backendData?.constraints || []).filter(
    (c) => c.type !== "crz",
  );

  const layersAnalyzed = backendData?.layers_analyzed ?? 0;
  const overlappingLayers = backendData?.overlapping_layers ?? 0;
  const clearLayers = backendData?.clear_layers ?? 0;
  const noDataLayers = backendData?.no_data_layers ?? 0;
  const blockerStatus = backendData?.blocker_status || "UNAVAILABLE";

  const getStatusBadge = (status: ConstraintStatus) => {
    switch (status) {
      case "OVERLAP":
        return {
          label: "INTERSECTION",
          icon: AlertTriangle,
          className:
            "text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
        };
      case "CLEAR":
        return {
          label: "CLEAR",
          icon: CheckCircle2,
          className:
            "text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
        };
      case "NO_DATA":
        return {
          label: "NOT APPLICABLE",
          icon: HelpCircle,
          className: "text-slate-400 bg-slate-400/10 border-slate-400/30",
        };
      default:
        return {
          label: "UNKNOWN",
          icon: HelpCircle,
          className: "text-amber-400 bg-amber-400/10 border-amber-400/30",
        };
    }
  };

  const blockerBadge = (() => {
    switch (blockerStatus) {
      case "ASSESSED_NO_INTERSECTION":
        return {
          label: "CLEAR — NO RESTRICTION DETECTED",
          icon: CheckCircle2,
          className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
        };
      case "POTENTIAL_RESTRICTION_REVIEW":
        return {
          label: "POTENTIAL RESTRICTION REVIEW",
          icon: AlertTriangle,
          className: "text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
        };
      case "CONFIRMED_BLOCKER":
        return {
          label: "CONFIRMED STATUTORY BLOCKER",
          icon: ShieldAlert,
          className: "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
        };
      default:
        return {
          label: "UNAVAILABLE — MISSING BOUNDARY",
          icon: AlertCircle,
          className: "text-slate-400 bg-slate-400/10 border-slate-400/30",
        };
    }
  })();

  return (
    <div className="relative flex flex-col gap-6">
      {/* Dynamic Section Header */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              GEODETIC SPATIAL INTERSECTIONS
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
              — Environmental & Zoning Constraints
            </span>
            {isApproximateBbox && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                <Info className="h-3 w-3" /> 500m Approx Bbox
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isApproximateBbox
              ? "Calculated against a 500m screening bounding box around centroid coordinates. Official boundary survey required."
              : "Geodesic PostGIS spatial queries across Survey of India, WRIS, and Highway corridors."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${blockerBadge.className}`}
          >
            <blockerBadge.icon className="h-3.5 w-3.5" /> {blockerBadge.label}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6 py-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl space-y-3 animate-pulse"
                >
                  <div className="h-3 w-20 rounded bg-border/50" />
                  <div className="h-7 w-12 rounded bg-border/60" />
                  <div className="h-2.5 w-32 rounded bg-border/30" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center py-4 text-center">
              <p className="font-mono text-xs text-primary animate-pulse flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Computing PostGIS geodesic intersections for {aoi.name}...
              </p>
            </div>
          </motion.div>
        ) : isError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
            <h4 className="font-mono text-sm font-semibold text-rose-400 uppercase tracking-wider">
              CONSTRAINT SERVICE ERROR
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Failed to query PostGIS constraint layers for {aoi.name}.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-5 py-2.5 font-mono text-xs font-medium text-primary hover:bg-primary/30"
            >
              <RefreshCw className="h-4 w-4" /> Retry Query
            </button>
          </motion.div>
        ) : isPolygonMissing ? (
          <motion.div
            key={`polygon-missing-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-amber-400/30 bg-amber-400/5 p-8 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
            <h4 className="font-display text-lg font-bold text-foreground">
              Constraint Screening Unavailable: No Registered Polygon Geometry
            </h4>
            <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">
              This site has only centroid coordinates in the database. PostGIS cannot calculate
              intersection areas, boundary overlaps, or setback distances without an authoritative
              polygon boundary.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 font-mono text-xs font-semibold text-amber-300">
              STATUS: UNAVAILABLE
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`content-${aoi.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Top Stat Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Layers Analyzed
                </span>
                <span className="font-display text-2xl font-bold text-foreground">
                  {layersAnalyzed}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Active GIS layers verified
                </span>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Overlapping Layers
                </span>
                <span
                  className={`font-display text-2xl font-bold ${
                    overlappingLayers > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {overlappingLayers}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  {overlappingLayers > 0
                    ? `${backendData?.overall_overlap_pct?.toFixed(2)}% total AOI overlap`
                    : "Zero spatial conflicts"}
                </span>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Clear Layers
                </span>
                <span className="font-display text-2xl font-bold text-cyan-400">
                  {clearLayers}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  No spatial intersection
                </span>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                  Site Area Evaluated
                </span>
                <span className="font-display text-2xl font-bold text-foreground">
                  {backendData?.aoi_area_ha ? `${backendData.aoi_area_ha.toFixed(2)} ha` : "N/A"}
                </span>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  True geodetic polygon area
                </span>
              </div>
            </div>

            {/* Constraint Layer Breakdown Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {constraintsList.map((c) => {
                const badge = getStatusBadge(c.status);
                const BadgeIcon = badge.icon;
                const isToggled = activeToggles[c.type] ?? false;

                return (
                  <div
                    key={c.type}
                    onClick={() => toggleLayer(c.type)}
                    className={`group cursor-pointer rounded-2xl border p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 ${
                      isToggled
                        ? "border-primary/50 bg-white/[0.09] shadow-[0_0_20px_rgba(56,189,248,0.12)]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileCheck2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {c.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${badge.className}`}
                        >
                          <BadgeIcon className="h-3 w-3" /> {badge.label}
                        </span>

                        <div
                          className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-all ${
                            isToggled
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-foreground/[0.02]"
                          }`}
                        >
                          {isToggled && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3.5 flex items-baseline justify-between border-t border-border/30 pt-2.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Geodesic Overlap:
                      </span>
                      {c.status === "NO_DATA" ? (
                        <span className="font-mono text-xs text-slate-400 italic">
                          Not applicable (Inland)
                        </span>
                      ) : c.status === "CLEAR" ? (
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          0% overlap (0 ha)
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {c.affected_percentage?.toFixed(2)}% overlap
                          {c.affected_area_ha !== null && (
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({c.affected_area_ha.toFixed(2)} ha)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-muted-foreground font-light leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Factual Screening Summary Box */}
            <div className="glass-panel rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 shrink-0 text-cyan-400" />
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-400">
                  POSTGIS SCREENING SUMMARY
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed">
                "{backendData?.factual_summary}"
              </p>
            </div>

            {/* Regulatory Review Notice */}
            <div className="glass-panel flex items-start gap-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 block mb-2">
                  PRELIMINARY SPATIAL SCREENING DISCLAIMER
                </span>
                <p className="text-xs sm:text-sm text-amber-100/90 font-normal leading-relaxed">
                  Spatial intersection percentages indicate potential geographic overlaps with mapped
                  datasets (e.g. Survey of India forest boundaries, WRIS water features, highway vectors).
                  They represent preliminary screening alerts and do not by themselves constitute a
                  confirmed statutory prohibition, stop-work order, or environmental clearance. Always
                  consult authoritative revenue, municipal, and forest department records.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
