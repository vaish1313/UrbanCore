/**
 * SatelliteMapPreview
 *
 * Simulates the actual UrbanCore product: a satellite change-detection map
 * with the real hero-bg satellite image as the base, animated built-up
 * expansion overlays, year scrubber, spectral readouts, and a scan line.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

// ─── Detected change zones (positioned over the satellite image) ──────────────
const CHANGE_ZONES = [
  {
    id: 1,
    x: "36%",
    y: "22%",
    w: "13%",
    h: "11%",
    label: "+2.4 km²",
    type: "expansion",
    minYear: 2021,
  },
  {
    id: 2,
    x: "58%",
    y: "40%",
    w: "10%",
    h: "9%",
    label: "+1.1 km²",
    type: "expansion",
    minYear: 2022,
  },
  { id: 3, x: "22%", y: "54%", w: "8%", h: "7%", label: "+0.6 km²", type: "new", minYear: 2023 },
  {
    id: 4,
    x: "50%",
    y: "15%",
    w: "7%",
    h: "10%",
    label: "Protected",
    type: "protected",
    minYear: 2021,
  },
  {
    id: 5,
    x: "70%",
    y: "58%",
    w: "9%",
    h: "6%",
    label: "+0.8 km²",
    type: "expansion",
    minYear: 2024,
  },
] as const;

const YEARS = [2021, 2022, 2023, 2024, 2025];

const SPECTRAL = [
  { label: "NDVI", value: 0.34, color: "#34d399" },
  { label: "NDBI", value: 0.61, color: "#22d3ee" },
  { label: "BSI", value: 0.47, color: "#a78bfa" },
  { label: "NDWI", value: 0.22, color: "#60a5fa" },
];

export function WorkflowVisualization() {
  const [activeYear, setActiveYear] = useState(2021);
  const [showOverlays, setShowOverlays] = useState(false);
  const [scanLine, setScanLine] = useState(0);

  // Auto-advance year
  useEffect(() => {
    const t = setInterval(() => {
      setActiveYear((prev) => {
        const next = YEARS[(YEARS.indexOf(prev) + 1) % YEARS.length];
        setShowOverlays(false);
        setTimeout(() => setShowOverlays(true), 500);
        return next;
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);

  // Initial overlay reveal
  useEffect(() => {
    const t = setTimeout(() => setShowOverlays(true), 700);
    return () => clearTimeout(t);
  }, []);

  // Continuous scan line
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const DURATION = 4200;
    const tick = (ts: number) => {
      if (!start) start = ts;
      setScanLine((((ts - start) % DURATION) / DURATION) * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const yearIdx = YEARS.indexOf(activeYear);
  const progress = yearIdx / (YEARS.length - 1);
  const visibleZones = CHANGE_ZONES.filter((z) => z.minYear <= activeYear);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020b16]">
      {/* ── Real satellite image base ───────────────────────────────────────── */}
      <img
        src={heroBg}
        alt="Satellite map"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.55) saturate(0.8) hue-rotate(180deg)" }}
      />

      {/* ── Dark tint so overlays pop ───────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[#020b16]/40" />

      {/* ── GIS grid overlay ────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.09] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right,#38bdf8 1px,transparent 1px)," +
            "linear-gradient(to bottom,#38bdf8 1px,transparent 1px)",
          backgroundSize: "5% 5%",
        }}
      />

      {/* ── Animated scan line ──────────────────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: `${scanLine}%`,
          height: "2px",
          background:
            "linear-gradient(to right,transparent,rgba(34,211,238,0.15),rgba(34,211,238,0.30),rgba(34,211,238,0.15),transparent)",
          boxShadow: "0 0 10px 2px rgba(34,211,238,0.10)",
        }}
      />

      {/* ── Built-up base footprint (grows with year) ───────────────────────── */}
      <motion.div
        className="absolute rounded-sm"
        style={{ left: "20%", top: "20%" }}
        animate={{
          width: `${13 + progress * 10}%`,
          height: `${11 + progress * 7}%`,
          backgroundColor: `rgba(34,211,238,${0.07 + progress * 0.07})`,
        }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 border border-cyan-400/25 rounded-sm" />
      </motion.div>

      {/* ── Detected change polygons ────────────────────────────────────────── */}
      <AnimatePresence>
        {showOverlays &&
          visibleZones.map((zone) => (
            <motion.div
              key={`${zone.id}-${activeYear}`}
              className="absolute"
              style={{ left: zone.x, top: zone.y, width: zone.w, height: zone.h }}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, delay: 0.05 * zone.id }}
            >
              <div
                className="w-full h-full rounded-sm relative"
                style={{
                  background:
                    zone.type === "protected" ? "rgba(251,113,133,0.10)" : "rgba(251,146,60,0.11)",
                  border: `1.5px dashed ${zone.type === "protected" ? "rgba(251,113,133,0.55)" : "rgba(251,146,60,0.55)"}`,
                }}
              >
                <span
                  className="font-mono absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[7px] tracking-wider"
                  style={{
                    color: zone.type === "protected" ? "#fb7185" : "#fb923c",
                    background: "rgba(2,11,22,0.88)",
                    border: `1px solid ${zone.type === "protected" ? "rgba(251,113,133,0.3)" : "rgba(251,146,60,0.3)"}`,
                  }}
                >
                  {zone.label}
                </span>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-[#020c1a]/88 border-b border-white/[0.07] backdrop-blur-md flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono text-[9px] text-cyan-400 tracking-widest uppercase">
            Nashik · Maharashtra
          </span>
          <span className="font-mono text-[9px] text-slate-500 ml-1">20.0059° N, 73.7898° E</span>
        </div>
        <div className="flex items-center gap-1">
          {[ZoomIn, ZoomOut, Maximize2, Download].map((Icon, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.05] border border-white/[0.07] cursor-pointer hover:bg-white/[0.10] transition-colors"
            >
              <Icon size={10} className="text-slate-400" strokeWidth={1.5} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Active year badge ────────────────────────────────────────────────── */}
      <div className="absolute top-12 left-3 z-20">
        <motion.div
          key={activeYear}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-3 py-1.5 rounded-lg bg-[#020c1a]/90 border border-cyan-500/35 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <Layers size={10} className="text-cyan-400" strokeWidth={1.5} />
            <span className="font-mono text-[10px] text-white">{activeYear}</span>
            <span className="font-mono text-[8px] text-cyan-400/70">Urban Footprint</span>
          </div>
        </motion.div>
      </div>

      {/* ── Right panel: spectral indices + legend ──────────────────────────── */}
      <div className="absolute right-0 top-9 bottom-9 w-20 bg-[#020c1a]/88 border-l border-white/[0.07] backdrop-blur-md p-2 flex flex-col gap-2 z-20">
        <p className="font-mono text-[7px] text-slate-500 uppercase tracking-wider mb-0.5">
          Spectral
        </p>
        {SPECTRAL.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[7.5px]" style={{ color: s.color }}>
                {s.label}
              </span>
              <span className="font-mono text-[7px] text-white/45">{s.value.toFixed(2)}</span>
            </div>
            <div className="w-full h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color, opacity: 0.75 }}
                animate={{ width: `${s.value * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}

        <div className="mt-auto flex flex-col gap-1">
          <p className="font-mono text-[7px] text-slate-500 uppercase tracking-wider">Legend</p>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-dashed border-orange-400/70 rounded-sm flex-shrink-0" />
            <span className="font-mono text-[6.5px] text-slate-400">Expansion</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 border border-dashed border-rose-400/70 rounded-sm flex-shrink-0" />
            <span className="font-mono text-[6.5px] text-slate-400">Protected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-cyan-500/20 border border-cyan-400/40 rounded-sm flex-shrink-0" />
            <span className="font-mono text-[6.5px] text-slate-400">Built-up</span>
          </div>
        </div>
      </div>

      {/* ── Year timeline scrubber ──────────────────────────────────────────── */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0">
        {YEARS.map((year, i) => {
          const isActive = year === activeYear;
          const isDone = i < yearIdx;
          return (
            <div key={year} className="flex items-center">
              {i > 0 && (
                <div
                  className="h-px w-7 transition-all duration-700"
                  style={{
                    background: isDone ? "rgba(34,211,238,0.55)" : "rgba(255,255,255,0.10)",
                  }}
                />
              )}
              <button
                onClick={() => {
                  setActiveYear(year);
                  setShowOverlays(false);
                  setTimeout(() => setShowOverlays(true), 400);
                }}
                className="flex flex-col items-center"
              >
                <div
                  className="rounded-full transition-all duration-500 flex items-center justify-center"
                  style={{
                    width: isActive ? "28px" : "18px",
                    height: isActive ? "28px" : "18px",
                    background: isActive
                      ? "rgba(34,211,238,0.18)"
                      : isDone
                        ? "rgba(34,211,238,0.08)"
                        : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isActive ? "rgba(34,211,238,0.80)" : isDone ? "rgba(34,211,238,0.35)" : "rgba(255,255,255,0.12)"}`,
                    boxShadow: isActive ? "0 0 12px rgba(34,211,238,0.4)" : "none",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: isActive ? "9px" : "7px",
                      color: isActive
                        ? "#22d3ee"
                        : isDone
                          ? "rgba(34,211,238,0.55)"
                          : "rgba(255,255,255,0.28)",
                    }}
                  >
                    {year}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Bottom status bar ───────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-9 bg-[#020c1a]/88 border-t border-white/[0.07] backdrop-blur-md flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-wider">
            Sentinel-2 · 10m
          </span>
          <span className="w-px h-3 bg-white/10" />
          <motion.span
            key={activeYear}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[8px] text-cyan-400 tracking-wider"
          >
            {(4.9 + yearIdx * 1.2).toFixed(1)} km² change detected
          </motion.span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[8px] text-slate-500">U-Net · ResNet34</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[8px] text-emerald-400">Model Active</span>
        </div>
      </div>
    </div>
  );
}
