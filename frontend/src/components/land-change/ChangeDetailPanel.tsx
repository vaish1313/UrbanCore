import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  MapPin,
  BarChart3,
  Calendar,
  TrendingUp,
  Building2,
  Image as ImageIcon,
  CircleAlert,
  ArrowLeft,
} from "lucide-react";
import { useCellChange } from "@/hooks/useCellChange";
import { useNewCells } from "@/hooks/useNewCells";
import { useCellSatelliteImagery } from "@/hooks/useCellSatelliteImagery";
import { useLandChangeStore } from "@/store/landChangeStore";
import type { YearGrid } from "@/api/types";
import { ChangesList } from "./ChangesList";
import { CellMapView } from "./CellMapView";

interface ChangeDetailPanelProps {
  grids: YearGrid[];
  analysisId?: string | null | undefined;
  analysisLat?: number | undefined;
  analysisLng?: number | undefined;
  analysisRadius?: number | undefined;
}

export function ChangeDetailPanel({
  grids,
  analysisId,
  analysisLat,
  analysisLng,
  analysisRadius,
}: ChangeDetailPanelProps) {
  const {
    selectedCellId,
    setSelectedCellId,
    clearCellSelection,
    year,
    setAutoRotate,
    autoRotate,
  } = useLandChangeStore();

  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const newCells = useNewCells(year, grids);
  const cellChange = useCellChange(
    selectedCellId,
    year,
    grids,
    analysisLat,
    analysisLng,
    analysisRadius,
  );

  const selectedIndex = selectedCellId
    ? newCells.findIndex((cell) => cell.id === selectedCellId)
    : -1;

  const totalNewCells = newCells.length;

  // Determine before/after years and classes
  const beforeYear = cellChange?.beforeYear ?? year - 1;
  const afterYear = cellChange?.afterYear ?? year;
  const beforeClass =
    (cellChange?.classes.find((c) => c.year === beforeYear)?.class as string | undefined) ??
    "land";
  const afterClass =
    (cellChange?.classes.find((c) => c.year === afterYear)?.class as string | undefined) ?? "new";

  const classLabels: Record<string, string> = {
    land: "Open Land",
    existing: "Existing Construction",
    new: "New Construction",
  };

  const classColors: Record<string, string> = {
    land: "#22c55e",
    existing: "#f97316",
    new: "#ef4444",
  };

  // Satellite imagery for before/after
  const imagery = useCellSatelliteImagery(
    selectedCellId,
    beforeYear,
    afterYear,
    cellChange?.approximateLat ?? null,
    cellChange?.approximateLng ?? null,
    cellChange?.approximateBbox ?? null,
  );

  // Clear map view when cell changes
  useEffect(() => {
    setShowMap(false);
  }, [selectedCellId]);

  // Handle year changes — clear selection if cell not "new" in new year
  useEffect(() => {
    if (selectedCellId && cellChange && !cellChange.isNewInCurrentYear) {
      clearCellSelection();
    }
  }, [year, selectedCellId, cellChange, clearCellSelection]);

  // Handle mobile bottom sheet
  useEffect(() => {
    const handleResize = () => {
      setIsSheetOpen(window.innerWidth < 900 && !!selectedCellId);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedCellId]);

  // Pause auto-rotate when panel is open
  useEffect(() => {
    if (selectedCellId && autoRotate) {
      setAutoRotate(false);
    }
  }, [selectedCellId, autoRotate, setAutoRotate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCellId) return;
      switch (e.key) {
        case "Escape":
          if (showMap) setShowMap(false);
          else clearCellSelection();
          break;
        case "ArrowLeft":
        case "[":
          e.preventDefault();
          if (selectedIndex > 0) {
            const prevCell = newCells[selectedIndex - 1];
            if (prevCell) setSelectedCellId(prevCell.id);
          }
          break;
        case "ArrowRight":
        case "]":
          e.preventDefault();
          if (selectedIndex < totalNewCells - 1) {
            const nextCell = newCells[selectedIndex + 1];
            if (nextCell) setSelectedCellId(nextCell.id);
          }
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedCellId,
    selectedIndex,
    newCells,
    totalNewCells,
    setSelectedCellId,
    clearCellSelection,
    showMap,
  ]);

  // Slider mouse/touch handling
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setSliderPosition(x * 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSliderMove(e.clientX);
    const handleMouseMove = (ev: MouseEvent) => handleSliderMove(ev.clientX);
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    handleSliderMove(e.touches[0].clientX);
    const handleTouchMove = (ev: TouchEvent) => {
      if (!ev.touches[0]) return;
      handleSliderMove(ev.touches[0].clientX);
    };
    const handleTouchEnd = () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  // Reset slider on new selection
  useEffect(() => {
    setSliderPosition(50);
  }, [selectedCellId]);

  // ─── Empty state ──────────────────────────────────────────────────────────
  if (!selectedCellId || !cellChange) {
    return (
      <div
        className="hidden lg:flex w-full max-w-md bg-[#070b16] border-l border-white/10 flex-col overflow-y-auto"
        style={{ borderColor: "rgba(239,68,68,0.2)" }}
      >
        <div className="flex flex-col items-center justify-center text-center p-8 border-b border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <CircleAlert className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Click a Red Block</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Click any <span className="text-red-400 font-medium">red block</span> in the 3D grid,
            or pick one from the list below.
          </p>
        </div>
        <div className="p-4">
          <ChangesList grids={grids} year={year} onCellSelect={setSelectedCellId} />
        </div>
      </div>
    );
  }

  // ─── Determine if we can show on map ──────────────────────────────────────
  const hasCoords = !!(cellChange.approximateLat && cellChange.approximateLng);

  // ─── Imagery helpers ──────────────────────────────────────────────────────
  const hasRealImagery =
    !imagery.before.error && !imagery.after.error &&
    (imagery.before.url || imagery.after.url || imagery.before.loading || imagery.after.loading);

  const renderBeforeLayer = () => {
    if (imagery.before.loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0a1020]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-cyan-500/40 border-t-cyan-400 animate-spin" />
            <span className="text-xs text-slate-500">Loading imagery…</span>
          </div>
        </div>
      );
    }
    if (imagery.before.url) {
      return (
        <img
          src={imagery.before.url}
          alt={`Before ${beforeYear}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      );
    }
    // Fallback schematic
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-2 border-dashed border-green-500/50 rounded-md" />
          <div
            className="absolute inset-0 rounded-md opacity-30"
            style={{ backgroundColor: classColors["land"] }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white">
            {classLabels[beforeClass] ?? beforeClass}
          </div>
        </div>
      </div>
    );
  };

  const renderAfterLayer = () => {
    if (imagery.after.loading) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0a1020]">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-red-500/40 border-t-red-400 animate-spin" />
            <span className="text-xs text-slate-500">Loading imagery…</span>
          </div>
        </div>
      );
    }
    if (imagery.after.url) {
      return (
        <img
          src={imagery.after.url}
          alt={`After ${afterYear}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      );
    }
    // Fallback schematic
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div className="absolute inset-0 border-2 border-dashed border-red-500/50 rounded-md" />
          <div
            className="absolute inset-0 rounded-md opacity-70"
            style={{ backgroundColor: classColors["new"] }}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white">
            {classLabels[afterClass] ?? afterClass}
          </div>
        </div>
      </div>
    );
  };

  // ─── Panel content ─────────────────────────────────────────────────────────
  const panelContent = (
    <div className="flex flex-col h-full">
      {/* ── MAP VIEW (replaces panel content when showMap is true) ── */}
      <AnimatePresence mode="wait">
        {showMap ? (
          <motion.div
            key="map-view"
            className="flex flex-col h-full p-4 gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CellMapView
              cellChange={cellChange}
              beforeYear={beforeYear}
              afterYear={afterYear}
              beforeClass={beforeClass}
              afterClass={afterClass}
              onBack={() => setShowMap(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="detail-view"
            className="flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h2 className="text-lg font-semibold text-white">NEW CONSTRUCTION DETECTED</h2>
                  <p className="text-sm text-slate-400">
                    {classLabels[beforeClass] ?? beforeClass} →{" "}
                    {classLabels[afterClass] ?? afterClass}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Grid cell R{cellChange.row} · C{cellChange.col}
                    {cellChange.approximateLat && (
                      <>
                        {" "}
                        · {cellChange.approximateLat.toFixed(6)},{" "}
                        {cellChange.approximateLng?.toFixed(6)}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={clearCellSelection}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close panel"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Before/After Comparison */}
            <div className="p-6 border-b border-white/10">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">BEFORE/AFTER COMPARISON</h3>
                <p className="text-xs text-slate-500">Drag to compare before and after imagery</p>
              </div>

              {/* Comparison frame */}
              <div
                ref={sliderRef}
                className="relative aspect-[10/7] rounded-xl overflow-hidden bg-[#0f1626] border border-white/10 cursor-col-resize"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Before layer (full) */}
                <div className="absolute inset-0">{renderBeforeLayer()}</div>

                {/* Before chip */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 pointer-events-none">
                  <span className="text-xs font-medium text-slate-300">Before · {beforeYear}</span>
                </div>

                {/* After layer (clipped) */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                >
                  {renderAfterLayer()}
                </div>

                {/* After chip */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-10 pointer-events-none">
                  <span className="text-xs font-medium text-slate-300">After · {afterYear}</span>
                </div>

                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-800 rounded-full" />
                  </div>
                </div>

                {/* Status banner — only show if no real imagery */}
                {!hasRealImagery && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full z-10">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        Schematic view · No satellite imagery available per cell
                      </span>
                    </div>
                  </div>
                )}

                {/* Imagery unavailable notice per slot */}
                {hasRealImagery && (imagery.before.error || imagery.after.error) && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
                    <span className="text-[10px] text-amber-400">
                      {imagery.before.error && imagery.after.error
                        ? "Imagery unavailable for both years"
                        : imagery.before.error
                          ? `Imagery unavailable for ${beforeYear}`
                          : `Imagery unavailable for ${afterYear}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Compare controls */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSliderPosition(0)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sliderPosition === 0
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    After
                  </button>
                  <button
                    onClick={() => setSliderPosition(50)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sliderPosition === 50
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => setSliderPosition(100)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sliderPosition === 100
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    Before
                  </button>
                </div>
                <span className="text-xs text-slate-500">Drag slider or use buttons</span>
              </div>
            </div>

            {/* Detail Tiles */}
            <div className="grid grid-cols-2 gap-4 p-6 border-b border-white/10">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-400">Land Change</span>
                </div>
                <div className="text-sm font-semibold text-white leading-tight">
                  {classLabels[beforeClass] ?? beforeClass} →{" "}
                  {classLabels[afterClass] ?? afterClass}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: classColors[beforeClass as keyof typeof classColors] ?? "#64748b" }}
                  />
                  <div className="text-xs text-slate-500">Before: {beforeYear}</div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: classColors[afterClass as keyof typeof classColors] ?? "#64748b" }}
                  />
                  <div className="text-xs text-slate-500">After: {afterYear}</div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-medium text-slate-400">Detected In</span>
                </div>
                <div className="text-2xl font-bold text-white">{cellChange.detectionYear}</div>
                <div className="text-xs text-slate-500 mt-2">
                  First year detected as new construction
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-slate-400">AI Confidence</span>
                </div>
                <div className="text-2xl font-bold text-slate-400">—</div>
                <div className="text-xs text-slate-500 mt-2">
                  Not available in current backend
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-medium text-slate-400">Built-up Share</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    {Math.round(cellChange.builtUpShare * 100)}%
                  </span>
                  <span className="text-sm text-slate-400">of cell</span>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Estimated built-up area within this grid cell
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-b border-white/10">
              <div className="flex gap-3">
                <button className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Report Concern
                </button>

                {hasCoords ? (
                  <button
                    onClick={() => setShowMap(true)}
                    className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Show on Map
                  </button>
                ) : (
                  <div
                    className="flex-1 relative group"
                    title="No coordinates available for this cell"
                  >
                    <button
                      disabled
                      className="w-full bg-white/5 border border-white/10 text-slate-500 px-4 py-3 rounded-xl font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Show on Map
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-black/90 text-slate-300 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-white/10">
                        No coordinates for this cell
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (selectedIndex > 0) {
                      const prevCell = newCells[selectedIndex - 1];
                      if (prevCell) setSelectedCellId(prevCell.id);
                    }
                  }}
                  disabled={selectedIndex <= 0}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm font-medium text-slate-300">Prev</span>
                </button>

                <div className="text-center">
                  <div className="text-sm font-medium text-white">
                    {selectedIndex + 1} of {totalNewCells}
                  </div>
                  <div className="text-xs text-slate-500">
                    New construction blocks in {year}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (selectedIndex < totalNewCells - 1) {
                      const nextCell = newCells[selectedIndex + 1];
                      if (nextCell) setSelectedCellId(nextCell.id);
                    }
                  }}
                  disabled={selectedIndex >= totalNewCells - 1}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-slate-300">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* All changes list */}
              <ChangesList grids={grids} year={year} onCellSelect={setSelectedCellId} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─── Mobile bottom sheet ───────────────────────────────────────────────────
  if (isSheetOpen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-[#070b16] border-t border-white/10 rounded-t-2xl shadow-2xl"
          style={{ height: "85vh" }}
        >
          <div className="pt-3 pb-2 flex justify-center">
            <div className="w-12 h-1.5 bg-white/30 rounded-full" />
          </div>
          <div className="h-[calc(85vh-40px)] overflow-y-auto">{panelContent}</div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Desktop side panel ────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="hidden lg:flex w-full max-w-md bg-[#070b16] border-l border-white/10 overflow-y-auto flex-col"
      style={{
        boxShadow: "0 0 40px rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.35)",
      }}
    >
      {panelContent}
    </motion.div>
  );
}
