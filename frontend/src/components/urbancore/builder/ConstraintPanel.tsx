import { useState, useEffect } from "react";
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
} from "lucide-react";
import type { AOI } from "@/types/urbancore";

const API_BASE_URL = "http://localhost:8000/api/v1";

interface ConstraintPanelProps {
  aoi: AOI;
}

export type ConstraintStatus = "CLEAR" | "OVERLAP" | "NO_DATA" | "UNKNOWN";

export interface ConstraintItem {
  type: "crz" | "river_buffer" | "forest" | "green_belt" | string;
  name: string;
  status: ConstraintStatus;
  affected_area_ha: number | null;
  affected_percentage: number | null;
  description: string;
}

interface BackendConstraintsResponse {
  aoi_id: string;
  name: string;
  location?: string;
  layers_analyzed: number;
  overlapping_layers: number;
  clear_layers: number;
  no_data_layers: number;
  constraints: ConstraintItem[];
  factual_summary: string;
}

export function ConstraintPanel({ aoi }: ConstraintPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendData, setBackendData] = useState<BackendConstraintsResponse | null>(null);

  // Map layer toggle state for active UI filtering
  const [activeToggles, setActiveToggles] = useState<Record<string, boolean>>({
    crz: false,
    river_buffer: true,
    forest: true,
    green_belt: true,
  });

  // Fetch GIS constraints analysis from backend when active AOI changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchConstraints = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/violations/constraints/${aoi.id}`);
        if (response.ok) {
          const data: BackendConstraintsResponse = await response.json();
          if (isMounted) {
            setBackendData(data);
            setError(null);

            // Set default toggles based on overlapping status
            const initialToggles: Record<string, boolean> = {};
            data.constraints.forEach((c) => {
              initialToggles[c.type] = c.status === "OVERLAP";
            });
            setActiveToggles((prev) => ({ ...prev, ...initialToggles }));
          }
        } else {
          if (isMounted) {
            setBackendData(null);
          }
        }
      } catch (err) {
        console.warn("Backend constraints API unavailable. Using spatial AOI model fallback.", err);
        if (isMounted) {
          setBackendData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchConstraints();

    return () => {
      isMounted = false;
    };
  }, [aoi.id]);

  const toggleLayer = (type: string) => {
    setActiveToggles((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Fallback constraint data derived directly from AOI constraints props if backend offline
  const fallbackConstraints: ConstraintItem[] = [
    {
      type: "crz",
      name: "CRZ (Coastal Regulation Zone)",
      status: "NO_DATA",
      affected_area_ha: null,
      affected_percentage: null,
      description: "Coastal Regulation Zone data unavailable for inland region.",
    },
    {
      type: "river_buffer",
      name: "River Buffer Zone",
      status: aoi.constraints.floodZoneOverlapPercent > 0 ? "OVERLAP" : "CLEAR",
      affected_area_ha: aoi.constraints.floodZoneOverlapPercent > 0 ? Math.round((aoi.constraints.floodZoneOverlapPercent * 0.2) * 10) / 10 : 0,
      affected_percentage: aoi.constraints.floodZoneOverlapPercent,
      description: "Godavari river tributary 100m blue line & flood return zone.",
    },
    {
      type: "forest",
      name: "Forest Boundary & Buffer",
      status: aoi.constraints.forestBoundaryOverlapPercent > 0 ? "OVERLAP" : "CLEAR",
      affected_area_ha: aoi.constraints.forestBoundaryOverlapPercent > 0 ? Math.round((aoi.constraints.forestBoundaryOverlapPercent * 0.2) * 10) / 10 : 0,
      affected_percentage: aoi.constraints.forestBoundaryOverlapPercent,
      description: "Demarcated reserve forest boundary & eco-sensitive buffer.",
    },
    {
      type: "green_belt",
      name: "Agricultural Green Belt",
      status: aoi.constraints.greenBeltOverlapPercent > 0 ? "OVERLAP" : "CLEAR",
      affected_area_ha: aoi.constraints.greenBeltOverlapPercent > 0 ? Math.round((aoi.constraints.greenBeltOverlapPercent * 0.2) * 10) / 10 : 0,
      affected_percentage: aoi.constraints.greenBeltOverlapPercent,
      description: "Zonal DP masterplan agricultural land-use restriction.",
    },
  ];

  const constraintsList: ConstraintItem[] = backendData?.constraints || fallbackConstraints;

  // Compute summary metrics dynamically
  const layersAnalyzed = backendData?.layers_analyzed ?? constraintsList.length;
  const overlappingLayers =
    backendData?.overlapping_layers ??
    constraintsList.filter((c) => c.status === "OVERLAP").length;
  const clearLayers =
    backendData?.clear_layers ??
    constraintsList.filter((c) => c.status === "CLEAR").length;
  const noDataLayers =
    backendData?.no_data_layers ??
    constraintsList.filter((c) => c.status === "NO_DATA").length;

  // Construct dynamic factual summary text
  const overlapNames = constraintsList.filter((c) => c.status === "OVERLAP").map((c) => c.name);
  const clearNames = constraintsList.filter((c) => c.status === "CLEAR").map((c) => c.name);

  let factualSummaryText = backendData?.factual_summary;
  if (!factualSummaryText) {
    if (overlapNames.length > 0) {
      factualSummaryText = `The selected AOI intersects the ${overlapNames.join(" and ")}.`;
    } else {
      factualSummaryText = "No spatial overlap was detected with any active constraint layer.";
    }
    if (clearNames.length > 0) {
      factualSummaryText += ` No spatial overlap was detected with ${clearNames.join(" or ")}.`;
    }
    if (noDataLayers > 0) {
      factualSummaryText += " Coastal Regulation Zone (CRZ) data is unavailable for this inland region.";
    }
  }

  // Status helper styling
  const getStatusBadge = (status: ConstraintStatus) => {
    switch (status) {
      case "OVERLAP":
        return {
          label: "OVERLAP",
          icon: AlertTriangle,
          className: "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(251,113,133,0.2)]",
        };
      case "CLEAR":
        return {
          label: "CLEAR",
          icon: CheckCircle2,
          className: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
        };
      case "NO_DATA":
        return {
          label: "NO DATA",
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

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6 border border-border/80 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Subtle glowing accent background */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Dynamic Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
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
            <span className="text-muted-foreground font-normal text-base">— Zoning & Environmental Constraints</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <ShieldAlert className="h-3.5 w-3.5" /> GIS Polygon Audit
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
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-4 space-y-3 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-36 rounded bg-border/50" />
                    <div className="h-5 w-16 rounded-full bg-border/50" />
                  </div>
                  <div className="h-3 w-4/5 rounded bg-border/30" />
                  <div className="h-3 w-2/3 rounded bg-border/30" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center py-4 text-center">
              <p className="font-mono text-xs text-primary animate-pulse flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing GIS environmental constraint layers for {aoi.name}...
              </p>
            </div>
          </motion.div>
        ) : error ? (
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
              Unable to analyze environmental constraints
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              The GIS constraint analysis could not be completed for {aoi.name}. Please retry.
            </p>
            <button
              type="button"
              onClick={() => setIsLoading(true)}
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-5 py-2.5 font-mono text-xs font-medium text-primary hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <RefreshCw className="h-4 w-4" /> Retry Analysis
            </button>
          </motion.div>
        ) : (
          /* Main Constraints Content View */
          <motion.div
            key={`constraints-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            {/* Environmental Screening Summary Header Bar */}
            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  ENVIRONMENTAL SCREENING
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-1.5">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase">Layers Analyzed</span>
                  <span className="font-mono text-xs font-bold text-foreground">{layersAnalyzed}</span>
                </div>
                <div className="rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-1.5">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase">Overlapping</span>
                  <span className="font-mono text-xs font-bold text-rose-400">{overlappingLayers}</span>
                </div>
                <div className="rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-1.5">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase">Clear</span>
                  <span className="font-mono text-xs font-bold text-cyan-400">{clearLayers}</span>
                </div>
                <div className="rounded-xl border border-border/40 bg-foreground/[0.02] px-3 py-1.5">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase">No Data</span>
                  <span className="font-mono text-xs font-bold text-slate-400">{noDataLayers}</span>
                </div>
              </div>
            </div>

            {/* 4 Constraint Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {constraintsList.map((c) => {
                const badge = getStatusBadge(c.status);
                const BadgeIcon = badge.icon;
                const isToggled = activeToggles[c.type] ?? false;

                return (
                  <div
                    key={c.type}
                    onClick={() => toggleLayer(c.type)}
                    className={`cursor-pointer group relative overflow-hidden rounded-2xl border p-4.5 transition-all duration-300 ${
                      isToggled
                        ? "border-primary/40 bg-foreground/[0.03] shadow-[0_0_20px_rgba(56,189,248,0.12)]"
                        : "border-border/60 bg-foreground/[0.01] hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Eye
                          className={`h-4 w-4 transition-colors ${
                            isToggled ? "text-primary" : "text-muted-foreground/60"
                          }`}
                        />
                        <span className="text-xs font-semibold text-foreground tracking-tight">
                          {c.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        <span
                          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider ${badge.className}`}
                        >
                          <BadgeIcon className="h-3 w-3" /> {badge.label}
                        </span>

                        {/* Checkbox indicator */}
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

                    {/* Affected Metrics */}
                    <div className="mt-3.5 flex items-baseline justify-between border-t border-border/30 pt-2.5">
                      <span className="font-mono text-[11px] text-muted-foreground">Spatial Intersect:</span>
                      {c.status === "NO_DATA" ? (
                        <span className="font-mono text-xs text-slate-400 italic">Data unavailable</span>
                      ) : c.status === "CLEAR" ? (
                        <span className="font-mono text-xs font-bold text-cyan-400">0% overlap (0 ha)</span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-rose-400">
                          {c.affected_percentage}% affected
                          {c.affected_area_ha !== null && (
                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                              ({c.affected_area_ha} ha)
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-[11px] text-muted-foreground font-light leading-relaxed truncate">
                      {c.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Factual Screening Summary Box */}
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 shrink-0" /> ENVIRONMENTAL SCREENING SUMMARY
              </span>
              <p className="text-xs text-foreground/90 font-light leading-relaxed">
                "{factualSummaryText}"
              </p>
            </div>

            {/* Official Legal Disclaimer */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 text-[11px] text-amber-200/80 leading-relaxed font-light flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300 block mb-0.5">LEGAL & ZONING DISCLAIMER</span>
                Spatial screening based on available GIS layers. This analysis does not constitute legal, zoning, environmental, or construction approval. Verify applicable regulations and permissions with the relevant authority before development.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
