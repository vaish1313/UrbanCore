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
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, X, ArrowRight, ChevronRight, ChevronDown, ChevronUp, Eye,
  ShieldAlert, AlertTriangle, CheckCircle2, Flag,
  Satellite, Layers, Clock, User, MessageSquare, AlertCircle, Loader2, RefreshCw
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { HeroSearch } from "@/components/urbancore/citizen/HeroSearch";
import { NASHIK_AOIS, STATUS_COLORS, AOI_COUNTS } from "@/data/nashikAois";
import type { MunicipalAOI } from "@/data/nashikAois";
import { useMunicipalCases, useUpdateCaseStatus, useMunicipalComplaints } from "@/hooks/use-municipal";
import { MUNICIPAL_FEATURE_MENU } from "@/components/urbancore/role/roleFeatureMenus";
import type { MunicipalCase, MunicipalComplaint } from "@/types/urbancore";
import { getComplaintStatusMeta, isValidComplaintCoordinate } from "@/utils/complaintMapUtils";
import { ComplaintDetailModal } from "@/components/urbancore/municipal/ComplaintDetailModal";

export const Route = createFileRoute("/municipal/")({
  head: () => ({ meta: [{ title: "Nashik District Map — Municipal Authority" }] }),
  component: CommandOverviewPage,
});

const TYPE_CONFIG: Record<string, string> = {
  "Illegal Construction": "#f87171",
  "Encroachment":         "#fb923c",
  "Building Safety":      "#fbbf24",
  "Zoning Violation":     "#c084fc",
  "Road Obstruction":     "#38bdf8",
  "Demolition Request":   "#94a3b8",
};

/* ── constants ──────────────────────────────────────────────────────────── */
const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const NASHIK_CENTER = { longitude: 73.82, latitude: 20.01, zoom: 10.4 };

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
  { id: "satellite" as const, label: "Satellite View", icon: <Satellite size={12} /> },
  { id: "boundary"  as const, label: "District Boundary", icon: <Layers size={12} /> },
];

/* review state helpers */
const stateColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  pending:  { bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.3)", text: "#94a3b8", label: "Pending" },
  reviewed: { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.35)", text: "#34d399", label: "Reviewed ✓" },
  flagged:  { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.35)", text: "#fb923c", label: "Action Required" },
};

const STATUS_CFG = {
  "New":          { bg:"rgba(99,102,241,0.10)",  border:"rgba(99,102,241,0.30)",  text:"#a5b4fc", dot:"#818cf8" },
  "Under Review": { bg:"rgba(251,191,36,0.10)",  border:"rgba(251,191,36,0.30)",  text:"#fbbf24", dot:"#fbbf24" },
  "Action Taken": { bg:"rgba(251,146,60,0.10)",  border:"rgba(251,146,60,0.30)",  text:"#fb923c", dot:"#fb923c" },
  "Closed":       { bg:"rgba(52,211,153,0.10)",  border:"rgba(52,211,153,0.30)",  text:"#34d399", dot:"#34d399" },
} as const;

/* build encroachment GeoJSON */
function buildEncroachGeoJSON(cases: MunicipalCase[], highlightId?: string) {
  const features = cases.map((c) => {
    if (!c.geometry) return null;
    return { type:"Feature" as const, properties:{ id:c.id, isHighlighted: c.id === highlightId }, geometry: c.geometry };
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

  /* district-map (complaints monitoring) state */
  const districtMapRef = useRef<{ flyTo: (o: object) => void } | null>(null);
  const [showBoundary, setShowBoundary] = useState(true);
  const [hoveredComplaintId, setHoveredComplaintId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<MunicipalComplaint | null>(null);
  const [isComplaintsExpanded, setIsComplaintsExpanded] = useState(false);
  const [selectedModalComplaint, setSelectedModalComplaint] = useState<MunicipalComplaint | null>(null);

  /* data hooks */
  const { data: casesData } = useMunicipalCases();
  const cases = casesData?.cases || [];
  const updateCaseStatus = useUpdateCaseStatus();
  
  // Fetch up to 100 complaints starting at offset 0 so none are hidden by pagination
  const { 
    data: complaintsData, 
    isLoading: isComplaintsLoading, 
    isError: isComplaintsError,
    refetch: refetchComplaints 
  } = useMunicipalComplaints(100, 0);
  
  const rawComplaints = complaintsData?.complaints || [];

  const activeComplaint = selectedComplaint
    ? rawComplaints.find(
        (c) => c.id === selectedComplaint.id || c.reference_number === selectedComplaint.reference_number
      ) || selectedComplaint
    : null;

  // Filter valid coordinates vs omitted coordinates
  const { validComplaints, omittedCount, statusCounts } = useMemo(() => {
    const valid: MunicipalComplaint[] = [];
    let omitted = 0;
    const counts = { total: rawComplaints.length, newCount: 0, underReviewCount: 0, actionTakenCount: 0, closedCount: 0 };

    for (const c of rawComplaints) {
      const meta = getComplaintStatusMeta(c.status);
      if (meta.category === "new") counts.newCount++;
      else if (meta.category === "under_review") counts.underReviewCount++;
      else if (meta.category === "action_taken") counts.actionTakenCount++;
      else if (meta.category === "closed") counts.closedCount++;

      if (isValidComplaintCoordinate(c.latitude, c.longitude)) {
        valid.push(c);
      } else {
        omitted++;
      }
    }

    return { validComplaints: valid, omittedCount: omitted, statusCounts: counts };
  }, [rawComplaints]);

  /* encroachment state */
  const encMapRef    = useRef<{ flyTo: (o: object) => void } | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

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
      if (featureId === "case-detail") {
        navigate({ to: "/municipal/case-detail" });
        return;
      }
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
  }, [navigate]);

  const handleComplaintMarkerClick = useCallback((complaint: MunicipalComplaint) => {
    setSelectedComplaint(complaint);
    if (complaint.latitude && complaint.longitude) {
      districtMapRef.current?.flyTo({
        center: [complaint.longitude, complaint.latitude],
        zoom: 14.5,
        speed: 1.0,
        curve: 1.4,
      });
    }
  }, []);

  const handleCloseComplaintPopup = useCallback(() => {
    setSelectedComplaint(null);
  }, []);

  const handleUpdateCaseStatus = (id: string, newStatus: string) => {
    updateCaseStatus.mutate({ caseId: id, status: newStatus });
  };

  const encroachGeoJSON = buildEncroachGeoJSON(cases, selectedCase?.id);
  const encMapCenter = selectedCase && selectedCase.latitude && selectedCase.longitude
    ? { longitude: selectedCase.longitude, latitude: selectedCase.latitude, zoom: 12.5 }
    : { longitude: 73.72, latitude: 20.00, zoom: 11 };

  /* section label map */
  const SECTION_LABELS: Record<FeatureId, string> = {
    "district-map":  "── CITIZEN COMPLAINT MAP",
    "encroachment":  "── ENCROACHMENT WATCH",
    "case-detail":   "── CASE DETAIL",
    "complaints":    "── CITIZEN COMPLAINTS",
  };
  const SECTION_H2: Record<FeatureId, string> = {
    "district-map":  "Live Citizen Complaints Map",
    "encroachment":  "Detected Encroachment Flags",
    "case-detail":   "Satellite Evidence & Year Timeline",
    "complaints":    "Citizen Complaint Queue",
  };

  return (
    <>
      <style>{`
        @keyframes complaint-pulse {
          0%   { transform:scale(1);   opacity:0.9; }
          70%  { transform:scale(2.6); opacity:0;   }
          100% { transform:scale(2.6); opacity:0;   }
        }
        .complaint-pulse-ring {
          position:absolute; inset:-4px; border-radius:50%;
          animation:complaint-pulse 2.2s ease-out infinite;
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
                badgeText="CITIZEN COMPLAINT MONITORING · NASHIK MUNICIPAL CORPORATION"
                titlePrefix="Municipal"
                titleSuffix="Intelligence"
                subtitle="Live spatial map of citizen-submitted complaints across Nashik with review tracking and geographic coordination."
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

              {/* ══ LIVE CITIZEN COMPLAINT MAP ════════════════════════════════ */}
              {activeFeature === "district-map" && (
                <motion.div whileHover={{ boxShadow:"0 12px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.15)" }} style={{ ...PANEL, overflow:"hidden", position:"relative" }}>
                  {/* Top-left controls & summary badges */}
                  <div style={{ position:"absolute", top:14, left:14, zIndex:10, display:"flex", gap:8, flexWrap:"wrap", maxWidth:"calc(100% - 28px)" }}>
                    {/* Boundary toggle */}
                    <button 
                      type="button" 
                      onClick={() => setShowBoundary(!showBoundary)}
                      style={{ 
                        display:"flex", 
                        alignItems:"center", 
                        gap:6, 
                        padding:"6px 14px", 
                        borderRadius:999, 
                        cursor:"pointer", 
                        backdropFilter:"blur(12px)", 
                        fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", 
                        fontSize:"0.72rem", 
                        letterSpacing:"0.04em", 
                        border: showBoundary ? "1px solid rgba(34,211,238,0.5)" : "1px solid rgba(255,255,255,0.1)", 
                        background: showBoundary ? "rgba(34,211,238,0.15)" : "rgba(10,16,34,0.75)", 
                        color: showBoundary ? "#22d3ee" : "#94a3b8", 
                        fontWeight: showBoundary ? 700 : 500, 
                        boxShadow: showBoundary ? "0 0 14px rgba(34,211,238,0.18)" : "none" 
                      }}
                    >
                      <Layers size={12} /> {showBoundary ? "Hide District Boundary" : "Show District Boundary"}
                    </button>

                    <button 
                      type="button" 
                      onClick={() => refetchComplaints()}
                      title="Refresh complaints from database"
                      style={{ 
                        display:"flex", 
                        alignItems:"center", 
                        gap:6, 
                        padding:"6px 12px", 
                        borderRadius:999, 
                        cursor:"pointer", 
                        backdropFilter:"blur(12px)", 
                        fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", 
                        fontSize:"0.72rem", 
                        border: "1px solid rgba(255,255,255,0.15)", 
                        background: "rgba(10,16,34,0.75)", 
                        color: "#94a3b8" 
                      }}
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {/* Top-right Status Legend */}
                  <div 
                    style={{ 
                      position:"absolute", 
                      top:14, 
                      right:14, 
                      zIndex:10, 
                      ...PANEL, 
                      borderRadius:14, 
                      padding:"10px 14px", 
                      display:"flex", 
                      flexDirection:"column", 
                      gap:6,
                      background:"rgba(10,16,34,0.90)",
                      border:"1px solid rgba(34,211,238,0.2)"
                    }}
                  >
                    <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", letterSpacing:"0.12em", textTransform:"uppercase", color:"#22d3ee", fontWeight:700 }}>
                      Live Status Legend
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 8px", alignItems:"center", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.66rem" }}>
                      <span style={{ width:10, height:10, borderRadius:"50%", background:"#F59E0B", boxShadow:"0 0 8px rgba(245,158,11,0.5)" }} />
                      <span style={{ color:"#fde68a" }}>New / Submitted ({statusCounts.newCount})</span>

                      <span style={{ width:10, height:10, borderRadius:"50%", background:"#3B82F6", boxShadow:"0 0 8px rgba(59,130,246,0.5)" }} />
                      <span style={{ color:"#bfdbfe" }}>Under Review ({statusCounts.underReviewCount})</span>

                      <span style={{ width:10, height:10, borderRadius:"50%", background:"#8B5CF6", boxShadow:"0 0 8px rgba(139,92,246,0.5)" }} />
                      <span style={{ color:"#ddd6fe" }}>Action Taken ({statusCounts.actionTakenCount})</span>

                      <span style={{ width:10, height:10, borderRadius:"50%", background:"#16A34A", boxShadow:"0 0 8px rgba(22,163,74,0.5)" }} />
                      <span style={{ color:"#bbf7d0" }}>Closed / Resolved ({statusCounts.closedCount})</span>
                    </div>
                  </div>

                  {/* map container */}
                  <div style={{ height:540, position:"relative" }}>
                    {isComplaintsLoading && (
                      <div style={{ position:"absolute", inset:0, zIndex:25, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(10,16,34,0.75)", backdropFilter:"blur(6px)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, color:"#22d3ee", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.8rem" }}>
                          <Loader2 className="animate-spin" size={20} /> Loading live citizen complaints...
                        </div>
                      </div>
                    )}

                    {isComplaintsError && (
                      <div style={{ position:"absolute", top:60, left:14, zIndex:25, ...PANEL, borderRadius:12, padding:"12px 16px", color:"#f87171", display:"flex", alignItems:"center", gap:8 }}>
                        <AlertCircle size={16} /> Unable to connect to complaints API.
                      </div>
                    )}

                    <Map 
                      ref={districtMapRef as React.Ref<unknown>} 
                      initialViewState={NASHIK_CENTER}
                      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      style={{ width:"100%", height:"100%" }} 
                      attributionControl={false}
                    >
                      <NavigationControl position="bottom-right" style={{ marginBottom:40 }} />
                      
                      {/* District Boundary Layer */}
                      {showBoundary && (
                        <Source id="dist-bnd" type="geojson" data={DISTRICT_BOUNDARY}>
                          <Layer id="dist-bnd-line" type="line" paint={{ "line-color":"#22d3ee","line-width":2,"line-dasharray":[4,3],"line-opacity":0.55 }} />
                        </Source>
                      )}

                      {/* Live Citizen Complaint Markers */}
                      {validComplaints.map((c) => {
                        const meta = getComplaintStatusMeta(c.status);
                        const isSelected = selectedComplaint?.id === c.id;
                        const isHovered = hoveredComplaintId === c.id;
                        const isClosed = meta.category === "closed";

                        return (
                          <Marker 
                            key={c.id} 
                            longitude={c.longitude as number} 
                            latitude={c.latitude as number} 
                            anchor="center"
                          >
                            <button
                              type="button"
                              title={`${c.reference_number} - ${c.title}`}
                              onMouseEnter={() => setHoveredComplaintId(c.id)}
                              onMouseLeave={() => setHoveredComplaintId(null)}
                              onClick={() => handleComplaintMarkerClick(c)}
                              style={{
                                position: "relative",
                                width: isSelected ? 22 : isHovered ? 18 : 14,
                                height: isSelected ? 22 : isHovered ? 18 : 14,
                                borderRadius: "50%",
                                background: meta.color,
                                border: `2px solid ${isSelected ? "#ffffff" : "#ffffffcc"}`,
                                boxShadow: `0 0 ${isSelected ? 20 : isHovered ? 14 : 8}px ${meta.color}`,
                                cursor: "pointer",
                                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                                padding: 0,
                                outline: "none",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {/* Pulse ring for active/open complaints */}
                              {!isClosed && (
                                <span 
                                  className="complaint-pulse-ring" 
                                  style={{ background: meta.color }} 
                                />
                              )}

                              {/* Hover Tooltip (Accessible & Viewport-safe) */}
                              {isHovered && !isSelected && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 10px)",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: 240,
                                    background: "rgba(10,16,34,0.96)",
                                    border: `1px solid ${meta.color}60`,
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                                    color: "#e2e8f0",
                                    pointerEvents: "none",
                                    backdropFilter: "blur(14px)",
                                    boxShadow: "0 8px 30px rgba(0,0,0,0.65)",
                                    zIndex: 30,
                                    textAlign: "left",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                    <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.62rem", fontWeight: 700, color: "#22d3ee" }}>
                                      {c.reference_number}
                                    </span>
                                    <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: meta.badgeBg, border: `1px solid ${meta.badgeBorder}`, color: meta.color }}>
                                      {meta.label}
                                    </span>
                                  </div>
                                  <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "0.74rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 3 }}>
                                    {c.title}
                                  </div>
                                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                    <User size={10} color="#64748b" /> {c.citizen_name || "Anonymous"}
                                  </div>
                                  <div style={{ fontSize: "0.62rem", color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                                    <MapPin size={9} color="#22d3ee" /> {c.latitude?.toFixed(4)}° N, {c.longitude?.toFixed(4)}° E
                                  </div>
                                </div>
                              )}
                            </button>
                          </Marker>
                        );
                      })}
                    </Map>

                    {/* Selected Complaint Detailed Popover */}
                    <AnimatePresence>
                      {activeComplaint && (
                        <motion.div
                          key="complaint-popup"
                          initial={{ opacity: 0, scale: 0.94, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            position: "absolute",
                            top: 60,
                            right: 14,
                            zIndex: 25,
                            width: 320,
                            background: "rgba(10,16,34,0.96)",
                            border: `1px solid ${getComplaintStatusMeta(activeComplaint.status).color}60`,
                            borderRadius: 16,
                            backdropFilter: "blur(28px)",
                            boxShadow: "0 12px 50px rgba(0,0,0,0.7)",
                            overflow: "hidden",
                          }}
                        >
                          {/* Header */}
                          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <MessageSquare size={13} color="#22d3ee" />
                                <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", fontWeight: 700, color: "#22d3ee" }}>
                                  {activeComplaint.reference_number}
                                </span>
                              </div>
                              <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "0.86rem", fontWeight: 700, color: "#f1f5f9", marginTop: 4 }}>
                                {activeComplaint.title}
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={handleCloseComplaintPopup} 
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}
                            >
                              <X size={15} />
                            </button>
                          </div>

                          {/* Body */}
                          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Status</span>
                              <span style={{ 
                                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", 
                                fontSize: "0.64rem", 
                                fontWeight: 700, 
                                padding: "2px 8px", 
                                borderRadius: 999, 
                                background: getComplaintStatusMeta(activeComplaint.status).badgeBg, 
                                border: `1px solid ${getComplaintStatusMeta(activeComplaint.status).badgeBorder}`, 
                                color: getComplaintStatusMeta(activeComplaint.status).color 
                              }}>
                                {getComplaintStatusMeta(activeComplaint.status).label}
                              </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Citizen</span>
                              <span style={{ fontSize: "0.7rem", color: "#cbd5e1", fontWeight: 600 }}>{activeComplaint.citizen_name || "Anonymous"}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Reported Location</span>
                              <span style={{ fontSize: "0.7rem", color: "#cbd5e1", fontWeight: 600, textAlign: "right", maxWidth: 180 }}>
                                {activeComplaint.location_name || "Nashik"}
                              </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>GPS Coordinates</span>
                              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.68rem", color: "#22d3ee" }}>
                                {activeComplaint.latitude?.toFixed(5)}° N, {activeComplaint.longitude?.toFixed(5)}° E
                              </span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Submitted Date</span>
                              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.65rem", color: "#94a3b8" }}>
                                {activeComplaint.created_at ? new Date(activeComplaint.created_at).toLocaleString() : "—"}
                              </span>
                            </div>

                            {/* Narrative */}
                            <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginTop: 4 }}>
                              <div style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                                Complaint Description
                              </div>
                              <p style={{ fontSize: "0.7rem", color: "#94a3b8", lineHeight: 1.45, margin: 0 }}>
                                {activeComplaint.description || "No description provided."}
                              </p>
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div style={{ padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setSelectedModalComplaint(activeComplaint)}
                              style={{
                                flex: 1,
                                padding: "8px 0",
                                borderRadius: 10,
                                background: "linear-gradient(135deg,#06b6d4,#3b82f6)",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4
                              }}
                            >
                              Review Details <Eye size={12} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Status Bar */}
                  <div style={{ padding:"9px 18px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(8,13,28,0.7)", display:"flex", gap:16, flexWrap:"wrap", alignItems:"center", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", color:"#475569" }}>
                    <span style={{ color:"#22d3ee", fontWeight:700 }}>LIVE CITIZEN COMPLAINTS</span>
                    <span style={{ color:"rgba(255,255,255,0.08)" }}>|</span>
                    <span>Total Submissions: <strong style={{ color:"#f1f5f9" }}>{statusCounts.total}</strong></span>
                    <span style={{ color:"rgba(255,255,255,0.08)" }}>|</span>
                    <span>Mapped Pins: <strong style={{ color:"#22d3ee" }}>{validComplaints.length}</strong></span>
                    {omittedCount > 0 && (
                      <>
                        <span style={{ color:"rgba(255,255,255,0.08)" }}>|</span>
                        <span style={{ color:"#f87171" }}>{omittedCount} unmapped (missing/invalid GPS)</span>
                      </>
                    )}
                    <span style={{ marginLeft:"auto", color:"#64748b" }}>Source: PostgreSQL `complaints`</span>
                  </div>
                </motion.div>
              )}

              {/* ══ ENCROACHMENT WATCH ═════════════════════════════════════ */}
              {activeFeature === "encroachment" && (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {/* map */}
                  <motion.div whileHover={{ boxShadow:"0 12px 60px rgba(0,0,0,0.6)" }} style={{ ...PANEL, overflow:"hidden", height:360, position:"relative" }}>
                    <Map ref={encMapRef as React.Ref<unknown>} key={selectedCase?.id || "enc-map"}
                      initialViewState={encMapCenter}
                      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                      style={{ width:"100%", height:"100%" }} attributionControl={false}>
                      <NavigationControl position="bottom-right" style={{ marginBottom:8 }} />
                      <Source id="enc-poly" type="geojson" data={encroachGeoJSON}>
                        <Layer id="enc-fill" type="fill" paint={{ "fill-color":["case",["get","isHighlighted"],"rgba(239,68,68,0.35)","rgba(239,68,68,0.15)"],"fill-outline-color":"transparent" }} />
                        <Layer id="enc-stroke" type="line" paint={{ "line-color":"#f87171","line-width":["case",["get","isHighlighted"],2.5,1.5],"line-opacity":["case",["get","isHighlighted"],1,0.6],"line-dasharray":[4,2] }} />
                      </Source>
                      {cases.map((c) => {
                        if (!c.latitude || !c.longitude) return null;
                        const isSel = c.id === selectedCase?.id;
                        return (
                          <Marker key={c.id} longitude={c.longitude} latitude={c.latitude} anchor="center">
                            <button type="button" onClick={() => setSelectedCaseId(c.id)}
                              style={{ width:isSel?20:13, height:isSel?20:13, borderRadius:"50%", background:isSel?"#ef4444":"rgba(239,68,68,0.7)", border:`2px solid ${isSel?"#fff":"#f87171"}`, boxShadow:`0 0 ${isSel?18:8}px rgba(239,68,68,0.6)`, cursor:"pointer", padding:0, outline:"none", transition:"all 0.2s" }} />
                          </Marker>
                        );
                      })}
                    </Map>
                    <div style={{ position:"absolute", top:12, left:14, zIndex:10, ...PANEL, borderRadius:12, padding:"7px 14px", display:"flex", alignItems:"center", gap:8 }}>
                      <ShieldAlert size={13} color="#f87171" />
                      <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.65rem", color:"#f87171", letterSpacing:"0.08em" }}>LIVE ENCROACHMENT OVERLAY · {cases.length} FLAGS</span>
                    </div>
                  </motion.div>

                  {/* alert cards */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
                    {cases.map((c) => {
                      const isSel=c.id===selectedCase?.id;
                      const state=c.status || "NEEDS_REVIEW";
                      const sc=stateColors[state] || stateColors.NEEDS_REVIEW;
                      const isHigh=true;
                      const primaryZone = c.intersection_details?.[0]?.zone_type || "Unknown Zone";
                      const totalArea = Math.round(c.intersection_details?.reduce((acc, detail) => acc + detail.intersection_area_sqm, 0) || 0);

                      return (
                        <motion.div key={c.id} whileHover={{ y:-2, boxShadow:"0 8px 40px rgba(0,0,0,0.5)" }} onClick={() => setSelectedCaseId(c.id)}
                          style={{ ...PANEL, borderRadius:16, padding:"18px", cursor:"pointer", background:isSel?"rgba(34,211,238,0.06)":state==="NOTICE_ISSUED"?"rgba(251,146,60,0.06)":"rgba(10,16,34,0.72)", border:isSel?"1px solid rgba(34,211,238,0.35)":state==="NOTICE_ISSUED"?"1px solid rgba(251,146,60,0.35)":"1px solid rgba(34,211,238,0.10)", display:"flex", flexDirection:"column", gap:12, transition:"all 0.2s" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ padding:"3px 10px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", background:isHigh?"rgba(239,68,68,0.15)":"rgba(251,191,36,0.15)", border:isHigh?"1px solid rgba(239,68,68,0.3)":"1px solid rgba(251,191,36,0.3)", color:isHigh?"#f87171":"#fbbf24" }}>HIGH</span>
                            <span style={{ padding:"3px 10px", borderRadius:999, fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.text }}>{sc.label}</span>
                          </div>
                          <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                            <AlertTriangle size={14} color={isHigh?"#f87171":"#fbbf24"} style={{ marginTop:2, flexShrink:0 }} />
                            <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.82rem", fontWeight:600, color:"#e2e8f0", lineHeight:1.35 }}>{primaryZone} Violation</span>
                          </div>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                              <MapPin size={11} color="#22d3ee" />
                              <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.72rem", color:"#64748b" }}>Nashik • {c.latitude?.toFixed(4)}, {c.longitude?.toFixed(4)}</span>
                            </div>
                            <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.62rem", color:"#475569" }}>{c.year} · {totalArea.toLocaleString()} m²</span>
                          </div>
                          <div style={{ display:"flex", gap:8, marginTop:4 }}>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateCaseStatus(c.id, "REVIEWED"); }} disabled={state==="REVIEWED" || updateCaseStatus.isPending}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, border:"1px solid rgba(52,211,153,0.3)", background:state==="REVIEWED"?"rgba(52,211,153,0.12)":"rgba(52,211,153,0.06)", color:"#34d399", cursor:state==="REVIEWED"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:state==="REVIEWED"?0.7:1 }}>
                              <CheckCircle2 size={11} />{state==="REVIEWED"?"Reviewed":"Review"}
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleUpdateCaseStatus(c.id, "NOTICE_ISSUED"); }} disabled={state==="NOTICE_ISSUED" || updateCaseStatus.isPending}
                              style={{ flex:1, padding:"7px 0", borderRadius:9, border:"1px solid rgba(251,146,60,0.3)", background:state==="NOTICE_ISSUED"?"rgba(251,146,60,0.14)":"rgba(251,146,60,0.06)", color:"#fb923c", cursor:state==="NOTICE_ISSUED"?"default":"pointer", fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:4, opacity:state==="NOTICE_ISSUED"?0.7:1 }}>
                              <Flag size={11} />{state==="NOTICE_ISSUED"?"Flagged":"Flag"}
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); navigate({ to:"/municipal/case-detail", search: { caseId: c.id } }); }}
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

              {/* ══ CASE DETAIL & COMPLAINT ANALYTICS ════════════════════════ */}
              {activeFeature === "case-detail" && (
                <div style={{ ...PANEL, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: "rgba(56, 189, 248, 0.12)",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            color: "#38bdf8",
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.60rem",
                            fontWeight: 700,
                          }}
                        >
                          MUNICIPAL ANALYTICS
                        </span>
                        <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.64rem", color: "#64748b" }}>
                          Live Database Aggregation
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc" }}>
                        Municipal Complaint Analytics Dashboard
                      </h3>
                      <p style={{ margin: "4px 0 0", fontFamily: "var(--font-sans,'Manrope',sans-serif)", fontSize: "0.78rem", color: "#94a3b8" }}>
                        Aggregated from {rawComplaints.length} persisted records across Nashik District with dynamic year-wise volume, status metrics, and locality density.
                      </p>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate({ to: "/municipal/case-detail" })}
                      style={{
                        padding: "10px 22px",
                        borderRadius: 10,
                        background: "rgba(34, 211, 238, 0.15)",
                        border: "1px solid rgba(34, 211, 238, 0.4)",
                        color: "#22d3ee",
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 0 16px rgba(34, 211, 238, 0.15)",
                      }}
                    >
                      Open Full Analytics Dashboard <ArrowRight size={14} />
                    </motion.button>
                  </div>

                  {/* Quick Dynamic Status Metric Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 4 }}>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                      <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.62rem", color: "#38bdf8", fontWeight: 700 }}>NEW / SUBMITTED</div>
                      <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>{statusCounts.newCount}</div>
                    </div>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.25)" }}>
                      <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.62rem", color: "#fbbf24", fontWeight: 700 }}>UNDER REVIEW</div>
                      <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>{statusCounts.underReviewCount}</div>
                    </div>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(192, 132, 252, 0.08)", border: "1px solid rgba(192, 132, 252, 0.25)" }}>
                      <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.62rem", color: "#c084fc", fontWeight: 700 }}>ACTION TAKEN</div>
                      <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>{statusCounts.actionTakenCount}</div>
                    </div>
                    <div style={{ padding: "14px 16px", borderRadius: 12, background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.25)" }}>
                      <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.62rem", color: "#34d399", fontWeight: 700 }}>CLOSED / RESOLVED</div>
                      <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>{statusCounts.closedCount}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══ CITIZEN COMPLAINTS ═════════════════════════════════════ */}
              {activeFeature === "complaints" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Status Summary & Counts Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      padding: "12px 18px",
                      borderRadius: 14,
                      background: "linear-gradient(135deg, rgba(16, 28, 58, 0.72) 0%, rgba(9, 17, 36, 0.6) 100%)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(56, 189, 248, 0.16)",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "#22d3ee",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Live Citizen Queue ({rawComplaints.length})
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {(["New", "Under Review", "Action Taken", "Closed"] as const).map((s) => {
                        const count =
                          s === "New"
                            ? statusCounts.newCount
                            : s === "Under Review"
                            ? statusCounts.underReviewCount
                            : s === "Action Taken"
                            ? statusCounts.actionTakenCount
                            : statusCounts.closedCount;
                        const meta = getComplaintStatusMeta(s);
                        return (
                          <div
                            key={s}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 10px",
                              borderRadius: 999,
                              background: meta.badgeBg,
                              border: `1px solid ${meta.badgeBorder}`,
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.62rem",
                              fontWeight: 600,
                              color: meta.color,
                            }}
                          >
                            <span
                              style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dotColor }}
                            />
                            <span>{s}:</span>
                            <strong style={{ color: meta.color }}>{count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complaint Cards List (Preview 4 items OR Expanded all items) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(isComplaintsExpanded ? rawComplaints : rawComplaints.slice(0, 4)).map((c, i) => {
                      const meta = getComplaintStatusMeta(c.status);
                      const typeColor = TYPE_CONFIG[c.title] || "#94a3b8";
                      const hasCoords = isValidComplaintCoordinate(c.latitude, c.longitude);

                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
                          whileHover={{
                            scale: 1.006,
                            x: 4,
                            borderColor: "rgba(56, 189, 248, 0.42)",
                            boxShadow:
                              "0 14px 40px rgba(0, 0, 0, 0.45), 0 0 24px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                          }}
                          onClick={() => setSelectedModalComplaint(c)}
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(16, 28, 58, 0.78) 0%, rgba(9, 17, 38, 0.70) 100%)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            border: "1px solid rgba(56, 189, 248, 0.18)",
                            borderRadius: 16,
                            padding: "16px 22px",
                            cursor: "pointer",
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: "12px 20px",
                            alignItems: "center",
                            boxShadow:
                              "0 8px 32px 0 rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 0 16px rgba(34, 211, 238, 0.03)",
                            transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "#22d3ee",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {c.reference_number}
                              </span>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                  fontSize: "0.58rem",
                                  fontWeight: 700,
                                  background: `${typeColor}15`,
                                  border: `1px solid ${typeColor}30`,
                                  color: typeColor,
                                }}
                              >
                                {c.title}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <User size={12} color="#64748b" />
                                <span
                                  style={{
                                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#cbd5e1",
                                  }}
                                >
                                  {c.citizen_name || "Anonymous Citizen"}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <MapPin size={11} color={hasCoords ? "#22d3ee" : "#f87171"} />
                                <span
                                  style={{
                                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                                    fontSize: "0.7rem",
                                    color: hasCoords ? "#94a3b8" : "#fca5a5",
                                  }}
                                >
                                  {c.location_name
                                    ? hasCoords
                                      ? `${c.location_name} (${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)})`
                                      : `${c.location_name} · Location coordinates unavailable`
                                    : hasCoords
                                    ? `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`
                                    : "Location coordinates unavailable"}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <Clock size={11} color="#64748b" />
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                    fontSize: "0.62rem",
                                    color: "#64748b",
                                  }}
                                >
                                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                                </span>
                              </div>
                            </div>

                            {c.description && (
                              <p
                                style={{
                                  fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                                  fontSize: "0.72rem",
                                  color: "#94a3b8",
                                  lineHeight: 1.45,
                                  margin: 0,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                                  overflow: "hidden",
                                }}
                              >
                                {c.description}
                              </p>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                              style={{
                                padding: "4px 12px",
                                borderRadius: 999,
                                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                background: meta.badgeBg,
                                border: `1px solid ${meta.badgeBorder}`,
                                color: meta.color,
                                whiteSpace: "nowrap",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: `0 0 10px ${meta.dotColor}25`,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dotColor }} />
                              {meta.label}
                            </span>
                            <span
                              style={{
                                padding: "5px 10px",
                                borderRadius: 8,
                                background: "rgba(34, 211, 238, 0.08)",
                                border: "1px solid rgba(34, 211, 238, 0.25)",
                                color: "#38bdf8",
                                fontSize: "0.64rem",
                                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Eye size={12} /> Details
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {isComplaintsLoading && (
                    <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                      <Loader2 className="animate-spin" size={24} color="#22d3ee" style={{ margin: "0 auto 8px" }} />
                      <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.72rem" }}>
                        Loading citizen complaints...
                      </span>
                    </div>
                  )}

                  {!isComplaintsLoading && rawComplaints.length === 0 && (
                    <div
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#64748b",
                        fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No citizen complaints submitted yet.
                    </div>
                  )}

                  {/* Expand / Collapse Button in-place without page navigation */}
                  {rawComplaints.length > 4 && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, background: "rgba(34,211,238,0.14)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsComplaintsExpanded(!isComplaintsExpanded)}
                      style={{
                        alignSelf: "center",
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 24px",
                        borderRadius: 12,
                        background: "rgba(34,211,238,0.08)",
                        border: "1px solid rgba(34,211,238,0.3)",
                        cursor: "pointer",
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#22d3ee",
                        transition: "all 0.15s",
                      }}
                    >
                      {isComplaintsExpanded ? (
                        <>
                          Show Less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          View All Complaints ({rawComplaints.length}) <ChevronDown size={14} />
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Centered Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedModalComplaint}
        isOpen={!!selectedModalComplaint}
        onClose={() => setSelectedModalComplaint(null)}
      />
    </>
  );
}
