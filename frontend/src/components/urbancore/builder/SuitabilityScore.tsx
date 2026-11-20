import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  FileText,
  Info,
  Loader2,
  MapPin,
  Mountain,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Check,
} from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { useBuilderSuitability } from "@/hooks/use-builder";

interface SuitabilityScoreProps {
  aoi: AOI;
  onGenerateReport?: () => void;
}

type Factor = {
  label: string;
  weight: string;
  score: number | null;
  explanation: string;
  isUnavailable?: boolean;
  icon: typeof Mountain;
};

export function SuitabilityScore({ aoi, onGenerateReport }: SuitabilityScoreProps) {
  const isCanonicalAoi = aoi.selectionSource !== "map-selected" && !aoi.id.startsWith("aoi-");
  const { data, isLoading, isError, error, refetch } = useBuilderSuitability(aoi.id, isCanonicalAoi);

  if (isError && error) {
    console.error("[SuitabilityScore] Error fetching suitability:", error);
  }

  if (!isCanonicalAoi) {
    return (
      <div className="relative flex flex-col gap-4 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <h3 className="font-mono text-sm font-semibold uppercase tracking-wider">
            PRELIMINARY SCREENING UNAVAILABLE FOR THIS LOCATION
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          This map-selected site has no registered polygon boundary in the database. Land
          suitability screening requires validated boundary geometry and cannot be reliably
          extrapolated from point coordinates alone.
        </p>
      </div>
    );
  }

  const isPolygonMissing = data?.overall_status === "UNAVAILABLE";
  const isApproximateBbox = data?.is_approximate_geometry || !aoi.geometry;
  const isComplete = data?.overall_status === "ASSESSED" && data?.overall_score !== null;
  const blockerStatus = data?.blocker_status || "UNAVAILABLE";

  const blockerBadge = (() => {
    switch (blockerStatus) {
      case "ASSESSED_NO_INTERSECTION":
        return {
          label: "NO REGULATORY INTERSECTION",
          icon: CheckCircle2,
          className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
        };
      case "POTENTIAL_RESTRICTION_REVIEW":
        return {
          label: "REGULATORY REVIEW REQUIRED",
          icon: AlertTriangle,
          className: "text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
        };
      case "CONFIRMED_BLOCKER":
        return {
          label: "CONFIRMED STATUTORY BLOCKER",
          icon: ShieldAlert,
          className: "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
        };
      default:
        return {
          label: "RESTRICTIONS UNASSESSED",
          icon: AlertCircle,
          className: "text-slate-400 bg-slate-400/10 border-slate-400/30",
        };
    }
  })();

  // Composite terrain score computed from available calibrated metrics
  const activeTerrainScore = useMemo(() => {
    if (!data?.factors) return aoi.suitabilityScore || 80;
    const { slope_score, flat_land_score, roughness_score } = data.factors;
    if (slope_score !== null && flat_land_score !== null && roughness_score !== null) {
      return Math.round((slope_score * 0.40 + flat_land_score * 0.15 + roughness_score * 0.20) / 0.75);
    }
    return aoi.suitabilityScore || 80;
  }, [data, aoi.suitabilityScore]);

  const factors: Factor[] = data
    ? [
        {
          label: "Slope Score",
          weight: "50%",
          score: data.factors.slope_score,
          explanation:
            data.inputs.mean_slope_deg !== null
              ? `${data.inputs.mean_slope_deg.toFixed(2)}° mean slope (provisional piece-wise curve)`
              : "Slope data unavailable",
          icon: TrendingUp,
        },
        {
          label: "Flat-Land Score",
          weight: "20%",
          score: data.factors.flat_land_score,
          explanation:
            data.inputs.flat_land_percentage !== null
              ? `${data.inputs.flat_land_percentage.toFixed(2)}% flat terrain (≤5° slope)`
              : "Flat land coverage unavailable",
          icon: Mountain,
        },
        {
          label: "Roughness Score",
          weight: "30%",
          score: data.factors.roughness_score,
          explanation:
            data.inputs.terrain_roughness_m !== null
              ? `${data.inputs.terrain_roughness_m.toFixed(2)} m 3×3 local relief (provisional thresholds)`
              : "Roughness data unavailable",
          icon: Mountain,
        },
        {
          label: "Zoning & Constraints",
          weight: "Review Only",
          score: data.factors.constraint_score,
          explanation:
            data.detailed_constraints?.status === "ASSESSED"
              ? `${data.detailed_constraints.overall_overlap_pct?.toFixed(2)}% total overlap · ${blockerBadge.label}`
              : "Zoning intersection requires verified polygon geometry",
          icon: ShieldAlert,
        },
      ]
    : [];

  return (
    <div className="relative flex flex-col gap-6">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Dynamic Section Header */}
      <div className="glass-panel flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              PRELIMINARY SITE SCREENING
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
              — Multi-Criteria GIS Screening
            </span>
            {isApproximateBbox && (
              <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                <Info className="h-3 w-3" /> 500m Approx Bbox
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isApproximateBbox
              ? "Screened using a 500m bounding box around centroid coordinates (official polygon boundary not registered in database)."
              : "Provisional land screening only; not certified legal, zoning, or geotechnical approval."}
          </p>
        </div>

        {onGenerateReport && (
          <button
            type="button"
            onClick={onGenerateReport}
            className="flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary transition-all hover:border-primary hover:bg-primary/20 shrink-0"
          >
            <FileText className="h-3.5 w-3.5" /> Generate Land Intelligence PDF
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-8 md:grid-cols-12 py-6"
          >
            <div className="glass-panel flex min-h-64 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:col-span-5">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 font-mono text-xs text-primary">Loading screening metrics for {aoi.name}...</p>
            </div>
            <div className="flex flex-col gap-3 md:col-span-7">
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-border/40 bg-foreground/[0.02]"
                />
              ))}
            </div>
          </motion.div>
        ) : isError || !data ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
            <h4 className="font-mono text-sm font-semibold text-rose-400 uppercase tracking-wider">
              SCREENING DATA UNAVAILABLE
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Unable to retrieve screening suitability metrics for {aoi.name}.
            </p>
            {error && (
              <p className="font-mono text-[11px] text-rose-400/80 mt-2 bg-rose-400/10 border border-rose-400/20 px-3 py-1.5 rounded-lg max-w-md">
                {(error as Error).message || String(error)}
              </p>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-5 py-2.5 font-mono text-xs font-medium text-primary hover:bg-primary/30"
            >
              <RefreshCw className="h-4 w-4" /> Retry Analysis
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
              Boundary Polygon Geometry Missing in Database
            </h4>
            <p className="text-xs text-muted-foreground mt-2 max-w-lg mx-auto">
              {data.availability_reasons?.terrain ||
                "Site suitability and regulatory constraint screening require verified boundary polygon geometry. Centroid fallbacks are not presented as site-wide suitability."}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 font-mono text-xs font-semibold text-amber-300">
              STATUS: UNAVAILABLE
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`content-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-8 md:grid-cols-12 md:items-start"
          >
            {/* Left Column: Decision Dial & Key Status */}
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl md:col-span-5">
              <div className="relative flex h-52 w-52 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" className="stroke-white/10" strokeWidth="7" fill="transparent" />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="stroke-primary"
                    strokeWidth="7"
                    strokeDasharray={326.7}
                    initial={{ strokeDashoffset: 326.7 }}
                    animate={{ strokeDashoffset: 326.7 - (326.7 * Math.min(100, Math.max(0, activeTerrainScore))) / 100 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    TERRAIN SUITABILITY
                  </span>
                  <div className="flex items-baseline justify-center gap-0.5 mt-1">
                    <span className="font-display text-4xl font-extrabold tracking-tight text-foreground">
                      {activeTerrainScore}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">/100</span>
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-emerald-400 mt-1 uppercase tracking-wider">
                    {activeTerrainScore >= 75 ? "High Buildability" : activeTerrainScore >= 50 ? "Moderate Buildability" : "Low Buildability"}
                  </span>
                </div>
              </div>

              {/* Regulatory Blocker / Review Status Badge */}
              <div
                className={`mt-4 flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-mono text-[10px] font-bold tracking-wider ${blockerBadge.className}`}
              >
                <blockerBadge.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{blockerBadge.label}</span>
              </div>

              {/* Warnings Box if applicable */}
              {data.warnings && data.warnings.length > 0 && (
                <div className="mt-4 w-full rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-left text-xs text-amber-200">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> SCREENING WARNINGS
                  </div>
                  <ul className="space-y-1 text-[11px] text-amber-200/90 list-disc list-inside">
                    {data.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Metric Highlights */}
              <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-[280px]">
                <Metric label="Mean Slope" value={data.inputs.mean_slope_deg !== null ? `${data.inputs.mean_slope_deg.toFixed(2)}°` : "N/A"} />
                <Metric label="85th% Slope" value={data.inputs.p85_slope_deg !== undefined && data.inputs.p85_slope_deg !== null ? `${data.inputs.p85_slope_deg.toFixed(2)}°` : "N/A"} />
                <Metric label="Flat Land (≤5°)" value={data.inputs.flat_land_percentage !== null ? `${data.inputs.flat_land_percentage.toFixed(2)}%` : "N/A"} />
                <Metric label="Roughness" value={data.inputs.terrain_roughness_m !== null ? `${data.inputs.terrain_roughness_m.toFixed(2)} m` : "N/A"} />
              </div>
            </div>

            {/* Right Column: Factor Analysis Cards */}
            <div className="flex flex-col gap-3.5 md:col-span-7">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> FACTOR ANALYSIS & PROVISIONAL WEIGHTS
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">Provisional V2 GIS Engine</span>
              </div>

              {factors.map((factor, index) => {
                const Icon = factor.icon;
                return (
                  <div
                    key={factor.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.065] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.1]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-all group-hover:bg-primary/20">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-foreground">{factor.label}</span>
                          <span className="ml-2 font-mono text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                            Weight: {factor.weight}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-primary">
                        {factor.isUnavailable || factor.score === null
                          ? "Pending Ingestion"
                          : `${factor.score.toFixed(2)} / 100`}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/40 p-0.5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                        initial={{ width: 0 }}
                        animate={{
                          width: factor.score === null ? 0 : `${Math.min(100, Math.max(0, factor.score))}%`,
                        }}
                        transition={{ duration: 0.8, delay: 0.05 + index * 0.06 }}
                      />
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Info className="h-3 w-3 shrink-0 text-primary/70" />
                      <span>{factor.explanation}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full-width Section: Positive & Alert Screening Indicators */}
            <div className="md:col-span-12 pt-2">
              <div className="grid gap-5 md:grid-cols-2">
                <ReasonList title="Positive Screening Indicators" items={data.positive_factors} tone="positive" />
                <ReasonList title="Screening Considerations & Alerts" items={data.negative_factors} tone="negative" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 text-center transition-all hover:border-primary/30">
      <span className="block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="font-mono text-[11px] font-bold text-foreground truncate block mt-0.5">{value}</span>
    </div>
  );
}

function ReasonList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const isPositive = tone === "positive";
  const Icon = isPositive ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl shadow-lg transition-all duration-200 ${
        isPositive
          ? "border-emerald-500/25 bg-emerald-500/[0.04] hover:border-emerald-500/40"
          : "border-amber-500/25 bg-amber-500/[0.04] hover:border-amber-500/40"
      }`}
    >
      <div className="flex items-center gap-2.5 pb-3 border-b border-white/[0.08] mb-3.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg border ${
            isPositive
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
              : "border-amber-400/30 bg-amber-400/10 text-amber-400"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={`font-mono text-xs sm:text-sm font-bold uppercase tracking-wider ${
            isPositive ? "text-emerald-400" : "text-amber-300"
          }`}
        >
          {title}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 py-1.5">
          {isPositive ? (
            <span className="text-muted-foreground">No positive indicators recorded</span>
          ) : (
            <div className="flex items-center gap-2 text-slate-300">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>None reported — No adverse regulatory or slope constraints detected</span>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {isPositive ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
