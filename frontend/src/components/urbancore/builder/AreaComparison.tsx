import { useState } from "react";
import { SlidersHorizontal, Trophy, ArrowRightLeft } from "lucide-react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import { BUILDER_COMPARISON_PRESETS } from "@/data/builderData";

export function AreaComparison() {
  const [areaAId, setAreaAId] = useState("gangapur-road");
  const [areaBId, setAreaBId] = useState("pathardi-phata");

  const areaA = NASHIK_AOIS.find((a) => a.id === areaAId) || NASHIK_AOIS[0]!;
  const areaB = NASHIK_AOIS.find((a) => a.id === areaBId) || NASHIK_AOIS[1]!;

  const preset = BUILDER_COMPARISON_PRESETS.find(
    (p) => (p.areaA === areaAId && p.areaB === areaBId) || (p.areaA === areaBId && p.areaB === areaAId)
  );

  const customMetrics = [
    { label: "Suitability Score", valA: areaA.suitabilityScore, valB: areaB.suitabilityScore, winner: areaA.suitabilityScore >= areaB.suitabilityScore ? "A" : "B" },
    { label: "Flat Land %", valA: `${areaA.terrain.flatLandPercent}%`, valB: `${areaB.terrain.flatLandPercent}%`, winner: areaA.terrain.flatLandPercent >= areaB.terrain.flatLandPercent ? "A" : "B" },
    { label: "Average Slope", valA: `${areaA.terrain.slope}°`, valB: `${areaB.terrain.slope}°`, winner: areaA.terrain.slope <= areaB.terrain.slope ? "A" : "B" },
    { label: "Road Access Score", valA: areaA.accessibilityScore, valB: areaB.accessibilityScore, winner: areaA.accessibilityScore >= areaB.accessibilityScore ? "A" : "B" },
    { label: "Flood Risk Overlap", valA: `${areaA.constraints.floodZoneOverlapPercent}%`, valB: `${areaB.constraints.floodZoneOverlapPercent}%`, winner: areaA.constraints.floodZoneOverlapPercent <= areaB.constraints.floodZoneOverlapPercent ? "A" : "B" },
    { label: "Environmental Restriction", valA: areaA.constraints.environmentalRestriction, valB: areaB.constraints.environmentalRestriction, winner: areaA.constraints.environmentalRestriction === "Low" ? "A" : "B" },
  ];

  const metrics = preset
    ? preset.metrics.map((m) => ({
        label: m.label,
        valA: m.valueA,
        valB: m.valueB,
        winner: m.winner,
      }))
    : customMetrics;

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            GEOSPATIAL BENCHMARKING
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Compare Nearby Areas
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Side-by-Side Matrix
        </span>
      </div>

      {/* Selector dropdowns */}
      <div className="grid items-center gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Area A</label>
          <select
            value={areaAId}
            onChange={(e) => setAreaAId(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
          >
            {NASHIK_AOIS.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === areaBId}>
                {a.name} ({a.suitabilityScore}/100)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Area B</label>
          <select
            value={areaBId}
            onChange={(e) => setAreaBId(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary"
          >
            {NASHIK_AOIS.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === areaAId}>
                {a.name} ({a.suitabilityScore}/100)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-foreground/[0.01]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="p-3.5">Metric</th>
              <th className="p-3.5 text-primary">{areaA.name}</th>
              <th className="p-3.5 text-accent">{areaB.name}</th>
              <th className="p-3.5 text-right">Advantage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {metrics.map((m) => (
              <tr key={m.label} className="transition-colors hover:bg-white/[0.02]">
                <td className="p-3.5 font-medium text-foreground">{m.label}</td>
                <td className={`p-3.5 font-mono ${m.winner === "A" ? "font-bold text-primary" : "text-muted-foreground"}`}>
                  {m.valA}
                </td>
                <td className={`p-3.5 font-mono ${m.winner === "B" ? "font-bold text-accent" : "text-muted-foreground"}`}>
                  {m.valB}
                </td>
                <td className="p-3.5 text-right font-mono text-[10px]">
                  {m.winner === "A" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                      <Trophy className="h-3 w-3" /> {areaA.name}
                    </span>
                  ) : m.winner === "B" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent">
                      <Trophy className="h-3 w-3" /> {areaB.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Tie</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
