/**
 * /municipal — Command Overview
 *
 * Behaviour:
 *  - On first load: hero only (HeroSearch), no feature content visible.
 *  - Sidebar items set `activeFeature` state in THIS component.
 *  - The matching feature section renders below the hero, replacing the previous one.
 *  - citizen-bg-new.jpg at 0.25 opacity — identical to Citizen & Builder dashboards.
 *  - "District Map" heading has no AOI count.
 *
 * Feature IDs (match roleFeatureMenus.ts):
 *   overview | district-map | encroachment | case-detail | complaints
 *
 * The sub-routes (/district-map, /encroachment, /case-detail, /complaints) still
 * exist for direct URL access but the sidebar now drives in-page switching here.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, X, ArrowRight, ChevronRight,
  ShieldAlert, AlertTriangle, CheckCircle2, Flag,
  Satellite, Layers, Clock, User,
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { HeroSearch } from "@/components/urbancore/citizen/HeroSearch";
import { NASHIK_AOIS, STATUS_COLORS, AOI_COUNTS } from "@/data/nashikAois";
import type { MunicipalAOI } from "@/data/nashikAois";
import { MUNICIPAL_ALERTS } from "@/data/municipalData";
import { MUNICIPAL_FEATURE_MENU } from "@/components/urbancore/role/roleFeatureMenus";

export const Route = createFileRoute("/municipal/")({
  head: () => ({ meta: [{ title: "Command Overview — Municipal Authority" }] }),
  component: CommandOverviewPage,
});

/* ── constants ──────────────────────────────────────────────────────────── */
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const NASHIK_CENTER = { longitude: 73.82, latitude: 20.01, zoom: 10.2 };

const PULSE_COLOR: Record<string, string> = {
  red:    "rgba(239,68,68,0.55)",
  yellow: "rgba(251,191,36,0.55)",
  green:  "rgba(52,211,153,0.0)",
};

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.82)",
  border: "1px solid rgba(34,211,238,0.13)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const DISTRICT_BOUNDARY = {
  type: "FeatureCollection" as const,
  features: [{
    type: "Feature" as const, properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[73.40,19.68],[73.52,19.62],[73.72,19.65],[73.90,19.72],[74.10,19.78],[74.30,19.84],[74.52,19.92],[74.72,20.08],[74.62,20.22],[74.48,20.38],[74.32,20.48],[74.15,20.58],[73.98,20.62],[73.80,20.58],[73.62,20.52],[73.45,20.44],[73.36,20.28],[73.32,20.10],[73.38,19.92],[73.40,19.68]]],
    },
  }],
};

const LAYER_TOGGLES = [
  { id: "satellite" as const, label: "Satellite", icon: <Satellite size={12} /> },
  { id: "heatmap"   as const, label: "Heatmap",   icon: <Layers size={12} /> },
  { id: "zoning"    as const, label: "Zoning",    icon: <Layers size={12} /> },
];

/* review state helpers */
const stateColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  pending:  { bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.3)", text: "#94a3b8", label: "Pending" },
  reviewed: { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.35)", text: "#34d399", label: "Reviewed ✓" },
  flagged:  { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.35)", text: "#fb923c", label: "Action Required" },
};

/* complaint preview */
const PREVIEW_COMPLAINTS = [
  { id: "CMP-2025-0041", name: "Rajesh Patil",    location: "Gangapur Road, Nashik",      type: "Illegal Construction", date: "12 Jan 2025", status: "New"          },
  { id: "CMP-2025-0039", name: "Sunita Deshmukh", location: "Godavari Floodplain, Nashik", type: "Encroachment",        date: "10 Jan 2025", status: "Under Review"  },
  { id: "CMP-2025-0037", name: "Amol Shinde",     location: "Anjaneri Hill Reserve",       type: "Zoning Violation",    date: "08 Jan 2025", status: "Under Review"  },
  { id: "CMP-2025-0034", name: "Priya Kulkarni",  location: "Trimbakeshwar Foothills",     type: "Building Safety",     date: "05 Jan 2025", status: "Action Taken"  },
] as const;

const STATUS_CFG = {
  "New":          { bg:"rgba(99,102,241,0.10)",  border:"rgba(99,102,241,0.30)",  text:"#a5b4fc", dot:"#818cf8" },
  "Under Review": { bg:"rgba(251,191,36,0.10)",  border:"rgba(251,191,36,0.30)",  text:"#fbbf24", dot:"#fbbf24" },
  "Action Taken": { bg:"rgba(251,146,60,0.10)",  border:"rgba(251,146,60,0.30)",  text:"#fb923c", dot:"#fb923c" },
  "Closed":       { bg:"rgba(52,211,153,0.10)",  border:"rgba(52,211,153,0.30)",  text:"#34d399", dot:"#34d399" },
} as const;

/* build encroachment GeoJSON */
function buildEncroachGeoJSON(highlightId?: string) {
  const features = MUNICIPAL_ALERTS.map((alert) => {
    const aoi = NASHIK_AOIS.find((a) => a.id === alert.aoiId);
    if (!aoi?.geometry) return null;
    return { type:"Feature" as const, properties:{ id:alert.id, isHighlighted: alert.id === highlightId }, geometry: aoi.geometry };
  }).filter(Boolean);
  return { type:"FeatureCollection" as const, features: features as NonNullable<typeof features[0]>[] };
}

/* ── feature ids ─────────────────────────────────────────────────────────── */
type FeatureId = "district-map" | "encroachment" | "case-detail" | "complaints";
/* ═══════════════════════════════════════════════════════════════════════════ */
function CommandOverviewPage() {
  const navigate = useNavigate();

  /* which feature is shown below the hero; "district-map" = default on first load */
  const [activeFeature, setActiveFeature] = useState<FeatureId>("district-map");
  const featureSectionRef = useRef<HTMLDivElement>(null);

  /* district-map state */
  const districtMapRef = useRef<{ flyTo: (o: object) => void } | null>(null);
  const [mapLayer,      setMapLayer]      = useState<"satellite"|"heatmap"|"zoning">("satellite");
  const [hoveredId,     setHoveredId]     = useState<string | null>(null);
  const [selectedAoi,   setSelectedAoi]   = useState<MunicipalAOI | null>(null);

  /* encroachment state */
  const encMapRef    = useRef<{ flyTo: (o: object) => void } | null>(null);
  const [reviewState, setReviewState] = useState<Record<string, "pending"|"reviewed"|"flagged">>(() =>
    Object.fromEntries(MUNICIPAL_ALERTS.map((a) => [a.id, "pending"])),
  );
  const [selectedAlert, setSelectedAlert] = useState(MUNICIPAL_ALERTS[0]!);

  /* case-detail state */
  const YEARS = [2021,2022,2023,2024,2025] as const;
  type Year = typeof YEARS[number];
  const [caseYear,   setCaseYear]  = useState<Year>(2025);
  const [caseState,  setCaseState] = useState<"pending"|"reviewed"|"flagged">("pending");

  const YEAR_STAGE: Record<Year, { label:string; color:string }> = {
    2021:{ label:"Pristine",         color:"#34d399" },
    2022:{ label:"Early Activity",   color:"#86efac" },
    2023:{ label:"Emerging",         color:"#fbbf24" },
    2024:{ label:"Active Incursion", color:"#fb923c" },
    2025:{ label:"Critical",         color:"#f87171" },
  };
  const YEAR_STATS: Record<Year,{buildings:number;area:string;change:string}> = {
    2021:{ buildings:142, area:"5,200",  change:"Baseline"  },
    2022:{ buildings:154, area:"7,400",  change:"+8.4 %"    },
    2023:{ buildings:167, area:"10,800", change:"+17.6 %"   },
    2024:{ buildings:181, area:"14,600", change:"+27.4 %"   },
    2025:{ buildings:194, area:"18,500", change:"+36.6 %"   },
  };

  /* ── listen for sidebar selections broadcast via custom event ───────── */
  useEffect(() => {
    const handler = (e: Event) => {
      const { featureId } = (e as CustomEvent<{ featureId: string }>).detail;
      if (featureId === "overview") {
        setActiveFeature("district-map");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setActiveFeature(featureId as FeatureId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("municipal-feature-select", handler);
    return () => window.removeEventListener("municipal-feature-select", handler);
  }, []);

  const handleMarkerClick = useCallback((aoi: MunicipalAOI) => {
    setSelectedAoi(aoi);
    districtMapRef.current?.flyTo({ center:[aoi.coords.lng, aoi.coords.lat], zoom:13.5, speed:0.9, curve:1.4 });
  }, []);

  const handleCloseAoi = useCallback(() => {
    setSelectedAoi(null);
    districtMapRef.current?.flyTo({ center:[NASHIK_CENTER.longitude, NASHIK_CENTER.latitude], zoom:NASHIK_CENTER.zoom, speed:0.6 });
  }, []);

  const markReviewed = (id: string) => setReviewState((p) => ({ ...p, [id]: "reviewed" }));
  const flagAction   = (id: string) => setReviewState((p) => ({ ...p, [id]: "flagged" }));

  const encroachGeoJSON = buildEncroachGeoJSON(selectedAlert.id);
  const focusAoi = NASHIK_AOIS.find((a) => a.id === selectedAlert.aoiId);
  const encMapCenter = focusAoi
    ? { longitude: focusAoi.coords.lng, latitude: focusAoi.coords.lat, zoom: 12.5 }
    : { longitude: 73.72, latitude: 20.00, zoom: 11 };

  /* section label map */
  const SECTION_LABELS: Record<FeatureId, string> = {
    "district-map":  "── DISTRICT MAP",
    "encroachment":  "── ENCROACHMENT WATCH",
    "case-detail":   "── CASE DETAIL",
    "complaints":    "── CITIZEN COMPLAINTS",
  };
  const SECTION_H2: Record<FeatureId, string> = {
    "district-map":  "Nashik District Map",
    "encroachment":  "Detected Encroachment Flags",
    "case-detail":   "Satellite Evidence & Year Timeline",
    "complaints":    "Citizen Complaint Queue",
  };

  return (
    <>
      <style>{`
        @keyframes aoi-pulse {
          0%   { transform:scale(1);   opacity:0.9; }
          70%  { transform:scale(2.6); opacity:0;   }
          100% { transform:scale(2.6); opacity:0;   }
        }
        .aoi-pulse-ring {
          position:absolute; inset:-4px; border-radius:50%;
          animation:aoi-pulse 2.4s ease-out infinite;
          pointer-events:none;
        }
      `}</style>

      {/* ── page wrapper — matches cs-page pattern exactly ─────────────── */}
      <div
        style={{
          position:"relative",
          width:"100%",
          minHeight:"100vh",
          marginTop:-68,
          paddingTop:68,
          overflowX:"hidden",
          color:"#e2e8f0",
          fontFamily:"var(--font-sans,'Manrope',sans-serif)",
        }}
      >
        {/* citizen-bg-new.jpg — same as Citizen & Builder dashboards */}
        <div
          style={{
            position:"absolute",
            top:0, left:0, right:0, bottom:0,
            backgroundImage:"url('/citizen-bg-new.jpg')",
            backgroundSize:"cover",
            backgroundPosition:"center top",
            opacity:0.25,
            zIndex:-1,
            pointerEvents:"none",
          }}
        />

        {/* ── HERO — visible only on first load (district-map is active) ─── */}
        <AnimatePresence mode="wait">
          {activeFeature === "district-map" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <HeroSearch
                onSearch={() => {}}
                onDropPin={() => {}}
                mode="citizen"
                badgeText="AI GIS PLATFORM · NASHIK MUNICIPAL CORPORATION"
                titlePrefix="Municipal"
                titleSuffix="Intelligence"
                subtitle="Monitor urban development, zoning compliance, protected zones and satellite-detected encroachments across Nashik."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FEATURE SECTION — always present, swaps on sidebar click ───── */}
        <AnimatePresence mode="wait">
          {activeFeature && (
            <motion.div
              ref={featureSectionRef}
              key={activeFeature}
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-12 }}
              transition={{ duration:0.38, ease:[0.16,1,0.3,1] }}
              style={{
                maxWidth:1280,
                margin:"0 auto",
                padding:"24px 24px 80px",
              }}
            >
              {/* section header */}
              <div style={{ marginBottom:28 }}>
                <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#22d3ee", marginBottom:6 }}>
                  {SECTION_LABELS[activeFeature]}
                </div>
                <h2 style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"clamp(1.6rem,3vw,2.1rem)", fontWeight:700, color:"#f1f5f9", letterSpacing:"-0.02em", margin:0 }}>
                  {SECTION_H2[activeFeature]}
                </h2>
              </div>

              {/* ══ DISTRICT MAP ═══════════════════════════════════════════ */}
              {activeFeature === "district-map" && (
                <motion.div whileHover={{ boxShadow:"0 12px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.15)" }} style={{ ...PANEL, overflow:"hidden", position:"relative" }}>
                  {/* layer toggles */}
                  <div style={{ position:"absolute", top:14, left:14, zIndex:10, display:"flex", gap:8, flexWrap:"wrap" }}>
                    {LAYER_TOGGLES.map((l) => (
                      <button key={l.id} type="button" onClick={() => setMapLayer(l.id)}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:999, cursor:"pointer", backdropFilter:"blur(12px)", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.72rem", letterSpacing:"0.04em", border: mapLayer===l.id?"1px solid rgba(34,211,238,0.5)":"1px solid rgba(255,255,255,0.1)", background: mapLayer===l.id?"rgba(34,211,238,0.15)":"rgba(10,16,34,0.75)", color: mapLayer===l.id?"#22d3ee":"#94a3b8", fontWeight: mapLayer===l.id?700:500, boxShadow: mapLayer===l.id?"0 0 14px rgba(34,211,238,0.18)":"none" }}>
                        {l.icon}{l.label}
                      </button>
                    ))}
                  </div>

                  {/* map */}
                  <div style={{ height:520, position:"relative" }}>
                    <Map ref={districtMapRef as React.Ref<unknown>} initialViewState={NASHIK_CENTER}
                      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      style={{ width:"100%", height:"100%" }} attributionControl={false}>
                      <NavigationControl position="bottom-right" style={{ marginBottom:40 }} />
                      <Source id="dist-bnd" type="geojson" data={DISTRICT_BOUNDARY}>
                        <Layer id="dist-bnd-line" type="line" paint={{ "line-color":"#22d3ee","line-width":2,"line-dasharray":[4,3],"line-opacity":0.55 }} />
                      </Source>
                      {NASHIK_AOIS.map((aoi) => {
                        const col=STATUS_COLORS[aoi.status]; const pulse=aoi.status!=="green";
                        const isHov=hoveredId===aoi.id; const isSel=selectedAoi?.id===aoi.id;
                        return (
                          <Marker key={aoi.id} longitude={aoi.coords.lng} latitude={aoi.coords.lat} anchor="center">
                            <button type="button" title={aoi.name}
                              onMouseEnter={() => setHoveredId(aoi.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              onClick={() => handleMarkerClick(aoi)}
                              style={{ position:"relative", width:isSel?18:isHov?15:11, height:isSel?18:isHov?15:11, borderRadius:"50%", background:col.stroke, border:`2px solid ${isSel?"#fff":col.stroke}`, boxShadow:`0 0 ${isSel?18:8}px ${col.glow}`, cursor:"pointer", transition:"all 0.2s", padding:0, outline:"none", flexShrink:0 }}>
                              {pulse && <span className="aoi-pulse-ring" style={{ background:PULSE_COLOR[aoi.status] }} />}
                              {isHov && !isSel && (
                                <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:"50%", transform:"translateX(-50%)", whiteSpace:"nowrap", background:"rgba(10,16,34,0.92)", border:"1px solid rgba(34,211,238,0.25)", borderRadius:8, padding:"4px 10px", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:11, color:"#e2e8f0", pointerEvents:"none", backdropFilter:"blur(12px)", zIndex:20 }}>
                                  {aoi.name}
                                </div>
                              )}
                            </button>
                          </Marker>
                        );
                      })}
                    </Map>

                    {/* AOI popup */}
                    <AnimatePresence>
                      {selectedAoi && (
                        <motion.div key="aoi-popup" initial={{ opacity:0, scale:0.94, y:8 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.94 }} transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
                          style={{ position:"absolute", top:14, right:14, zIndex:20, width:260, background:"rgba(10,16,34,0.92)", border:`1px solid ${STATUS_COLORS[selectedAoi.status].stroke}40`, borderRadius:16, backdropFilter:"blur(28px)", boxShadow:"0 8px 40px rgba(0,0,0,0.55)", overflow:"hidden" }}>
                          <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <MapPin size={13} color={STATUS_COLORS[selectedAoi.status].stroke} />
                              <div>
                                <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.78rem", fontWeight:700, color:"#f1f5f9" }}>{selectedAoi.name}</div>
                                <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.58rem", color:STATUS_COLORS[selectedAoi.status].stroke, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:2 }}>{STATUS_COLORS[selectedAoi.status].label}</div>
                              </div>
                            </div>
                            <button type="button" onClick={handleCloseAoi} style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", padding:2 }}><X size={14} /></button>
                          </div>
                          <div style={{ padding:"8px 14px 6px" }}>
                            {([["Lat",`${selectedAoi.coords.lat.toFixed(4)}° N`],["Lng",`${selectedAoi.coords.lng.toFixed(4)}° E`],["Village",selectedAoi.village],["Built-Up",`${selectedAoi.estimatedConstructionAreaSqM.toLocaleString()} m²`]] as [string,string][]).map(([l,v]) => (
                              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                                <span style={{ fontSize:"0.65rem", color:"#475569", fontFamily:"var(--font-sans,'Manrope',sans-serif)" }}>{l}</span>
                                <span style={{ fontSize:"0.65rem", color:"#cbd5e1", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontWeight:600 }}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ padding:"8px 14px 12px", display:"flex", gap:8 }}>
                            <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                              onClick={() => setActiveFeature("case-detail")}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, background:"linear-gradient(135deg,#06b6d4,#3b82f6)", border:"none", cursor:"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", fontWeight:700, color:"#fff" }}>
                              Case Detail
                            </motion.button>
                            <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                              onClick={() => setActiveFeature("encroachment")}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)", cursor:"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", fontWeight:700, color:"#f87171" }}>
                              Encroachment
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* status bar */}
                  <div style={{ padding:"9px 18px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(8,13,28,0.6)", display:"flex", gap:18, flexWrap:"wrap", alignItems:"center", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", color:"#475569" }}>
                    <span style={{ color:"#22d3ee", fontWeight:700 }}>NASHIK DISTRICT</span>
                    <span style={{ color:"rgba(255,255,255,0.08)" }}>|</span>
                    <span>Sentinel-2 · 10m resolution</span>
                    <span style={{ color:"rgba(255,255,255,0.08)" }}>|</span>
                    <span>Last update: Jan 2025</span>
                    {(["red","yellow","green"] as const).map((s) => {
                      const col=STATUS_COLORS[s];
                      return (
                        <div key={s} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:col.stroke }} />
                          <span style={{ color:col.stroke, fontWeight:700 }}>{AOI_COUNTS[s]}</span>
                          <span>{col.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ══ ENCROACHMENT WATCH ═════════════════════════════════════ */}
              {activeFeature === "encroachment" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* map */}
                  <motion.div whileHover={{ boxShadow:"0 12px 60px rgba(0,0,0,0.6)" }} style={{ ...PANEL, overflow:"hidden", height:360, position:"relative" }}>
                    <Map ref={encMapRef as React.Ref<unknown>} key={selectedAlert.id}
                      initialViewState={encMapCenter}
                      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      style={{ width:"100%", height:"100%" }} attributionControl={false}>
                      <NavigationControl position="bottom-right" style={{ marginBottom:8 }} />
                      <Source id="enc-poly" type="geojson" data={encroachGeoJSON}>
                        <Layer id="enc-fill" type="fill" paint={{ "fill-color":["case",["get","isHighlighted"],"rgba(239,68,68,0.35)","rgba(239,68,68,0.15)"],"fill-outline-color":"transparent" }} />
                        <Layer id="enc-stroke" type="line" paint={{ "line-color":"#f87171","line-width":["case",["get","isHighlighted"],2.5,1.5],"line-opacity":["case",["get","isHighlighted"],1,0.6],"line-dasharray":[4,2] }} />
                      </Source>
                      {MUNICIPAL_ALERTS.map((alert) => {
                        const aoi=NASHIK_AOIS.find((a) => a.id===alert.aoiId); if (!aoi) return null;
                        const isSel=alert.id===selectedAlert.id;
                        return (
                          <Marker key={alert.id} longitude={aoi.coords.lng} latitude={aoi.coords.lat} anchor="center">
                            <button type="button" onClick={() => setSelectedAlert(alert)}
                              style={{ width:isSel?20:13, height:isSel?20:13, borderRadius:"50%", background:isSel?"#ef4444":"rgba(239,68,68,0.7)", border:`2px solid ${isSel?"#fff":"#f87171"}`, boxShadow:`0 0 ${isSel?18:8}px rgba(239,68,68,0.6)`, cursor:"pointer", padding:0, outline:"none", transition:"all 0.2s" }} />
                          </Marker>
                        );
                      })}
                    </Map>
                    <div style={{ position:"absolute", top:12, left:14, zIndex:10, ...PANEL, borderRadius:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:8 }}>
                      <ShieldAlert size={13} color="#f87171" />
                      <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.65rem", color:"#f87171", letterSpacing:"0.08em" }}>LIVE ENCROACHMENT OVERLAY · {MUNICIPAL_ALERTS.length} FLAGS</span>
                    </div>
                  </motion.div>

                  {/* alert cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
                    {MUNICIPAL_ALERTS.map((alert) => {
                      const isSel=alert.id===selectedAlert.id;
                      const state=reviewState[alert.id]??"pending";
                      const sc=stateColors[state];
                      const isHigh=alert.severity==="HIGH";
                      return (
                        <motion.div key={alert.id} whileHover={{ y:-2, boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }} onClick={() => setSelectedAlert(alert)}
                          style={{ ...PANEL, borderRadius:16, padding:"18px", cursor:"pointer", background:isSel?"rgba(34,211,238,0.06)":state==="flagged"?"rgba(251,146,60,0.06)":"rgba(10,16,34,0.72)", border:isSel?"1px solid rgba(34,211,238,0.35)":state==="flagged"?"1px solid rgba(251,146,60,0.35)":"1px solid rgba(34,211,238,0.10)", display:"flex", flexDirection:"column", gap:12, transition:"all 0.2s" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ padding:"3px 10px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", background:isHigh?"rgba(239,68,68,0.15)":"rgba(251,191,36,0.15)", border:isHigh?"1px solid rgba(239,68,68,0.3)":"1px solid rgba(251,191,36,0.3)", color:isHigh?"#f87171":"#fbbf24" }}>{alert.severity}</span>
                            <span style={{ padding:"3px 10px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.text }}>{sc.label}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                            <AlertTriangle size={14} color={isHigh?"#f87171":"#fbbf24"} style={{ marginTop:2, flexShrink:0 }} />
                            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.82rem", fontWeight:600, color:"#e2e8f0", lineHeight:1.35 }}>{alert.title}</span>
                          </div>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                              <MapPin size={11} color="#22d3ee" />
                              <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.72rem", color:"#64748b" }}>{alert.location}</span>
                            </div>
                            <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", color:"#475569" }}>{alert.detectedYear} · {alert.affectedAreaSqM.toLocaleString()} m²</span>
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:4 }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); markReviewed(alert.id); }} disabled={state==="reviewed"}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, border:"1px solid rgba(52,211,153,0.3)", background:state==="reviewed"?"rgba(52,211,153,0.12)":"rgba(52,211,153,0.06)", color:"#34d399", cursor:state==="reviewed"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:state==="reviewed"?0.7:1 }}>
                              <CheckCircle2 size={11} />{state==="reviewed"?"Reviewed":"Review"}
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); flagAction(alert.id); }} disabled={state==="flagged"}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, border:"1px solid rgba(251,146,60,0.3)", background:state==="flagged"?"rgba(251,146,60,0.14)":"rgba(251,146,60,0.06)", color:"#fb923c", cursor:state==="flagged"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:state==="flagged"?0.7:1 }}>
                              <Flag size={11} />{state==="flagged"?"Flagged":"Flag"}
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); navigate({ to:"/municipal/encroachment" }); }}
                              style={{ padding:"7px 10px", borderRadius:9, border:"1px solid rgba(34,211,238,0.2)", background:"rgba(34,211,238,0.06)", color:"#22d3ee", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ CASE DETAIL ════════════════════════════════════════════ */}
              {activeFeature === "case-detail" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* year cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12 }}>
                    {YEARS.map((yr) => {
                      const st=YEAR_STAGE[yr]; const s=YEAR_STATS[yr];
                      const isActive=yr===caseYear;
                      return (
                        <motion.div key={yr} whileHover={{ scale:1.02 }} onClick={() => setCaseYear(yr)}
                          style={{ ...PANEL, borderRadius:14, padding:"18px", cursor:"pointer", background:isActive?`${st.color}08`:"rgba(10,16,34,0.72)", border:isActive?`1px solid ${st.color}40`:"1px solid rgba(34,211,238,0.10)", display:"flex", flexDirection:"column", gap:10, transition:"all 0.2s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ width:10, height:10, borderRadius:"50%", background:st.color, boxShadow:`0 0 10px ${st.color}80` }} />
                              <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"1rem", fontWeight:700, color:st.color }}>{yr}</span>
                            </div>
                            <span style={{ padding:"2px 8px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.58rem", fontWeight:700, background:`${st.color}14`, border:`1px solid ${st.color}30`, color:st.color }}>{st.label}</span>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                            {([["Buildings",String(s.buildings)],["Built-Up",`${s.area} m²`],["Change",s.change]] as [string,string][]).map(([l,v]) => (
                              <div key={l} style={{ display:"flex", justifyContent:"space-between" }}>
                                <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.68rem", color:"#475569" }}>{l}</span>
                                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", fontWeight:600, color: l==="Change"&&yr>2021?"#f87171":l==="Change"?"#34d399":"#cbd5e1" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ height:3, borderRadius:999, background:"rgba(255,255,255,0.05)" }}>
                            <div style={{ height:"100%", width:`${((yr-2021)/4)*100}%`, background:`linear-gradient(90deg,#10b981,${st.color})`, borderRadius:999, transition:"width 0.4s" }} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* GPS / AOI info + case actions */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:16 }}>
                    {/* GPS card */}
                    <div style={{ ...PANEL, borderRadius:16, padding:"20px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        <MapPin size={14} color="#22d3ee" />
                        <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.85rem", fontWeight:700, color:"#f1f5f9" }}>GPS / AOI Information</span>
                      </div>
                      {([["AOI Name","Gangapur Road"],["Latitude","20.0124° N"],["Longitude","73.7548° E"],["Village","Gangapur"],["Taluka","Nashik"],["District","Nashik"],["Est. Built-Up","18,500 m²"],["Detection Status","Potential Encroachment"],["Case ID","UC-2025-0894"]] as [string,string][]).map(([l,v]) => (
                        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.03)", alignItems:"center" }}>
                          <span style={{ fontSize:"0.68rem", color:"#475569", fontFamily:"var(--font-sans,'Manrope',sans-serif)" }}>{l}</span>
                          <span style={{ fontSize:"0.7rem", color:"#cbd5e1", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontWeight:600, textAlign:"right" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* case actions card */}
                    <div style={{ ...PANEL, borderRadius:16, padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        <Satellite size={14} color="#22d3ee" />
                        <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.85rem", fontWeight:700, color:"#f1f5f9" }}>Case Actions</span>
                      </div>

                      {/* current state badge */}
                      <AnimatePresence mode="wait">
                        <motion.div key={caseState} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                          style={{ padding:"8px 12px", borderRadius:10, background:stateColors[caseState].bg, border:`1px solid ${stateColors[caseState].border}`, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", fontWeight:700, color:stateColors[caseState].text, textAlign:"center" }}>
                          {stateColors[caseState].label}
                        </motion.div>
                      </AnimatePresence>

                      {/* selected year summary */}
                      <div style={{ padding:"12px", borderRadius:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                          <span style={{ width:8, height:8, borderRadius:"50%", background:YEAR_STAGE[caseYear].color, boxShadow:`0 0 8px ${YEAR_STAGE[caseYear].color}80` }} />
                          <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.78rem", fontWeight:700, color:YEAR_STAGE[caseYear].color }}>{caseYear} — {YEAR_STAGE[caseYear].label}</span>
                        </div>
                        <div style={{ height:4, borderRadius:999, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                          <motion.div key={caseYear} initial={{ width:0 }} animate={{ width:`${((caseYear-2021)/4)*100}%` }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
                            style={{ height:"100%", background:"linear-gradient(90deg,#10b981,#fbbf24,#ef4444)", borderRadius:999 }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.58rem", color:"#475569" }}>
                          <span>2021 Baseline</span><span style={{ color:YEAR_STAGE[caseYear].color }}>{YEAR_STATS[caseYear].change}</span><span style={{ color:"#f87171", fontWeight:700 }}>Critical 2025</span>
                        </div>
                      </div>

                      {/* action buttons */}
                      <div style={{ display:"flex", gap:10 }}>
                        <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} disabled={caseState==="reviewed"} onClick={() => setCaseState("reviewed")}
                          style={{ flex:1, padding:"11px 0", borderRadius:11, border:"1px solid rgba(52,211,153,0.35)", background:caseState==="reviewed"?"rgba(52,211,153,0.14)":"rgba(52,211,153,0.07)", color:"#34d399", cursor:caseState==="reviewed"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:caseState==="reviewed"?0.7:1, transition:"all 0.2s" }}>
                          <CheckCircle2 size={14} />{caseState==="reviewed"?"Reviewed ✓":"Mark Reviewed"}
                        </motion.button>
                        <motion.button type="button" whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} disabled={caseState==="flagged"} onClick={() => setCaseState("flagged")}
                          style={{ flex:1, padding:"11px 0", borderRadius:11, border:"1px solid rgba(251,146,60,0.35)", background:caseState==="flagged"?"rgba(251,146,60,0.14)":"rgba(251,146,60,0.07)", color:"#fb923c", cursor:caseState==="flagged"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:6, opacity:caseState==="flagged"?0.7:1, transition:"all 0.2s" }}>
                          <Flag size={14} />{caseState==="flagged"?"Flagged":"Flag for Action"}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ CITIZEN COMPLAINTS ═════════════════════════════════════ */}
              {activeFeature === "complaints" && (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {PREVIEW_COMPLAINTS.map((c, i) => {
                    const scfg=STATUS_CFG[c.status];
                    return (
                      <motion.div key={c.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:i*0.06 }} whileHover={{ x:4 }} onClick={() => navigate({ to:"/municipal/complaints" })}
                        style={{ ...PANEL, borderRadius:14, padding:"16px 20px", cursor:"pointer", display:"grid", gridTemplateColumns:"1fr auto", gap:"8px 20px", alignItems:"center" }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                            <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.65rem", fontWeight:700, color:"#22d3ee" }}>{c.id}</span>
                            <span style={{ padding:"2px 8px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.58rem", fontWeight:700, background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.22)", color:"#f87171" }}>{c.type}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}><User size={11} color="#475569" /><span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.75rem", fontWeight:600, color:"#cbd5e1" }}>{c.name}</span></div>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}><MapPin size={10} color="#22d3ee" /><span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.7rem", color:"#64748b" }}>{c.location}</span></div>
                            <div style={{ display:"flex", alignItems:"center", gap:5 }}><Clock size={10} color="#475569" /><span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", color:"#475569" }}>{c.date}</span></div>
                          </div>
                        </div>
                        <span style={{ padding:"4px 12px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", fontWeight:700, background:scfg.bg, border:`1px solid ${scfg.border}`, color:scfg.text, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:5 }}>
                          <span style={{ width:5, height:5, borderRadius:"50%", background:scfg.dot }} />{c.status}
                        </span>
                      </motion.div>
                    );
                  })}
                  <motion.button type="button" whileHover={{ scale:1.02 }} onClick={() => navigate({ to:"/municipal/complaints" })}
                    style={{ alignSelf:"center", marginTop:8, display:"flex", alignItems:"center", gap:6, padding:"10px 24px", borderRadius:10, background:"rgba(34,211,238,0.08)", border:"1px solid rgba(34,211,238,0.25)", cursor:"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.72rem", fontWeight:700, color:"#22d3ee" }}>
                    View All Complaints <ArrowRight size={13} />
                  </motion.button>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
