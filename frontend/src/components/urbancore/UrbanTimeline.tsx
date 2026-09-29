/**
 * UrbanTimeline
 * Shared component — Realistic Nashik 2021-2025 urban growth heatmap.
 * Only 5-10% of the map changes per year — localized, incremental, believable.
 * Used in: How It Works (Step 04) & Data & Insights
 */

import { useEffect, useRef, useState } from "react";

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
type Year = typeof YEARS[number];

const ZONES = [
  {
    id: "gangapur",
    label: "Gangapur Road",
    x: 55, y: 50, w: 11, h: 8,
    intensity: { 2021: 0, 2022: 0.3, 2023: 0.5, 2024: 0.75, 2025: 1.0 },
  },
  {
    id: "pathardi",
    label: "Pathardi",
    x: 36, y: 60, w: 10, h: 7,
    intensity: { 2021: 0, 2022: 0.25, 2023: 0.4, 2024: 0.65, 2025: 0.8 },
  },
  {
    id: "nashikrd",
    label: "Nashik Road",
    x: 38, y: 54, w: 9, h: 7,
    intensity: { 2021: 0, 2022: 0, 2023: 0, 2024: 0.3, 2025: 0.55 },
  },
  {
    id: "cidco",
    label: "CIDCO Outskirts",
    x: 46, y: 56, w: 8, h: 6,
    intensity: { 2021: 0, 2022: 0, 2023: 0.2, 2024: 0.35, 2025: 0.5 },
  },
  {
    id: "makhmalabad",
    label: "Makhmalabad",
    x: 42, y: 30, w: 7, h: 6,
    intensity: { 2021: 0, 2022: 0, 2023: 0.15, 2024: 0.25, 2025: 0.35 },
  },
  {
    id: "panchavati",
    label: "Panchavati Outskirts",
    x: 42, y: 36, w: 9, h: 6,
    intensity: { 2021: 0, 2022: 0, 2023: 0, 2024: 0, 2025: 0.25 },
  },
] as const;

function heatColor(intensity: number): string {
  if (intensity <= 0) return "transparent";
  if (intensity < 0.4) return `rgba(250,204,21,${intensity * 0.55})`;
  if (intensity < 0.7) return `rgba(251,146,60,${intensity * 0.55})`;
  return `rgba(239,68,68,${intensity * 0.55})`;
}

function borderColor(intensity: number): string {
  if (intensity <= 0) return "transparent";
  if (intensity < 0.4) return `rgba(250,204,21,${0.4 + intensity * 0.4})`;
  if (intensity < 0.7) return `rgba(251,146,60,${0.4 + intensity * 0.4})`;
  return `rgba(239,68,68,${0.4 + intensity * 0.4})`;
}

const YEAR_ANNOTATIONS: Record<Year, { headline: string; stat: string }> = {
  2021: { headline: "Baseline — 2021",            stat: "Built-up: ~31% of city area"       },
  2022: { headline: "+2 new residential clusters", stat: "Gangapur Rd · Pathardi"            },
  2023: { headline: "Industrial expansion detected",stat: "CIDCO outskirts · Makhmalabad"   },
  2024: { headline: "Urban growth accelerated",    stat: "Gangapur · Pathardi · Nashik Rd"  },
  2025: { headline: "Highest expansion observed",  stat: "All zones active · 90% unchanged" },
};

export function UrbanTimeline() {
  const [year, setYear]           = useState<Year>(2021);
  const [labelVisible, setLabel]  = useState(true);
  const autoRef  = useRef<ReturnType<typeof setTimeout>>();
  const labelRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const advance = () => {
      setLabel(false);
      labelRef.current = setTimeout(() => {
        setYear(y => YEARS[(YEARS.indexOf(y) + 1) % YEARS.length]);
        setLabel(true);
      }, 300);
      autoRef.current = setTimeout(advance, 2500);
    };
    autoRef.current = setTimeout(advance, 2500);
    return () => { clearTimeout(autoRef.current); clearTimeout(labelRef.current); };
  }, []);

  const handleClick = (y: Year) => {
    clearTimeout(autoRef.current);
    clearTimeout(labelRef.current);
    setLabel(false);
    setTimeout(() => { setYear(y); setLabel(true); }, 200);
    // resume auto after 6s
    autoRef.current = setTimeout(() => {
      const advance = () => {
        setLabel(false);
        labelRef.current = setTimeout(() => {
          setYear(prev => YEARS[(YEARS.indexOf(prev) + 1) % YEARS.length]);
          setLabel(true);
        }, 300);
        autoRef.current = setTimeout(advance, 2500);
      };
      autoRef.current = setTimeout(advance, 2500);
    }, 6000);
  };

  const ann = YEAR_ANNOTATIONS[year];

  return (
    <div className="w-full flex flex-col items-center gap-8">

      {/* Year selector */}
      <div className="flex items-center justify-between w-full max-w-2xl relative">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15 -translate-y-1/2 z-0" />
        {YEARS.map(y => {
          const active = y === year;
          const past   = y < year;
          return (
            <button
              key={y}
              onClick={() => handleClick(y)}
              className={`relative z-10 w-12 h-12 rounded-full border flex flex-col items-center justify-center transition-all duration-300 bg-[#050a15]
                ${active
                  ? "border-blue-400 text-blue-400 shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                  : past
                  ? "border-white/30 text-white/50"
                  : "border-white/15 text-slate-500 hover:border-white/30"}`}
            >
              <span className="font-mono text-[10px] leading-none">{y}</span>
              {active && <span className="w-1 h-1 rounded-full bg-blue-400 mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Map + heatmap */}
      <div
        className="w-full rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl"
        style={{ aspectRatio: "21/9" }}
      >
        <img
          src="/citizen map.png"
          alt="Nashik satellite map"
          className="absolute inset-0 w-full h-full object-cover select-none"
          draggable={false}
          style={{ filter: "brightness(0.55) saturate(0.9)" }}
        />

        {/* GIS grid */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(to right,#38bdf8 1px,transparent 1px),linear-gradient(to bottom,#38bdf8 1px,transparent 1px)",
            backgroundSize: "6% 6%",
          }}
        />

        {/* Heatmap zones */}
        {ZONES.map(zone => {
          const intensity = zone.intensity[year];
          if (intensity <= 0) return null;
          return (
            <div
              key={zone.id}
              className="absolute pointer-events-none"
              style={{
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                transition: "opacity 0.7s ease",
              }}
            >
              <div className="absolute inset-0 rounded-sm" style={{ background: heatColor(intensity) }} />
              <div className="absolute inset-0 rounded-sm"
                style={{
                  border: `1.5px solid ${borderColor(intensity)}`,
                  boxShadow: `0 0 10px 2px ${borderColor(intensity).replace(/[\d.]+\)$/, "0.25)")}`,
                }}
              />
            </div>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
          {[
            { color: "rgba(239,68,68,0.8)",  label: "High Change" },
            { color: "rgba(251,146,60,0.8)", label: "Moderate"    },
            { color: "rgba(250,204,21,0.8)", label: "Low / New"   },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="font-mono text-[9px] text-white/60 tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* Year badge */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1.5 rounded-full bg-black/70 border border-blue-500/30 backdrop-blur-sm">
            <span className="font-mono text-base text-blue-400 tracking-widest">{year}</span>
          </div>
        </div>

        {/* Annotation */}
        <div
          className="absolute bottom-4 right-4 z-10 text-right max-w-[200px]"
          style={{ opacity: labelVisible ? 1 : 0, transition: "opacity 0.3s ease" }}
        >
          <p className="font-mono text-[10px] text-white/80 leading-tight mb-0.5">{ann.headline}</p>
          <p className="font-mono text-[9px] text-slate-400 leading-tight">{ann.stat}</p>
        </div>
      </div>
    </div>
  );
}

export default UrbanTimeline;
