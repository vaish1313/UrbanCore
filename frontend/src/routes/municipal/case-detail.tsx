/**
 * /municipal/case-detail — Municipal Complaint Analytics Dashboard
 *
 * Dynamic, data-driven municipal complaint analytics derived from persisted
 * PostgreSQL complaint records.
 *
 * Layout:
 * - Left (62%): Interactive Satellite Map with geospatial complaint distribution,
 *   epoch/year filtering, and interactive inspection pins.
 * - Right (38%): Glassmorphic Analytics Sidebar featuring:
 *   1. Dynamic Status Summary (New, Under Review, Action Taken, Closed)
 *   2. Year-wise Complaint Statistics (2021–2025) with Bar Chart & YoY % changes
 *   3. Top 5 Most Affected Localities with proportional indicators
 *   4. Demonstration Data Disclosure & Status Update Workflow Integration
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Building2,
  Info,
  ShieldAlert,
  ChevronRight,
  Filter,
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useMunicipalComplaints, useMunicipalCase } from "@/hooks/use-municipal";
import { ComplaintDetailModal } from "@/components/urbancore/municipal/ComplaintDetailModal";
import type { MunicipalComplaint } from "@/types/urbancore";

type CaseDetailSearch = {
  caseId?: string;
};

export const Route = createFileRoute("/municipal/case-detail")({
  validateSearch: (search: Record<string, unknown>): CaseDetailSearch => {
    return {
      caseId: search.caseId as string | undefined,
    };
  },
  head: () => ({ meta: [{ title: "Case Detail & Complaint Analytics — Municipal Authority" }] }),
  component: CaseDetailPage,
});

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const GLASS_CARD: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(16, 28, 58, 0.78) 0%, rgba(9, 17, 38, 0.70) 100%)",
  border: "1px solid rgba(56, 189, 248, 0.18)",
  borderRadius: 14,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(2, 6, 23, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
};

type CanonicalStatus = "New" | "Under Review" | "Action Taken" | "Closed";

function normalizeStatus(raw: string | undefined): CanonicalStatus {
  const s = (raw || "").trim().toLowerCase();
  if (s === "new" || s === "submitted" || s === "pending") return "New";
  if (s === "under review" || s === "under_review" || s === "reviewed") return "Under Review";
  if (s === "action taken" || s === "action_taken" || s === "notice issued" || s === "notice_issued") return "Action Taken";
  if (s === "closed" || s === "resolved" || s === "completed") return "Closed";
  return "New";
}

const STATUS_CONFIG: Record<
  CanonicalStatus,
  { label: string; color: string; badgeBg: string; border: string; dot: string }
> = {
  New: {
    label: "New / Submitted",
    color: "#38bdf8",
    badgeBg: "rgba(56, 189, 248, 0.12)",
    border: "rgba(56, 189, 248, 0.35)",
    dot: "#38bdf8",
  },
  "Under Review": {
    label: "Under Review",
    color: "#fbbf24",
    badgeBg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.35)",
    dot: "#fbbf24",
  },
  "Action Taken": {
    label: "Action Taken",
    color: "#c084fc",
    badgeBg: "rgba(192, 132, 252, 0.12)",
    border: "rgba(192, 132, 252, 0.35)",
    dot: "#c084fc",
  },
  Closed: {
    label: "Closed / Resolved",
    color: "#34d399",
    badgeBg: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.35)",
    dot: "#34d399",
  },
};

const TARGET_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

function CaseDetailPage() {
  const { caseId } = Route.useSearch();
  const { data: caseData } = useMunicipalCase(caseId);

  // Fetch all persisted complaints from the existing municipal endpoint (limit=100)
  const {
    data: complaintsData,
    isLoading: isComplaintsLoading,
    isError: isComplaintsError,
    refetch: refetchComplaints,
    isFetching: isComplaintsFetching,
  } = useMunicipalComplaints(100, 0);

  const rawComplaints = useMemo(() => complaintsData?.complaints || [], [complaintsData]);

  // Selected filters for map exploration
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | "ALL">("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | "ALL">("ALL");
  const [activePopupComplaint, setActivePopupComplaint] = useState<MunicipalComplaint | null>(null);
  const [selectedModalComplaint, setSelectedModalComplaint] = useState<MunicipalComplaint | null>(null);

  // 1. Status Summary (Normalized across canonical statuses)
  const statusSummary = useMemo(() => {
    const counts: Record<CanonicalStatus, number> = {
      New: 0,
      "Under Review": 0,
      "Action Taken": 0,
      Closed: 0,
    };
    rawComplaints.forEach((c) => {
      const canonical = normalizeStatus(c.status);
      counts[canonical] = (counts[canonical] || 0) + 1;
    });
    return counts;
  }, [rawComplaints]);

  // 2. Year-wise Statistics (2021 - 2025)
  const yearStats = useMemo(() => {
    const countsByYear: Record<number, number> = {};
    rawComplaints.forEach((c) => {
      if (c.created_at) {
        const yr = new Date(c.created_at).getFullYear();
        countsByYear[yr] = (countsByYear[yr] || 0) + 1;
      }
    });

    return TARGET_YEARS.map((yr, idx) => {
      const count = countsByYear[yr] || 0;
      const prevYear = idx > 0 ? TARGET_YEARS[idx - 1] : null;
      const prevCount = prevYear !== null ? countsByYear[prevYear] || 0 : null;

      let pctChange: string = "—";
      let isIncrease: boolean | null = null;
      if (prevCount !== null) {
        if (prevCount === 0) {
          pctChange = count > 0 ? "+100%" : "0.0%";
          isIncrease = count > 0;
        } else {
          const diff = ((count - prevCount) / prevCount) * 100;
          isIncrease = diff > 0 ? true : diff < 0 ? false : null;
          const sign = diff > 0 ? "+" : "";
          pctChange = `${sign}${diff.toFixed(1)}%`;
        }
      }

      return {
        year: yr,
        count,
        prevCount,
        pctChange,
        isIncrease,
      };
    });
  }, [rawComplaints]);

  // 3. Top 5 Most Affected Areas
  const topAffectedAreas = useMemo(() => {
    const areaMap: Record<string, number> = {};
    rawComplaints.forEach((c) => {
      const rawLoc = c.location_name?.trim();
      const loc = rawLoc && rawLoc.length > 0 ? rawLoc : "Unspecified Location";
      areaMap[loc] = (areaMap[loc] || 0) + 1;
    });

    const entries = Object.entries(areaMap).map(([name, count]) => ({
      name,
      count,
    }));

    // Sort descending by count, then alphabetically
    entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    const top5 = entries.slice(0, 5);
    const maxCount = top5[0]?.count || 1;

    return top5.map((item, index) => ({
      ...item,
      rank: index + 1,
      proportionPercent: Math.round((item.count / maxCount) * 100),
      shareOfTotal: rawComplaints.length > 0 ? ((item.count / rawComplaints.length) * 100).toFixed(1) : "0.0",
    }));
  }, [rawComplaints]);

  // Filter complaints displayed on map
  const mapComplaints = useMemo(() => {
    return rawComplaints.filter((c) => {
      if (c.latitude === null || c.longitude === null) return false;
      if (selectedYearFilter !== "ALL") {
        const yr = new Date(c.created_at).getFullYear();
        if (yr !== selectedYearFilter) return false;
      }
      if (selectedStatusFilter !== "ALL") {
        const norm = normalizeStatus(c.status);
        if (norm !== selectedStatusFilter) return false;
      }
      return true;
    });
  }, [rawComplaints, selectedYearFilter, selectedStatusFilter]);

  const totalComplaints = rawComplaints.length;

  return (
    <div
      className="w-full flex-1 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mb-8"
      style={{
        background: "linear-gradient(180deg, #090e24 0%, #060a19 60%, #030611 100%)",
        boxSizing: "border-box",
      }}
    >
      <div className="max-w-[1680px] mx-auto">
        <style>{`
          .case-detail-workspace {
            display: grid;
            grid-template-columns: 1fr;
            width: 100%;
            gap: 24px;
            position: relative;
            box-sizing: border-box;
          }
          .case-detail-map-pane {
            width: 100%;
            height: 520px;
            min-height: 440px;
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            border: 1px solid rgba(56, 189, 248, 0.22);
            box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            background: rgba(10, 18, 38, 0.85);
          }
          .case-detail-analytics-pane {
            width: 100%;
            background: linear-gradient(180deg, rgba(13, 22, 45, 0.82) 0%, rgba(8, 14, 30, 0.90) 100%);
            border: 1px solid rgba(56, 189, 248, 0.22);
            border-radius: 18px;
            box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            display: flex;
            flex-direction: column;
            overflow-y: visible;
            padding: 24px;
            gap: 20px;
            box-sizing: border-box;
          }

          @media (min-width: 1024px) {
            .case-detail-workspace {
              grid-template-columns: minmax(0, 1.45fr) minmax(420px, 1fr);
              height: calc(100vh - 130px);
              min-height: 640px;
              max-height: 880px;
            }
            .case-detail-map-pane {
              height: 100%;
            }
            .case-detail-analytics-pane {
              height: 100%;
              overflow-y: auto;
              padding: 24px;
            }
          }
        `}</style>

        <div className="case-detail-workspace">
          {/* ── LEFT: SATELLITE COMPLAINT MAP ─────────────────────────────── */}
          <div className="case-detail-map-pane">
          <Map
            initialViewState={{
              longitude: caseData?.longitude || 73.78,
              latitude: caseData?.latitude || 20.00,
              zoom: caseData ? 14.5 : 12.2,
              pitch: 15,
              bearing: 0,
            }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" style={{ marginBottom: 16 }} />

            {/* Complaint geospatial markers */}
            {mapComplaints.map((c) => {
              const norm = normalizeStatus(c.status);
              const meta = STATUS_CONFIG[norm];
              const isSelected = activePopupComplaint?.id === c.id;

              return (
                <Marker
                  key={c.id}
                  longitude={c.longitude!}
                  latitude={c.latitude!}
                  anchor="center"
                  onClick={(e: { originalEvent: MouseEvent }) => {
                    e.originalEvent.stopPropagation();
                    setActivePopupComplaint(c);
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.35 }}
                    style={{
                      width: isSelected ? 18 : 12,
                      height: isSelected ? 18 : 12,
                      borderRadius: "50%",
                      background: meta.dot,
                      border: `2px solid ${isSelected ? "#ffffff" : "rgba(10,16,34,0.9)"}`,
                      boxShadow: `0 0 12px ${meta.dot}`,
                      cursor: "pointer",
                      transition: "all 0.15s ease-out",
                    }}
                  />
                </Marker>
              );
            })}

            {/* Marker click popup */}
            {activePopupComplaint && activePopupComplaint.longitude && activePopupComplaint.latitude && (
              <Popup
                longitude={activePopupComplaint.longitude}
                latitude={activePopupComplaint.latitude}
                anchor="bottom"
                onClose={() => setActivePopupComplaint(null)}
                closeButton={true}
                closeOnClick={false}
                maxWidth="320px"
              >
                <div
                  style={{
                    padding: "6px 4px",
                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                    color: "#f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        color: "#22d3ee",
                      }}
                    >
                      {activePopupComplaint.reference_number}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: "0.58rem",
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontWeight: 700,
                        background: STATUS_CONFIG[normalizeStatus(activePopupComplaint.status)].badgeBg,
                        border: `1px solid ${STATUS_CONFIG[normalizeStatus(activePopupComplaint.status)].border}`,
                        color: STATUS_CONFIG[normalizeStatus(activePopupComplaint.status)].color,
                      }}
                    >
                      {STATUS_CONFIG[normalizeStatus(activePopupComplaint.status)].label}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
                    {activePopupComplaint.title || "Citizen Report"}
                  </div>

                  <div style={{ fontSize: "0.68rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                    <MapPin size={11} color="#38bdf8" />
                    <span>{activePopupComplaint.location_name || "Unspecified Location"}</span>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedModalComplaint(activePopupComplaint);
                      setActivePopupComplaint(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: "rgba(34, 211, 238, 0.15)",
                      border: "1px solid rgba(34, 211, 238, 0.4)",
                      color: "#22d3ee",
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <Eye size={12} /> Open Case Investigation
                  </motion.button>
                </div>
              </Popup>
            )}
          </Map>

          {/* Floating Header Badge (Top-Left of Map) */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 10,
              ...GLASS_CARD,
              padding: "12px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxWidth: "min(420px, calc(100% - 32px))",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart3 size={15} color="#22d3ee" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#38bdf8",
                  }}
                >
                  NASHIK MUNICIPAL JURISDICTION
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display,'Sora',sans-serif)",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#f8fafc",
                  }}
                >
                  Geospatial Complaint Analytics
                </div>
              </div>
            </div>

            {/* Quick interactive year selector for map */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.60rem",
                  color: "#64748b",
                }}
              >
                Epoch Filter:
              </span>
              {(["ALL", 2021, 2022, 2023, 2024, 2025] as const).map((yr) => {
                const isSelected = selectedYearFilter === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYearFilter(yr)}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: "0.62rem",
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: isSelected ? "rgba(34,211,238,0.22)" : "rgba(255,255,255,0.04)",
                      border: isSelected ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,0.1)",
                      color: isSelected ? "#22d3ee" : "#94a3b8",
                      transition: "all 0.15s",
                    }}
                  >
                    {yr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Map Legend (Bottom-Left) */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              zIndex: 10,
              ...GLASS_CARD,
              padding: "10px 14px",
              maxWidth: "calc(100% - 32px)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.56rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              Workflow Status Markers ({mapComplaints.length} shown)
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              {(Object.keys(STATUS_CONFIG) as CanonicalStatus[]).map((key) => {
                const conf = STATUS_CONFIG[key];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: conf.dot,
                        boxShadow: `0 0 6px ${conf.dot}80`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontSize: "0.60rem",
                        color: "#cbd5e1",
                      }}
                    >
                      {conf.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: ANALYTICS DASHBOARD ─────────────────────────── */}
        <div className="case-detail-analytics-pane">
          {/* Header Panel */}
          <div
            style={{
              ...GLASS_CARD,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    color: "#38bdf8",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                  }}
                >
                  SYNTHETIC DEMO DATA
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.62rem",
                    color: "#64748b",
                  }}
                >
                  PostgreSQL Active
                </span>
              </div>

              <motion.button
                type="button"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                onClick={() => refetchComplaints()}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
                title="Refresh Analytics Data"
              >
                <RefreshCw size={14} className={isComplaintsFetching ? "animate-spin text-cyan-400" : ""} />
              </motion.button>
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  letterSpacing: "-0.01em",
                }}
              >
                Complaint Analytics & Case Detail
              </h2>
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                  fontSize: "0.72rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                }}
              >
                Dynamic aggregations calculated from {totalComplaints} persisted complaints across Nashik.
              </p>
            </div>

            {/* Context banner if a case ID was passed in query param */}
            {caseData && (
              <div
                style={{
                  marginTop: 4,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(34, 211, 238, 0.07)",
                  border: "1px solid rgba(34, 211, 238, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={13} color="#22d3ee" />
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.64rem",
                      fontWeight: 600,
                      color: "#cbd5e1",
                    }}
                  >
                    Context Case: {caseData.id?.slice(0, 8)}... ({caseData.location_name || "Nashik"})
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.60rem",
                    color: "#38bdf8",
                  }}
                >
                  Epoch {caseData.year}
                </span>
              </div>
            )}
          </div>

          {/* Loading state indicator */}
          {isComplaintsLoading && (
            <div style={{ ...GLASS_CARD, padding: "30px", textAlign: "center" }}>
              <div className="animate-spin inline-block mb-2">
                <RefreshCw size={22} color="#22d3ee" />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.72rem",
                  color: "#94a3b8",
                }}
              >
                Calculating dynamic complaint metrics...
              </div>
            </div>
          )}

          {/* Error state */}
          {isComplaintsError && !isComplaintsLoading && (
            <div
              style={{
                ...GLASS_CARD,
                padding: "20px",
                borderColor: "rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171" }}>
                <AlertCircle size={16} />
                <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "0.82rem" }}>
                  Failed to load complaints from backend
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.70rem", color: "#cbd5e1" }}>
                Could not connect to the municipal complaints API. Check your network or backend server.
              </p>
              <button
                type="button"
                onClick={() => refetchComplaints()}
                style={{
                  alignSelf: "flex-start",
                  marginTop: 4,
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: "rgba(239, 68, 68, 0.2)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  fontSize: "0.68rem",
                  cursor: "pointer",
                }}
              >
                Retry Request
              </button>
            </div>
          )}

          {!isComplaintsLoading && !isComplaintsError && totalComplaints === 0 && (
            <div style={{ ...GLASS_CARD, padding: "30px", textAlign: "center", color: "#64748b" }}>
              <Info size={24} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.80rem", fontWeight: 600 }}>No complaints recorded</div>
              <div style={{ fontSize: "0.68rem", marginTop: 4 }}>
                Run the database seed script to populate synthetic test complaints.
              </div>
            </div>
          )}

          {!isComplaintsLoading && totalComplaints > 0 && (
            <>
              {/* ── 1. COMPLAINT STATUS SUMMARY ────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.62rem",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#94a3b8",
                      fontWeight: 700,
                    }}
                  >
                    Workflow Status Summary
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.62rem",
                      color: "#38bdf8",
                    }}
                  >
                    Total: {totalComplaints}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  {(Object.keys(STATUS_CONFIG) as CanonicalStatus[]).map((statusKey) => {
                    const conf = STATUS_CONFIG[statusKey];
                    const count = statusSummary[statusKey] || 0;
                    const pct = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;
                    const isFilterActive = selectedStatusFilter === statusKey;

                    return (
                      <motion.div
                        key={statusKey}
                        whileHover={{ translateY: -2 }}
                        onClick={() =>
                          setSelectedStatusFilter(isFilterActive ? "ALL" : statusKey)
                        }
                        style={{
                          ...GLASS_CARD,
                          padding: "12px 14px",
                          cursor: "pointer",
                          borderColor: isFilterActive ? conf.color : GLASS_CARD.border,
                          background: isFilterActive
                            ? `linear-gradient(135deg, ${conf.badgeBg} 0%, rgba(9,17,38,0.85) 100%)`
                            : GLASS_CARD.background,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: conf.dot,
                                boxShadow: `0 0 8px ${conf.dot}`,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                color: "#e2e8f0",
                              }}
                            >
                              {conf.label}
                            </span>
                          </div>
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.58rem",
                              color: "#64748b",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-display,'Sora',sans-serif)",
                              fontSize: "1.4rem",
                              fontWeight: 700,
                              color: conf.color,
                              lineHeight: 1,
                            }}
                          >
                            {count}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.58rem",
                              color: "#64748b",
                            }}
                          >
                            records
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* ── 2. YEAR-WISE COMPLAINT STATISTICS (2021-2025) ──────── */}
              <div
                style={{
                  ...GLASS_CARD,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={14} color="#38bdf8" />
                    <span
                      style={{
                        fontFamily: "var(--font-display,'Sora',sans-serif)",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      Annual Complaint Volume (2021–2025)
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.58rem",
                      color: "#64748b",
                    }}
                  >
                    Dynamic Count
                  </span>
                </div>

                {/* Recharts Bar Chart */}
                <div style={{ width: "100%", height: 160, position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yearStats}
                      margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
                      onClick={(state) => {
                        if (state && state.activeLabel) {
                          const yr = Number(state.activeLabel);
                          setSelectedYearFilter((prev) => (prev === yr ? "ALL" : yr));
                        }
                      }}
                    >
                      <XAxis
                        dataKey="year"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                      />
                      <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(56, 189, 248, 0.06)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as (typeof yearStats)[0];
                            return (
                              <div
                                style={{
                                  ...GLASS_CARD,
                                  padding: "8px 12px",
                                  border: "1px solid rgba(56, 189, 248, 0.4)",
                                  fontSize: "0.68rem",
                                }}
                              >
                                <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: 2 }}>
                                  Epoch {data.year}
                                </div>
                                <div style={{ color: "#f8fafc" }}>
                                  Total Complaints: <strong>{data.count}</strong>
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.62rem" }}>
                                  YoY Change:{" "}
                                  <span
                                    style={{
                                      color:
                                        data.isIncrease === true
                                          ? "#f87171"
                                          : data.isIncrease === false
                                            ? "#34d399"
                                            : "#cbd5e1",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {data.pctChange}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {yearStats.map((entry) => (
                          <Cell
                            key={`cell-${entry.year}`}
                            fill={
                              selectedYearFilter === entry.year
                                ? "#22d3ee"
                                : "rgba(34, 211, 238, 0.70)"
                            }
                            stroke={selectedYearFilter === entry.year ? "#ffffff" : "rgba(34, 211, 238, 0.9)"}
                            strokeWidth={selectedYearFilter === entry.year ? 1.5 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabular YoY Breakdown rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
                  {yearStats.map((item) => {
                    const isFiltered = selectedYearFilter === item.year;
                    return (
                      <div
                        key={item.year}
                        onClick={() => setSelectedYearFilter(isFiltered ? "ALL" : item.year)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: isFiltered ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.02)",
                          border: isFiltered ? "1px solid rgba(34,211,238,0.3)" : "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: isFiltered ? "#22d3ee" : "#f1f5f9",
                            }}
                          >
                            {item.year}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              color: "#64748b",
                            }}
                          >
                            {item.count} complaints
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* Mini visual indicator bar */}
                          <div
                            style={{
                              width: 60,
                              height: 4,
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.08)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(100, (item.count / 15) * 100)}%`,
                                height: "100%",
                                background: "#22d3ee",
                              }}
                            />
                          </div>

                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.62rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background:
                                item.isIncrease === true
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : item.isIncrease === false
                                    ? "rgba(52, 211, 153, 0.12)"
                                    : "rgba(255, 255, 255, 0.05)",
                              color:
                                item.isIncrease === true
                                  ? "#f87171"
                                  : item.isIncrease === false
                                    ? "#34d399"
                                    : "#94a3b8",
                              minWidth: 46,
                              textAlign: "center",
                            }}
                          >
                            {item.pctChange === "—" ? "Base Yr" : item.pctChange}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── 3. MOST AFFECTED AREAS (TOP 5) ────────────────────── */}
              <div
                style={{
                  ...GLASS_CARD,
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={14} color="#38bdf8" />
                    <span
                      style={{
                        fontFamily: "var(--font-display,'Sora',sans-serif)",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#f8fafc",
                      }}
                    >
                      Top 5 Affected Areas
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.58rem",
                      color: "#64748b",
                    }}
                  >
                    By Complaint Volume
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topAffectedAreas.map((area) => (
                    <div
                      key={area.name}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              background: "rgba(56, 189, 248, 0.15)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              color: "#38bdf8",
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.60rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            #{area.rank}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "#e2e8f0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={area.name}
                          >
                            {area.name}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: "#38bdf8",
                            }}
                          >
                            {area.count}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.58rem",
                              color: "#64748b",
                            }}
                          >
                            ({area.shareOfTotal}%)
                          </span>
                        </div>
                      </div>

                      {/* Proportional visual bar */}
                      <div
                        style={{
                          width: "100%",
                          height: 5,
                          borderRadius: 999,
                          background: "rgba(255, 255, 255, 0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${area.proportionPercent}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          style={{
                            height: "100%",
                            background: "linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── 4. DATA ACCURACY & METHODOLOGICAL DISCLOSURE ──────── */}
              <div
                style={{
                  ...GLASS_CARD,
                  padding: "12px 14px",
                  background: "rgba(15, 23, 42, 0.6)",
                  borderColor: "rgba(100, 116, 139, 0.25)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <Info size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.60rem",
                      fontWeight: 700,
                      color: "#cbd5e1",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Methodological Disclosure
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.64rem",
                      color: "#94a3b8",
                      lineHeight: 1.45,
                      fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                    }}
                  >
                    These metrics are calculated from synthetic demonstration complaint records stored in
                    PostgreSQL for municipal workflow testing. They do not represent physical encroachment
                    measurements, which are evaluated independently via satellite raster change detection.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

      {/* Reusable Centered Complaint Detail Modal */}
      <ComplaintDetailModal
        complaint={selectedModalComplaint}
        isOpen={!!selectedModalComplaint}
        onClose={() => setSelectedModalComplaint(null)}
      />
    </div>
  );
}
