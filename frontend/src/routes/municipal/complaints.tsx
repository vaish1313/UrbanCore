/**
 * /municipal/complaints — Citizen Complaints Queue
 *
 * Real API-backed complaints page.
 * Status workflow: New -> Under Review -> Action Taken -> Closed
 * Design matches existing UrbanCore dark glassmorphism theme.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, MapPin, Clock, ChevronDown, User, Filter, AlertCircle, Loader2 } from "lucide-react";
import { useMunicipalComplaints, useUpdateComplaintStatus } from "@/hooks/use-municipal";
import type { MunicipalComplaint } from "@/types/urbancore";

export const Route = createFileRoute("/municipal/complaints")({
  head: () => ({ meta: [{ title: "Citizen Complaints — Municipal Authority" }] }),
  component: ComplaintsPage,
});

/* ─── Design tokens ──────────────────────────────────────────────────────── */

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.80)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 16,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.38)",
};

const STATUS_CONFIG: Record<string, {
  bg: string; border: string; text: string; dot: string;
}> = {
  "New":          { bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.30)",  text: "#a5b4fc", dot: "#818cf8" },
  "Under Review": { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)",  text: "#fbbf24", dot: "#fbbf24" },
  "Action Taken": { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.30)",  text: "#fb923c", dot: "#fb923c" },
  "Closed":       { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.30)",  text: "#34d399", dot: "#34d399" },
};

const DEFAULT_STATUS_CFG = { bg: "rgba(148,163,184,0.10)", border: "rgba(148,163,184,0.30)", text: "#94a3b8", dot: "#94a3b8" };

const TYPE_CONFIG: Record<string, string> = {
  "Illegal Construction": "#f87171",
  "Encroachment":         "#fb923c",
  "Building Safety":      "#fbbf24",
  "Zoning Violation":     "#c084fc",
  "Road Obstruction":     "#38bdf8",
  "Demolition Request":   "#94a3b8",
};

const STATUS_ORDER = ["New", "Under Review", "Action Taken", "Closed"];
const ALL_TYPES = ["All", "Illegal Construction", "Encroachment", "Building Safety", "Zoning Violation", "Road Obstruction", "Demolition Request"] as const;

/* ─── Component ─────────────────────────────────────────────────────────── */

function ComplaintsPage() {
  const { data, isLoading, error } = useMunicipalComplaints();
  const updateStatusMutation = useUpdateComplaintStatus();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [filterType,   setFilterType]   = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const complaints = data?.complaints || [];

  const advanceStatus = (id: string, next: string) => {
    updateStatusMutation.mutate({ complaintId: id, status: next });
    setOpenDropdown(null);
  };

  const filtered = complaints.filter((c) => {
    if (filterType !== "All" && c.title !== filterType) return false;
    if (filterStatus !== "All" && c.status !== filterStatus) return false;
    return true;
  });

  /* summary counts */
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = complaints.filter((c) => c.status === s).length;
    return acc;
  }, {});

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        top: 56,
        zIndex: 0,
        display: "flex",
        flexDirection: "column",
        background: "rgba(8,13,28,0.92)",
        overflowY: "auto",
        padding: "16px 18px 40px",
        gap: 14,
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquare size={16} color="#22d3ee" />
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.58rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#22d3ee",
                marginBottom: 2,
              }}
            >
              MUNICIPAL AUTHORITY
            </div>
            <div
              style={{
                fontFamily: "var(--font-display,'Sora',sans-serif)",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#f1f5f9",
              }}
            >
              Citizen Complaints Queue
            </div>
          </div>
        </div>

        {/* status summary pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {STATUS_ORDER.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(filterStatus === s ? "All" : s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 999,
                  border: `1px solid ${filterStatus === s ? cfg.border : "rgba(255,255,255,0.08)"}`,
                  background: filterStatus === s ? cfg.bg : "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: filterStatus === s ? cfg.text : "#475569",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: cfg.dot,
                  }}
                />
                {s}
                <span style={{ color: filterStatus === s ? cfg.text : "#334155" }}>
                  {counts[s] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Type filter bar ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Filter size={12} color="#475569" />
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            style={{
              padding: "3px 10px",
              borderRadius: 999,
              border: `1px solid ${filterType === t ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.07)"}`,
              background: filterType === t ? "rgba(34,211,238,0.10)" : "transparent",
              cursor: "pointer",
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.6rem",
              color: filterType === t ? "#22d3ee" : "#475569",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
          <Loader2 className="animate-spin" size={24} color="#22d3ee" />
        </div>
      ) : error ? (
        <div style={{ ...PANEL, padding: 32, display: "flex", alignItems: "center", gap: 12, color: "#f87171" }}>
          <AlertCircle size={20} />
          <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.75rem" }}>
            Failed to load complaints. Please check server connection.
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AnimatePresence>
            {filtered.map((complaint, idx) => {
              const status = complaint.status;
              const cfg    = STATUS_CONFIG[status] || DEFAULT_STATUS_CFG;
              const typeColor = TYPE_CONFIG[complaint.title] || "#94a3b8";
              const isOpen = openDropdown === complaint.id;

              return (
                <motion.div
                  key={complaint.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22, delay: idx * 0.03 }}
                  style={{
                    ...PANEL,
                    padding: "14px 16px",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "10px 16px",
                    alignItems: "start",
                    opacity: updateStatusMutation.isPending && updateStatusMutation.variables?.complaintId === complaint.id ? 0.6 : 1,
                  }}
                >
                  {/* left: main content */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: "#22d3ee",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {complaint.reference_number}
                      </span>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          color: typeColor,
                          background: `${typeColor}12`,
                          border: `1px solid ${typeColor}28`,
                        }}
                      >
                        {complaint.title}
                      </span>
                    </div>

                    {/* citizen + date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <User size={11} color="#475569" />
                        <span
                          style={{
                            fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            color: "#cbd5e1",
                          }}
                        >
                          {complaint.citizen_name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={10} color="#475569" />
                        <span
                          style={{
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.62rem",
                            color: "#475569",
                          }}
                        >
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* location (lat/lon if no name) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={11} color="#22d3ee" style={{ flexShrink: 0 }} />
                      <span
                        style={{
                          fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                          fontSize: "0.68rem",
                          color: "#64748b",
                        }}
                      >
                        Lat: {complaint.latitude?.toFixed(4)}, Lng: {complaint.longitude?.toFixed(4)}
                      </span>
                    </div>

                    {/* description */}
                    <p
                      style={{
                        fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                        fontSize: "0.7rem",
                        color: "#475569",
                        lineHeight: 1.5,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                        overflow: "hidden",
                      }}
                    >
                      {complaint.description}
                    </p>
                  </div>

                  {/* right: status control */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    {/* current status pill + dropdown trigger */}
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : complaint.id)}
                        disabled={updateStatusMutation.isPending}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: `1px solid ${cfg.border}`,
                          background: cfg.bg,
                          cursor: updateStatusMutation.isPending ? "not-allowed" : "pointer",
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: cfg.text,
                          whiteSpace: "nowrap",
                          transition: "all 0.15s",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: cfg.dot,
                            flexShrink: 0,
                          }}
                        />
                        {status}
                        <ChevronDown
                          size={11}
                          style={{
                            transition: "transform 0.2s",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>

                      {/* dropdown */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              right: 0,
                              zIndex: 50,
                              minWidth: 160,
                              background: "rgba(10,16,34,0.97)",
                              border: "1px solid rgba(34,211,238,0.18)",
                              borderRadius: 12,
                              boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
                              backdropFilter: "blur(20px)",
                              overflow: "hidden",
                            }}
                          >
                            {STATUS_ORDER.map((s, i) => {
                              const sc = STATUS_CONFIG[s];
                              const isCurrent = s === status;
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => advanceStatus(complaint.id, s)}
                                  disabled={isCurrent}
                                  style={{
                                    width: "100%",
                                    padding: "9px 14px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: isCurrent ? sc.bg : "transparent",
                                    border: "none",
                                    borderBottom:
                                      i < STATUS_ORDER.length - 1
                                        ? "1px solid rgba(255,255,255,0.04)"
                                        : "none",
                                    cursor: isCurrent ? "default" : "pointer",
                                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                    fontSize: "0.66rem",
                                    fontWeight: isCurrent ? 700 : 500,
                                    color: isCurrent ? sc.text : "#64748b",
                                    textAlign: "left",
                                    transition: "background 0.12s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isCurrent) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                                  }}
                                >
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      background: sc.dot,
                                      flexShrink: 0,
                                    }}
                                  />
                                  {s}
                                  {isCurrent && (
                                    <span style={{ marginLeft: "auto", fontSize: "0.58rem", opacity: 0.7 }}>
                                      current
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && filtered.length === 0 && (
            <div
              style={{
                ...PANEL,
                padding: "32px",
                textAlign: "center",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.72rem",
                color: "#334155",
              }}
            >
              No complaints match the selected filters.
            </div>
          )}
        </div>
      )}

      {/* click-outside to close dropdown */}
      {openDropdown && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 40 }}
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
