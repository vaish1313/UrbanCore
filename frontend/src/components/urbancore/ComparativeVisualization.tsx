/**
 * ComparativeVisualization
 *
 * Premium before/after comparison slider for the Solutions > Citizen section.
 * - Uses /citizen map.png as the base image on BOTH sides (perfectly aligned)
 * - LEFT (2021): clean satellite map, no overlays
 * - RIGHT (2025): same map + semi-transparent GIS polygon overlays
 * - Auto-animates the slider back and forth on mount
 * - User can grab and drag at any time
 * - No side panels, no popups, no stats — only map + slider + legend
 */

import { useEffect, useRef, useState, useCallback } from "react";

/* ── GIS overlay regions ── exact % positions on the citizen map.png ──── */
const OVERLAYS = [
  /* ── GREEN: Urban growth / safe development ─────────────────────────── */
  {
    id: "pathardi",
    label: "Pathardi",
    color: "#22c55e",
    opacity: 0.32,
    glow: "rgba(34,197,94,0.45)",
    // bottom-right quadrant — Pathardi Phata residential growth
    points: "62,72 74,68 80,74 78,84 68,88 60,82",
  },
  {
    id: "ambad",
    label: "Ambad MIDC",
    color: "#22c55e",
    opacity: 0.28,
    glow: "rgba(34,197,94,0.40)",
    // left-center — Ambad industrial zone
    points: "16,62 32,58 36,68 28,76 14,72",
  },
  {
    id: "mhasrul",
    label: "Mhasrul",
    color: "#22c55e",
    opacity: 0.25,
    glow: "rgba(34,197,94,0.35)",
    points: "50,28 60,24 66,32 58,40 48,36",
  },

  /* ── BLUE: Rivers / water bodies ────────────────────────────────────── */
  {
    id: "godavari",
    label: "",
    color: "#3b82f6",
    opacity: 0.38,
    glow: "rgba(59,130,246,0.5)",
    // diagonal river strip through centre
    points: "34,42 54,38 68,44 72,52 56,56 38,52",
  },
  {
    id: "gangapur-res",
    label: "",
    color: "#3b82f6",
    opacity: 0.35,
    glow: "rgba(59,130,246,0.45)",
    // top-left — Gangapur reservoir
    points: "8,16 22,12 28,22 20,30 8,26",
  },

  /* ── RED: Restricted / eco-sensitive ────────────────────────────────── */
  {
    id: "trimbak",
    label: "Trimbak Road",
    color: "#ef4444",
    opacity: 0.30,
    glow: "rgba(239,68,68,0.45)",
    // far left — Trimbakeshwar protected hill
    points: "2,52 14,46 18,56 14,66 4,64",
  },
  {
    id: "panchavati",
    label: "Panchavati",
    color: "#ef4444",
    opacity: 0.28,
    glow: "rgba(239,68,68,0.40)",
    // centre-right riverbank
    points: "58,42 68,40 74,48 68,56 58,54",
  },

  /* ── YELLOW: Moderate monitoring ────────────────────────────────────── */
  {
    id: "satpur",
    label: "Satpur MIDC",
    color: "#eab308",
    opacity: 0.28,
    glow: "rgba(234,179,8,0.40)",
    // top-centre
    points: "32,18 46,14 52,24 46,32 30,28",
  },
  {
    id: "gangapur-road",
    label: "Gangapur Road",
    color: "#eab308",
    opacity: 0.26,
    glow: "rgba(234,179,8,0.38)",
    // centre
    points: "42,44 56,40 62,50 54,58 40,54",
  },
  {
    id: "deolali",
    label: "Deolali",
    color: "#eab308",
    opacity: 0.24,
    glow: "rgba(234,179,8,0.35)",
    // bottom-right
    points: "72,76 84,72 88,82 80,90 70,86",
  },
];

const LEGEND = [
  { color: "#22c55e", label: "Urban Growth" },
  { color: "#ef4444", label: "Restricted Zone" },
  { color: "#3b82f6", label: "Water Bodies" },
  { color: "#eab308", label: "Monitoring Area" },
];

/* Convert "x,y x,y ..." (% values) to SVG points string */
function toSvgPoints(pts: string, w: number, h: number): string {
  return pts
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      return `${((x! / 100) * w).toFixed(1)},${((y! / 100) * h).toFixed(1)}`;
    })
    .join(" ");
}

export function ComparativeVisualization({ onComplete }: { onComplete?: () => void }) {
  /* slider position 0-100 (% from left) */
  const [sliderPct, setSliderPct] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging      = useRef(false);
  const animFrameRef  = useRef<number>(0);
  const autoRef       = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* SVG canvas size — kept in state so overlays scale with container */
  const [svgSize, setSvgSize] = useState({ w: 600, h: 400 });

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSvgSize({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── auto-animate slider ───────────────────────────────────────────── */
  useEffect(() => {
    let start: number | null = null;
    let cancelled = false;
    const PERIOD = 5000; // ms for one full left↔right sweep

    const tick = (ts: number) => {
      if (cancelled) return;
      if (start === null) start = ts;
      const elapsed = ts - start;
      /* sine wave 0→1→0 oscillation — pause feels natural at ends */
      const t = (elapsed % PERIOD) / PERIOD;
      /* 10% to 90% range so edges don't get cut off */
      const pct = 10 + 80 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t - Math.PI / 2));
      if (!dragging.current) setSliderPct(pct);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    /* small delay so component has mounted */
    autoRef.current = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(tick);
    }, 600);

    return () => {
      cancelled = true;
      if (autoRef.current) clearTimeout(autoRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ── drag handlers ─────────────────────────────────────────────────── */
  const getPct = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    const raw = ((clientX - rect.left) / rect.width) * 100;
    return Math.min(98, Math.max(2, raw));
  }, []);

  const onMouseDown = useCallback(() => { dragging.current = true; }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    setSliderPct(getPct(e.clientX));
  }, [getPct]);
  const onMouseUp   = useCallback(() => { dragging.current = false; }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    dragging.current = true;
    setSliderPct(getPct(e.touches[0]!.clientX));
  }, [getPct]);
  const onTouchEnd  = useCallback(() => { dragging.current = false; }, []);

  /* notify parent once */
  useEffect(() => { onComplete?.(); }, [onComplete]);

  const MAP_SRC = "/citizen map.png";

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-2xl"
      style={{
        aspectRatio: "3/2",
        boxShadow:
          "0 0 0 1px rgba(34,211,238,0.22), 0 0 40px -8px rgba(34,211,238,0.14), 0 25px 50px -12px rgba(0,0,0,0.65)",
        cursor: dragging.current ? "ew-resize" : "col-resize",
        userSelect: "none",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── RIGHT LAYER: 2025 with GIS overlays (full width, always) ─── */}
      <div className="absolute inset-0">
        <img
          src={MAP_SRC}
          alt="Nashik 2025 satellite"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />

        {/* SVG overlay — polygons only, no cover */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
          preserveAspectRatio="none"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            {OVERLAYS.map((ov) => (
              <filter key={`glow-${ov.id}`} id={`glow-${ov.id}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            ))}
          </defs>

          {OVERLAYS.map((ov) => (
            <g key={ov.id}>
              <polygon
                points={toSvgPoints(ov.points, svgSize.w, svgSize.h)}
                fill={ov.color}
                fillOpacity={ov.opacity}
                stroke={ov.color}
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeLinejoin="round"
                filter={`url(#glow-${ov.id})`}
              />
              {ov.label && (
                <text
                  x={(() => {
                    const pts = ov.points.trim().split(/\s+/);
                    const xs = pts.map((p) => (Number(p.split(",")[0]!) / 100) * svgSize.w);
                    return (Math.min(...xs) + Math.max(...xs)) / 2;
                  })()}
                  y={(() => {
                    const pts = ov.points.trim().split(/\s+/);
                    const ys = pts.map((p) => (Number(p.split(",")[1]!) / 100) * svgSize.h);
                    return (Math.min(...ys) + Math.max(...ys)) / 2 + 4;
                  })()}
                  textAnchor="middle"
                  fill="white"
                  fillOpacity={0.88}
                  fontSize={Math.max(9, svgSize.w * 0.018)}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                  letterSpacing="0.04em"
                  style={{ pointerEvents: "none", textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                >
                  {ov.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* 2025 year badge */}
        <div
          className="absolute top-3 right-3 z-10 font-mono text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(6,12,28,0.80)",
            border: "1px solid rgba(34,211,238,0.35)",
            color: "#22d3ee",
            backdropFilter: "blur(10px)",
          }}
        >
          2025 · AI Analysis
        </div>
      </div>

      {/* ── LEFT LAYER: 2021 clean map — revealed by slider clip ──────── */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPct}% 0 0)` }}
      >
        {/* same image, same size/position as the right layer — perfectly aligned */}
        <img
          src={MAP_SRC}
          alt="Nashik 2021 satellite"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />

        {/* 2021 year badge */}
        <div
          className="absolute top-3 left-3 z-10 font-mono text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(6,12,28,0.80)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#cbd5e1",
            backdropFilter: "blur(10px)",
          }}
        >
          2021 · Baseline
        </div>
      </div>

      {/* ── Slider handle ────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
        style={{
          left: `calc(${sliderPct}% - 1px)`,
          width: 2,
          background: "rgba(255,255,255,0.85)",
          boxShadow: "0 0 12px rgba(255,255,255,0.5), 0 0 24px rgba(34,211,238,0.4)",
          pointerEvents: "none",
        }}
      >
        {/* circular drag pill */}
        <div
          onMouseDown={onMouseDown}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(6,12,28,0.92)",
            border: "2px solid rgba(34,211,238,0.7)",
            boxShadow: "0 0 16px rgba(34,211,238,0.45), 0 2px 12px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "ew-resize",
            pointerEvents: "auto",
            flexShrink: 0,
            backdropFilter: "blur(8px)",
          }}
        >
          {/* left-right arrows */}
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
            <path d="M5 1L1 5l4 4M11 1l4 4-4 4" stroke="#22d3ee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* ── Legend bottom-right ───────────────────────────────────────────── */}
      <div
        className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
        style={{
          background: "rgba(4,9,22,0.82)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(12px)",
          pointerEvents: "none",
        }}
      >
        <p
          className="font-mono uppercase tracking-widest mb-0.5"
          style={{ fontSize: 8, color: "rgba(255,255,255,0.38)", letterSpacing: "0.18em" }}
        >
          Zone Legend
        </p>
        {LEGEND.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="flex-shrink-0 rounded-sm"
              style={{ width: 9, height: 9, background: color, opacity: 0.9 }}
            />
            <span
              className="font-mono tracking-wide whitespace-nowrap"
              style={{ fontSize: 9, color: "rgba(255,255,255,0.72)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
