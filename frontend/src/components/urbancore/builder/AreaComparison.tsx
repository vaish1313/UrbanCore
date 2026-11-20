import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  MapPin,
  TrendingUp,
  ShieldAlert,
  Mountain,
  RefreshCw,
  Compass,
  Layers,
  Info,
  CheckCircle2,
} from "lucide-react";
import type { AOI } from "@/types/urbancore";

interface ComparisonItem {
  id: string;
  name: string;
  distance_km: number;
  suitability_score: number;
  flood_zone_percent: number;
  construction_growth_percent: number;
  avg_slope: number;
  elevation?: number;
  is_selected?: boolean;
}

interface ComparisonData {
  selected_aoi: ComparisonItem;
  nearest_aois: ComparisonItem[];
  observations: string[];
}

interface AreaComparisonProps {
  aoi: AOI;
}



export function AreaComparison({ aoi }: AreaComparisonProps) {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isCanonicalAoi = aoi.selectionSource !== "map-selected" && !aoi.id.startsWith("aoi-");

  const fetchComparison = async () => {
    if (!isCanonicalAoi) {
      setIsLoading(false);
      setComparisonData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/aois/compare/${aoi.id}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const json: ComparisonData = await response.json();
      setComparisonData(json);
    } catch (err) {
      console.error("Backend API call failed.", err);
      setError("Failed to fetch neighborhood comparison data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [aoi.id, aoi.selectionSource]);

  if (isLoading) {
    return (
      <div className="relative flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/20" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-40 animate-pulse rounded bg-muted/40" />
              <div className="h-6 w-64 animate-pulse rounded bg-muted/30" />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-border/30 bg-card/20"
            />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl border border-border/30 bg-card/20" />
      </div>
    );
  }

  if (!isCanonicalAoi) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center border border-amber-400/20 bg-amber-400/5">
        <ShieldAlert className="h-10 w-10 text-amber-400" />
        <h3 className="font-display text-lg font-semibold text-foreground">
          Comparison Unavailable for Map-Selected Site
        </h3>
        <p className="text-xs text-muted-foreground max-w-md">
          Spatial neighborhood comparisons are computed across verified database AOIs. Arbitrary map-selected locations do not have neighborhood matrix scores.
        </p>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h3 className="font-display text-lg font-semibold text-foreground">
          Comparison Data Unavailable
        </h3>
        <p className="text-xs text-muted-foreground">
          Unable to compute neighborhood spatial comparison for {aoi.name}.
        </p>
        <button
          type="button"
          onClick={fetchComparison}
          className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/30"
        >
          <RefreshCw className="h-4 w-4" /> Retry Analysis
        </button>
      </div>
    );
  }

  const { selected_aoi, nearest_aois, observations } = comparisonData;
  const allSites: ComparisonItem[] = [{ ...selected_aoi, is_selected: true }, ...nearest_aois];

  const maxSuitability = 100;
  const maxGrowth = Math.max(...allSites.map((s) => s.construction_growth_percent), 40);

  return (
    <div className="relative flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
              MODULE 6 — NEIGHBOURHOOD BENCHMARK
            </span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Spatial Benchmark Matrix
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Comparing <strong className="text-foreground">{selected_aoi.name}</strong> with the 4
            geographically nearest candidate locations in Nashik district (great-circle distance).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            <Compass className="h-3.5 w-3.5 text-primary" /> 4 Spatial Neighbors
          </span>
        </div>
      </div>

      {/* 5 Sites Overview Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {allSites.map((site) => (
          <div
            key={site.id}
            className={`flex flex-col justify-between rounded-2xl p-4 transition-all duration-300 ${
              site.is_selected
                ? "border-2 border-primary/60 bg-primary/10 shadow-[0_0_20px_rgba(114,180,255,0.15)] backdrop-blur-xl"
                : "border border-white/15 bg-white/[0.065] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl hover:border-primary/40 hover:bg-white/[0.1]"
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                {site.is_selected ? (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                    SELECTED SITE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {site.distance_km} km away
                  </span>
                )}
              </div>
              <h4
                className="font-display text-sm font-semibold text-foreground truncate"
                title={site.name}
              >
                {site.name}
              </h4>
            </div>

            <div className="mt-4 flex flex-col gap-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-[10px] text-muted-foreground">Suitability</span>
                <span
                  className={`font-bold ${
                    site.suitability_score >= 80
                      ? "text-emerald-400"
                      : site.suitability_score >= 70
                        ? "text-cyan-400"
                        : "text-amber-400"
                  }`}
                >
                  {site.suitability_score}/100
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-[10px] text-muted-foreground">Flood Zone</span>
                <span
                  className={
                    site.flood_zone_percent <= 5
                      ? "text-emerald-400"
                      : site.flood_zone_percent <= 15
                        ? "text-amber-400"
                        : "text-rose-400"
                  }
                >
                  {site.flood_zone_percent}%
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border/30 pb-1.5">
                <span className="text-[10px] text-muted-foreground">Growth (5Y)</span>
                <span className="text-cyan-300">+{site.construction_growth_percent}%</span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[10px] text-muted-foreground">Avg Slope</span>
                <span className="text-foreground">{site.avg_slope}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison Table */}
      <div className="glass-panel overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.055] shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20">
              <th className="p-3.5">AOI Site Name</th>
              <th className="p-3.5">Spatial Distance</th>
              <th className="p-3.5">Suitability Score</th>
              <th className="p-3.5">Flood Zone %</th>
              <th className="p-3.5">Construction Growth %</th>
              <th className="p-3.5 text-right">Avg Slope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {allSites.map((site) => (
              <tr
                key={site.id}
                className={`transition-colors ${
                  site.is_selected ? "bg-primary/10 font-semibold" : "hover:bg-white/[0.02]"
                }`}
              >
                <td className="p-3.5 font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {site.is_selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    <span>{site.name}</span>
                    {site.is_selected && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                        Active Selection
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3.5 font-mono text-muted-foreground">
                  {site.is_selected ? (
                    <span className="text-primary font-bold">0.0 km (Selected Site)</span>
                  ) : (
                    `${site.distance_km} km`
                  )}
                </td>
                <td className="p-3.5 font-mono">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 font-bold ${
                      site.suitability_score >= 80
                        ? "bg-emerald-500/10 text-emerald-400"
                        : site.suitability_score >= 70
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {site.suitability_score} / 100
                  </span>
                </td>
                <td className="p-3.5 font-mono">
                  <span
                    className={
                      site.flood_zone_percent <= 5
                        ? "text-emerald-400"
                        : site.flood_zone_percent <= 15
                          ? "text-amber-400"
                          : "text-rose-400"
                    }
                  >
                    {site.flood_zone_percent}%
                  </span>
                </td>
                <td className="p-3.5 font-mono text-cyan-300">
                  +{site.construction_growth_percent}%
                </td>
                <td className="p-3.5 text-right font-mono text-foreground">{site.avg_slope}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Comparison Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Land Suitability Score Visual Comparison */}
        <div className="glass-panel flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-border/30 pb-3">
            <Layers className="h-4 w-4 text-primary" />
            <h4 className="font-display text-sm font-semibold text-foreground">
              Land Suitability Score Comparison
            </h4>
          </div>
          <div className="flex flex-col gap-3">
            {allSites.map((site) => {
              const pct = Math.round((site.suitability_score / maxSuitability) * 100);
              return (
                <div key={site.id} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span
                      className={
                        site.is_selected ? "font-bold text-primary" : "text-muted-foreground"
                      }
                    >
                      {site.name} {site.is_selected && "(Selected)"}
                    </span>
                    <span className="font-bold text-foreground">{site.suitability_score}/100</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        site.is_selected
                          ? "bg-gradient-to-r from-primary to-cyan-400"
                          : site.suitability_score >= 80
                            ? "bg-emerald-400/80"
                            : "bg-cyan-500/70"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5-Year Construction Growth Visual Comparison */}
        <div className="glass-panel flex flex-col gap-4 rounded-2xl border border-white/15 bg-white/[0.065] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-border/30 pb-3">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <h4 className="font-display text-sm font-semibold text-foreground">
              5-Year Built-Up Growth (%) Comparison
            </h4>
          </div>
          <div className="flex flex-col gap-3">
            {allSites.map((site) => {
              const pct = Math.min(
                100,
                Math.round((site.construction_growth_percent / maxGrowth) * 100),
              );
              return (
                <div key={site.id} className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span
                      className={
                        site.is_selected ? "font-bold text-primary" : "text-muted-foreground"
                      }
                    >
                      {site.name} {site.is_selected && "(Selected)"}
                    </span>
                    <span className="font-bold text-cyan-300">
                      +{site.construction_growth_percent}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        site.is_selected
                          ? "bg-gradient-to-r from-cyan-400 to-blue-500"
                          : "bg-cyan-500/60"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Neutral Factual Observations Box */}
      <div className="glass-panel flex flex-col gap-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-2 pb-2.5 border-b border-primary/20">
          <Info className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
          <h4 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-400">
            Spatial Benchmark Observations
          </h4>
        </div>
        <ul className="grid gap-3.5 md:grid-cols-2">
          {observations.map((obs, idx) => (
            <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-100 font-normal leading-relaxed">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <span>{obs}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
