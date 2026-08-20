import { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Sliders, Camera, MapPin, AlertCircle, FileCheck } from "lucide-react";
import type { MunicipalAlert } from "@/types/urbancore";
import cityImg from "@/assets/city-nashik.jpg";
import regionImg from "@/assets/region-maharashtra.jpg";

export function EvidenceViewer({
  alert,
  onGenerateDraft,
}: {
  alert: MunicipalAlert;
  onGenerateDraft: () => void;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            SATELLITE CHANGE AUDIT EVIDENCE
          </span>
          <h3 className="font-display text-lg font-medium text-foreground flex items-center gap-2">
            Evidence Viewer: {alert.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onGenerateDraft}
          className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/20 px-4 py-2 font-mono text-xs font-semibold text-primary hover:bg-primary/30 transition-colors shadow-[0_0_16px_rgba(114,180,255,0.2)]"
        >
          <FileCheck className="h-4 w-4" /> Generate Complaint Draft
        </button>
      </div>

      {/* Interactive 2021 | 2025 Split-Screen Drag Slider */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-black">
        <div
          ref={containerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative h-80 w-full cursor-ew-resize select-none overflow-hidden"
        >
          {/* Right Image: 2025 (After / Current) */}
          <img
            src={cityImg}
            alt="2025 Satellite Imagery"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute top-3 right-3 rounded-full border border-primary/40 bg-background/80 px-3 py-1 font-mono text-[10px] font-semibold text-primary backdrop-blur-md">
            2025 · Detected Change
          </div>

          {/* Overlay Box for Detected Footprint */}
          <div
            className="absolute border-2 border-destructive bg-destructive/20 rounded-lg pointer-events-none animate-pulse"
            style={{ left: "55%", top: "35%", width: "22%", height: "30%" }}
          >
            <span className="absolute -top-5 left-0 font-mono text-[9px] text-destructive font-bold bg-background/90 px-1.5 py-0.5 rounded">
              ⚠️ Footprint Flagged
            </span>
          </div>

          {/* Left Image: 2021 (Before / Baseline) clipped by sliderPos */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={regionImg}
              alt="2021 Baseline Satellite Imagery"
              className="h-full w-full object-cover"
              style={{ width: containerRef.current?.offsetWidth || "100%" }}
            />
            <div className="absolute top-3 left-3 rounded-full border border-border bg-background/80 px-3 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-md">
              2021 · Baseline
            </div>
          </div>

          {/* Divider Handle */}
          <div
            className="absolute inset-y-0 z-20 w-1 bg-primary cursor-ew-resize"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-primary bg-background shadow-xl text-primary">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-background/90 px-4 py-2 text-center font-mono text-[10px] text-muted-foreground border-t border-border/40">
          <span>◄ Drag left for 2025 Change View</span>
          <span className="text-primary">Drag handle to compare 2021 vs 2025</span>
          <span>Drag right for 2021 Baseline View ►</span>
        </div>
      </div>

      {/* Metadata & Evidence Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" /> GPS Coordinates
          </div>
          <div className="mt-1 font-mono text-xs font-semibold text-foreground">{alert.evidence.gpsCoords}</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
            <Camera className="h-3.5 w-3.5 text-primary" /> Sensor Source
          </div>
          <div className="mt-1 font-mono text-xs font-semibold text-foreground">{alert.evidence.satelliteSensor}</div>
        </div>

        <div className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" /> Footprint Signature
          </div>
          <div className="mt-1 text-xs text-foreground/90 truncate">{alert.evidence.buildingFootprint}</div>
        </div>
      </div>
    </div>
  );
}
