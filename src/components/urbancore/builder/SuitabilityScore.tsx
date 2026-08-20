import { motion } from "motion/react";
import { ShieldCheck, Info } from "lucide-react";
import type { AOI } from "@/types/urbancore";

export function SuitabilityScore({ aoi }: { aoi: AOI }) {
  const score = aoi.suitabilityScore;
  const statusLabel = score >= 80 ? "HIGH SUITABILITY" : score >= 60 ? "MODERATE SUITABILITY" : "LOW SUITABILITY";
  const statusColor = score >= 80 ? "text-accent" : score >= 60 ? "text-amber-400" : "text-destructive";

  const factors = [
    { label: "Terrain & Elevation", score: Math.round(100 - aoi.terrain.slope * 2.5), explanation: `${aoi.terrain.flatLandPercent}% flat land, average slope ${aoi.terrain.slope}°` },
    { label: "Road Access & Connectivity", score: aoi.accessibilityScore, explanation: "Direct arterial highway connectivity and grid road density" },
    { label: "Water Availability", score: aoi.waterAvailabilityScore, explanation: "Godavari canal network & municipal water pipeline supply" },
    { label: "Environmental Restrictions", score: aoi.environmentalRiskScore, explanation: `Flood zone overlap: ${aoi.constraints.floodZoneOverlapPercent}%, Forest overlap: ${aoi.constraints.forestBoundaryOverlapPercent}%` },
    { label: "Development Potential", score: aoi.developmentPotentialScore, explanation: "5-yr growth trajectory and low structural density saturation" },
  ];

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            COMPOSITE SCORE
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Land Suitability Index
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> AI Evaluated
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-12 md:items-center">
        {/* Radial Score Gauge */}
        <div className="flex flex-col items-center justify-center md:col-span-5">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                className="stroke-border/40"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                className="stroke-primary"
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  filter: "drop-shadow(0px 0px 12px var(--atmos))",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                className="font-display text-4xl font-bold tracking-tight text-foreground"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {score}
              </motion.span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                / 100
              </span>
            </div>
          </div>
          <span className={`mt-3 font-mono text-xs font-semibold tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
          <p className="mt-1 text-center text-[11px] text-muted-foreground max-w-[200px]">
            {aoi.name} parcel suitablity score calculated via satellite multi-spectral fusion.
          </p>
        </div>

        {/* Breakdown Factors */}
        <div className="flex flex-col gap-3 md:col-span-7">
          {factors.map((f, i) => (
            <div key={f.label} className="group rounded-2xl border border-border/50 bg-foreground/[0.02] p-3 transition-colors hover:border-primary/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{f.label}</span>
                <span className="font-mono text-xs font-semibold text-primary">{f.score} / 100</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${f.score}%` }}
                  transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
                />
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <Info className="h-2.5 w-2.5 shrink-0 text-primary/70" />
                <span className="truncate">{f.explanation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
