import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Layers, MousePointer2 } from "lucide-react";

export function TimelineSlider({
  image2021 = "/src/assets/region-maharashtra.jpg",
  image2025 = "/src/assets/city-nashik.jpg",
}: {
  image2021?: string;
  image2025?: string;
}) {
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100
  const [showRedOverlay, setShowRedOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const yearDisplay = Math.round(2021 + (sliderPos / 100) * 4);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-white">
            Construction Heatmap (2021 - 2025)
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Drag the slider to observe structural changes over time.
          </p>
        </div>
        <button
          onClick={() => setShowRedOverlay(!showRedOverlay)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            showRedOverlay
              ? "bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
          }`}
        >
          <Layers className="h-4 w-4" />
          {showRedOverlay ? "Hide Construction" : "Highlight Construction"}
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative h-[400px] sm:h-[500px] w-full cursor-ew-resize overflow-hidden rounded-2xl border border-white/10 shadow-2xl touch-none"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleMove(e.touches[0]!.clientX);
        }}
        onTouchMove={(e) => {
          if (isDragging) handleMove(e.touches[0]!.clientX);
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* Base Image (2021) */}
        <div
          className="absolute inset-0 bg-cover bg-center saturate-50 brightness-75"
          style={{ backgroundImage: `url('${image2021}')` }}
        />

        {/* Overlay Image (2025) */}
        <div
          className="absolute inset-y-0 left-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${image2025}')`,
            width: `${sliderPos}%`,
            borderRight: "2px solid rgba(255,255,255,0.8)",
          }}
        >
          {/* Red Highlight Overlay (Masked to 2025 visibility) */}
          {showRedOverlay && (
            <div className="absolute inset-0 bg-red-500/30 mix-blend-multiply">
              {/* Mock red boxes representing construction */}
              <div className="absolute left-[20%] top-[40%] h-12 w-16 rounded border border-red-500/50 bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
              <div className="absolute left-[60%] top-[30%] h-20 w-24 rounded border border-red-500/50 bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
              <div className="absolute right-[10%] bottom-[20%] h-16 w-16 rounded border border-red-500/50 bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            </div>
          )}
        </div>

        {/* Slider Handle */}
        <div
          className="absolute inset-y-0 flex items-center justify-center"
          style={{ left: `calc(${sliderPos}% - 24px)` }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            <MousePointer2 className="h-5 w-5" />
          </div>
        </div>

        {/* Year Label Float */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-6 py-2 backdrop-blur-md border border-white/10">
          <span className="font-mono text-xl font-bold text-white tracking-widest">
            {yearDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
