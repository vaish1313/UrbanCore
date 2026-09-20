/**
 * MunicipalGISDashboard
 *
 * Theme identical to CitizenDashboard:
 *   - transparent page bg + citizen-bg-new.jpg at 0.25 opacity (cs-page / cs-page-bg)
 *   - card panels: rgba(13,20,40,0.72) bg · 1px solid rgba(34,211,238,0.12) border ·
 *     border-radius 20px · backdrop-filter blur(24px) · box-shadow 0 4px 32px rgba(0,0,0,0.35)
 *   - fonts: var(--font-display,'Sora') / var(--font-sans,'Manrope') / var(--font-mono,'JetBrains Mono',monospace)
 *   - primary gradient button: linear-gradient(135deg,#06b6d4,#3b82f6)
 *   - accent: #22d3ee  gradient-start: #06b6d4  gradient-end: #3b82f6
 *   - No Three.js, no oklch solid bg, no HUD telemetry overlays
 */

import { useMemo, useState, useRef } from "react";
import { motion } from "motion/react";
import {
  BarChart3, Layers, RefreshCw, Flame, AlertTriangle, CheckCircle2,
  FileText, Satellite, MapPin, ShieldAlert, Download,
  Printer, ChevronRight, Flag, Eye, ArrowLeft,
} from "lucide-react";
import { HeroSearch } from "../citizen/HeroSearch";
// @ts-expect-error react-map-gl/mapbox types might be missing
import Map, { Layer, NavigationControl, Source } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

/** Fixed view — AOI-07 Gangapur Road (frontend demo only). */
const FORENSICS_HEATMAP_VIEW = {
  longitude: 73.7548,
  latitude: 20.0124,
  zoom: 14.35,
  pitch: 0,
  bearing: -12,
};

/**
 * Synthetic construction hotspots for timeline scrubbing (2021→2025).
 * Weights grow each year to simulate spreading built-up change — replace with API GeoJSON later.
 */
const DEMO_CONSTRUCTION_HOTSPOTS = [
  { lng: 73.7536, lat: 20.0134, base: 0.04, growth: 0.17, spread: 0.00035 },
  { lng: 73.7552, lat: 20.0126, base: 0.07, growth: 0.22, spread: 0.00042 },
  { lng: 73.7566, lat: 20.0119, base: 0.03, growth: 0.26, spread: 0.00038 },
  { lng: 73.7524, lat: 20.0121, base: 0.05, growth: 0.14, spread: 0.00028 },
  { lng: 73.7544, lat: 20.0146, base: 0.04, growth: 0.19, spread: 0.00032 },
  { lng: 73.7574, lat: 20.0137, base: 0.02, growth: 0.28, spread: 0.00045 },
  { lng: 73.7518, lat: 20.0138, base: 0.03, growth: 0.12, spread: 0.00025 },
] as const;

function buildDemoConstructionHeatGeoJSON(epochYear: number): FeatureCollection {
  const yearsElapsed = Math.max(0, epochYear - 2021);
  const features = DEMO_CONSTRUCTION_HOTSPOTS.flatMap((site, siteIndex) => {
    const weight = Math.min(1, site.base + site.growth * yearsElapsed);
    const pointCount = 1 + Math.floor(yearsElapsed * 1.4);
    return Array.from({ length: pointCount }, (_, i) => {
      const angle = (i / pointCount) * Math.PI * 2 + siteIndex * 0.4;
      const radius = site.spread * (0.35 + i * 0.55);
      return {
        type: "Feature" as const,
        properties: { weight: weight * (1 - i * 0.08) },
        geometry: {
          type: "Point" as const,
          coordinates: [
            site.lng + Math.cos(angle) * radius,
            site.lat + Math.sin(angle) * radius * 0.72,
          ],
        },
      };
    });
  });

  return { type: "FeatureCollection", features };
}

// ─── Design tokens (exact citizen hex values) ─────────────────────────────────
const T = {
  cyan:     "#22d3ee",
  cyan500:  "#06b6d4",
  blue500:  "#3b82f6",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  // citizen card panel (cs-map-panel)
  cardBg:      "rgba(13,20,40,0.72)",
  cardBorder:  "rgba(34,211,238,0.12)",
  // status badge palette — mirrors citizen MyReports STATUS_STYLES
  statusPending:  { bg:"rgba(250,204,21,0.1)",  text:"#fbbf24", border:"rgba(250,204,21,0.25)" },
  statusReview:   { bg:"rgba(251,146,60,0.1)",  text:"#fb923c", border:"rgba(251,146,60,0.25)" },
  statusResolved: { bg:"rgba(52,211,153,0.1)",  text:"#34d399", border:"rgba(52,211,153,0.25)" },
  statusRejected: { bg:"rgba(248,113,113,0.1)", text:"#f87171", border:"rgba(248,113,113,0.25)" },
  statusQueue:    { bg:"rgba(99,102,241,0.1)",  text:"#a5b4fc", border:"rgba(99,102,241,0.25)" },
  // severity — kept because citizen MyReports uses identical palette
  sevHigh: { bg:"rgba(239,68,68,0.15)",   text:"#f87171", border:"rgba(239,68,68,0.3)" },
  sevMed:  { bg:"rgba(251,191,36,0.15)",  text:"#fbbf24", border:"rgba(251,191,36,0.3)" },
  sevLow:  { bg:"rgba(52,211,153,0.12)",  text:"#34d399", border:"rgba(52,211,153,0.3)" },
} as const;

// ─── Shared citizen panel style (cs-map-panel equivalent) ────────────────────
const PANEL: React.CSSProperties = {
  background:     T.cardBg,
  border:         `1px solid ${T.cardBorder}`,
  borderRadius:   20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow:      "0 4px 32px rgba(0,0,0,0.35)",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
      fontSize: "0.65rem", letterSpacing: "0.15em",
      textTransform: "uppercase", color: T.cyan,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-display,'Sora',sans-serif)",
      fontSize: "clamp(1.4rem, 3vw, 1.85rem)",
      fontWeight: 700, color: T.slate100,
      letterSpacing: "-0.02em", margin: 0,
    }}>
      {children}
    </h2>
  );
}

function StatusPill({
  label, colors,
}: {
  label: string;
  colors: { bg: string; text: string; border: string };
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "3px 10px",
      borderRadius: 999, border: `1px solid ${colors.border}`,
      background: colors.bg, color: colors.text,
      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
    }}>
      {label}
    </span>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16, width:"100%", margin:"0 0 8px" }}>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
      <span style={{
        fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
        fontSize:"0.625rem", letterSpacing:"0.18em",
        textTransform:"uppercase", color:"#334155", whiteSpace:"nowrap",
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// Primary gradient button — citizen exact values
function PrimaryBtn({ children, onClick, icon }: {
  children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button" onClick={onClick}
      whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(34,211,238,0.25)" }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: `linear-gradient(135deg, ${T.cyan500} 0%, ${T.blue500} 100%)`,
        color: "#fff", border: "none", borderRadius: 12,
        padding: "11px 22px", fontSize: "0.875rem", fontWeight: 600,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-sans,'Manrope',sans-serif)",
      }}
    >
      {icon}{children}
    </motion.button>
  );
}

function OutlineBtn({ children, onClick, icon }: {
  children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode;
}) {
  return (
    <motion.button
      type="button" onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: "rgba(255,255,255,0.04)",
        color: T.slate300, border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12, padding: "10px 20px",
        fontSize: "0.875rem", fontWeight: 500,
        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
        fontFamily: "var(--font-sans,'Manrope',sans-serif)",
      }}
    >
      {icon}{children}
    </motion.button>
  );
}

// ─── Section 1 · District Overview Map ───────────────────────────────────────

function DistrictMap() {
  const [activeLayer, setActiveLayer] = useState<"heatmap" | "satellite" | "zoning">("satellite");
  const [viewState, setViewState] = useState({
    longitude: 73.78,
    latitude: 20.005,
    zoom: 11,
  });

  const LAYER_STYLES: Record<string, string> = {
    heatmap:   "mapbox://styles/mapbox/satellite-streets-v12",
    satellite: "mapbox://styles/mapbox/satellite-streets-v12",
    zoning:    "mapbox://styles/mapbox/satellite-streets-v12",
  };

  return (
    <section>
      <SectionDivider label="District Overview Map" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* header row */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-end", gap:12 }}>
          <div>
            <EyebrowLabel><Satellite size={13} /> District Overview Map</EyebrowLabel>
            <SectionTitle>Nashik District – Monitored AOIs</SectionTitle>
          </div>
          <div className="cs-muni-status-row">
            {[
              { label:"18 Nominal",          color:"#34d399" },
              { label:"7 Moderate",           color:"#fbbf24" },
              { label:"5 High Construction",  color:"#f87171", bold:true },
            ].map(s => (
              <span key={s.label} style={{
                display:"flex", alignItems:"center", gap:6, fontSize:"0.8rem",
                color:s.color, fontWeight: s.bold ? 700 : 500,
                fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
              }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, display:"inline-block" }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* map card — citizen panel style */}
        <motion.div
          whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
          style={{ ...PANEL, overflow:"hidden", position:"relative", height:500 }}
        >
          {/* layer toggle pills — float over map */}
          <div style={{
            position:"absolute", top:14, left:14, zIndex:10,
            display:"flex", gap:8, flexWrap:"wrap",
          }}>
            {([
              { id:"heatmap",   icon:<Flame size={13}/>,    label:"Heatmap" },
              { id:"satellite", icon:<Satellite size={13}/>, label:"Satellite" },
              { id:"zoning",    icon:<Layers size={13}/>,   label:"Zoning Layer" },
            ] as const).map(l => (
              <button key={l.id} type="button" onClick={() => setActiveLayer(l.id)}
                style={{
                  display:"flex", alignItems:"center", gap:6,
                  padding:"6px 14px", borderRadius:999,
                  border: activeLayer === l.id
                    ? "1px solid rgba(34,211,238,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: activeLayer === l.id
                    ? "rgba(34,211,238,0.15)"
                    : "rgba(13,20,40,0.72)",
                  color: activeLayer === l.id ? T.cyan : T.slate400,
                  fontSize:"0.78rem", fontWeight: activeLayer === l.id ? 700 : 500,
                  cursor:"pointer", backdropFilter:"blur(12px)",
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  letterSpacing:"0.04em",
                  boxShadow: activeLayer === l.id ? "0 0 14px rgba(34,211,238,0.18)" : "none",
                }}>
                {l.icon}{l.label}
              </button>
            ))}
          </div>

          {/* Mapbox satellite map */}
          <Map
            {...viewState}
            onMove={(evt: { viewState: typeof viewState }) => setViewState(evt.viewState)}
            mapStyle={LAYER_STYLES[activeLayer]}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width:"100%", height:"100%" }}
          >
            <NavigationControl position="bottom-right" />
          </Map>

          {/* AOI-07 pinned callout */}
          <div style={{
            position:"absolute", top:14, right:14, zIndex:20,
            ...PANEL,
            padding:"12px 16px",
            display:"flex", flexDirection:"column", gap:6,
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
              <span style={{
                fontFamily:"var(--font-display,'Sora',sans-serif)",
                fontSize:13, color:T.slate100, fontWeight:700,
              }}>
                AOI-07 · Gangapur Road
              </span>
              <StatusPill label="+42% Growth" colors={T.sevHigh} />
            </div>
            <span style={{ fontSize:12, color:T.slate400, fontFamily:"var(--font-sans,'Manrope',sans-serif)" }}>
              Anandwalli / River Buffer Zone
            </span>
            <div style={{
              display:"flex", gap:8, paddingTop:6,
              borderTop:"1px solid rgba(255,255,255,0.08)",
              fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
              fontSize:11, color:T.cyan,
            }}>
              <span>3 Active Cases</span><span>·</span>
              <span>Confidence: 96%</span><span>·</span>
              <span>20.0124°N</span>
            </div>
          </div>

          {/* bottom status bar */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0, zIndex:20,
            borderTop:"1px solid rgba(255,255,255,0.06)",
            background:"rgba(13,20,40,0.82)", backdropFilter:"blur(12px)",
            padding:"10px 20px", display:"flex", gap:20, flexWrap:"wrap",
            fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
            fontSize:11, color:T.slate500,
          }}>
            <span>CENTER: 20.0050° N, 73.7800° E</span>
            <span style={{ color:"rgba(255,255,255,0.1)" }}>|</span>
            <span>ELEVATION: 584 m</span>
            <span style={{ color:"rgba(255,255,255,0.1)" }}>|</span>
            <span style={{ color:T.cyan, fontWeight:700 }}>MONITORED AOIs</span>
          </div>
        </motion.div>
      </div>

      <style>{`
        .cs-muni-status-row {
          display:flex; flex-wrap:wrap; align-items:center; gap:20px;
          background:rgba(13,20,40,0.72);
          border:1px solid rgba(255,255,255,0.07);
          padding:8px 18px; border-radius:999px;
          backdrop-filter:blur(12px);
        }
      `}</style>
    </section>
  );
}

// ─── Section 2 · Priority Queue ───────────────────────────────────────────────

const CASES = [
  {
    id:"URB-10492", nk:"NK-2025-0894", conf:97, high:true,
    icon:<AlertTriangle size={22} />, iconColor:"#f87171",
    title:"Gangapur Road, Plot 4A / Anandwalli Sector 4",
    detail:"Detected Oct 12, 2024 · 100m Godavari River Setback Incursion (−18.4m)",
    status:"UNDER REVIEW", statusColors: T.statusReview,
  },
  {
    id:"URB-09211", nk:"NK-2025-0891", conf:91, high:false,
    icon:<FileText size={22} />, iconColor:"#34d399",
    title:"Trimbakeshwar Link Road, Plot 89",
    detail:"Detected Aug 05, 2024 · Eco-Forest Conservation Zone",
    status:"RESOLVED", statusColors: T.statusResolved,
  },
  {
    id:"URB-08477", nk:"NK-2025-0888", conf:94, high:true,
    icon:<Satellite size={22} />, iconColor:"#a5b4fc",
    title:"Panchavati Ghat Shoreline, Sector 2",
    detail:"Detected Feb 25, 2025 · High Blue Floodline Zone",
    status:"INSPECTION QUEUE", statusColors: T.statusQueue,
  },
] as const;

function PriorityQueue() {
  return (
    <section>
      <SectionDivider label="Priority Queue" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:8 }}>
          <div>
            <EyebrowLabel><Flag size={13} /> Priority Queue</EyebrowLabel>
            <SectionTitle>Detected Encroachment Flags</SectionTitle>
          </div>
          <button type="button" style={{
            display:"flex", alignItems:"center", gap:6,
            background:"none", border:"none", cursor:"pointer",
            color:T.cyan, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
            fontSize:"0.8rem",
          }}>
            View All Encroachments <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {CASES.map(c => (
            <motion.div
              key={c.id}
              whileHover={{ y:-2, boxShadow:"0 8px 40px rgba(0,0,0,0.5)", borderColor:"rgba(34,211,238,0.22)" }}
              style={{
                ...PANEL,
                padding:"16px 20px",
                display:"flex", flexWrap:"wrap", alignItems:"center",
                justifyContent:"space-between", gap:16, cursor:"pointer",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  width:44, height:44, borderRadius:12, flexShrink:0,
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:c.iconColor,
                }}>
                  {c.icon}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8 }}>
                    <span style={{
                      fontFamily:"var(--font-display,'Sora',sans-serif)",
                      color: c.high ? T.cyan : T.slate100,
                      fontWeight:700, fontSize:15, letterSpacing:"0.02em",
                    }}>{c.id}</span>
                    <span style={{
                      fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize:11, color:T.slate500,
                    }}>({c.nk})</span>
                    <StatusPill
                      label={`${c.conf}% ${c.high ? "High" : "Medium"} Confidence`}
                      colors={c.high ? T.sevHigh : T.sevMed}
                    />
                  </div>
                  <span style={{
                    fontSize:14, color:T.slate200, fontWeight:500,
                    fontFamily:"var(--font-sans,'Manrope',sans-serif)",
                  }}>{c.title}</span>
                  <span style={{
                    fontSize:12, color:T.slate500,
                    fontFamily:"var(--font-sans,'Manrope',sans-serif)",
                  }}>{c.detail}</span>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
                <StatusPill label={c.status} colors={c.statusColors} />
                <div style={{
                  width:34, height:34, borderRadius:"50%",
                  background:"rgba(255,255,255,0.04)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:T.slate500,
                }}>
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section 3 · Case Forensics ───────────────────────────────────────────────

const YEAR_NODES = [
  { year:2021, left:"2%",  top:"78%" },
  { year:2022, left:"26%", top:"35%" },
  { year:2023, left:"50%", top:"8%"  },
  { year:2024, left:"74%", top:"35%" },
  { year:2025, left:"98%", top:"78%" },
];

function CaseForensics() {
  const [val, setVal] = useState(2021);
  const t = (val - 2021) / 4;
  const intensity = Math.round(8 + t * 84);
  const stage = intensity < 25 ? "Pristine" : intensity < 55 ? "Emerging" : intensity < 80 ? "Active Incursion" : "Critical";
  const velocity = Math.round(t * 84);
  const nearest = Math.round(val);
  const heatGeoJson = useMemo(() => buildDemoConstructionHeatGeoJSON(val), [val]);
  const demoAreaDelta = Math.round(18 + t * 402);

  return (
    <section>
      <SectionDivider label="Deep Investigation" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><Eye size={13} /> Deep Investigation</EyebrowLabel>
          <SectionTitle>Case Forensics &amp; Change Telemetry</SectionTitle>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))", gap:16 }}>

          {/* Left: Chrono-dial */}
          <motion.div
            whileHover={{ boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}
            style={{ ...PANEL, padding:24, display:"flex", flexDirection:"column", gap:20 }}
          >
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{
                  width:40, height:40, borderRadius:12,
                  background:"rgba(34,211,238,0.08)",
                  border:"1px solid rgba(34,211,238,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:T.cyan, flexShrink:0,
                }}>
                  <Satellite size={18} />
                </div>
                <div>
                  <div style={{
                    fontFamily:"var(--font-display,'Sora',sans-serif)",
                    fontSize:14, color:T.slate100, fontWeight:700,
                  }}>Construction Heatmap (2021 – 2025)</div>
                  <div style={{
                    fontSize:12, color:T.slate500,
                    fontFamily:"var(--font-sans,'Manrope',sans-serif)",
                  }}>Scrub 2021–2025 on live satellite — demo heat until backend is wired</div>
                </div>
              </div>
              <span style={{
                padding:"5px 14px", borderRadius:999,
                background:`linear-gradient(135deg, ${T.cyan500}, ${T.blue500})`,
                color:"#fff", fontSize:"0.75rem", fontWeight:700, whiteSpace:"nowrap",
                fontFamily:"var(--font-sans,'Manrope',sans-serif)",
              }}>Chrono Scrub</span>
            </div>

            {/* heatmap stage — satellite base + yearly construction heat (mock) */}
            <div style={{
              position:"relative", borderRadius:14, overflow:"hidden", height:280,
              background:"rgba(5,10,25,0.9)",
              border:"1px solid rgba(255,255,255,0.06)",
            }}>
              <Map
                {...FORENSICS_HEATMAP_VIEW}
                mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width:"100%", height:"100%" }}
                dragPan={false}
                dragRotate={false}
                scrollZoom={false}
                doubleClickZoom={false}
                touchZoomRotate={false}
                keyboard={false}
                attributionControl={false}
              >
                <Source id="forensics-construction-heat" type="geojson" data={heatGeoJson}>
                  <Layer
                    id="forensics-construction-heat-layer"
                    type="heatmap"
                    paint={{
                      "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
                      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 12, 0.85, 16, 2.4],
                      "heatmap-color": [
                        "interpolate",
                        ["linear"],
                        ["heatmap-density"],
                        0, "rgba(16,185,129,0)",
                        0.15, "rgba(34,211,238,0.45)",
                        0.45, "rgba(251,191,36,0.72)",
                        0.72, "rgba(239,68,68,0.88)",
                        1, "rgba(220,38,38,1)",
                      ],
                      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 12, 22, 16, 58],
                      "heatmap-opacity": 0.78 + t * 0.12,
                    }}
                  />
                </Source>
              </Map>

              <div style={{
                position:"absolute", inset:0, pointerEvents:"none",
                background:"linear-gradient(to bottom, rgba(5,10,25,0.35) 0%, transparent 35%, rgba(5,10,25,0.55) 100%)",
              }} />

              {/* AOI tag */}
              <div style={{
                position:"absolute", top:10, left:10, zIndex:5, pointerEvents:"none",
                display:"flex", alignItems:"center", gap:6,
                padding:"5px 10px", borderRadius:10,
                border:"1px solid rgba(34,211,238,0.25)",
                background:"rgba(13,20,40,0.85)", backdropFilter:"blur(8px)",
              }}>
                <MapPin size={12} color={T.cyan} />
                <span style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:11, color:T.slate300,
                }}>AOI-07 · Gangapur Road</span>
              </div>

              <div style={{
                position:"absolute", top:10, left:"50%", transform:"translateX(-50%)", zIndex:5,
                padding:"4px 10px", borderRadius:999, pointerEvents:"none",
                border:"1px solid rgba(255,255,255,0.12)",
                background:"rgba(13,20,40,0.75)", backdropFilter:"blur(8px)",
                fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:T.slate500,
              }}>
                Demo · {nearest} baseline
              </div>

              {/* epoch */}
              <div style={{ position:"absolute", top:10, right:12, zIndex:5, pointerEvents:"none" }}>
                <span style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:20, color:T.slate100, fontWeight:700,
                }}>{val.toFixed(1)}</span>
                <div style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:9, color:T.slate500, textTransform:"uppercase", letterSpacing:"0.18em",
                }}>Epoch Scrub</div>
              </div>

              {/* intensity bar */}
              <div style={{
                position:"absolute", bottom:72, right:12, zIndex:5, pointerEvents:"none",
                display:"flex", flexDirection:"column", gap:4,
                padding:"8px 12px", borderRadius:10,
                border:"1px solid rgba(255,255,255,0.08)",
                background:"rgba(13,20,40,0.85)", backdropFilter:"blur(8px)",
              }}>
                <span style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:9, color:T.slate500, textTransform:"uppercase", letterSpacing:"0.12em",
                }}>Construction Intensity</span>
                <div style={{
                  width:112, height:5, borderRadius:999,
                  background:"rgba(255,255,255,0.08)", overflow:"hidden",
                }}>
                  <div style={{
                    height:"100%", width:`${intensity}%`,
                    background:"linear-gradient(90deg, #10b981, #fbbf24, #ef4444)",
                    transition:"width 0.1s",
                  }} />
                </div>
                <span style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:9, color:T.slate400,
                }}>{intensity}% · {stage}</span>
                <span style={{
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:9, color:T.cyan,
                }}>~{demoAreaDelta} m² Δ vs 2021</span>
              </div>

              {/* arc + year nodes */}
              <div style={{ position:"absolute", bottom:8, left:0, right:0, zIndex:6, display:"flex", justifyContent:"center", pointerEvents:"auto" }}>
                <div style={{ position:"relative", width:"92%", maxWidth:380, height:60 }}>
                  <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
                    viewBox="0 0 400 64" preserveAspectRatio="none">
                    <path d="M10,54 Q200,-6 390,54" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="2" />
                  </svg>
                  {YEAR_NODES.map(({ year, left, top }) => {
                    const active = year === nearest;
                    return (
                      <button key={year} type="button" onClick={() => setVal(year)}
                        style={{
                          position:"absolute", left, top,
                          transform:`translateX(-50%) scale(${active ? 1.1 : 1})`,
                          background:"none", border:"none", cursor:"pointer",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                        }}>
                        <span style={{
                          width:12, height:12, borderRadius:"50%", display:"block",
                          background: active ? T.cyan : "rgba(255,255,255,0.18)",
                          border: `1px solid ${active ? T.cyan : "rgba(255,255,255,0.28)"}`,
                          boxShadow: active ? `0 0 10px ${T.cyan}` : "none",
                        }} />
                        <span style={{
                          fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize:10,
                          color: year === 2025 && !active ? "#f87171" : active ? T.cyan : T.slate500,
                          fontWeight: year === 2025 ? 700 : 400,
                        }}>{year}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* slider */}
            <div style={{
              background:"rgba(5,10,25,0.7)",
              border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:14, padding:"12px 16px",
              display:"flex", flexDirection:"column", gap:8,
            }}>
              <input
                type="range" min={2021} max={2025} step={0.05} value={val}
                onChange={e => setVal(parseFloat(e.target.value))}
                style={{ width:"100%", height:5, borderRadius:999, accentColor:T.cyan, cursor:"pointer" }}
              />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:11, color:T.slate500 }}>Pristine 2021</span>
                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:11, color:T.cyan }}>+{velocity} m²/yr</span>
                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:11, color:"#f87171", fontWeight:700 }}>Critical 2025</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Case details */}
          <motion.div
            whileHover={{ boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}
            style={{ ...PANEL, padding:24, display:"flex", flexDirection:"column", justifyContent:"space-between", gap:20 }}
          >
            <div>
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                paddingBottom:14, borderBottom:"1px solid rgba(255,255,255,0.07)", marginBottom:4,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FileText size={18} color={T.cyan} />
                  <span style={{
                    fontFamily:"var(--font-display,'Sora',sans-serif)",
                    fontSize:17, color:T.slate100, fontWeight:700,
                  }}>Case Details</span>
                </div>
                <StatusPill label="High Priority" colors={T.sevHigh} />
              </div>

              <div style={{ display:"flex", flexDirection:"column" }}>
                {([
                  ["Case ID",        "UC-2025-0894",                    true,  T.slate100],
                  ["Location",       "Gangapur Road, Nashik",           false, T.slate200],
                  ["Latitude",       "20.0124° N",                      true,  T.cyan],
                  ["Longitude",      "73.7548° E",                      true,  T.cyan],
                  ["Protected Zone", "River Buffer Zone (100m)",         false, "#fbbf24"],
                  ["Detected Year",  "2024 – 2025 Incursion",           true,  T.slate200],
                  ["Confidence",     "97% Corroborated",                true,  "#34d399"],
                  ["Area Affected",  "420 m²",                          true,  "#f87171"],
                  ["Detected Change","New Commercial Plinth Footprint", false, T.slate200],
                ] as [string, string, boolean, string][]).map(([label, value, mono, color]) => (
                  <div key={label} style={{
                    display:"flex", justifyContent:"space-between",
                    padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", gap:12,
                  }}>
                    <span style={{
                      fontSize:12, color:T.slate500,
                      fontFamily:"var(--font-sans,'Manrope',sans-serif)",
                    }}>{label}</span>
                    <span style={{
                      fontFamily: mono
                        ? "var(--font-mono,'JetBrains Mono',monospace)"
                        : "var(--font-sans,'Manrope',sans-serif)",
                      fontSize:12, color, fontWeight:600, textAlign:"right",
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                style={{
                  flex:1, padding:"10px 0", borderRadius:12,
                  border:"1px solid rgba(52,211,153,0.4)",
                  background:"rgba(52,211,153,0.1)", color:"#34d399",
                  cursor:"pointer",
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}>
                <CheckCircle2 size={14}/> Mark Reviewed
              </motion.button>
              <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                style={{
                  flex:1, padding:"10px 0", borderRadius:12,
                  border:"1px solid rgba(248,113,113,0.4)",
                  background:"rgba(248,113,113,0.1)", color:"#f87171",
                  cursor:"pointer",
                  fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize:12, fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                }}>
                <Flag size={14}/> Flag for Action
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Section 4 · AI Legal Notice ──────────────────────────────────────────────

function AILegalNotice() {
  const steps = [
    { label:"Preparing satellite evidence...",  done:true  },
    { label:"Collecting GPS coordinates...",    done:true  },
    { label:"Compiling multi-year timeline...", done:true  },
    { label:"Generating official notice...",    done:false },
  ];

  return (
    <section>
      <SectionDivider label="AI Complaint Letter Generator" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><ShieldAlert size={13} /> AI Complaint Letter Generator</EyebrowLabel>
          <SectionTitle>Auto-Generated Legal Notice</SectionTitle>
        </div>

        <motion.div
          whileHover={{ boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}
          style={{ ...PANEL, padding:24, display:"flex", flexWrap:"wrap", gap:24 }}
        >
          {/* pipeline */}
          <div style={{
            flex:"1 1 240px", minWidth:220,
            display:"flex", flexDirection:"column", justifyContent:"space-between", gap:16,
            background:"rgba(5,10,25,0.7)",
            border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:14, padding:18,
          }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <span style={{
                fontFamily:"var(--font-mono,'JetBrains Mono',monospace)",
                fontSize:"0.65rem", textTransform:"uppercase",
                letterSpacing:"0.15em", color:T.slate500, fontWeight:600,
              }}>Automated Compilation Pipeline</span>
              {steps.map(s => (
                <div key={s.label} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"8px 12px", borderRadius:10,
                  border:`1px solid ${s.done ? "rgba(52,211,153,0.25)" : "rgba(34,211,238,0.3)"}`,
                  background: s.done ? "rgba(52,211,153,0.07)" : "rgba(34,211,238,0.1)",
                }}>
                  {s.done
                    ? <CheckCircle2 size={17} color="#34d399" style={{ flexShrink:0 }} />
                    : <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
                        <RefreshCw size={17} color={T.cyan} style={{ flexShrink:0 }} />
                      </motion.div>
                  }
                  <span style={{
                    fontSize:12,
                    color: s.done ? T.slate300 : T.cyan,
                    fontWeight: s.done ? 500 : 600,
                    fontFamily:"var(--font-sans,'Manrope',sans-serif)",
                  }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{
              display:"flex", gap:8, padding:"10px 12px", borderRadius:10,
              background:"rgba(34,211,238,0.04)",
              border:"1px solid rgba(34,211,238,0.1)",
              fontSize:11, color:T.slate400, alignItems:"flex-start",
              fontFamily:"var(--font-sans,'Manrope',sans-serif)",
            }}>
              <ShieldAlert size={14} color={T.cyan} style={{ flexShrink:0, marginTop:1 }} />
              <span>Digital seal cryptographically attached to Section 53 MRTP Act statutory complaint.</span>
            </div>
          </div>

          {/* white paper notice */}
          <div style={{
            flex:"2 1 340px",
            background:"#fff", borderRadius:14, padding:28,
            color:"#1e293b", boxShadow:"0 4px 24px rgba(0,0,0,0.35)",
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute", right:-30, bottom:-30, opacity:0.04, color:"#1e293b", pointerEvents:"none", userSelect:"none" }}>
              <ShieldAlert size={200} />
            </div>
            <div style={{
              paddingBottom:14, marginBottom:14,
              borderBottom:"2px solid #1e293b",
              display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <ShieldAlert size={32} color="#1e293b" />
                <div>
                  <div style={{
                    fontFamily:"var(--font-display,'Sora',sans-serif)",
                    fontWeight:700, fontSize:"clamp(12px,1.5vw,15px)",
                    textTransform:"uppercase", letterSpacing:"-0.01em", color:"#1e293b",
                  }}>Nashik Municipal Corporation</div>
                  <div style={{ fontSize:11, color:"#475569" }}>Town Planning &amp; Encroachment Removal Department</div>
                </div>
              </div>
              <div style={{ fontFamily:"monospace", fontSize:10, color:"#475569", textAlign:"right" }}>
                <div>REF: NMC/TPD/2025/0894</div>
                <div>DATE: 18 SEP 2025</div>
              </div>
            </div>
            <h5 style={{
              textAlign:"center", fontWeight:700, fontSize:"clamp(10px,1.2vw,12px)",
              textTransform:"uppercase", letterSpacing:"0.06em", textDecoration:"underline",
              color:"#1e293b", marginBottom:12,
            }}>
              NOTICE OF UNAUTHORIZED CONSTRUCTION UNDER SECTION 53, MRTP ACT, 1966
            </h5>
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr", gap:6,
              background:"#f1f5f9", padding:10, borderRadius:6,
              fontFamily:"monospace", fontSize:11, color:"#1e293b", marginBottom:12,
            }}>
              <div><strong>Case ID:</strong> UC-2025-0894</div>
              <div><strong>Location:</strong> Gangapur Rd, Plot 4A</div>
              <div><strong>Coordinates:</strong> 20.0124°N, 73.7548°E</div>
              <div><strong>Violation:</strong> −18.4m inside 100m River Setback</div>
            </div>
            <p style={{ fontSize:12, color:"#475569", lineHeight:1.7, marginBottom:8 }}>
              This is to formally notify that an unauthorized commercial foundation footprint of approximately{" "}
              <strong>420 sq. meters</strong> has been detected through multispectral satellite telemetry and verified by
              designated Ward 4 inspectors. The construction directly infringes upon the statutory Godavari River riparian green corridor.
            </p>
            <p style={{ fontSize:12, color:"#475569", lineHeight:1.7, marginBottom:16 }}>
              You are hereby commanded to halt all ongoing masonry and excavation operations immediately and show cause within{" "}
              <strong>48 hours</strong> of service, failing which summary demolition will proceed under Municipal Code.
            </p>
            <div style={{
              display:"flex", alignItems:"flex-end", justifyContent:"space-between",
              paddingTop:12, borderTop:"1px solid #e2e8f0",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <CheckCircle2 size={16} color="#047857" />
                <span style={{ fontFamily:"monospace", fontSize:10, color:"#475569" }}>
                  Digital Signature ID: #NK-9921-VERIFIED
                </span>
              </div>
              <div style={{ textAlign:"center" }}>
                <div style={{
                  fontFamily:"var(--font-display,'Sora',sans-serif)",
                  fontSize:12, fontWeight:700, color:"#1e293b",
                }}>Municipal Commissioner</div>
                <div style={{ fontSize:10, color:"#64748b" }}>Nashik Municipal Corporation</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Section 5 · Case Package Export ─────────────────────────────────────────

function CaseExport() {
  return (
    <section>
      <SectionDivider label="Report Generation and Export" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          <EyebrowLabel><Download size={13} /> Report Generation and Export</EyebrowLabel>
          <SectionTitle>Case Package Ready</SectionTitle>
        </div>

        <motion.div
          whileHover={{ boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }}
          style={{
            ...PANEL,
            padding:"24px 28px",
            display:"flex", flexWrap:"wrap",
            alignItems:"center", justifyContent:"space-between", gap:24,
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{
              width:52, height:52, borderRadius:14, flexShrink:0,
              background:"rgba(34,211,238,0.08)",
              border:"1px solid rgba(34,211,238,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:T.cyan, boxShadow:"0 0 20px rgba(34,211,238,0.15)",
            }}>
              <Download size={26} />
            </div>
            <div>
              <div style={{
                fontFamily:"var(--font-display,'Sora',sans-serif)",
                fontSize:"clamp(15px,2vw,18px)", color:T.slate100, fontWeight:700,
              }}>Case Package #UC-2025-0894 Ready</div>
              <div style={{
                fontSize:12, color:T.slate500, marginTop:3,
                fontFamily:"var(--font-sans,'Manrope',sans-serif)",
              }}>
                Includes high-res Sentinel-2 orthomosaic captures, timeline telemetry, and Section 53 MRTP statutory notice.
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <OutlineBtn icon={<Printer size={16}/>}>Print Notice</OutlineBtn>
            <PrimaryBtn icon={<Download size={16}/>}>Export Official Case PDF</PrimaryBtn>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer (identical to citizen DashboardFooter) ────────────────────────────

function MunicipalFooter() {
  return (
    <footer className="cs-footer">
      <div className="cs-footer-inner">
        <div className="cs-footer-brand">
          <BarChart3 className="h-4 w-4 text-cyan-500" />
          <span className="text-slate-300 font-medium">UrbanCore</span>
          <span className="cs-footer-sep">|</span>
          <span className="text-slate-500">Municipal Intelligence</span>
        </div>
        <nav className="cs-footer-links">
          <a href="#" className="cs-footer-link">Privacy Policy</a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">Terms of Use</a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">Contact NMC</a>
        </nav>
      </div>
      <style>{`
        .cs-footer { width:100%; border-top:1px solid rgba(255,255,255,0.06); padding:22px 0; margin-top:12px; }
        .cs-footer-inner { max-width:1280px; margin:0 auto; padding:0 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
        .cs-footer-brand { display:flex; align-items:center; gap:8px; font-size:0.8125rem; }
        .cs-footer-sep { color:rgba(255,255,255,0.18); }
        .cs-footer-links { display:flex; align-items:center; gap:8px; }
        .cs-footer-link { font-size:0.75rem; color:#334155; text-decoration:none; transition:color 0.15s; }
        .cs-footer-link:hover { color:#94a3b8; }
        .cs-footer-dot { font-size:0.75rem; color:rgba(255,255,255,0.12); }
        @media (max-width:640px) { .cs-footer-inner { flex-direction:column; align-items:flex-start; } }
      `}</style>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MunicipalGISDashboard({ onBack }: { onBack?: () => void }) {
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* ── page shell — identical structure to CitizenDashboard cs-page ── */}
      <style>{`
        .mg-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          margin-top: -68px;
          padding-top: 68px;
          overflow-x: hidden;
          background: transparent;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          font-family: var(--font-sans, 'Manrope', sans-serif);
        }
        .mg-page-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          height: 100%;
          background-image: url("/citizen-bg-new.jpg");
          background-size: cover;
          background-position: center top;
          opacity: 0.25;
          z-index: -1;
          pointer-events: none;
        }
        .mg-content {
          flex: 1;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 24px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
      `}</style>

      <div className="mg-page">
        {/* satellite aerial backdrop at 0.25 opacity — same as citizen cs-page-bg */}
        <div className="mg-page-bg" />

        {/* page sections */}
        <div className="mg-content">
          {/* ── 1. Hero Title Section matching Citizen Intelligence ── */}
          <HeroSearch
            titlePrefix="Municipal"
            titleGradient="Intelligence"
            subtitle="Monitor urban development, zoning compliance, protected zones, and satellite-detected encroachments across Nashik."
            showSearch={false}
            showDropPin={false}
          />

          {/* ── 2. District Overview Map Section ── */}
          <div ref={mapSectionRef} style={{ width: "100%" }}>
            <DistrictMap />
          </div>

          <PriorityQueue />
          <CaseForensics />
          <AILegalNotice />
          <CaseExport />
        </div>

        <MunicipalFooter />
      </div>
    </>
  );
}
