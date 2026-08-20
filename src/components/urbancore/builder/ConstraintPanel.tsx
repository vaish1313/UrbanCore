import { useState } from "react";
import { AlertTriangle, ShieldAlert, Check, Eye } from "lucide-react";
import type { AOI } from "@/types/urbancore";

export function ConstraintPanel({ aoi }: { aoi: AOI }) {
  const { floodZoneOverlapPercent, forestBoundaryOverlapPercent, greenBeltOverlapPercent, protectedAreaOverlapPercent, environmentalRestriction } = aoi.constraints;

  const [activeToggles, setActiveToggles] = useState({
    flood: floodZoneOverlapPercent > 0,
    forest: forestBoundaryOverlapPercent > 0,
    greenbelt: greenBeltOverlapPercent > 0,
    protected: protectedAreaOverlapPercent > 0,
  });

  const toggleLayer = (key: keyof typeof activeToggles) => {
    setActiveToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const constraintsList = [
    { key: "flood" as const, title: "River / Flood Zone Buffer", val: floodZoneOverlapPercent, color: "text-atmos border-atmos/40", desc: "Godavari 100m blue line & 25-yr return flood risk polygon" },
    { key: "forest" as const, title: "Forest Boundary & Buffer", val: forestBoundaryOverlapPercent, color: "text-gis border-gis/40", desc: "Demarcated reserve forest boundary & eco-sensitive buffer" },
    { key: "greenbelt" as const, title: "Agricultural Green Belt", val: greenBeltOverlapPercent, color: "text-accent border-accent/40", desc: "Zonal DP masterplan agricultural land-use restriction" },
    { key: "protected" as const, title: "Protected Archeological / Heritage", val: protectedAreaOverlapPercent, color: "text-amber-400 border-amber-400/40", desc: "Heritage tribunal buffer and restricted building height zone" },
  ];

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            ZONAL & ENVIRONMENTAL AUDIT
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Development Constraints Manager
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" /> Risk Level: {environmentalRestriction}
        </span>
      </div>

      {/* Official Disclaimer Alert */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-semibold block">Potential Constraint Detected</span>
          <p className="mt-0.5 text-[11px] text-amber-300/80">
            Constraint overlays are satellite-derived automated spatial flags. They require official physical survey and verification by the Municipal Planning Authority.
          </p>
        </div>
      </div>

      {/* Constraints Toggles */}
      <div className="grid gap-3 sm:grid-cols-2">
        {constraintsList.map((c) => {
          const isActive = activeToggles[c.key];
          return (
            <div
              key={c.key}
              onClick={() => toggleLayer(c.key)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                isActive
                  ? "bg-foreground/[0.04] shadow-[0_0_16px_rgba(114,180,255,0.1)] " + c.color
                  : "border-border/40 bg-foreground/[0.01] text-muted-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-medium text-foreground">{c.title}</span>
                </div>
                <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {isActive && <Check className="h-3.5 w-3.5" />}
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-xs text-muted-foreground">Overlap Area:</span>
                <span className="font-mono text-sm font-semibold text-foreground">{c.val}%</span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground truncate">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
