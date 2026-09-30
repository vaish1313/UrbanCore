import { useState } from "react";
import { Building2, Search, Filter, Loader2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

import { useAnalysis } from "@/hooks/use-analysis";
import { BUILDING_DETECTIONS } from "@/data/municipalData";
import type { BuildingDetection } from "@/types/urbancore";

interface ConstructionMonitorProps {
  analysisId?: string; // New prop for real analysis data
}

export function ConstructionMonitor({ analysisId }: ConstructionMonitorProps) {
  const [filterYear, setFilterYear] = useState<number | "ALL">("ALL");
  const [selectedBld, setSelectedBld] = useState<BuildingDetection | null>(BUILDING_DETECTIONS[0]!);

  const { data: analysis, isLoading, error } = useAnalysis(analysisId);

  // Generate building detections from real analysis data
  const buildingDetections: BuildingDetection[] = [];

  // For real analysis, we don't generate synthetic building detections
  // The actual construction data is shown in the map visualization
  // This table could show year-over-year statistics instead

  const dataToShow = analysisId && analysis ? [] : BUILDING_DETECTIONS; // Only show mock data if no real analysis
  const yearsToShow = analysisId && analysis ? analysis.years : [2021, 2022, 2023, 2024, 2025];

  const filtered = dataToShow.filter(
    (b) =>
      filterYear === "ALL" ||
      b.firstDetectedYear === filterYear ||
      b.latestDetectedYear === filterYear,
  );

  // Loading state
  if (analysisId && isLoading) {
    return (
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading construction monitoring data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (analysisId && error) {
    return (
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
        <div className="flex items-center justify-center py-16 text-center">
          <div>
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
            <p className="text-muted-foreground">Failed to load construction data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            {analysisId ? "REAL-TIME ANALYSIS" : "U-NET + SAM FOOTPRINT SEGMENTATION"}
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Construction Monitoring
            {analysisId && analysis && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({analysis.years.length} years analyzed)
              </span>
            )}
          </h3>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Filter Year:
          </span>
          {["ALL", ...yearsToShow].map((y) => (
            <button
              key={y.toString()}
              type="button"
              onClick={() => setFilterYear(y as number | "ALL")}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-colors ${filterYear === y
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
      {analysisId && analysis ? (
        <div className="bg-foreground/[0.02] rounded-2xl p-6 border border-border/30">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Real-Time Analysis Results
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Construction monitoring data is visualized on the map above.
            Each year's actual detected building footprints are shown as polygons.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Analysis Period:</span>
              <div className="font-mono font-medium text-foreground">
                {analysis.start_year}–{analysis.end_year}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Years Analyzed:</span>
              <div className="font-mono font-medium text-foreground">
                {analysis.years.length} years
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Analysis Radius:</span>
              <div className="font-mono font-medium text-foreground">
                {analysis.radius_m}m
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Detection Method:</span>
              <div className="font-mono font-medium text-foreground">
                U-Net + SAM-3D
              </div>
            </div>
          </div>
        </div>
      ) : (
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
              {filtered.length > 0 ? (
                filtered.map((b) => {
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
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setSelectedBld(b)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-white/[0.02]"}`}
                    >
                      <td className="p-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <span>{b.location}</span>
                            <span className="block font-mono text-[9px] text-muted-foreground">
                              {b.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-foreground">{b.storeys} F</td>
                      <td className="p-3.5 font-mono text-muted-foreground">{b.firstDetectedYear}</td>
                      <td className="p-3.5 font-mono text-foreground">{b.builtUpAreaSqM.toLocaleString()} m²</td>
                      <td className="p-3.5 text-muted-foreground">{b.nearbyProtectedZone}</td>
                      <td className="p-3.5 text-right">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${statusColor}`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No construction data found for the selected year filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
