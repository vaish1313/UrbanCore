import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Info,
  Mountain,
  Navigation as NavigationIcon,
  Droplet,
  ShieldAlert,
  TrendingUp,
  Loader2,
  RefreshCw,
  MapPin,
  Sparkles,
  AlertTriangle,
  FileText,
} from "lucide-react";
import type { AOI } from "@/types/urbancore";

const API_BASE_URL = "http://localhost:8000/api/v1";

interface SuitabilityScoreProps {
  aoi: AOI;
  onGenerateReport?: () => void;
}

interface FactorItem {
  label: string;
  score: number;
  explanation: string;
  icon: typeof Mountain;
}

interface BackendSuitabilityResponse {
  aoi_id: string;
  name: string;
  location?: string;
  suitability_score: number;
  status: string;
  category?: string;
  terrain_roughness?: string;
  factors?: { label: string; score: number; explanation: string }[];
  site_profile?: {
    terrain: string;
    accessibility: string;
    water: string;
    restrictions: string;
  };
  summary?: string;
}

export function SuitabilityScore({ aoi, onGenerateReport }: SuitabilityScoreProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendData, setBackendData] = useState<BackendSuitabilityResponse | null>(null);

  // Animated display score for smooth count-up transition
  const [displayScore, setDisplayScore] = useState(0);

  // Fetch suitability analysis from backend for selected AOI
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchSuitability = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/terrain/suitability/${aoi.id}`);
        if (response.ok) {
          const data: BackendSuitabilityResponse = await response.json();
          if (isMounted) {
            setBackendData(data);
            setError(null);
          }
        } else {
          // If server returns error status, fallback to AOI spatial props gracefully
          if (isMounted) {
            setBackendData(null);
          }
        }
      } catch (err) {
        console.warn("Backend suitability API unavailable. Using AOI spatial metrics model.", err);
        if (isMounted) {
          setBackendData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSuitability();

    return () => {
      isMounted = false;
    };
  }, [aoi.id]);

  // Determine target score from backend or fallback to AOI prop
  const targetScore = backendData?.suitability_score ?? aoi.suitabilityScore;

  // Smooth score counting animation when switching AOIs
  useEffect(() => {
    if (isLoading || targetScore === undefined || targetScore === null) return;

    let startTimestamp: number | null = null;
    const startScore = displayScore;
    const duration = 600; // ms

    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (targetScore - startScore) * easedProgress);

      setDisplayScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [targetScore, isLoading]);

  // Derive status label and styling
  const score = targetScore ?? 0;
  const statusLabel =
    backendData?.status ||
    (score >= 80
      ? "HIGH SUITABILITY"
      : score >= 60
        ? "MODERATE SUITABILITY"
        : score >= 40
          ? "LIMITED SUITABILITY"
          : "LOW SUITABILITY");

  const statusColorClass =
    score >= 80
      ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]"
      : score >= 60
        ? "text-amber-400 bg-amber-400/10 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.25)]"
        : score >= 40
          ? "text-orange-400 bg-orange-400/10 border-orange-400/30 shadow-[0_0_15px_rgba(251,146,60,0.25)]"
          : "text-rose-400 bg-rose-400/10 border-rose-400/30 shadow-[0_0_15px_rgba(251,113,133,0.25)]";

  // Calculate terrain factor score from slope
  const terrainFactorScore = Math.round(Math.max(20, Math.min(100, 100 - aoi.terrain.slope * 2.5)));

  // Construct factors array using backend data or fallback to AOI props
  const defaultFactors: FactorItem[] = [
    {
      label: "Terrain & Elevation",
      score: terrainFactorScore,
      icon: Mountain,
      explanation: `${aoi.terrain.flatLandPercent}% flat land · Avg. slope ${aoi.terrain.slope}° · ${aoi.terrain.roughness}`,
    },
    {
      label: "Road Access & Connectivity",
      score: aoi.accessibilityScore,
      icon: NavigationIcon,
      explanation: `${aoi.accessibilityScore}/100 access rating · Direct arterial highway & grid road density`,
    },
    {
      label: "Water Availability",
      score: aoi.waterAvailabilityScore,
      icon: Droplet,
      explanation: `${aoi.waterAvailabilityScore}/100 availability · Local water network & municipal lines`,
    },
    {
      label: "Environmental Restrictions",
      score: aoi.environmentalRiskScore,
      icon: ShieldAlert,
      explanation: `Flood overlap: ${aoi.constraints.floodZoneOverlapPercent}% · Forest overlap: ${aoi.constraints.forestBoundaryOverlapPercent}% · Level: ${aoi.constraints.environmentalRestriction}`,
    },
    {
      label: "Development Potential",
      score: aoi.developmentPotentialScore,
      icon: TrendingUp,
      explanation: `${aoi.developmentPotentialScore}/100 growth index · Multi-year construction & density trajectory`,
    },
  ];

  // Map icons to factor labels if coming from backend
  const getIconForLabel = (label: string) => {
    if (label.includes("Terrain")) return Mountain;
    if (label.includes("Road") || label.includes("Access")) return NavigationIcon;
    if (label.includes("Water")) return Droplet;
    if (label.includes("Environmental")) return ShieldAlert;
    return TrendingUp;
  };

  const factors: FactorItem[] = backendData?.factors
    ? backendData.factors.map((f) => ({
        label: f.label,
        score: f.score,
        explanation: f.explanation,
        icon: getIconForLabel(f.label),
      }))
    : defaultFactors;

  // Profile mini summary info
  const siteProfile = backendData?.site_profile || {
    terrain: aoi.terrain.roughness,
    accessibility: `${aoi.accessibilityScore}/100`,
    water: `${aoi.waterAvailabilityScore}/100`,
    restrictions: aoi.constraints.environmentalRestriction,
  };

  const summaryText =
    backendData?.summary ||
    aoi.summary ||
    `Overall land suitability evaluated for ${aoi.name} based on terrain, accessibility, water, and environmental constraints.`;

  // SVG Gauge calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col gap-6">
      {/* Subtle glowing accent background */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Section Header with Site Context */}
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
              — Land Suitability Index
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onGenerateReport && (
            <button
              type="button"
              onClick={onGenerateReport}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-cyan-500/50 bg-cyan-500/20 px-5 py-3 font-mono text-xs font-semibold text-cyan-300 transition-all duration-300 hover:bg-cyan-500/30 hover:border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)] shrink-0 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              Generate Land Intelligence PDF
            </button>
          )}
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
            className="grid gap-8 md:grid-cols-12 md:items-center py-6"
          >
            {/* Score Skeleton */}
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-xl md:col-span-5">
              <div className="relative flex h-48 w-48 items-center justify-center">
                <div className="h-44 w-44 rounded-full border-4 border-dashed border-primary/30 animate-spin" />
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl font-bold text-muted-foreground animate-pulse">
                    --
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                    / 100
                  </span>
                </div>
              </div>
              <div className="mt-4 h-6 w-36 rounded-full bg-border/40 animate-pulse" />
              <p className="mt-3 font-mono text-xs text-primary animate-pulse flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Calculating suitability for {aoi.name}...
              </p>
            </div>

            {/* Factor Cards Skeleton */}
            <div className="flex flex-col gap-3 md:col-span-7">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5 space-y-2.5 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-36 rounded bg-border/50" />
                    <div className="h-4 w-12 rounded bg-border/50" />
                  </div>
                  <div className="h-2 w-full rounded-full bg-border/30" />
                  <div className="h-3 w-4/5 rounded bg-border/30" />
                </div>
              ))}
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
            <h4 className="font-mono text-sm font-semibold text-rose-400">
              Suitability data unavailable
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Unable to retrieve analysis for {aoi.name}. Please check your connection or retry.
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
          /* Main Content View */
          <motion.div
            key={`content-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="grid gap-8 md:grid-cols-12 md:items-center"
          >
            {/* Left Column: Radial Score Gauge & Site Profile Mini Cards */}
            <div className="glass-panel flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-xl md:col-span-5">
              {/* Radial SVG Score visualization */}
              <div className="relative flex h-52 w-52 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
                  {/* Background track circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-border/30"
                    strokeWidth="7"
                    fill="transparent"
                  />
                  {/* Active SVG Arc with cyan glow */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-primary"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      filter: "drop-shadow(0px 0px 10px rgba(56,189,248,0.75))",
                    }}
                  />
                </svg>

                {/* Main Score Display inside Radial Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-5xl font-extrabold tracking-tight text-foreground drop-shadow-md">
                    {displayScore}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mt-0.5">
                    / 100
                  </span>
                </div>
              </div>

              {/* Status Classification Badge */}
              <div
                className={`mt-4 rounded-full border px-4 py-1.5 font-mono text-xs font-bold tracking-wider ${statusColorClass}`}
              >
                {statusLabel}
              </div>

              {/* Supporting Factual Summary */}
              <p className="mt-3 text-center text-xs text-muted-foreground max-w-[260px] font-light leading-relaxed">
                {summaryText}
              </p>

              {/* Site Profile Mini Cards */}
              <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-[280px]">
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 text-center transition-all hover:border-primary/30">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    Terrain
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground truncate block mt-0.5">
                    {siteProfile.terrain}
                  </span>
                </div>
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 text-center transition-all hover:border-primary/30">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    Accessibility
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground truncate block mt-0.5">
                    {siteProfile.accessibility}
                  </span>
                </div>
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 text-center transition-all hover:border-primary/30">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    Water
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground truncate block mt-0.5">
                    {siteProfile.water}
                  </span>
                </div>
                <div className="rounded-xl border border-border/50 bg-foreground/[0.02] p-2.5 text-center transition-all hover:border-primary/30">
                  <span className="block font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    Restrictions
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground truncate block mt-0.5">
                    {siteProfile.restrictions}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Factor Breakdown Cards */}
            <div className="flex flex-col gap-3.5 md:col-span-7">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> FACTOR ANALYSIS & DRIVERS
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  5 Evaluation Categories
                </span>
              </div>

              {factors.map((f, i) => {
                const FactorIcon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.065] p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:bg-white/[0.1] hover:shadow-[0_0_18px_rgba(56,189,248,0.16)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary group-hover:bg-primary/20 transition-all">
                          <FactorIcon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-semibold text-foreground tracking-tight">
                          {f.label}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-primary">
                        {f.score}{" "}
                        <span className="text-[10px] text-muted-foreground font-normal">/ 100</span>
                      </span>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border/40 p-0.5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, f.score))}%` }}
                        transition={{ duration: 0.8, delay: 0.05 + i * 0.06 }}
                      />
                    </div>

                    {/* Data-Driven Factual Supporting Info */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
                      <Info className="h-3 w-3 shrink-0 text-primary/70" />
                      <span className="truncate">{f.explanation}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
