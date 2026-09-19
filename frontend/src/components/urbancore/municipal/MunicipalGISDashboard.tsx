/**
 * MunicipalGISDashboard
 *
 * Pixel-for-pixel React port of the approved reference design:
 *   src/reference/municipal-dashboard-reference.html
 *
 * Architecture decisions:
 *  - Inline styles for every hex/rgba value that is not already a Tailwind
 *    token in this project's Tailwind v4 CSS config.
 *  - Three.js is initialised inside a useEffect and cleaned up on unmount
 *    (no @react-three/fiber — the scene is self-contained vanilla Three.js
 *    because the reference used r128 CDN directly and the scene wiring is
 *    simpler to match 1-to-1 without the R3F abstraction layer).
 *  - The chrono-dial state (slider value → overlay opacity, epoch, intensity
 *    bar width, velocity, active year node) is driven by React useState.
 *  - Material Symbols Outlined icons are rendered as <span className="material-symbols-outlined">.
 *    The font is already loaded in __root.tsx.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Map a slider value [2021…2025] → construction intensity 0…100 */
function calcIntensity(val: number): number {
  const t = (val - 2021) / 4;
  return Math.round(8 + t * 84);
}

function stageLabel(intensity: number): string {
  if (intensity < 25) return "Pristine";
  if (intensity < 55) return "Emerging";
  if (intensity < 80) return "Active Incursion";
  return "Critical";
}

// ─── sub-components ───────────────────────────────────────────────────────────

/** Renders a single Material Symbol icon */
function MSI({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined${className ? ` ${className}` : ""}`} style={style}>
      {name}
    </span>
  );
}

// ─── section a · header ───────────────────────────────────────────────────────

function GISHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b px-4 sm:px-8 py-3.5"
      style={{
        background: "rgba(7,19,36,0.85)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.10)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all group"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.10)",
              color: "#dbfcff",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <MSI name="arrow_back" style={{ fontSize: "16px" }} />
            <span>Back to UrbanCore</span>
          </button>

          <div className="h-5 w-px hidden sm:block" style={{ background: "rgba(255,255,255,0.10)" }} />

          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg,rgba(0,210,255,0.20),rgba(0,114,255,0.10))",
                border: "1px solid rgba(0,240,255,0.40)",
                color: "#00f0ff",
                boxShadow: "0 0 15px rgba(0,240,255,0.30)",
              }}
            >
              <MSI name="hub" style={{ fontSize: "20px" }} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "18px",
                    color: "#fff",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  UrbanCore GIS
                </span>
                <span
                  className="px-2 py-0.5 rounded-full border"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    background: "rgba(0,240,255,0.15)",
                    color: "#00f0ff",
                    borderColor: "rgba(0,240,255,0.30)",
                  }}
                >
                  MUNICIPAL
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "#b9cacb" }}>
                UrbanCore Municipal Corporation Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border"
            style={{
              background: "rgba(16,185,129,0.10)",
              borderColor: "rgba(16,185,129,0.30)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#34d399" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#34d399" }}
              />
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "#6ee7b7",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Live Satellite Link Active
            </span>
          </div>

          <div
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: "#00f0ff", boxShadow: "0 0 8px rgba(0,240,255,0.90)" }}
            />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "#fff",
                fontWeight: 500,
              }}
            >
              Insp. Rajesh Deshmukh
            </span>
            <span style={{ color: "rgba(255,255,255,0.30)" }}>•</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "#b9cacb",
              }}
            >
              Nashik Municipal Corporation (NMC)
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── section b · district map ────────────────────────────────────────────────

function DistrictMap() {
  const terrainSvgB64 =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDEyMDAgODAwIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4iPgogICAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wMTIgMC4wMTgiIG51bU9jdGF2ZXM9IjUiIHNlZWQ9IjciIHJlc3VsdD0ibm9pc2UiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggaW49Im5vaXNlIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iCiAgICAgICAgMC4xNSAwLjI1IDAuMTAgMCAwLjAyCiAgICAgICAgMC4xMCAwLjMwIDAuMTUgMCAwLjAzCiAgICAgICAgMC4wNSAwLjE1IDAuMjUgMCAwLjA4CiAgICAgICAgMCAgICAwICAgIDAgICAgMSAwIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4yIj4KICAgICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMDYgMC4wOSIgbnVtT2N0YXZlcz0iMyIgc2VlZD0iMyIgcmVzdWx0PSJuMiIvPgogICAgICA8ZmVDb2xvck1hdHJpeCBpbj0ibjIiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwLjMgMC4zIDAuMyAwIC0wLjE1Ii8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjMDUwZTFlIi8+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWx0ZXI9InVybCgjdGVycmFpbikiLz4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIGZpbHRlcj0idXJsKCN0ZXJyYWluMikiIG9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=";

  return (
    <section className="flex flex-col gap-4">
      {/* heading row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div
            className="flex items-center gap-2 mb-1"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#00f0ff",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            <MSI name="satellite_alt" style={{ fontSize: "16px" }} />
            <span>District Overview Map</span>
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(24px,3vw,30px)",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Nashik District – 30 Monitored AOIs
          </h2>
        </div>

        {/* status pills */}
        <div
          className="flex flex-wrap items-center gap-2.5 px-4 py-2 rounded-2xl border"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            background: "rgba(7,19,36,0.80)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.10)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          <span className="flex items-center gap-1.5" style={{ color: "#34d399" }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#34d399", boxShadow: "0 0 8px #34d399" }}
            />
            18 Nominal
          </span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span className="flex items-center gap-1.5" style={{ color: "#fbbf24" }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#fbbf24", boxShadow: "0 0 8px #fbbf24" }}
            />
            7 Moderate
          </span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span
            className="flex items-center gap-1.5"
            style={{ color: "#fb7185", fontWeight: 600 }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "#f43f5e", boxShadow: "0 0 10px #f43f5e" }}
            />
            5 High Construction
          </span>
        </div>
      </div>

      {/* map card */}
      <div
        className="relative w-full overflow-hidden rounded-3xl mc-glow-cyan"
        style={{
          height: "520px",
          background: "rgba(7,19,36,0.80)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* satellite texture */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            backgroundImage: `url('${terrainSvgB64}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.45,
            mixBlendMode: "screen",
            filter: "contrast(1.25) brightness(0.90)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, #050c18 0%, transparent 40%, rgba(5,12,24,0.60) 100%)",
          }}
        />

        {/* map controls */}
        <div
          className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border"
          style={{
            background: "rgba(5,14,30,0.85)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.10)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
            style={{
              background: "#00f0ff",
              color: "#006970",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 0 15px rgba(0,240,255,0.40)",
            }}
          >
            <MSI name="local_fire_department" style={{ fontSize: "16px" }} />
            <span>Heatmap: Active</span>
          </button>
          {[
            { icon: "high_res", label: "Satellite 4K" },
            { icon: "layers", label: "Zoning Layer (WRD / Forest)" },
            { icon: "restart_alt", label: "Reset View" },
          ].map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              className="px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 border transition-colors"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(255,255,255,0.05)",
                color: "#b9cacb",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
              }}
            >
              <MSI name={icon} style={{ fontSize: "16px" }} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* SVG AOI vector layer */}
        <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="heatGlowRed" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ff4d6d" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#93000a" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#93000a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatGlowYellow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#002e6b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heatGlowGreen" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#003824" stopOpacity="0" />
              </radialGradient>
              <filter id="aoiGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00f0ff" floodOpacity="0.85" />
              </filter>
            </defs>

            {/* Godavari river path */}
            <path
              d="M 30,340 Q 230,300 440,270 T 780,250 T 1150,190"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="3.5"
              strokeDasharray="6,4"
              strokeOpacity="0.45"
            />
            <text fill="#38bdf8" x="50" y="325" style={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", opacity: 0.80 }}>
              Godavari Riparian Artery (100m Setback)
            </text>

            {/* 18 green nominal AOIs */}
            {([
              [110,120],[210,100],[310,140],[180,200],[130,410],[240,450],[360,430],
              [490,390],[560,440],[680,400],[820,380],[910,330],[990,280],[1060,220],
              [620,130],[740,110],[880,140],[1020,120],
            ] as [number,number][]).map(([cx,cy],i) => (
              <g key={`g${i}`}>
                <circle cx={cx} cy={cy} r={14} fill="url(#heatGlowGreen)" />
                <circle cx={cx} cy={cy} r={4} fill="#34d399" />
              </g>
            ))}

            {/* 7 yellow moderate AOIs */}
            {([
              [280,230],[390,190],[540,290],[670,220],[760,320],[850,250],[330,340],
            ] as [number,number][]).map(([cx,cy],i) => (
              <g key={`y${i}`}>
                <circle cx={cx} cy={cy} r={18} fill="url(#heatGlowYellow)" />
                <circle cx={cx} cy={cy} r={5} fill="#fbbf24" />
              </g>
            ))}

            {/* 4 red high-construction AOIs */}
            {([
              [490,210],[610,300],[710,270],[890,220],
            ] as [number,number][]).map(([cx,cy],i) => (
              <g key={`r${i}`}>
                <circle cx={cx} cy={cy} r={22} fill="url(#heatGlowRed)" />
                <circle cx={cx} cy={cy} r={6} fill="#f43f5e" />
              </g>
            ))}

            {/* SELECTED AOI-07 target polygon + reticle */}
            <polygon
              points="420,250 470,240 485,280 435,290"
              fill="#dc2626"
              fillOpacity="0.60"
              stroke="#00f0ff"
              strokeWidth="2.5"
              filter="url(#aoiGlow)"
            />
            <circle
              cx={452} cy={265} r={30}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeDasharray="5,4"
              style={{ transformOrigin: "452px 265px", animation: "mc-spin-slow 12s linear infinite" }}
            />
            <circle cx={452} cy={265} r={7} fill="#ff4d6d" />
            <polyline
              points="452,265 500,175 580,175"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          </svg>
        </div>

        {/* Cartographic overlay – graticule + labels + compass + scale */}
        <div className="absolute inset-0 z-[12] pointer-events-none">
          {/* grid */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.14,
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(0,240,255,0.5) 0px, rgba(0,240,255,0.5) 1px, transparent 1px, transparent 14.28%)," +
                "repeating-linear-gradient(0deg, rgba(0,240,255,0.5) 0px, rgba(0,240,255,0.5) 1px, transparent 1px, transparent 20%)",
            }}
          />
          {/* top longitude labels */}
          <div
            className="absolute top-0 left-0 right-0 flex justify-between px-3 pt-1"
            style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(147,210,255,0.50)", letterSpacing: "-0.01em" }}
          >
            {["73.760°E","73.774°E","73.788°E","73.802°E","73.816°E","73.830°E"].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
          {/* left latitude labels */}
          <div
            className="absolute top-0 bottom-0 left-0 flex flex-col justify-between py-6 pl-1.5"
            style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(147,210,255,0.50)" }}
          >
            {["20.024°N","20.012°N","20.000°N","19.988°N"].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
          {/* north arrow */}
          <div
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(5,14,30,0.70)", border: "1px solid rgba(0,212,255,0.30)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <polygon points="12,2 15,13 12,10 9,13" fill="#00f0ff" />
              <polygon points="12,22 15,13 12,16 9,13" fill="rgba(255,255,255,0.30)" />
            </svg>
            <span
              className="absolute -top-1"
              style={{ fontSize: "8px", fontFamily: "monospace", color: "#a5e4f1" }}
            >
              N
            </span>
          </div>
          {/* scale bar */}
          <div className="absolute bottom-4 right-4 flex flex-col items-center gap-0.5">
            <div className="flex items-end h-2">
              <div className="w-14 h-1" style={{ background: "rgba(255,255,255,0.60)" }} />
              <div
                className="w-14 h-1 border-t border-l border-r"
                style={{ borderColor: "rgba(255,255,255,0.60)" }}
              />
            </div>
            <div
              className="flex justify-between w-28"
              style={{ fontFamily: "monospace", fontSize: "8px", color: "rgba(255,255,255,0.50)" }}
            >
              <span>0</span><span>250</span><span>500m</span>
            </div>
          </div>
        </div>

        {/* AOI-07 floating callout card */}
        <div
          className="absolute z-20 px-4 py-3 rounded-2xl flex flex-col gap-1"
          style={{
            top: "135px",
            left: "42%",
            background: "rgba(7,19,36,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,240,255,0.50)",
            boxShadow: "0 0 30px rgba(0,240,255,0.25)",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "14px",
                color: "#dbfcff",
                fontWeight: 700,
              }}
            >
              AOI-07 • Gangapur Road
            </span>
            <span
              className="px-2 py-0.5 rounded-full border"
              style={{
                background: "rgba(244,63,94,0.20)",
                color: "#fda4af",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: 700,
                borderColor: "rgba(244,63,94,0.40)",
              }}
            >
              +42% Growth
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "#b9cacb", fontWeight: 500 }}>
            Anandwalli / River Buffer Zone
          </span>
          <div
            className="flex items-center gap-2 pt-1 mt-0.5 border-t"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "#00f0ff",
              borderColor: "rgba(255,255,255,0.10)",
            }}
          >
            <span>3 Active Cases</span>
            <span>•</span>
            <span>Confidence: 96%</span>
            <span>•</span>
            <span>Lat: 20.0124°N</span>
          </div>
        </div>

        {/* bottom telemetry bar */}
        <div
          className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-4 px-4 py-2 rounded-xl border"
          style={{
            background: "rgba(5,14,30,0.85)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.10)",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "#b9cacb",
          }}
        >
          <span>CENTER: 20.0050° N, 73.7800° E</span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span>ELEVATION: 584m</span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span>RADAR: POL-SAR COMPOSITE</span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span style={{ color: "#00f0ff", fontWeight: 600 }}>SYNC LOCK: 100%</span>
        </div>
      </div>
    </section>
  );
}

// ─── section c · encroachment flags ──────────────────────────────────────────

const FLAGS = [
  {
    id: "URB-10492",
    nk: "NK-2025-0894",
    confidence: "97% High Confidence",
    confColor: "#fb7185",
    confBg: "rgba(244,63,94,0.20)",
    confBorder: "rgba(244,63,94,0.40)",
    icon: "warning",
    iconColor: "#00f0ff",
    iconBg: "linear-gradient(135deg,rgba(0,210,255,0.20),rgba(0,114,255,0.10))",
    iconBorder: "rgba(0,240,255,0.40)",
    iconShadow: "0 0 12px rgba(0,240,255,0.25)",
    title: "Gangapur Road, Plot 4A / Anandwalli Sector 4",
    detail: "Detected Oct 12, 2024 • 100m Godavari River Setback Incursion (-18.4m)",
    status: "UNDER REVIEW",
    statusColor: "#fcd34d",
    statusBg: "rgba(245,158,11,0.15)",
    statusBorder: "rgba(245,158,11,0.40)",
    statusShadow: "0 0 10px rgba(245,158,11,0.20)",
    activeBorder: "rgba(0,240,255,0.40)",
    activeBorderHover: "#00f0ff",
    titleColor: "#00f0ff",
  },
  {
    id: "URB-09211",
    nk: "NK-2025-0891",
    confidence: "91% Medium",
    confColor: "#fcd34d",
    confBg: "rgba(245,158,11,0.15)",
    confBorder: "rgba(245,158,11,0.30)",
    icon: "forest",
    iconColor: "#34d399",
    iconBg: "rgba(255,255,255,0.05)",
    iconBorder: "rgba(255,255,255,0.10)",
    iconShadow: "none",
    title: "Trimbakeshwar Link Road, Plot 89",
    detail: "Detected Aug 05, 2024 • Eco-Forest Conservation Zone",
    status: "RESOLVED",
    statusColor: "#6ee7b7",
    statusBg: "rgba(16,185,129,0.15)",
    statusBorder: "rgba(16,185,129,0.40)",
    statusShadow: "0 0 10px rgba(52,211,153,0.20)",
    activeBorder: "rgba(255,255,255,0.10)",
    activeBorderHover: "rgba(0,240,255,0.50)",
    titleColor: "#fff",
  },
  {
    id: "URB-08477",
    nk: "NK-2025-0888",
    confidence: "94% High Confidence",
    confColor: "#fb7185",
    confBg: "rgba(244,63,94,0.20)",
    confBorder: "rgba(244,63,94,0.40)",
    icon: "water",
    iconColor: "#38bdf8",
    iconBg: "rgba(255,255,255,0.05)",
    iconBorder: "rgba(255,255,255,0.10)",
    iconShadow: "none",
    title: "Panchavati Ghat Shoreline, Sector 2",
    detail: "Detected Feb 25, 2025 • High Blue Floodline Zone",
    status: "INSPECTION QUEUE",
    statusColor: "#7dd3fc",
    statusBg: "rgba(14,165,233,0.20)",
    statusBorder: "rgba(14,165,233,0.40)",
    statusShadow: "none",
    activeBorder: "rgba(255,255,255,0.10)",
    activeBorderHover: "rgba(0,240,255,0.50)",
    titleColor: "#fff",
  },
];

function EncroachmentFlags() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div
            className="flex items-center gap-2 mb-1"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#00f0ff",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            <MSI name="flag" style={{ fontSize: "16px" }} />
            <span>Priority Queue</span>
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(24px,3vw,30px)",
              color: "#fff",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Detected Encroachment Flags
          </h2>
        </div>
        <a
          href="#"
          className="inline-flex items-center gap-1.5"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "#00f0ff",
            textDecoration: "none",
          }}
        >
          <span>View All Encroachments</span>
          <MSI name="arrow_forward" style={{ fontSize: "16px" }} />
        </a>
      </div>

      <div className="flex flex-col gap-3">
        {FLAGS.map((f) => (
          <div
            key={f.id}
            className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-5 cursor-pointer group transition-all"
            style={{
              background: "rgba(7,19,36,0.80)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${f.activeBorder}`,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = f.activeBorderHover;
              if (f.id === "URB-10492") {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 0 24px rgba(0,240,255,0.20)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = f.activeBorder;
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: f.iconBg,
                  border: `1px solid ${f.iconBorder}`,
                  color: f.iconColor,
                  boxShadow: f.iconShadow,
                }}
              >
                <MSI name={f.icon} style={{ fontSize: "24px" }} />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: f.titleColor,
                      fontWeight: 700,
                      fontSize: "15px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {f.id}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      color: "#b9cacb",
                    }}
                  >
                    ({f.nk})
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full border"
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      background: f.confBg,
                      color: f.confColor,
                      borderColor: f.confBorder,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {f.confidence}
                  </span>
                </div>
                <span style={{ fontSize: "14px", color: "#fff", fontWeight: 500 }}>
                  {f.title}
                </span>
                <span style={{ fontSize: "12px", color: "#b9cacb" }}>{f.detail}</span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
              <span
                className="px-4 py-1.5 rounded-full border"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: f.statusBg,
                  color: f.statusColor,
                  borderColor: f.statusBorder,
                  boxShadow: f.statusShadow,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {f.status}
              </span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#b9cacb",
                }}
              >
                <MSI name="arrow_forward_ios" style={{ fontSize: "18px" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── section d · case forensics (chrono-dial + case details) ─────────────────

const YEAR_NODES = [
  { year: 2021, left: "2%",  top: "78%" },
  { year: 2022, left: "26%", top: "35%" },
  { year: 2023, left: "50%", top: "8%"  },
  { year: 2024, left: "74%", top: "35%" },
  { year: 2025, left: "98%", top: "78%" },
];

function CaseForensics() {
  const [sliderVal, setSliderVal] = useState(2021);
  const intensity = calcIntensity(sliderVal);
  const overlayOpacity = 0.05 + ((sliderVal - 2021) / 4) * 0.75;
  const velocityVal = Math.round(((sliderVal - 2021) / 4) * 84);
  const nearestYear = Math.round(sliderVal);

  const terrainSvgB64 =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDEyMDAgODAwIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4iPgogICAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wMTIgMC4wMTgiIG51bU9jdGF2ZXM9IjUiIHNlZWQ9IjciIHJlc3VsdD0ibm9pc2UiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggaW49Im5vaXNlIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iCiAgICAgICAgMC4xNSAwLjI1IDAuMTAgMCAwLjAyCiAgICAgICAgMC4xMCAwLjMwIDAuMTUgMCAwLjAzCiAgICAgICAgMC4wNSAwLjE1IDAuMjUgMCAwLjA4CiAgICAgICAgMCAgICAwICAgIDAgICAgMSAwIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4yIj4KICAgICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMDYgMC4wOSIgbnVtT2N0YXZlcz0iMyIgc2VlZD0iMyIgcmVzdWx0PSJuMiIvPgogICAgICA8ZmVDb2xvck1hdHJpeCBpbj0ibjIiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwLjMgMC4zIDAuMyAwIC0wLjE1Ii8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjMDUwZTFlIi8+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWx0ZXI9InVybCgjdGVycmFpbikiLz4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIGZpbHRlcj0idXJsKCN0ZXJyYWluMikiIG9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=";

  return (
    <section className="flex flex-col gap-4">
      <div>
        <div
          className="flex items-center gap-2 mb-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "#00f0ff",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          <MSI name="biotech" style={{ fontSize: "16px" }} />
          <span>Deep Investigation</span>
        </div>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(24px,3vw,30px)",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Case Forensics &amp; Change Telemetry
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-stretch">
        {/* left: chrono-dial panel */}
        <div
          className="lg:col-span-7 rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 mc-glow-cyan"
          style={{
            background: "rgba(7,19,36,0.80)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* panel header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(0,210,255,0.10)",
                  border: "1px solid rgba(0,210,255,0.30)",
                  color: "#00f0ff",
                }}
              >
                <MSI name="radar" style={{ fontSize: "20px" }} />
              </div>
              <div className="flex flex-col">
                <h4
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "15px",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Construction Heatmap (2021 – 2025)
                </h4>
                <span style={{ fontSize: "12px", color: "#b9cacb" }}>
                  Rotate the chrono-dial to scrub through 5 years of change
                </span>
              </div>
            </div>
            <div
              className="flex items-center p-1 rounded-full border"
              style={{ background: "#050e1e", borderColor: "rgba(255,255,255,0.10)" }}
            >
              <span
                className="px-3 py-1 rounded-full"
                style={{
                  background: "linear-gradient(90deg,#00d2ff,#0072ff)",
                  color: "#fff",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,114,255,0.3)",
                }}
              >
                Chrono Scrub
              </span>
            </div>
          </div>

          {/* heatmap stage */}
          <div
            className="relative w-full rounded-2xl overflow-hidden select-none border"
            style={{ height: "320px", background: "#050e1e", borderColor: "rgba(255,255,255,0.10)" }}
          >
            {/* terrain base */}
            <img
              src={terrainSvgB64}
              alt="Nashik satellite terrain base layer"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.40 }}
            />
            {/* heat overlay – opacity driven by slider */}
            <div
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                background:
                  "linear-gradient(135deg, rgba(127,0,0,0.70) 0%, rgba(180,80,10,0.40) 50%, transparent 100%)",
                mixBlendMode: "color-dodge",
                opacity: overlayOpacity,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(5,14,30,0.20) 0%, transparent 40%, rgba(5,14,30,0.90) 100%)",
              }}
            />

            {/* AOI marker top-left */}
            <div
              className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{
                background: "rgba(7,19,36,0.90)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(0,212,255,0.30)",
              }}
            >
              <MSI name="satellite_alt" style={{ fontSize: "15px", color: "#a5e4f1" }} />
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#cff0f8",
                }}
              >
                AOI-07 · Gangapur Road
              </span>
            </div>

            {/* epoch readout top-right */}
            <div className="absolute top-3 right-3 flex flex-col items-end">
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "18px",
                  color: "#fff",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {sliderVal.toFixed(1)}
              </span>
              <span
                style={{
                  fontSize: "9px",
                  color: "#b9cacb",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  fontFamily: "monospace",
                }}
              >
                Epoch Scrub
              </span>
            </div>

            {/* intensity bar bottom-right */}
            <div
              className="absolute bottom-24 right-3 hidden sm:flex flex-col gap-1 px-3 py-1.5 rounded-xl border"
              style={{
                background: "rgba(7,19,36,0.90)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.10)",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: "#b9cacb",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                Construction Intensity
              </span>
              <div
                className="rounded-full overflow-hidden"
                style={{ width: "112px", height: "6px", background: "rgba(255,255,255,0.10)" }}
              >
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${intensity}%`,
                    background: "linear-gradient(90deg,#10b981,#fbbf24,#ef4444)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "9px",
                  color: "#b9cacb",
                  fontFamily: "monospace",
                }}
              >
                {intensity}% · {stageLabel(intensity)}
              </span>
            </div>

            {/* chrono-dial arc + year nodes */}
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <div className="relative w-[92%] max-w-[420px] h-16">
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 64"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M10,54 Q200,-6 390,54"
                    fill="none"
                    stroke="rgba(0,240,255,0.35)"
                    strokeWidth="2"
                  />
                </svg>
                {YEAR_NODES.map(({ year, left, top }) => {
                  const isActive = year === nearestYear;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSliderVal(year)}
                      className="absolute -translate-x-1/2 flex flex-col items-center gap-1 transition-all"
                      style={{
                        left,
                        top,
                        transform: `translateX(-50%) ${isActive ? "scale(1.10)" : "scale(1)"}`,
                      }}
                    >
                      <span
                        className="w-3 h-3 rounded-full border block"
                        style={{
                          background: isActive ? "#00f0ff" : "rgba(255,255,255,0.20)",
                          borderColor: isActive ? "#00f0ff" : "rgba(255,255,255,0.30)",
                          boxShadow: isActive ? "0 0 10px #00f0ff" : "none",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "10px",
                          color:
                            year === 2025 && !isActive
                              ? "#fb7185"
                              : isActive
                                ? "#00f0ff"
                                : "#b9cacb",
                          fontWeight: year === 2025 ? 700 : 400,
                        }}
                      >
                        {year}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* slider control */}
          <div
            className="w-full rounded-2xl p-3.5 flex flex-col gap-2.5 border"
            style={{ background: "#050e1e", borderColor: "rgba(255,255,255,0.10)" }}
          >
            <input
              type="range"
              min={2021}
              max={2025}
              step={0.05}
              value={sliderVal}
              onChange={(e) => setSliderVal(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
              style={{ height: "6px", borderRadius: "9999px", accentColor: "#00d2ff" }}
            />
            <div className="flex items-center justify-between px-0.5">
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#b9cacb",
                }}
              >
                Pristine 2021
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#00e5ff",
                }}
              >
                +{velocityVal} m²/yr
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#fb7185",
                  fontWeight: 700,
                }}
              >
                Critical 2025
              </span>
            </div>
          </div>
        </div>

        {/* right: case details panel */}
        <div
          className="lg:col-span-5 rounded-3xl p-6 flex flex-col justify-between gap-4"
          style={{
            background: "rgba(7,19,36,0.80)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div>
            <div
              className="flex items-center justify-between pb-3 border-b"
              style={{ borderColor: "rgba(255,255,255,0.10)" }}
            >
              <div className="flex items-center gap-2">
                <MSI name="description" style={{ fontSize: "20px", color: "#00f0ff" }} />
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "18px",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  Case Details
                </h3>
              </div>
              <span
                className="px-2.5 py-0.5 rounded-full border"
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  background: "rgba(244,63,94,0.20)",
                  color: "#fda4af",
                  borderColor: "rgba(244,63,94,0.40)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                High Priority
              </span>
            </div>

            {/* attribute table */}
            <div
              className="divide-y"
              style={{
                fontSize: "12px",
              }}
            >
              {[
                { label: "Case ID",       value: "UC-2025-0894",                  mono: true, color: "#fff" },
                { label: "Location",      value: "Gangapur Road, Nashik",         mono: false, color: "#fff" },
                { label: "Latitude",      value: "20.0124° N",                    mono: true, color: "#00f0ff" },
                { label: "Longitude",     value: "73.7548° E",                    mono: true, color: "#00f0ff" },
                { label: "Protected Zone",value: "River Buffer Zone (100m)",       mono: false, color: "#fcd34d" },
                { label: "Detected Year", value: "2024 – 2025 Incursion",         mono: true, color: "#fff" },
                { label: "Confidence Score", value: "97% Corroborated",           mono: true, color: "#34d399" },
                { label: "Area Affected", value: "420 m²",                        mono: true, color: "#fb7185", bold: true, large: true },
                { label: "Detected Change", value: "New Commercial Plinth Footprint", mono: false, color: "#fff" },
              ].map(({ label, value, mono, color, bold, large }) => (
                <div
                  key={label}
                  className="flex justify-between py-2"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  <span style={{ color: "#b9cacb" }}>{label}</span>
                  <span
                    style={{
                      fontFamily: mono ? "monospace" : "inherit",
                      color,
                      fontWeight: bold ? 700 : 500,
                      fontSize: large ? "14px" : "12px",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all"
              style={{
                background: "rgba(16,185,129,0.20)",
                color: "#6ee7b7",
                borderColor: "rgba(16,185,129,0.50)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(16,185,129,0.30)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(16,185,129,0.20)")
              }
            >
              <MSI name="check_circle" style={{ fontSize: "16px" }} />
              <span>Mark Reviewed</span>
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 border transition-all"
              style={{
                background: "rgba(244,63,94,0.20)",
                color: "#fda4af",
                borderColor: "rgba(244,63,94,0.50)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "12px",
                fontWeight: 700,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(244,63,94,0.30)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(244,63,94,0.20)")
              }
            >
              <MSI name="flag" style={{ fontSize: "16px" }} />
              <span>Flag for Action</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── section e · ai complaint letter ─────────────────────────────────────────

function AIComplaintLetter() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <div
          className="flex items-center gap-2 mb-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "#00f0ff",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          <MSI name="smart_toy" style={{ fontSize: "16px" }} />
          <span>AI Complaint Letter Generator</span>
        </div>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(24px,3vw,30px)",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Auto-Generated Legal Notice
        </h2>
      </div>

      <div
        className="w-full rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row gap-6"
        style={{
          background: "rgba(7,19,36,0.80)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* left: pipeline steps */}
        <div
          className="lg:w-1/3 flex flex-col justify-between gap-4 rounded-2xl p-5 border"
          style={{ background: "#050e1e", borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div className="flex flex-col gap-3.5">
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#b9cacb",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              Automated Compilation Pipeline
            </span>

            {/* steps 1-3 done */}
            {[
              "Preparing satellite evidence...",
              "Collecting GPS coordinates...",
              "Compiling multi-year timeline...",
            ].map((step) => (
              <div
                key={step}
                className="flex items-center gap-3 p-2.5 rounded-xl border"
                style={{
                  background: "rgba(16,185,129,0.10)",
                  borderColor: "rgba(16,185,129,0.30)",
                }}
              >
                <MSI
                  name="check_circle"
                  style={{ fontSize: "20px", color: "#34d399" }}
                />
                <span style={{ fontSize: "12px", color: "#fff", fontWeight: 500 }}>
                  {step}
                </span>
              </div>
            ))}

            {/* step 4 active */}
            <div
              className="flex items-center gap-3 p-2.5 rounded-xl border"
              style={{
                background: "rgba(0,240,255,0.15)",
                borderColor: "rgba(0,240,255,0.40)",
                boxShadow: "0 0 12px rgba(0,240,255,0.20)",
              }}
            >
              <MSI
                name="progress_activity"
                style={{
                  fontSize: "20px",
                  color: "#00f0ff",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  color: "#00f0ff",
                  fontWeight: 600,
                }}
              >
                Generating official notice...
              </span>
            </div>
          </div>

          <div
            className="p-3 rounded-xl border flex items-start gap-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.10)",
              fontSize: "11px",
              color: "#b9cacb",
            }}
          >
            <MSI
              name="verified_user"
              style={{ fontSize: "16px", color: "#00f0ff", flexShrink: 0 }}
            />
            <span>
              Digital seal cryptographically attached to Section 53 MRTP Act statutory complaint.
            </span>
          </div>
        </div>

        {/* right: notice preview (white paper) */}
        <div
          className="lg:w-2/3 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-5 relative overflow-hidden"
          style={{
            background: "#fff",
            color: "#1e293b",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* watermark */}
          <div
            className="absolute -right-12 -bottom-12 pointer-events-none select-none"
            style={{ opacity: 0.05, color: "#1e293b" }}
          >
            <MSI name="account_balance" style={{ fontSize: "260px" }} />
          </div>

          {/* header */}
          <div>
            <div
              className="flex items-center justify-between pb-4"
              style={{ borderBottom: "2px solid #1e293b" }}
            >
              <div className="flex items-center gap-3">
                <MSI name="account_balance" style={{ fontSize: "36px", color: "#1e293b" }} />
                <div className="flex flex-col">
                  <h4
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: "clamp(13px,1.5vw,16px)",
                      textTransform: "uppercase",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Nashik Municipal Corporation
                  </h4>
                  <span style={{ fontSize: "11px", color: "#475569", fontWeight: 500 }}>
                    Town Planning &amp; Encroachment Removal Department
                  </span>
                </div>
              </div>
              <div
                className="text-right"
                style={{ fontFamily: "monospace", fontSize: "10px", color: "#475569" }}
              >
                <span>REF: NMC/TPD/2025/0894</span>
                <br />
                <span>DATE: 18 SEP 2025</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              <h5
                className="text-center underline"
                style={{
                  fontWeight: 700,
                  color: "#1e293b",
                  fontSize: "clamp(11px,1.2vw,13px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                NOTICE OF UNAUTHORIZED CONSTRUCTION UNDER SECTION 53, MRTP ACT, 1966
              </h5>

              <div
                className="grid grid-cols-2 gap-2 p-2.5 rounded mt-1"
                style={{
                  background: "#f1f5f9",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#1e293b",
                }}
              >
                <div><strong>Case ID:</strong> UC-2025-0894</div>
                <div><strong>Location:</strong> Gangapur Rd, Plot 4A</div>
                <div><strong>Coordinates:</strong> 20.0124°N, 73.7548°E</div>
                <div><strong>Violation:</strong> -18.4m inside 100m River Setback</div>
              </div>

              <p
                className="leading-relaxed mt-2"
                style={{ color: "#475569", fontSize: "12px" }}
              >
                This is to formally notify that an unauthorized commercial foundation footprint of
                approximately <strong>420 sq. meters</strong> has been detected through multispectral
                satellite telemetry and verified by designated Ward 4 inspectors. The construction
                directly infringes upon the statutory Godavari River riparian green corridor.
              </p>
              <p className="leading-relaxed" style={{ color: "#475569", fontSize: "12px" }}>
                You are hereby commanded to halt all ongoing masonry and excavation operations
                immediately and show cause within <strong>48 hours</strong> of service, failing which
                summary demolition will proceed under Municipal Code.
              </p>
            </div>
          </div>

          {/* sign-off */}
          <div
            className="flex items-end justify-between pt-4"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            <div className="flex items-center gap-2">
              <MSI name="verified" style={{ fontSize: "20px", color: "#047857" }} />
              <span style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace" }}>
                Digital Signature ID: #NK-9921-VERIFIED
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Municipal Commissioner
              </span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>Nashik Municipal Corporation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── section f · export ───────────────────────────────────────────────────────

function CaseExport() {
  return (
    <section className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <div
          className="flex items-center gap-2 mb-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            color: "#00f0ff",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            fontWeight: 600,
          }}
        >
          <MSI name="ios_share" style={{ fontSize: "16px" }} />
          <span>Report Generation and Export</span>
        </div>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(24px,3vw,30px)",
            color: "#fff",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Case Package Ready
        </h2>
      </div>

      <div
        className="w-full rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mc-glow-cyan border"
        style={{
          background: "rgba(7,19,36,0.80)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255,255,255,0.10)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg,rgba(0,210,255,0.20),rgba(0,114,255,0.10))",
              border: "1px solid rgba(0,240,255,0.40)",
              color: "#00f0ff",
              boxShadow: "0 0 15px rgba(0,240,255,0.30)",
            }}
          >
            <MSI name="folder_zip" style={{ fontSize: "30px" }} />
          </div>
          <div className="flex flex-col">
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(16px,2vw,20px)",
                color: "#fff",
                fontWeight: 700,
              }}
            >
              Case Package #UC-2025-0894 Ready
            </h3>
            <span style={{ fontSize: "12px", color: "#b9cacb", marginTop: "2px" }}>
              Includes high-res Sentinel-2 orthomosaic captures, timeline telemetry, and Section 53
              MRTP statutory notice.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            className="flex-1 md:flex-initial px-6 py-3.5 rounded-full border flex items-center justify-center gap-2 transition-all"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.05)",
              color: "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.10)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.05)")
            }
          >
            <MSI name="print" style={{ fontSize: "18px" }} />
            <span>Print Notice</span>
          </button>
          <button
            type="button"
            className="flex-1 md:flex-initial px-7 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(90deg,#00d2ff,#0072ff)",
              color: "#00275e",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              boxShadow: "0 0 20px rgba(0,210,255,0.45)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(90deg,#38bdf8,#0284c7)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "linear-gradient(90deg,#00d2ff,#0072ff)")
            }
          >
            <MSI name="download" style={{ fontSize: "18px" }} />
            <span>Export Official Case PDF</span>
          </button>
        </div>
      </div>

      {/* footer */}
      <footer
        className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 border-t"
        style={{
          fontSize: "12px",
          color: "#b9cacb",
          borderColor: "rgba(255,255,255,0.10)",
        }}
      >
        <div className="flex items-center gap-2">
          <MSI name="bar_chart" style={{ fontSize: "18px", color: "#00f0ff" }} />
          <span style={{ color: "#fff", fontWeight: 600 }}>UrbanCore</span>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <span>Municipal Citizen Intelligence</span>
        </div>
        <div className="flex items-center gap-6" style={{ fontWeight: 500 }}>
          <a href="#" style={{ color: "#b9cacb", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#b9cacb")}
          >
            Privacy Policy
          </a>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <a href="#" style={{ color: "#b9cacb", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#b9cacb")}
          >
            Terms of Use
          </a>
          <span style={{ color: "rgba(255,255,255,0.20)" }}>|</span>
          <a href="#" style={{ color: "#b9cacb", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "#fff")}
            onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "#b9cacb")}
          >
            Contact NMC
          </a>
        </div>
      </footer>
    </section>
  );
}

// ─── three.js background scene ────────────────────────────────────────────────

function useThreeBackground(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use window dimensions since the container is fixed/fullscreen
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 38);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // lighting
    const ambientLight = new THREE.AmbientLight(0x0a2540, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);
    const blueLight = new THREE.PointLight(0x0072ff, 3, 100);
    blueLight.position.set(-20, -10, 15);
    scene.add(blueLight);

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // topographic grid
    const gridSegments = 48;
    const planeGeo = new THREE.PlaneGeometry(80, 50, gridSegments, gridSegments);
    const pos = planeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const riverPath = Math.sin(x * 0.08) * 8.0;
      const distToRiver = Math.abs(y - riverPath);
      let zVal = Math.sin(x * 0.15) * Math.cos(y * 0.15) * 2.5;
      if (distToRiver < 5) {
        zVal -= (5 - distToRiver) * 1.8;
      } else {
        zVal += Math.sin(x * 0.3) * 1.2;
      }
      pos.setZ(i, zVal);
    }
    planeGeo.computeVertexNormals();
    const wireMaterial = new THREE.MeshLambertMaterial({
      color: 0x0a4066,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const terrainMesh = new THREE.Mesh(planeGeo, wireMaterial);
    terrainMesh.rotation.x = -Math.PI / 2.5;
    terrainMesh.position.y = -10;
    worldGroup.add(terrainMesh);

    // radar rings
    const ringGeo = new THREE.RingGeometry(18, 18.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const radarRing = new THREE.Mesh(ringGeo, ringMat);
    radarRing.rotation.x = -Math.PI / 2.5;
    radarRing.position.y = -8;
    worldGroup.add(radarRing);

    const ringGeo2 = new THREE.RingGeometry(26, 26.2, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const radarRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    radarRing2.rotation.x = -Math.PI / 2.5;
    radarRing2.position.y = -8.5;
    worldGroup.add(radarRing2);

    // AOI node spheres
    const nodeCount = 30;
    const nodeGroup = new THREE.Group();
    worldGroup.add(nodeGroup);
    const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const activeGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const normalNodeMat = new THREE.MeshBasicMaterial({ color: 0x00e699, transparent: true, opacity: 0.8 });
    const warnNodeMat = new THREE.MeshBasicMaterial({ color: 0xffb800, transparent: true, opacity: 0.9 });
    const alertNodeMat = new THREE.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 0.95 });

    const nodeRefs: Array<{
      mesh: THREE.Mesh;
      originalY: number;
      speed: number;
      isAlert: boolean;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 10 + (i % 5) * 3.5;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 4;
      const z = Math.sin(angle) * (radius * 0.6) + (Math.random() - 0.5) * 4;
      const y = -6 + Math.sin(i * 1.5) * 2.0;

      const isAlert = i === 7 || i === 18;
      const mat = isAlert ? alertNodeMat : i % 4 === 0 ? warnNodeMat : normalNodeMat;
      const mesh = new THREE.Mesh(isAlert ? activeGeo : sphereGeo, mat);
      mesh.position.set(x, y, z);
      nodeGroup.add(mesh);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x, -10, z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: isAlert ? 0xff3b5c : 0x00d2ff,
        transparent: true,
        opacity: isAlert ? 0.65 : 0.25,
      });
      nodeGroup.add(new THREE.Line(lineGeo, lineMat));
      nodeRefs.push({ mesh, originalY: y, speed: 0.8 + Math.random() * 0.6, isAlert });
    }

    // satellite
    const satGroup = new THREE.Group();
    worldGroup.add(satGroup);
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x00f0ff }),
    );
    const solarPanelL = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.05, 0.9),
      new THREE.MeshLambertMaterial({ color: 0x0055ff }),
    );
    solarPanelL.position.x = -1.8;
    const solarPanelR = solarPanelL.clone();
    solarPanelR.position.x = 1.8;
    satGroup.add(satBody, solarPanelL, solarPanelR);
    satGroup.position.set(18, 14, 5);

    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-14, -20, 0),
    ]);
    const beamMat = new THREE.LineDashedMaterial({
      color: 0x00f0ff,
      dashSize: 0.8,
      gapSize: 0.4,
      transparent: true,
      opacity: 0.5,
    });
    const targetBeam = new THREE.Line(beamGeo, beamMat);
    targetBeam.computeLineDistances();
    satGroup.add(targetBeam);

    // particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particleCoords = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      particleCoords[p] = (Math.random() - 0.5) * 70;
      particleCoords[p + 1] = (Math.random() - 0.5) * 35;
      particleCoords[p + 2] = (Math.random() - 0.5) * 40;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particleCoords, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.35,
      transparent: true,
      opacity: 0.4,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    worldGroup.add(particleSystem);

    // mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // resize
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // animation loop
    const clock = new THREE.Clock();
    let rafId: number;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      worldGroup.rotation.y += (mouseX * 0.05 - worldGroup.rotation.y) * 0.03 + 0.001;
      worldGroup.rotation.x += (mouseY * 0.03 - worldGroup.rotation.x) * 0.03;

      radarRing.scale.setScalar(1.0 + Math.sin(t * 1.5) * 0.06);
      radarRing2.scale.setScalar(1.0 + Math.cos(t * 1.2) * 0.08);

      satGroup.position.x = Math.cos(t * 0.25) * 22;
      satGroup.position.z = Math.sin(t * 0.25) * 12;
      satGroup.position.y = 12 + Math.sin(t * 0.5) * 1.5;
      satGroup.rotation.y = -t * 0.25;

      nodeRefs.forEach((n, idx) => {
        n.mesh.position.y = n.originalY + Math.sin(t * n.speed + idx) * 0.35;
        if (n.isAlert) {
          const s = 1.0 + Math.sin(t * 4.0) * 0.25;
          n.mesh.scale.set(s, s, s);
        }
      });

      particleSystem.rotation.y = t * 0.015;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerRef]);
}

// ─── main export ──────────────────────────────────────────────────────────────

export function MunicipalGISDashboard({
  onBack,
}: {
  onBack?: () => void;
}) {
  const threeContainerRef = useRef<HTMLDivElement>(null);
  useThreeBackground(threeContainerRef);

  // Ambient telemetry overlay strings
  const ambientTop = [
    "ORBITAL_ID: SENTINEL-2B // POL-SAR 4K",
    "COORD: 20.0050° N, 73.7800° E • ELEV 584M",
    "SYNCHRONIZATION: LIVE LOCK 99.8%",
  ];
  const ambientBottom = [
    "EPHEMERIS: AZ 142.4° • EL 68.2°",
    "BAND: SAR C-BAND POLARIMETRIC",
    "GODAVARI RIVER BASIN SECTOR 04",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        background: "#050c18",
        color: "#d9e3f9",
        fontFamily: "'Geist', ui-sans-serif, sans-serif",
      }}
    >
      {/* ── atmospheric backdrop (absolute so it covers the scroll container) ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {/* satellite texture */}
        <img
          alt="High-Altitude Orbital Satellite Imagery of Nashik Godavari Delta"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            opacity: 0.30,
            mixBlendMode: "luminosity",
            transform: "scale(1.05)",
            filter: "brightness(0.90) contrast(1.25) saturate(1.50)",
          }}
          src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDEyMDAgODAwIj4KICA8ZGVmcz4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4iPgogICAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC4wMTIgMC4wMTgiIG51bU9jdGF2ZXM9IjUiIHNlZWQ9IjciIHJlc3VsdD0ibm9pc2UiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggaW49Im5vaXNlIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iCiAgICAgICAgMC4xNSAwLjI1IDAuMTAgMCAwLjAyCiAgICAgICAgMC4xMCAwLjMwIDAuMTUgMCAwLjAzCiAgICAgICAgMC4wNSAwLjE1IDAuMjUgMCAwLjA4CiAgICAgICAgMCAgICAwICAgIDAgICAgMSAwIi8+CiAgICA8L2ZpbHRlcj4KICAgIDxmaWx0ZXIgaWQ9InRlcnJhaW4yIj4KICAgICAgPGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuMDYgMC4wOSIgbnVtT2N0YXZlcz0iMyIgc2VlZD0iMyIgcmVzdWx0PSJuMiIvPgogICAgICA8ZmVDb2xvck1hdHJpeCBpbj0ibjIiIHR5cGU9Im1hdHJpeCIgdmFsdWVzPSIKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwIDAgMCAwIDAKICAgICAgICAwLjMgMC4zIDAuMyAwIC0wLjE1Ii8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWxsPSIjMDUwZTFlIi8+CiAgPHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iODAwIiBmaWx0ZXI9InVybCgjdGVycmFpbikiLz4KICA8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIGZpbHRlcj0idXJsKCN0ZXJyYWluMikiIG9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4="
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 40%, rgba(0,18,36,0.35) 0%, #050d1a 75%, #03070f 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(5,12,24,0.90) 0%, rgba(7,19,36,0.60) 50%, rgba(3,8,18,0.95) 100%)",
          }}
        />
      </div>

      {/* ── HUD grid ── */}
      <div
        className="mc-hud-grid"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.60,
        }}
      />

      {/* ── radar sweep ── */}
      <div
        className="mc-radar-sweep"
        style={{
          position: "fixed",
          top: "25%",
          right: "-192px",
          width: "800px",
          height: "800px",
          borderRadius: "9999px",
          pointerEvents: "none",
          zIndex: 1,
          opacity: 0.40,
        }}
      />

      {/* ── Three.js terrain canvas ── */}
      <div
        ref={threeContainerRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          opacity: 0.70,
        }}
      />

      {/* ── ambient telemetry overlays ── */}
      <div
        className="hidden xl:flex flex-col gap-1"
        style={{
          position: "fixed",
          top: "96px",
          left: "32px",
          pointerEvents: "none",
          zIndex: 3,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "rgba(0,240,255,0.40)",
        }}
      >
        {ambientTop.map((s) => <span key={s}>{s}</span>)}
      </div>
      <div
        className="hidden xl:flex flex-col items-end gap-1"
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          pointerEvents: "none",
          zIndex: 3,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "rgba(0,212,255,0.40)",
        }}
      >
        {ambientBottom.map((s) => <span key={s}>{s}</span>)}
      </div>

      {/* ── sticky header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 40 }}>
        <GISHeader onBack={onBack} />
      </div>

      {/* ── main content ── */}
      <main
        className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10"
        style={{ zIndex: 10 }}
      >
        <DistrictMap />
        <EncroachmentFlags />
        <CaseForensics />
        <AIComplaintLetter />
        <CaseExport />
      </main>

      {/* spin keyframe for the pipeline step 4 icon */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
