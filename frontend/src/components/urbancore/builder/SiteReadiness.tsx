import { Mountain, Layers, TrendingUp, CheckCircle, HelpCircle } from "lucide-react";
import type { AOI } from "@/types/urbancore";

export function SiteReadiness({ aoi }: { aoi: AOI }) {
  const { elevation, slope, roughness, flatLandPercent, readiness } = aoi.terrain;

  const readinessColor = readiness === "HIGH" ? "text-accent bg-accent/10 border-accent/30" : readiness === "MEDIUM" ? "text-amber-400 bg-amber-400/10 border-amber-400/30" : "text-destructive bg-destructive/10 border-destructive/30";

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            SRTM TERRAIN ANALYSIS
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Site Preparation & Readiness
          </h3>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider font-semibold ${readinessColor}`}>
          <CheckCircle className="h-3.5 w-3.5" /> Readiness: {readiness}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Elevation */}
        <div className="group rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">Elevation</span>
            <Mountain className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold text-foreground">{elevation}</span>
            <span className="font-mono text-xs text-muted-foreground">m MSL</span>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Above Mean Sea Level (SRTM 30m dataset)</p>
        </div>

        {/* Metric 2: Slope */}
        <div className="group rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">Average Slope</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold text-foreground">{slope}°</span>
            <span className="font-mono text-xs text-muted-foreground">gradient</span>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Low grading expense required for foundation</p>
        </div>

        {/* Metric 3: Flat Land */}
        <div className="group rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">Flat Area</span>
            <Layers className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-display text-2xl font-semibold text-accent">{flatLandPercent}%</span>
            <span className="font-mono text-xs text-muted-foreground">buildable</span>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Contiguous un-excavated buildable plane</p>
        </div>

        {/* Metric 4: Roughness */}
        <div className="group rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 transition-all hover:border-primary/40">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">Terrain Class</span>
            <HelpCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-lg font-semibold text-foreground truncate">
            {roughness}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Sub-surface stability & rock depth profile</p>
        </div>
      </div>

      {/* Mini Elevation Graph Visualizer */}
      <div className="rounded-2xl border border-border/40 bg-foreground/[0.01] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Cross-Section Contour Profile ({aoi.name})
          </span>
          <span className="font-mono text-[10px] text-primary">600m — 625m Elevation Band</span>
        </div>
        <div className="relative h-16 w-full flex items-end justify-between gap-1 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = Math.min(100, Math.max(20, Math.sin(i * 0.4) * 35 + slope * 6 + (i % 3) * 5));
            return (
              <div
                key={i}
                className="w-full rounded-t-sm bg-gradient-to-t from-primary/20 via-primary/60 to-primary transition-all duration-500 hover:bg-accent"
                style={{ height: `${h}%` }}
                title={`Point ${i + 1}: ${elevation + Math.round(h * 0.15)}m`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
