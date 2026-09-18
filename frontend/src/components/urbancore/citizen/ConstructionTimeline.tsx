import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Layers,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Satellite,
  Flame,
  TrendingUp,
  Trees,
} from "lucide-react";
import { TIMELINE_YEARS, TIMELINE_DATA } from "@/data/citizenMockData";

const ease = [0.16, 1, 0.3, 1] as const;

type LayerMode = "satellite" | "heatmap" | "urbangrowth" | "vegetation";
type ViewMode = "single" | "split";

interface ConstructionTimelineProps {
  onReportConcern: () => void;
}

const LAYER_TABS: { id: LayerMode; label: string; icon: React.ElementType }[] = [
  { id: "satellite", label: "Satellite", icon: Satellite },
  { id: "heatmap", label: "Heatmap", icon: Flame },
  { id: "urbangrowth", label: "Urban Growth", icon: TrendingUp },
  { id: "vegetation", label: "Vegetation", icon: Trees },
];

export function ConstructionTimeline({ onReportConcern }: ConstructionTimelineProps) {
  const [selectedYear, setSelectedYear] = useState(2023);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [layerMode, setLayerMode] = useState<LayerMode>("satellite");
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setSelectedYear((y) => {
          const idx = TIMELINE_YEARS.indexOf(y);
          if (idx >= TIMELINE_YEARS.length - 1) {
            setIsPlaying(false);
            return TIMELINE_YEARS[0]!;
          }
          return TIMELINE_YEARS[idx + 1]!;
        });
      }, 1200);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying]);

  // Split slider drag
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(clientX - rect.left, rect.width - 5));
    setSliderPos((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { if (isDragging) handleMove(e.clientX); };
    const onMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, handleMove]);

  const yearData = TIMELINE_DATA[selectedYear]!;

  // Heatmap blobs (mock construction hotspots)
  const heatmapBlobs = [
    { left: "22%", top: "35%", w: 70, h: 55, color: "#ef4444" },
    { left: "55%", top: "28%", w: 90, h: 70, color: "#f97316" },
    { left: "70%", top: "55%", w: 60, h: 50, color: "#ef4444" },
    { left: "35%", top: "60%", w: 50, h: 40, color: "#eab308" },
    { left: "10%", top: "70%", w: 40, h: 35, color: "#f97316" },
  ];

  // Overlay layer style
  const getOverlay = () => {
    switch (layerMode) {
      case "heatmap": return "rgba(0,0,0,0.1)";
      case "urbangrowth": return "rgba(59,130,246,0.15)";
      case "vegetation": return "rgba(34,197,94,0.15)";
      default: return "transparent";
    }
  };

  return (
    <motion.section
      className="cs-timeline-section"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease }}
    >
      {/* Header */}
      <div className="cs-tl-header">
        <div>
          <p className="cs-tl-eyebrow">Satellite Intelligence</p>
          <h2 className="cs-tl-title">Construction Timeline</h2>
          <p className="cs-tl-subtitle">Drag the slider to observe structural changes over time</p>
        </div>
        <div className="cs-tl-controls">
          {/* Layer tabs */}
          <div className="cs-layer-tabs">
            {LAYER_TABS.map(({ id, label, icon: TabIcon }) => {
              const TabIconEl = TabIcon as React.ElementType;
              return (
              <button
                key={id}
                type="button"
                id={`layer-${id}-btn`}
                className={`cs-layer-tab ${layerMode === id ? "cs-layer-tab--active" : ""}`}
                onClick={() => setLayerMode(id)}
              >
                <TabIconEl className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
              );
            })}
          </div>
          {/* View mode */}
          <div className="cs-view-toggle">
            <button
              type="button"
              id="single-view-btn"
              className={`cs-view-btn ${viewMode === "single" ? "cs-view-btn--active" : ""}`}
              onClick={() => setViewMode("single")}
            >
              <Satellite className="h-3.5 w-3.5" />
              Single View
            </button>
            <button
              type="button"
              id="split-view-btn"
              className={`cs-view-btn ${viewMode === "split" ? "cs-view-btn--active" : ""}`}
              onClick={() => setViewMode("split")}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Split View
            </button>
          </div>
        </div>
      </div>

      {/* Map viewer */}
      <div
        ref={containerRef}
        className="cs-map-viewer"
        style={{ cursor: viewMode === "split" ? "ew-resize" : "default" }}
        onMouseDown={viewMode === "split" ? (e) => { setIsDragging(true); handleMove(e.clientX); } : undefined}
        onTouchStart={viewMode === "split" ? (e) => { setIsDragging(true); handleMove(e.touches[0]!.clientX); } : undefined}
        onTouchMove={viewMode === "split" ? (e) => { if (isDragging) handleMove(e.touches[0]!.clientX); } : undefined}
        onTouchEnd={() => setIsDragging(false)}
      >
        {viewMode === "split" ? (
          <>
            {/* Base image (2021) */}
            <div className="cs-viewer-base" style={{ backgroundImage: `url('/src/assets/region-maharashtra.jpg')` }}>
              <div className="cs-viewer-year-badge cs-viewer-year-badge--left">2021</div>
            </div>
            {/* Overlay image (2025) */}
            <div
              className="cs-viewer-overlay"
              style={{
                width: `${sliderPos}%`,
                backgroundImage: `url('/src/assets/city-nashik.jpg')`,
                backgroundColor: getOverlay(),
              }}
            >
              <div className="cs-viewer-year-badge cs-viewer-year-badge--right">2025</div>
              {/* Heatmap blobs */}
              {layerMode === "heatmap" && heatmapBlobs.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.75, scale: 1 }}
                  className="cs-heatmap-blob"
                  style={{ left: b.left, top: b.top, width: b.w, height: b.h, background: `radial-gradient(ellipse,${b.color}cc 0%,${b.color}44 60%,transparent 100%)` }}
                />
              ))}
            </div>
            {/* Slider handle */}
            <div className="cs-split-handle" style={{ left: `${sliderPos}%` }}>
              <div className="cs-split-btn">
                <ChevronLeft className="h-3 w-3" />
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </>
        ) : (
          /* Single view */
          <div className="cs-viewer-base cs-viewer-base--full" style={{ backgroundImage: `url('/src/assets/region-maharashtra.jpg')` }}>
            <div style={{ position: "absolute", inset: 0, background: getOverlay() }} />
            {layerMode === "heatmap" && heatmapBlobs.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} className="cs-heatmap-blob"
                style={{ left: b.left, top: b.top, width: b.w, height: b.h, background: `radial-gradient(ellipse,${b.color}cc 0%,${b.color}44 60%,transparent 100%)` }} />
            ))}
            <div className="cs-viewer-year-badge cs-viewer-year-badge--left">{selectedYear}</div>
          </div>
        )}

        {/* Heatmap legend */}
        {layerMode === "heatmap" && (
          <div className="cs-heatmap-legend">
            <span className="text-[10px] text-slate-400 mr-2">Construction Intensity</span>
            <div className="cs-heatmap-legend-bar" />
            <div className="flex justify-between w-[100px]">
              <span className="text-[9px] text-slate-500">Low</span>
              <span className="text-[9px] text-slate-500">High</span>
            </div>
          </div>
        )}

        {/* Map controls */}
        <div className="cs-viewer-map-controls">
          <button type="button" className="cs-ctrl-btn" aria-label="Zoom in"><span style={{ fontSize: 18, lineHeight: 1 }}>+</span></button>
          <div className="cs-ctrl-sep" />
          <button type="button" className="cs-ctrl-btn" aria-label="Zoom out"><span style={{ fontSize: 18, lineHeight: 1 }}>−</span></button>
          <button type="button" className="cs-ctrl-btn cs-ctrl-btn--gap" aria-label="Locate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>
          </button>
        </div>
      </div>

      {/* Year timeline + stats */}
      <div className="cs-year-timeline">
        {/* Play/pause */}
        <button
          type="button"
          id="timeline-play-btn"
          className="cs-play-btn"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>

        {/* Year dots */}
        <div className="cs-year-dots">
          <div className="cs-year-track" />
          {TIMELINE_YEARS.map((y) => (
            <div key={y} className="cs-year-node" onClick={() => { setSelectedYear(y); setIsPlaying(false); }}>
              <motion.div
                className={`cs-year-dot ${selectedYear === y ? "cs-year-dot--active" : ""}`}
                whileHover={{ scale: 1.3 }}
                layout
              />
              <span className={`cs-year-label ${selectedYear === y ? "cs-year-label--active" : ""}`}>{y}</span>
            </div>
          ))}
        </div>

        {/* Selected year chip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedYear}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="cs-year-chip"
          >
            {selectedYear}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Year stats */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          className="cs-year-stats"
        >
          <div className="cs-year-stat">
            <span className="cs-stat-label">Structures</span>
            <span className="cs-stat-val">{yearData.buildingCount}</span>
          </div>
          <div className="cs-year-stat">
            <span className="cs-stat-label">Built-up Change</span>
            <span className="cs-stat-val" style={{ color: yearData.builtUpChange > 20 ? "#fb923c" : "#34d399" }}>
              +{yearData.builtUpChange}%
            </span>
          </div>
          <div className="cs-year-stat">
            <span className="cs-stat-label">Green Cover</span>
            <span className="cs-stat-val">{yearData.greenCover}%</span>
          </div>
          <div className="cs-year-stat">
            <span className="cs-stat-label">Roads</span>
            <span className="cs-stat-val">{yearData.roadsKm} km</span>
          </div>
          <p className="cs-year-desc">{yearData.description}</p>
        </motion.div>
      </AnimatePresence>

      <style>{`
        .cs-timeline-section { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 24px 52px; }
        .cs-tl-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .cs-tl-eyebrow { font-family: var(--font-mono,monospace); font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; color: #22d3ee; margin: 0 0 4px; }
        .cs-tl-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 1.75rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
        .cs-tl-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
        .cs-tl-controls { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
        .cs-layer-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 4px; }
        .cs-layer-tab { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: none; background: transparent; color: #64748b; font-size: 0.75rem; font-weight: 500; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .cs-layer-tab--active { background: rgba(34,211,238,0.12); color: #22d3ee; border: 1px solid rgba(34,211,238,0.25); }
        .cs-view-toggle { display: flex; gap: 4px; }
        .cs-view-btn { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #64748b; font-size: 0.75rem; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .cs-view-btn--active { background: rgba(56,189,248,0.1); color: #38bdf8; border-color: rgba(56,189,248,0.25); }

        /* Map viewer */
        .cs-map-viewer { position: relative; height: 400px; border-radius: 16px; overflow: hidden; background: #0d1428; user-select: none; touch-action: none; }
        @media (max-width: 640px) { .cs-map-viewer { height: 260px; } }
        .cs-viewer-base {
          position: absolute; inset: 0;
          background-size: cover; background-position: center;
          filter: saturate(0.6) brightness(0.75);
        }
        .cs-viewer-base--full { filter: saturate(0.8) brightness(0.8); }
        .cs-viewer-overlay {
          position: absolute; inset-y: 0; left: 0;
          background-size: cover; background-position: center;
          border-right: 2px solid rgba(255,255,255,0.7);
          overflow: hidden;
        }
        .cs-viewer-year-badge {
          position: absolute; top: 12px;
          background: rgba(6,9,20,0.85); border-radius: 8px;
          padding: 4px 12px; font-size: 0.875rem; font-weight: 700; color: #fff;
          font-family: var(--font-mono,monospace); letter-spacing: 0.05em;
          backdrop-filter: blur(8px);
        }
        .cs-viewer-year-badge--left { left: 12px; }
        .cs-viewer-year-badge--right { right: 12px; }

        /* Heatmap blobs */
        .cs-heatmap-blob { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(12px); }
        .cs-heatmap-legend {
          position: absolute; bottom: 12px; right: 52px;
          background: rgba(6,9,20,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 7px 12px;
          backdrop-filter: blur(8px);
          display: flex; flex-direction: column; align-items: center; gap: 3px;
        }
        .cs-heatmap-legend-bar {
          width: 100px; height: 8px; border-radius: 4px;
          background: linear-gradient(90deg,#22c55e,#eab308,#f97316,#ef4444);
        }

        /* Split handle */
        .cs-split-handle {
          position: absolute; inset-y: 0;
          width: 2px; background: rgba(255,255,255,0.8);
          transform: translateX(-50%);
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .cs-split-btn {
          display: flex; align-items: center;
          background: #fff; border-radius: 50%;
          width: 36px; height: 36px;
          justify-content: center;
          box-shadow: 0 0 20px rgba(255,255,255,0.4);
          color: #0f172a;
        }

        /* Controls */
        .cs-viewer-map-controls { position: absolute; right: 12px; bottom: 12px; display: flex; flex-direction: column; gap: 2px; }
        .cs-ctrl-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(6,9,20,0.85); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #94a3b8; cursor: pointer; backdrop-filter: blur(8px); transition: all 0.15s; font-size: 1rem; }
        .cs-ctrl-btn:hover { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.3); color: #e2e8f0; }
        .cs-ctrl-btn--gap { margin-top: 6px; }
        .cs-ctrl-sep { height: 1px; background: rgba(255,255,255,0.08); margin: 1px 4px; }

        /* Year timeline */
        .cs-year-timeline { display: flex; align-items: center; gap: 16px; padding: 20px 0 8px; }
        .cs-play-btn {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px;
          background: linear-gradient(135deg,#06b6d4,#3b82f6);
          border: none; border-radius: 50%; color: #fff;
          cursor: pointer; flex-shrink: 0;
          box-shadow: 0 0 20px rgba(34,211,238,0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cs-play-btn:hover { transform: scale(1.08); box-shadow: 0 0 28px rgba(34,211,238,0.4); }
        .cs-year-dots { flex: 1; position: relative; display: flex; align-items: center; justify-content: space-between; }
        .cs-year-track { position: absolute; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.08); }
        .cs-year-node { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; z-index: 1; }
        .cs-year-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.2); transition: all 0.2s; }
        .cs-year-dot--active { background: #22d3ee; border-color: #22d3ee; box-shadow: 0 0 10px #22d3ee; width: 16px; height: 16px; }
        .cs-year-label { font-size: 0.75rem; color: #475569; font-family: var(--font-mono,monospace); transition: color 0.2s; }
        .cs-year-label--active { color: #22d3ee; font-weight: 600; }
        .cs-year-chip {
          background: rgba(6,9,20,0.85); border: 1px solid rgba(34,211,238,0.3);
          border-radius: 10px; padding: 5px 14px;
          font-family: var(--font-mono,monospace); font-size: 1rem; font-weight: 700; color: #22d3ee;
          flex-shrink: 0;
        }

        /* Year stats */
        .cs-year-stats {
          background: rgba(13,20,40,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px 20px;
          display: flex; flex-wrap: wrap; align-items: center; gap: 20px 32px;
        }
        .cs-year-stat { display: flex; flex-direction: column; gap: 2px; }
        .cs-stat-label { font-size: 0.7rem; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
        .cs-stat-val { font-family: var(--font-display,"Sora",sans-serif); font-size: 1.25rem; font-weight: 700; color: #f1f5f9; }
        .cs-year-desc { flex: 1; min-width: 200px; font-size: 0.8125rem; color: #64748b; line-height: 1.6; }
        @media (max-width: 640px) { .cs-timeline-section { padding: 0 16px 36px; } }
      `}</style>
    </motion.section>
  );
}
