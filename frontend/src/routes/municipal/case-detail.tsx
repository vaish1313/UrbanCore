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
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, CheckCircle2, Flag, Satellite, Calendar,
  TrendingUp, Building2, ShieldAlert,
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMunicipalCase, useUpdateCaseStatus } from "@/hooks/use-municipal";
import { useAnalysis, useAnalysisGeoJSON } from "@/hooks/use-analysis";
import type { MunicipalCase } from "@/types/urbancore";

type CaseDetailSearch = {
  caseId?: string;
};

export const Route = createFileRoute("/municipal/case-detail")({
  validateSearch: (search: Record<string, unknown>): CaseDetailSearch => {
    return {
      caseId: search.caseId as string | undefined,
    };
  },
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

type Year = 2021 | 2022 | 2023 | 2024 | 2025;

/* Intensity label for a given year */
const YEAR_STAGE: Record<Year, { label: string; color: string }> = {
  2021: { label: "Pristine",        color: "#34d399" },
  2022: { label: "Early Activity",  color: "#86efac" },
  2023: { label: "Emerging",        color: "#fbbf24" },
  2024: { label: "Active Incursion",color: "#fb923c" },
  2025: { label: "Critical",        color: "#f87171" },
};

function CaseDetailPage() {
  const { caseId } = Route.useSearch();
  const { data: caseData, isLoading: isCaseLoading, isError: isCaseError } = useMunicipalCase(caseId);
  const updateStatus = useUpdateCaseStatus();
  
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const { data: analysisData } = useAnalysis(caseData?.analysis_id);
  const availableYears = analysisData?.years || (caseData ? [caseData.year] : []);

  useEffect(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears, selectedYear]);

  const { data: activeGeoJSON } = useAnalysisGeoJSON(caseData?.analysis_id, selectedYear || undefined, "inference");

  const stateStyle: Record<string, { bg: string; border: string; text: string; label: string }> = {
    NEEDS_REVIEW:  { bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.25)", text: "#94a3b8", label: "Pending Review" },
    REVIEWED: { bg: "rgba(52,211,153,0.12)",  border: "rgba(52,211,153,0.35)",  text: "#34d399", label: "Reviewed ✓" },
    NOTICE_ISSUED:  { bg: "rgba(251,146,60,0.12)",  border: "rgba(251,146,60,0.35)",  text: "#fb923c", label: "Action Required" },
    RESOLVED:  { bg: "rgba(34,211,238,0.10)",  border: "rgba(34,211,238,0.35)",  text: "#22d3ee", label: "Resolved" },
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (caseId) {
      updateStatus.mutate({ caseId, status: newStatus });
    }
  };

  if (isCaseLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 56px)", color: "#94a3b8" }}>
        Loading case details...
      </div>
    );
  }

  if (isCaseError || !caseData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 56px)", color: "#f87171" }}>
        Unable to load case details. Try again.
      </div>
    );
  }

  const caseState = caseData.status || "NEEDS_REVIEW";
  const stage = selectedYear ? (YEAR_STAGE[selectedYear as Year] || { label: "Unknown", color: "#64748b" }) : { label: "-", color: "#64748b" };
  const currentYearData = analysisData?.inference_results?.[selectedYear || caseData.year];



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
              longitude: caseData.longitude || 73.756,
              latitude:  caseData.latitude || 20.013,
              zoom:      15.2,
              pitch:     0,
              bearing:   0,
            }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" style={{ marginBottom: 8 }} />

            {/* Construction polygons layer */}
            {activeGeoJSON && (
              <Source id="construction-polygons" type="geojson" data={activeGeoJSON}>
                <Layer
                  id="construction-polygons-layer"
                  type="fill"
                  paint={{
                    "fill-color": "rgba(239,68,68,0.35)",
                    "fill-outline-color": "transparent",
                  }}
                />
                <Layer
                  id="construction-stroke"
                  type="line"
                  paint={{
                    "line-color": "#f87171",
                    "line-width": 1.5,
                  }}
                />
              </Source>
            )}
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

              {[...availableYears].reverse().map((year) => {
                const isActive = year === selectedYear;
                const st = YEAR_STAGE[year as Year] || { color: "#34d399", label: "Analyzed" };
                const yrData = analysisData?.inference_results?.[year];
                return (
                  <motion.button
                    key={year}
                    type="button"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedYear(year)}
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
                        <span>{yrData ? "Analysis Data Available" : "Data Pending"}</span>
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
              <span style={{ color: stage.color }}>-</span>
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
                ["Analysis ID",   caseData.analysis_id],
                ["Latitude",      `${caseData.latitude?.toFixed(4) || "—"}° N`],
                ["Longitude",     `${caseData.longitude?.toFixed(4) || "—"}° E`],
                ["Primary Zone",  caseData.intersection_details?.[0]?.zone_type || "Unknown"],
                ["Primary Area",  `${Math.round(caseData.intersection_details?.[0]?.intersection_area_sqm || 0).toLocaleString()} m²`],
                ["Detection Year", caseData.year.toString()],
                ["Case ID",       caseData.id],
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
            {caseData.intersection_details?.map((det, idx) => (
              <div
                key={idx}
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
                  Intersection #{idx + 1}
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
                  <span>{Math.round(det.intersection_area_sqm).toLocaleString()} m²</span>
                  <span style={{ color: "#fbbf24" }}>{det.zone_type}</span>
                </div>
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
                  {det.source_dataset}
                </div>
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
                  background: stateStyle[caseState]?.bg || stateStyle.NEEDS_REVIEW.bg,
                  border: `1px solid ${stateStyle[caseState]?.border || stateStyle.NEEDS_REVIEW.border}`,
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: stateStyle[caseState]?.text || stateStyle.NEEDS_REVIEW.text,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                {stateStyle[caseState]?.label || "Pending"}
              </motion.div>
            </AnimatePresence>

            <div style={{ display: "flex", gap: 8 }}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={caseState === "REVIEWED" || updateStatus.isPending}
                onClick={() => handleUpdateStatus("REVIEWED")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 11,
                  border: "1px solid rgba(52,211,153,0.35)",
                  background: caseState === "REVIEWED" ? "rgba(52,211,153,0.14)" : "rgba(52,211,153,0.07)",
                  color: "#34d399",
                  cursor: caseState === "REVIEWED" ? "default" : "pointer",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: caseState === "REVIEWED" ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <CheckCircle2 size={14} />
                {caseState === "REVIEWED" ? "Reviewed ✓" : "Mark Reviewed"}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={caseState === "NOTICE_ISSUED" || updateStatus.isPending}
                onClick={() => handleUpdateStatus("NOTICE_ISSUED")}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 11,
                  border: "1px solid rgba(251,146,60,0.35)",
                  background: caseState === "NOTICE_ISSUED" ? "rgba(251,146,60,0.14)" : "rgba(251,146,60,0.07)",
                  color: "#fb923c",
                  cursor: caseState === "NOTICE_ISSUED" ? "default" : "pointer",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: caseState === "NOTICE_ISSUED" ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <Flag size={14} />
                {caseState === "NOTICE_ISSUED" ? "Flagged" : "Flag for Action"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
