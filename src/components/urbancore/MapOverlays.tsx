import { useState } from "react";
import { motion } from "motion/react";

export const GROWTH_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

export type Feature = {
  kind: "building" | "water" | "zone" | "terrain";
  label: string;
  detail: string;
  meta: string;
};

export type Layers = {
  roads: boolean;
  buildings: boolean;
  contours: boolean;
  zones: boolean;
  water: boolean;
  vegetation: boolean;
  terrain: boolean;
  suitability: boolean;
  awaken: boolean;
  insights: boolean;
  /** 0..GROWTH_YEARS.length-1, fractional — how much of the city has been built */
  growth: number;
  /** 0..1 — how extruded the digital twin is */
  depth: number;
  interactive: boolean;
  onSelect?: (f: Feature) => void;
  activeRole?: "builder" | "municipal" | "citizen" | null;
  activeAoiId?: string | null;
  activeAlertId?: string | null;
  onSelectAlert?: (alertId: string) => void;
};

const ease = [0.16, 1, 0.3, 1] as const;

/** [x, y, growthIndex, storeys] */
const BUILDINGS: [number, number, number, number][] = [
  [34, 41, 0, 7],
  [46, 30, 0, 5],
  [58, 44, 0, 9],
  [41, 66, 0, 4],
  [28, 57, 0, 6],
  [52, 74, 1, 5],
  [63, 61, 1, 8],
  [72, 36, 1, 6],
  [38, 22, 1, 4],
  [69, 71, 2, 7],
  [77, 54, 2, 5],
  [24, 72, 2, 4],
  [19, 47, 2, 6],
  [84, 44, 3, 8],
  [66, 20, 3, 5],
  [45, 86, 3, 4],
  [31, 31, 3, 6],
  [56, 57, 4, 10],
  [49, 51, 4, 7],
  [74, 26, 4, 5],
  [22, 37, 4, 4],
];

const PARCELS = [
  "Gangapur Road",
  "Indira Nagar",
  "Panchavati",
  "Satpur",
  "CIDCO",
  "Adgaon",
  "Nashik Road",
];

const INSIGHTS: { x: number; y: number; label: string; tone: "gis" | "atmos" | "warn" }[] = [
  { x: 30, y: 52, label: "High suitability", tone: "gis" },
  { x: 63, y: 38, label: "Growth corridor", tone: "atmos" },
  { x: 20, y: 78, label: "Flood-prone", tone: "warn" },
  { x: 68, y: 20, label: "Regulatory constraint", tone: "warn" },
];

const VEGETATION: [number, number, number][] = [
  [10, 64, 9],
  [16, 70, 7],
  [88, 22, 8],
  [80, 16, 6],
  [93, 66, 7],
  [6, 30, 6],
];

export function MapOverlays(layers: Layers) {
  const {
    roads,
    buildings,
    contours,
    zones,
    water,
    vegetation,
    terrain,
    suitability,
    awaken,
    insights,
    growth,
    depth,
    interactive,
    onSelect,
  } = layers;
  const [hover, setHover] = useState<string | null>(null);

  const pe = interactive ? "auto" : "none";

  return (
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      {/* Road network */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: roads ? 1 : 0 }}
        transition={{ duration: 2.4, ease }}
      >
        <g
          stroke="var(--atmos)"
          strokeWidth={0.16 + depth * 0.12}
          fill="none"
          strokeLinecap="round"
          opacity="0.55"
        >
          <path d="M-5 62 C 20 58, 34 44, 52 46 S 82 40, 106 30" />
          <path d="M-5 34 C 18 36, 30 30, 48 33 S 80 24, 106 18" />
          <path d="M12 -5 C 18 24, 30 46, 34 106" />
          <path d="M58 -5 C 60 26, 66 50, 62 106" />
          <path d="M86 -5 C 84 30, 90 58, 88 106" />
          <path d="M-5 82 C 26 80, 52 86, 106 74" />
        </g>
        <g stroke="var(--atmos)" strokeWidth="0.08" fill="none" opacity="0.16">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`h${i}`} d={`M-5 ${8 + i * 11} L 106 ${4 + i * 11}`} />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={`v${i}`} d={`M${6 + i * 11} -5 L ${10 + i * 11} 106`} />
          ))}
        </g>
        {/* data flow along the arterial */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d="M-5 62 C 20 58, 34 44, 52 46 S 82 40, 106 30"
            stroke={i % 2 ? "var(--gis)" : "var(--atmos)"}
            strokeWidth={0.3}
            fill="none"
            strokeDasharray="5 395"
            opacity={awaken ? 0.95 : 0.5}
            style={{ animation: `uc-dash ${9 + i * 3}s linear infinite`, animationDelay: `${i * 2}s` }}
          />
        ))}
        {awaken && (
          <path
            d="M-5 34 C 18 36, 30 30, 48 33 S 80 24, 106 18"
            stroke="var(--gis)"
            strokeWidth="0.28"
            fill="none"
            strokeDasharray="4 396"
            style={{ animation: "uc-dash 7s linear infinite" }}
          />
        )}
      </motion.svg>

      {/* Vegetation — softly drifting canopy */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: vegetation ? 1 : 0 }}
        transition={{ duration: 2.4, ease }}
      >
        {VEGETATION.map(([x, y, r], i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${r}%`,
              height: `${r * 0.8}%`,
              marginLeft: `-${r / 2}%`,
              background: "radial-gradient(circle, var(--gis) 0%, transparent 70%)",
              opacity: 0.18,
              mixBlendMode: "screen",
              animation: `uc-drift ${9 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </motion.div>

      {/* Water bodies — Godavari + lake */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: water ? 1 : 0 }}
        transition={{ duration: 2.6, ease }}
        style={{ pointerEvents: pe, cursor: interactive ? "pointer" : "default" }}
        onPointerEnter={() => interactive && setHover("water")}
        onPointerLeave={() => setHover(null)}
        onClick={() =>
          onSelect?.({
            kind: "water",
            label: "Godavari corridor",
            detail: "Perennial river with a 100 m regulated buffer along both banks.",
            meta: "Blue line · Buffer 100 m · Flood return 25 yr",
          })
        }
      >
        <g fill="none" strokeLinecap="round">
          <path
            d="M-4 26 C 16 34, 26 48, 40 54 C 56 61, 68 78, 78 104"
            stroke="var(--atmos)"
            strokeWidth={hover === "water" ? 1.5 : 1.05}
            opacity={hover === "water" ? 0.75 : 0.4}
            style={{ transition: "all 600ms cubic-bezier(0.16,1,0.3,1)" }}
          />
          <path
            d="M-4 26 C 16 34, 26 48, 40 54 C 56 61, 68 78, 78 104"
            stroke="var(--gis)"
            strokeWidth="0.3"
            strokeDasharray="3 26"
            opacity={hover === "water" ? 0.9 : 0.5}
            style={{ animation: "uc-dash 11s linear infinite" }}
          />
          <ellipse
            cx="17"
            cy="88"
            rx="11"
            ry="6"
            transform="rotate(-12 17 88)"
            fill="var(--atmos)"
            opacity={hover === "water" ? 0.3 : 0.16}
            stroke="var(--atmos)"
            strokeWidth="0.18"
            style={{ transition: "opacity 600ms" }}
          />
        </g>
      </motion.svg>

      {/* Terrain — contours + hillshade lift */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: contours || terrain ? 1 : 0 }}
        transition={{ duration: 2.6, ease }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{ scale: terrain ? 1.05 : 1 }}
          transition={{ duration: 3.2, ease }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <g stroke="var(--foreground)" strokeWidth="0.07" fill="none" opacity="0.42">
              {Array.from({ length: 8 }).map((_, i) => (
                <ellipse
                  key={i}
                  cx="78"
                  cy="84"
                  rx={8 + i * 7}
                  ry={5 + i * 4.4}
                  transform="rotate(-18 78 84)"
                />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <ellipse
                  key={`b${i}`}
                  cx="14"
                  cy="16"
                  rx={6 + i * 6.5}
                  ry={4 + i * 4}
                  transform="rotate(24 14 16)"
                />
              ))}
            </g>
          </svg>
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: terrain ? 1 : 0 }}
            transition={{ duration: 2.4, ease }}
            style={{
              background:
                "radial-gradient(22% 18% at 78% 84%, var(--gis) 0%, transparent 70%), radial-gradient(18% 14% at 14% 16%, var(--atmos) 0%, transparent 72%)",
              opacity: 0.22,
              mixBlendMode: "screen",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Land suitability field */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: suitability ? 1 : 0 }}
        transition={{ duration: 2.8, ease }}
        style={{
          mixBlendMode: "screen",
          background:
            "radial-gradient(26% 22% at 30% 50%, var(--gis) 0%, transparent 70%), radial-gradient(22% 18% at 62% 38%, var(--atmos) 0%, transparent 72%), radial-gradient(20% 16% at 20% 79%, oklch(0.66 0.19 30) 0%, transparent 74%), radial-gradient(16% 14% at 69% 20%, oklch(0.66 0.19 30) 0%, transparent 76%)",
          opacity: 0.3,
        }}
      />

      {/* Protected zones */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: zones ? 1 : 0 }}
        transition={{ duration: 2.2, ease }}
        style={{ pointerEvents: pe, cursor: interactive ? "pointer" : "default" }}
        onPointerEnter={() => interactive && setHover("zones")}
        onPointerLeave={() => setHover(null)}
        onClick={() =>
          onSelect?.({
            kind: "zone",
            label: "Protected & regulated land",
            detail:
              "Green belt, reserved forest, river buffer and flood-prone extents restrict buildable area.",
            meta: "4 constraint layers · 18.4 km² restricted",
          })
        }
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="uc-zone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--gis)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--gis)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="uc-zone-warn" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--atmos)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--atmos)" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <g
            opacity={hover === "zones" ? 1 : 0.72}
            style={{ transition: "opacity 600ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Green belt */}
            <path
              d="M6 68 C 14 58, 26 60, 30 70 C 34 82, 22 92, 12 88 C 4 85, 2 76, 6 68 Z"
              fill="url(#uc-zone)"
              stroke="var(--gis)"
              strokeWidth="0.2"
              strokeDasharray="1.2 1.2"
            />
            {/* Forest boundary */}
            <path
              d="M70 12 C 82 8, 94 16, 92 26 C 90 36, 76 40, 70 32 C 65 25, 64 15, 70 12 Z"
              fill="url(#uc-zone)"
              stroke="var(--gis)"
              strokeWidth="0.2"
              strokeDasharray="1.2 1.2"
            />
            {/* River buffer */}
            <path
              d="M-4 22 C 18 31, 28 46, 42 52 C 58 59, 70 76, 80 104 L 74 104 C 64 78, 52 63, 37 57 C 22 50, 12 36, -4 30 Z"
              fill="url(#uc-zone-warn)"
              stroke="var(--atmos)"
              strokeWidth="0.16"
              strokeDasharray="0.9 1.4"
            />
            {/* Flood-prone */}
            <path
              d="M8 78 C 20 74, 32 82, 30 92 C 28 100, 12 102, 6 94 C 1 88, 2 80, 8 78 Z"
              fill="url(#uc-zone-warn)"
              stroke="var(--atmos)"
              strokeWidth="0.16"
              strokeDasharray="0.6 1.6"
            />
          </g>
        </svg>
      </motion.div>

      {/* Buildings — minimal extruded forms emerging from the terrain */}
      <div className="absolute inset-0" style={{ pointerEvents: pe }}>
        {BUILDINGS.map(([x, y, year, storeys], i) => {
          const grown = Math.max(0, Math.min(1, growth - year + 1));
          const built = buildings && grown > 0;
          const key = `b${i}`;
          const active = hover === key;
          const h = storeys * 2.4 * (0.35 + depth * 0.65) * grown;
          const parcel = PARCELS[i % PARCELS.length]!;
          return (
            <div
              key={key}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                cursor: interactive ? "pointer" : "default",
              }}
              onPointerEnter={() => interactive && setHover(key)}
              onPointerLeave={() => setHover(null)}
              onClick={() =>
                onSelect?.({
                  kind: "building",
                  label: `${parcel} · parcel ${100 + i}`,
                  detail: `Detected footprint, ${storeys} storeys. First observed in ${GROWTH_YEARS[year]}.`,
                  meta: `Built-up ${1200 + i * 140} m² · Slope ${(1 + (i % 5) * 1.4).toFixed(1)}° · Suitability ${72 + (i % 4) * 6}`,
                })
              }
            >
              {/* extrusion */}
              <motion.span
                className="absolute block"
                style={{
                  left: -4,
                  bottom: 0,
                  width: 8,
                  transformOrigin: "bottom center",
                  borderRadius: 2,
                  background:
                    "linear-gradient(to top, oklch(0.72 0.14 235 / 42%), oklch(0.92 0.05 200 / 78%))",
                  boxShadow: active
                    ? "0 0 26px 6px var(--atmos)"
                    : "0 0 12px 2px oklch(0.72 0.14 235 / 45%)",
                  transition: "box-shadow 500ms",
                }}
                initial={false}
                animate={{ height: built ? h : 0, opacity: built ? (active ? 1 : 0.82) : 0 }}
                transition={{ duration: 1.4, ease }}
              />
              {/* footprint */}
              <motion.span
                className="absolute rounded-full"
                style={{
                  left: -4,
                  top: -3,
                  width: 8,
                  height: 6,
                  background: "var(--primary)",
                  boxShadow: "0 0 18px 5px var(--atmos)",
                }}
                initial={false}
                animate={
                  built
                    ? { opacity: [0.45, 0.95, 0.45], scale: 1 }
                    : { opacity: 0, scale: 0.3 }
                }
                transition={{
                  opacity: {
                    duration: 4 + (i % 4),
                    repeat: built ? Infinity : 0,
                    ease: "easeInOut",
                  },
                  scale: { duration: 1.1, ease },
                }}
              />
              {/* contextual label */}
              {active && built && (
                <motion.span
                  className="glass-panel absolute whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/85"
                  style={{ left: 10, bottom: h + 4 }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease }}
                >
                  {parcel} · {storeys} storeys · {GROWTH_YEARS[year]}
                </motion.span>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="absolute inset-0">
        {INSIGHTS.map(({ x, y, label, tone }, i) => (
          <motion.div
            key={label}
            className="absolute flex items-center gap-2"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, y: 8 }}
            animate={insights ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 1.4, delay: insights ? i * 0.35 : 0, ease }}
          >
            <span
              className="breathe h-2 w-2 rounded-full"
              style={{
                background: tone === "gis" ? "var(--gis)" : "var(--atmos)",
                boxShadow: `0 0 18px 5px ${tone === "gis" ? "var(--gis)" : "var(--atmos)"}`,
              }}
            />
            <span className="glass-panel rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-foreground/80">
              {label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Role-Specific Geospatial Overlays */}
      {layers.activeRole === "builder" && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="absolute border-2 border-primary/70 bg-primary/10 rounded-xl shadow-[0_0_30px_rgba(114,180,255,0.3)] transition-all duration-700 flex flex-col items-center justify-center p-2"
            style={{ left: "30%", top: "34%", width: "24%", height: "22%" }}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary bg-background/80 px-2 py-0.5 rounded-full border border-primary/40">
              Parcel #88 · 82/100
            </span>
            <span className="text-[10px] text-foreground/90 font-medium mt-1">Gangapur Road Site</span>
          </div>
        </motion.div>
      )}

      {layers.activeRole === "municipal" && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {[
            { id: "enc-001", x: 62, y: 39, label: "Floodplain Encroachment", severe: true },
            { id: "enc-002", x: 16, y: 76, label: "Forest Clearing", severe: true },
            { id: "enc-003", x: 32, y: 38, label: "Greenbelt Conversion", severe: false },
          ].map((alt) => (
            <div
              key={alt.id}
              onClick={() => layers.onSelectAlert?.(alt.id)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto"
              style={{ left: `${alt.x}%`, top: `${alt.y}%` }}
            >
              <span className={`block h-4 w-4 rounded-full breathe ${alt.severe ? 'bg-destructive shadow-[0_0_20px_var(--destructive)]' : 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]'}`} />
              <span className="glass-panel absolute left-5 top-0 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground group-hover:scale-105 transition-transform">
                ⚠️ {alt.label}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Scan sweep */}
      {roads && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="sweep-line absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-primary/10 to-transparent" />
        </div>
      )}
    </div>
  );
}
