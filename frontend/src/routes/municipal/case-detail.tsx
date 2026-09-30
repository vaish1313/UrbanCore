/**
 * /municipal/case-detail — Case Detail & Satellite Evidence
 *
 * Layout: map takes ~65% width, right column has year timeline + GPS info card.
 * Year timeline (2021-2025) is the hero — clicking a year animates the map
 * viewport and shifts the heatmap intensity overlay.
 * Mark as Reviewed and Flag for Action are pure React state (no backend).
 * GPS / AOI information card shows all spatial metadata.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, CheckCircle2, Flag, Satellite, Calendar,
  TrendingUp, Building2, ShieldAlert,
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MUNICIPAL_ALERTS, BUILDING_DETECTIONS, ALERT_CASE_IDS } from "@/data/municipalData";
import { NASHIK_AOIS } from "@/data/nashikAois";

export const Route = createFileRoute("/municipal/case-detail")({
  head: () => ({ meta: [{ title: "Case Detail — Municipal Authority" }] }),
  component: CaseDetailPage,
});

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.82)",
  border: "1px solid rgba(34,211,238,0.13)",
  borderRadius: 16,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.42)",
};

/* Construction hotspots near Gangapur Road AOI (AOI-07) */
const DEMO_HOTSPOTS = [
  { lng: 73.7536, lat: 20.0134, base: 0.04, growth: 0.17, spread: 0.00035 },
  { lng: 73.7552, lat: 20.0126, base: 0.07, growth: 0.22, spread: 0.00042 },
  { lng: 73.7566, lat: 20.0119, base: 0.03, growth: 0.26, spread: 0.00038 },
  { lng: 73.7524, lat: 20.0121, base: 0.05, growth: 0.14, spread: 0.00028 },
  { lng: 73.7544, lat: 20.0146, base: 0.04, growth: 0.19, spread: 0.00032 },
  { lng: 73.7574, lat: 20.0137, base: 0.02, growth: 0.28, spread: 0.00045 },
  { lng: 73.7518, lat: 20.0138, base: 0.03, growth: 0.12, spread: 0.00025 },
];

const YEARS = [2021, 2022, 2023, 2024, 2025] as const;
type Year = (typeof YEARS)[number];

/* Build a heatmap GeoJSON whose point weights scale with the selected year */
function buildHeatGeoJSON(year: Year) {
  const t = (year - 2021) / 4; // 0 → 1
  return {
    type: "FeatureCollection" as const,
    features: DEMO_HOTSPOTS.flatMap((h) => {
      const weight = h.base + t * h.growth;
      const count  = Math.max(1, Math.round(weight * 60));
      return Array.from({ length: count }, (_, i) => ({
        type: "Feature" as const,
        properties: { weight },
        geometry: {
          type: "Point" as const,
          coordinates: [
            h.lng + (Math.random() - 0.5) * h.spread * 2,
            h.lat + (Math.random() - 0.5) * h.spread * 2,
          ],
        },
      }));
    }),
  };
}

/* Intensity label for a given year */
const YEAR_STAGE: Record<Year, { label: string; color: string }> = {
  2021: { label: "Pristine",        color: "#34d399" },
  2022: { label: "Early Activity",  color: "#86efac" },
  2023: { label: "Emerging",        color: "#fbbf24" },
  2024: { label: "Active Incursion",color: "#fb923c" },
  2025: { label: "Critical",        color: "#f87171" },
};


/* ─────────────────────────────────────────────────────────────────────────
 * MASTER CASE DATA — derived from MUNICIPAL_ALERTS (single source of truth).
 * Encroachment Watch displays these same alerts; Case Detail shows the detail
 * for the first/default alert. No duplicate datasets.
 * ───────────────────────────────────────────────────────────────────────── */

/* Per-alert construction timeline stats keyed by aoiId */
const AOI_YEAR_STATS: Record<string, Record<Year, { buildings: number; areaSqM: number; change: string }>> = {
  "gangapur-road": {
    2021: { buildings: 142, areaSqM: 5200,  change: "Baseline" },
    2022: { buildings: 154, areaSqM: 7400,  change: "+8.4 %" },
    2023: { buildings: 167, areaSqM: 10800, change: "+17.6 %" },
    2024: { buildings: 181, areaSqM: 14600, change: "+27.4 %" },
    2025: { buildings: 194, areaSqM: 18500, change: "+36.6 %" },
  },
  "godavari-ramkund": {
    2021: { buildings: 110, areaSqM: 800,   change: "Baseline" },
    2022: { buildings: 111, areaSqM: 900,   change: "+0.9 %" },
    2023: { buildings: 113, areaSqM: 1050,  change: "+2.7 %" },
    2024: { buildings: 115, areaSqM: 1250,  change: "+4.5 %" },
    2025: { buildings: 118, areaSqM: 1450,  change: "+7.2 %" },
  },
  "anjaneri": {
    2021: { buildings: 45,  areaSqM: 1800,  change: "Baseline" },
    2022: { buildings: 47,  areaSqM: 2100,  change: "+4.4 %" },
    2023: { buildings: 50,  areaSqM: 2500,  change: "+11.1 %" },
    2024: { buildings: 53,  areaSqM: 2900,  change: "+17.7 %" },
    2025: { buildings: 56,  areaSqM: 3200,  change: "+24.4 %" },
  },
  "trimbakeshwar": {
    2021: { buildings: 82,  areaSqM: 2200,  change: "Baseline" },
    2022: { buildings: 84,  areaSqM: 2600,  change: "+2.4 %" },
    2023: { buildings: 87,  areaSqM: 3000,  change: "+6.0 %" },
    2024: { buildings: 89,  areaSqM: 3600,  change: "+8.5 %" },
    2025: { buildings: 91,  areaSqM: 4100,  change: "+10.9 %" },
  },
};

/* Default: first HIGH severity alert = enc-001 (Godavari Ramkund) — same
   as the first card shown in Encroachment Watch */
const DEFAULT_ALERT = MUNICIPAL_ALERTS[0]!;
const DEFAULT_AOI   = NASHIK_AOIS.find((a) => a.id === DEFAULT_ALERT.aoiId) ?? NASHIK_AOIS[0]!;

type CaseState = "pending" | "reviewed" | "flagged";

function CaseDetailPage() {
  const [selectedYear, setSelectedYear] = useState<Year>(2025);
  const [caseState,    setCaseState]    = useState<CaseState>("pending");
  const [heatGeoJSON] = useState(() => buildHeatGeoJSON(2025));
  const [activeHeat,   setActiveHeat]   = useState<ReturnType<typeof buildHeatGeoJSON>>(heatGeoJSON);

  const handleYearSelect = useCallback((year: Year) => {
    setSelectedYear(year);
    setActiveHeat(buildHeatGeoJSON(year));
  }, []);

  const stateStyle: Record<CaseState, { bg: string; border: string; text: string; label: string }> = {
    pending:  { bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.25)", text: "#94a3b8", label: "Pending Review" },
    reviewed: { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399", label: "Reviewed ✓" },
    flagged:  { bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.35)",  text: "#fb923c", label: "Action Required" },
  };

  const stage = YEAR_STAGE[selectedYear];
  /* Use per-alert stats if available, fall back to gangapur-road stats */
  const yearStatsMap = AOI_YEAR_STATS[DEFAULT_ALERT.aoiId] ?? AOI_YEAR_STATS["gangapur-road"]!;
  const stats = yearStatsMap[selectedYear];

  return (
    <>
      <style>{`
        @keyframes year-glow {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
          50%      { box-shadow: 0 0 14px 3px rgba(34,211,238,0.35); }
        }
        .year-active { animation: year-glow 2.2s ease-in-out infinite; }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "calc(100vh - 56px)",
          position: "fixed",
          inset: 0,
          top: 56,
          zIndex: 0,
          gap: 0,
        }}
      >
        {/* ── LEFT: MAP (65 %) ──────────────────────────────────────────── */}
        <div style={{ flex: "0 0 65%", position: "relative" }}>
          <Map
            key={selectedYear}
            initialViewState={{
              longitude: 73.756,
              latitude:  20.013,
              zoom:      14.2,
              pitch:     0,
              bearing:   -12,
            }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" style={{ marginBottom: 8 }} />

            {/* Construction heatmap layer */}
            <Source id="construction-heat" type="geojson" data={activeHeat}>
              <Layer
                id="construction-heat-layer"
                type="heatmap"
                paint={{
                  "heatmap-weight":    ["interpolate", ["linear"], ["get", "weight"], 0, 0, 1, 1],
                  "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 3],
                  "heatmap-color": [
                    "interpolate", ["linear"], ["heatmap-density"],
                    0,    "rgba(0,0,0,0)",
                    0.15, "rgba(34,211,238,0.45)",
                    0.45, "rgba(251,191,36,0.72)",
                    0.72, "rgba(239,68,68,0.88)",
                    1,    "rgba(220,38,38,1)",
                  ],
                  "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 12, 22, 16, 58],
                  "heatmap-opacity": 0.82,
                }}
              />
            </Source>
          </Map>

          {/* Year badge floating on map */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 10,
              ...PANEL,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Satellite size={14} color="#22d3ee" />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#22d3ee",
                }}
              >
                SATELLITE EPOCH
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#f1f5f9",
                  lineHeight: 1.2,
                }}
              >
                {selectedYear}
              </div>
            </div>
            <div
              style={{
                marginLeft: 8,
                padding: "3px 10px",
                borderRadius: 999,
                background: `${stage.color}18`,
                border: `1px solid ${stage.color}50`,
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.62rem",
                fontWeight: 700,
                color: stage.color,
                letterSpacing: "0.06em",
              }}
            >
              {stage.label}
            </div>
          </div>

          {/* Heatmap legend bottom-left */}
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 14,
              zIndex: 10,
              ...PANEL,
              padding: "8px 14px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.58rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#475569",
                marginBottom: 6,
              }}
            >
              Construction Intensity
            </div>
            <div
              style={{
                width: 120,
                height: 6,
                borderRadius: 999,
                background: "linear-gradient(90deg,rgba(34,211,238,0.6),rgba(251,191,36,0.8),rgba(239,68,68,1))",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.56rem",
                color: "#475569",
              }}
            >
              <span>Low</span><span>High</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (35 %) ───────────────────────────────────────── */}
        <div
          style={{
            flex: "1 1 0",
            background: "rgba(8,13,28,0.94)",
            borderLeft: "1px solid rgba(34,211,238,0.08)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            gap: 0,
          }}
        >
          {/* ── Year Timeline ────────────────────────────────────────────── */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Calendar size={14} color="#22d3ee" />
              <span
                style={{
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#f1f5f9",
                }}
              >
                Year Timeline
              </span>
            </div>

            {/* vertical timeline nodes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              {/* connecting line */}
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 12,
                  bottom: 12,
                  width: 1,
                  background: "rgba(34,211,238,0.15)",
                  zIndex: 0,
                }}
              />

              {[...YEARS].reverse().map((year) => {
                const isActive = year === selectedYear;
                const st = YEAR_STAGE[year];
                const s  = yearStatsMap[year];
                return (
                  <motion.button
                    key={year}
                    type="button"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleYearSelect(year)}
                    className={isActive ? "year-active" : ""}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "8px 10px 8px 0",
                      background: isActive ? "rgba(34,211,238,0.06)" : "transparent",
                      border: isActive ? "1px solid rgba(34,211,238,0.22)" : "1px solid transparent",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: 4,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {/* node dot */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: isActive ? st.color : "rgba(255,255,255,0.04)",
                        border: `2px solid ${isActive ? st.color : "rgba(255,255,255,0.12)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginLeft: 1,
                        boxShadow: isActive ? `0 0 10px ${st.color}80` : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      {isActive && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#fff",
                            display: "block",
                          }}
                        />
                      )}
                    </div>

                    {/* text */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: isActive ? st.color : "#64748b",
                          }}
                        >
                          {year}
                        </span>
                        <span
                          style={{
                            padding: "1px 7px",
                            borderRadius: 999,
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.56rem",
                            fontWeight: 700,
                            color: st.color,
                            background: `${st.color}15`,
                            border: `1px solid ${st.color}30`,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.6rem",
                          color: "#475569",
                        }}
                      >
                        <span>{s.buildings} bldgs</span>
                        <span>{s.areaSqM.toLocaleString()} m²</span>
                        <span style={{ color: year > 2021 ? "#f87171" : "#34d399" }}>
                          {s.change}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Construction growth indicator ─────────────────────────── */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingUp size={13} color="#22d3ee" />
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#475569",
                }}
              >
                Construction Growth
              </span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
                marginBottom: 4,
              }}
            >
              <motion.div
                key={selectedYear}
                initial={{ width: 0 }}
                animate={{ width: `${((selectedYear - 2021) / 4) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg,#10b981,#fbbf24,#ef4444)",
                  borderRadius: 999,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.58rem",
                color: "#475569",
              }}
            >
              <span>2021 Baseline</span>
              <span style={{ color: stage.color }}>{stats.change}</span>
              <span style={{ color: "#f87171", fontWeight: 700 }}>Critical 2025</span>
            </div>
          </div>

          {/* ── GPS / AOI Info Card ───────────────────────────────────── */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <MapPin size={13} color="#22d3ee" />
              <span
                style={{
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#f1f5f9",
                }}
              >
                GPS / AOI Information
              </span>
            </div>
            {(
              [
                ["AOI Name",      DEFAULT_AOI.name],
                ["Latitude",      `${DEFAULT_AOI.coords.lat.toFixed(4)}° N`],
                ["Longitude",     `${DEFAULT_AOI.coords.lng.toFixed(4)}° E`],
                ["Village",       (DEFAULT_AOI as { village?: string }).village ?? "—"],
                ["Taluka",        (DEFAULT_AOI as { taluka?: string }).taluka  ?? "—"],
                ["District",      (DEFAULT_AOI as { district?: string }).district ?? "—"],
                ["Est. Built-Up", `${DEFAULT_ALERT.affectedAreaSqM.toLocaleString()} m²`],
                ["Detection",     DEFAULT_ALERT.status],
                ["Category",      DEFAULT_ALERT.category],
                ["Case ID",       ALERT_CASE_IDS[DEFAULT_ALERT.id] ?? "UC-2025-0894"],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "5px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "0.64rem",
                    color: "#475569",
                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "0.66rem",
                    color: "#cbd5e1",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Detection summary ────────────────────────────────────── */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Building2 size={13} color="#22d3ee" />
              <span
                style={{
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "#f1f5f9",
                }}
              >
                Detection Summary
              </span>
            </div>
            {BUILDING_DETECTIONS.filter((b) => b.aoiId === DEFAULT_ALERT.aoiId).map((det) => (
              <div
                key={det.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display,'Sora',sans-serif)",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#e2e8f0",
                    marginBottom: 4,
                  }}
                >
                  {det.location}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    color: "#475569",
                  }}
                >
                  <span>{det.storeys} storeys</span>
                  <span>{det.builtUpAreaSqM.toLocaleString()} m²</span>
                  <span style={{ color: "#fbbf24" }}>{det.status}</span>
                </div>
                {det.nearbyProtectedZone !== "None" && (
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.56rem",
                      color: "#fb923c",
                    }}
                  >
                    <ShieldAlert size={10} />
                    {det.nearbyProtectedZone}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Case actions ─────────────────────────────────────────── */}
          <div style={{ padding: "14px 16px", marginTop: "auto" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={caseState}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: stateStyle[caseState].bg,
                  border: `1px solid ${stateStyle[caseState].border}`,
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: stateStyle[caseState].text,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                {stateStyle[caseState].label}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", gap: 8 }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={caseState === "reviewed"}
                onClick={() => setCaseState("reviewed")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 11,
                  border: "1px solid rgba(52,211,153,0.35)",
                  background: caseState === "reviewed" ? "rgba(52,211,153,0.14)" : "rgba(52,211,153,0.07)",
                  color: "#34d399",
                  cursor: caseState === "reviewed" ? "default" : "pointer",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: caseState === "reviewed" ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <CheckCircle2 size={14} />
                {caseState === "reviewed" ? "Reviewed ✓" : "Mark Reviewed"}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={caseState === "flagged"}
                onClick={() => setCaseState("flagged")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 11,
                  border: "1px solid rgba(251,146,60,0.35)",
                  background: caseState === "flagged" ? "rgba(251,146,60,0.14)" : "rgba(251,146,60,0.07)",
                  color: "#fb923c",
                  cursor: caseState === "flagged" ? "default" : "pointer",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: caseState === "flagged" ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <Flag size={14} />
                {caseState === "flagged" ? "Flagged" : "Flag for Action"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
