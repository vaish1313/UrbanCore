import { useState } from "react";
import { Building2, Search, Filter } from "lucide-react";
import { BUILDING_DETECTIONS } from "@/data/municipalData";
import type { BuildingDetection } from "@/types/urbancore";

export function ConstructionMonitor() {
  const [filterYear, setFilterYear] = useState<number | "ALL">("ALL");
  const [selectedBld, setSelectedBld] = useState<BuildingDetection | null>(BUILDING_DETECTIONS[0]!);

  const filtered = BUILDING_DETECTIONS.filter(
    (b) => filterYear === "ALL" || b.firstDetectedYear === filterYear || b.latestDetectedYear === filterYear
  );

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            U-NET + SAM FOOTPRINT SEGMENTATION
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Construction Monitoring
          </h3>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Filter Year:</span>
          {["ALL", 2021, 2022, 2023, 2024, 2025].map((y) => (
            <button
              key={y.toString()}
              type="button"
              onClick={() => setFilterYear(y as any)}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${
                filterYear === y
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-foreground/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Buildings Table */}
      <div className="overflow-x-auto rounded-2xl border border-border/40 bg-foreground/[0.01]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="p-3.5">Structure ID / Location</th>
              <th className="p-3.5">Storeys</th>
              <th className="p-3.5">First Detected</th>
              <th className="p-3.5">Built-up Footprint</th>
              <th className="p-3.5">Protected Zone Proximity</th>
              <th className="p-3.5 text-right">Review Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.map((b) => {
              const isSelected = selectedBld?.id === b.id;
              const statusColor =
                b.status === "Newly Detected"
                  ? "text-accent bg-accent/10 border-accent/30"
                  : b.status === "Under Review"
                  ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
                  : b.status === "Changed"
                  ? "text-primary bg-primary/10 border-primary/30"
                  : "text-muted-foreground bg-foreground/5 border-border";

              return (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBld(b)}
                  className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-white/[0.02]"}`}
                >
                  <td className="p-3.5 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <span>{b.location}</span>
                        <span className="block font-mono text-[9px] text-muted-foreground">{b.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-foreground">{b.storeys} F</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{b.firstDetectedYear}</td>
                  <td className="p-3.5 font-mono text-foreground">{b.builtUpAreaSqM} m²</td>
                  <td className="p-3.5 text-muted-foreground">{b.nearbyProtectedZone}</td>
                  <td className="p-3.5 text-right">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${statusColor}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
