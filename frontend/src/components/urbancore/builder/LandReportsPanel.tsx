import { FileText } from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { useBuilderSuitability, useBuilderTerrain } from "@/hooks/use-builder";

export function LandReportsPanel({
  aoi,
  onGenerateReport,
}: {
  aoi: AOI;
  onGenerateReport: () => void;
}) {
  const isMapSelected = aoi.selectionSource === "map-selected";
  const { data: suitability, isLoading } = useBuilderSuitability(aoi.id, !isMapSelected);
  const { data: terrain, isLoading: isTerrainLoading, isError: isTerrainError } = useBuilderTerrain(aoi.id, !isMapSelected);

  return (
    <div className="glass-panel w-full rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400 mb-2">
            <FileText className="h-3 w-3 text-cyan-400" />
            <span>GEOSPATIAL LAND REPORT</span>
          </div>
          <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
            Land Intelligence Report: {aoi.name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Comprehensive geospatial evaluation including land suitability, terrain readiness,
            environmental constraints, and 5-year growth timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateReport}
          className="flex items-center justify-center gap-2.5 rounded-2xl border border-cyan-500/50 bg-cyan-500/20 px-6 py-3.5 font-mono text-xs font-semibold text-cyan-300 transition-all duration-300 hover:bg-cyan-500/30 hover:border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)] shrink-0 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-cyan-400" />
          <span>Generate Land Intelligence PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-slate-400">Selected Location</span>
          <span className="text-sm font-semibold text-white">
            {aoi.location || "Nashik, Maharashtra"}
          </span>
          <span className="font-mono text-[11px] text-cyan-400">
            {aoi.coords.lat}° N, {aoi.coords.lng}° E
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-slate-400">Suitability Score</span>
          <span className="text-lg font-bold text-cyan-400">
            {isMapSelected || isLoading || suitability?.overall_score == null
              ? "Assessment Incomplete"
              : `${suitability.overall_score.toFixed(2)} / 100`}
          </span>
          <span className="text-xs text-slate-400">
            {isMapSelected ? "Suitability unavailable for this location" : suitability?.constraint_status === "UNAVAILABLE" ? "Constraint assessment unavailable" : "Backend site screening result"}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase text-slate-400">Terrain Readiness</span>
          <span className="text-sm font-semibold text-emerald-400">
            {isMapSelected || isTerrainError ? "UNAVAILABLE" : isTerrainLoading || !terrain ? "LOADING" : "AVAILABLE"}
          </span>
          <span className="text-xs text-slate-400">
            {isMapSelected
              ? "Coordinate-based terrain analysis is not available"
              : isTerrainError
                ? "Terrain metrics could not be loaded"
                : terrain
                  ? `${terrain.terrain_roughness_m.toFixed(2)} m roughness (${terrain.mean_slope_deg.toFixed(2)}° mean slope)`
                  : "Loading terrain metrics..."}
          </span>
        </div>
      </div>
    </div>
  );
}
