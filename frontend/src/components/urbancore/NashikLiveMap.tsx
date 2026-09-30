/**
 * NashikLiveMap
 * Loops: full map (2s) → zoom into Gangapur Road (1.4s) → AOI held (2.5s) → zoom out (1.4s) → repeat
 */

import { useEffect, useRef, useState } from "react";
import { Search, Clock } from "lucide-react";

// Gangapur Road focal point (~62% x, ~60% y of the image)
// CSS transform-origin: center (50%,50%)
// translate (in scaled frame) to bring focal to center:
//   tx = (50 - fx) * (1 - 1/S),  ty = (50 - fy) * (1 - 1/S)
const ZOOM_SCALE = 2.6;
const FOCAL_X    = 62;
const FOCAL_Y    = 60;
const TX = (50 - FOCAL_X) * (1 - 1 / ZOOM_SCALE); // ≈ -4.6%
const TY = (50 - FOCAL_Y) * (1 - 1 / ZOOM_SCALE); // ≈ -3.8%

type Phase = "full" | "zooming-in" | "zoomed" | "zooming-out";

export function NashikLiveMap() {
  const [phase, setPhase]           = useState<Phase>("full");
  const [aoiVisible, setAoiVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const loop = () => {
      // 1. Show full map
      setPhase("full");
      setAoiVisible(false);
      timerRef.current = setTimeout(() => {

        // 2. Zoom in
        setPhase("zooming-in");
        timerRef.current = setTimeout(() => {

          // 3. Hold zoomed + show AOI
          setPhase("zoomed");
          setAoiVisible(true);
          timerRef.current = setTimeout(() => {

            // 4. Zoom out
            setAoiVisible(false);
            setPhase("zooming-out");
            timerRef.current = setTimeout(loop, 1500); // after zoom-out, restart

          }, 2500);
        }, 1500);
      }, 2000);
    };

    loop();
    return () => clearTimeout(timerRef.current);
  }, []);

  const isZoomed = phase === "zooming-in" || phase === "zoomed";

  return (
    <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#050a15] p-4 backdrop-blur-xl shadow-2xl relative">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center mb-3 px-1 gap-2">
        <div className="px-4 py-2 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-[11px] text-white">Search Location...</span>
        </div>
        <div className="px-4 py-2 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="font-mono text-[11px] text-white">2021 – 2025</span>
        </div>
      </div>

      {/* ── Map area ────────────────────────────────────────────────────── */}
      <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl border border-white/5 overflow-hidden relative select-none">

        {/* Map image — zoom handled by CSS transform */}
        <div
          className="absolute inset-0 origin-center"
          style={{
            transform: isZoomed
              ? `scale(${ZOOM_SCALE}) translate(${TX.toFixed(2)}%, ${TY.toFixed(2)}%)`
              : "scale(1) translate(0%, 0%)",
            transition: (phase === "zooming-in" || phase === "zooming-out")
              ? "transform 1.4s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
            willChange: "transform",
          }}
        >
          <img
            src="/citizen map.png"
            alt="Nashik satellite map"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Subtle GIS grid */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right,#38bdf8 1px,transparent 1px),linear-gradient(to bottom,#38bdf8 1px,transparent 1px)",
            backgroundSize: "6% 6%",
          }}
        />

        {/* ── AOI box — fades in while zoomed ─────────────────────────── */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: 160, height: 110,
            opacity: aoiVisible ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          {/* Dashed border */}
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              border: "2px dashed rgba(251,146,60,0.9)",
              boxShadow: "0 0 18px rgba(251,146,60,0.35), inset 0 0 20px rgba(251,146,60,0.05)",
            }}
          />
          {/* Corner accents */}
          {([
            ["top-0 left-0",     "border-t-2 border-l-2"],
            ["top-0 right-0",    "border-t-2 border-r-2"],
            ["bottom-0 left-0",  "border-b-2 border-l-2"],
            ["bottom-0 right-0", "border-b-2 border-r-2"],
          ] as [string, string][]).map(([pos, cls]) => (
            <div key={pos} className={`absolute w-4 h-4 ${pos} ${cls} border-orange-400`} />
          ))}
          {/* Label */}
          <div className="absolute -top-7 left-0">
            <span
              className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded whitespace-nowrap"
              style={{
                background: "rgba(4,10,22,0.88)",
                border: "1px solid rgba(251,146,60,0.5)",
                color: "#fb923c",
              }}
            >
              AOI · GANGAPUR ROAD
            </span>
          </div>
          {/* Subtle fill */}
          <div className="absolute inset-0 rounded-sm" style={{ background: "rgba(251,146,60,0.05)" }} />
        </div>

        {/* ── Status chip ─────────────────────────────────────────────── */}
        <div className="absolute bottom-3 left-3 z-10">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: "rgba(4,10,22,0.80)", border: "1px solid rgba(34,211,238,0.25)", backdropFilter: "blur(6px)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: phase === "zoomed" ? "#fb923c" : "#22d3ee",
                boxShadow: phase === "zoomed" ? "0 0 6px rgba(251,146,60,0.8)" : "0 0 6px rgba(34,211,238,0.6)",
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
            <span className="font-mono text-[8px] tracking-wider uppercase"
              style={{ color: phase === "zoomed" ? "#fb923c" : "#22d3ee" }}
            >
              {phase === "zoomed" ? "AOI · Gangapur Road" : "Exploring Nashik"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NashikLiveMap;
