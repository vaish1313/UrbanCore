/**
 * /municipal/complaints — Citizen Complaints Queue
 *
 * Real API-backed complaints queue with centered detail modal,
 * persistent PostgreSQL status management, refined glassmorphism theme,
 * and responsive alignment that naturally flows above the footer.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  MapPin,
  Clock,
  ChevronDown,
  User,
  Filter,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Download,
  Eye,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useMunicipalComplaints, useUpdateComplaintStatus } from "@/hooks/use-municipal";
import type { MunicipalComplaint } from "@/types/urbancore";
import { getComplaintStatusMeta, isValidComplaintCoordinate } from "@/utils/complaintMapUtils";
import { ComplaintDetailModal } from "@/components/urbancore/municipal/ComplaintDetailModal";

type ComplaintsSearch = {
  complaintId?: string;
};

export const Route = createFileRoute("/municipal/complaints")({
  validateSearch: (search: Record<string, unknown>): ComplaintsSearch => ({
    complaintId: search.complaintId as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Citizen Complaints Queue — Municipal Authority" }] }),
  component: ComplaintsPage,
});

/* ─── Status & Type Config ───────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "#F59E0B", description: "Recently submitted report" },
  { value: "Under Review", label: "Under Review", color: "#3B82F6", description: "Assigned for verification" },
  { value: "Action Taken", label: "Action Taken", color: "#8B5CF6", description: "Enforcement initiated" },
  { value: "Closed", label: "Closed", color: "#16A34A", description: "Case resolved or closed" },
] as const;

const TYPE_CONFIG: Record<string, string> = {
  "Illegal Construction": "#f87171",
  "Encroachment": "#fb923c",
  "Building Safety": "#fbbf24",
  "Zoning Violation": "#c084fc",
  "Road Obstruction": "#38bdf8",
  "Demolition Request": "#94a3b8",
};

const ALL_TYPES = [
  "All",
  "Illegal Construction",
  "Encroachment",
  "Building Safety",
  "Zoning Violation",
  "Road Obstruction",
  "Demolition Request",
] as const;

/* ─── Main Component ─────────────────────────────────────────────────────── */

function ComplaintsPage() {
  const { complaintId } = Route.useSearch();
  const { data, isLoading, isFetching, error, refetch } = useMunicipalComplaints(100, 0);
  const updateStatusMutation = useUpdateComplaintStatus();

  const [mounted, setMounted] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [modalTargetStatus, setModalTargetStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [actionFeedback, setActionFeedback] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const complaints = data?.complaints || [];

  // SSR hydration safeguard for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select complaint from URL search parameter
  useEffect(() => {
    if (complaintId && complaints.length > 0) {
      const target = complaints.find(
        (c) => c.id === complaintId || c.reference_number === complaintId
      );
      if (target) {
        setSelectedDetailId(target.id);
      }
    }
  }, [complaintId, complaints]);

  // Click-outside listener for quick dropdowns
  useEffect(() => {
    if (!openDropdownId) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [openDropdownId]);

  // Modal keyboard (Escape) listener and scroll locking
  useEffect(() => {
    if (!selectedDetailId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDetailId(null);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDetailId]);

  const selectedDetailComplaint = useMemo(() => {
    return complaints.find((c) => c.id === selectedDetailId) || null;
  }, [complaints, selectedDetailId]);

  // Sync modal target status whenever a complaint is opened
  useEffect(() => {
    if (selectedDetailComplaint) {
      const currentMeta = getComplaintStatusMeta(selectedDetailComplaint.status);
      const matchedOption = STATUS_OPTIONS.find(
        (o) => getComplaintStatusMeta(o.value).category === currentMeta.category
      );
      setModalTargetStatus(matchedOption ? matchedOption.value : "New");
    } else {
      setModalTargetStatus(null);
    }
  }, [selectedDetailComplaint]);

  // Advance / update status mutation
  const advanceStatus = useCallback(
    async (id: string, nextStatus: string) => {
      setOpenDropdownId(null);
      setActionFeedback(null);
      try {
        await updateStatusMutation.mutateAsync({ complaintId: id, status: nextStatus });
        setActionFeedback({
          id,
          type: "success",
          message: `Status updated to "${nextStatus}" successfully`,
        });
        setTimeout(() => {
          setActionFeedback((prev) => (prev?.id === id ? null : prev));
        }, 4000);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to update complaint status";
        setActionFeedback({ id, type: "error", message: errMsg });
      }
    },
    [updateStatusMutation]
  );

  // Filter complaints based on type and status category
  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (filterType !== "All" && c.title !== filterType) return false;
      if (filterStatus !== "All") {
        const meta = getComplaintStatusMeta(c.status);
        if (filterStatus === "New" && meta.category !== "new") return false;
        if (filterStatus === "Under Review" && meta.category !== "under_review") return false;
        if (filterStatus === "Action Taken" && meta.category !== "action_taken") return false;
        if (filterStatus === "Closed" && meta.category !== "closed") return false;
      }
      return true;
    });
  }, [complaints, filterType, filterStatus]);

  // Status counts normalized through getComplaintStatusMeta
  const counts = useMemo(() => {
    const acc = { All: complaints.length, New: 0, "Under Review": 0, "Action Taken": 0, Closed: 0 };
    for (const c of complaints) {
      const meta = getComplaintStatusMeta(c.status);
      if (meta.category === "new") acc.New++;
      else if (meta.category === "under_review") acc["Under Review"]++;
      else if (meta.category === "action_taken") acc["Action Taken"]++;
      else if (meta.category === "closed") acc.Closed++;
    }
    return acc;
  }, [complaints]);

  return (
    <div
      className="w-full flex-1 py-8 px-4 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(180deg, #090e24 0%, #060a19 60%, #030611 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* ── Top Header Section ────────────────────────────────────────── */}
        <div
          style={{
            background: "rgba(13, 22, 45, 0.72)",
            border: "1px solid rgba(56, 189, 248, 0.16)",
            borderRadius: 18,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
            padding: "20px 24px",
          }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(34, 211, 238, 0.10)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MessageSquare size={22} color="#22d3ee" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#22d3ee",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                MUNICIPAL AUTHORITY · CITIZEN COMPLIANCE
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display,'Sora',sans-serif)",
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Citizen Complaints Queue
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                  fontSize: "0.78rem",
                  color: "#94a3b8",
                  margin: "2px 0 0",
                }}
              >
                Review incoming citizen complaints, verify spatial coordinates, and update case statuses.
              </p>
            </div>
          </div>

          {/* Right Action: Refresh button & Total Indicator */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh complaints from PostgreSQL"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "#cbd5e1",
                cursor: isFetching ? "wait" : "pointer",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.68rem",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.08)";
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.3)";
                e.currentTarget.style.color = "#22d3ee";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.10)";
                e.currentTarget.style.color = "#cbd5e1";
              }}
            >
              <RefreshCw size={12} className={isFetching ? "animate-spin text-cyan-400" : ""} />
              <span>{isFetching ? "Refreshing..." : "Refresh Queue"}</span>
            </button>

            <div
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.15)",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.68rem",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>Total:</span>
              <strong style={{ color: "#22d3ee", fontWeight: 700 }}>{complaints.length}</strong>
            </div>
          </div>
        </div>

        {/* ── Filters & Status Summary Bar ──────────────────────────────── */}
        <div
          style={{
            background: "rgba(13, 22, 45, 0.65)",
            border: "1px solid rgba(56, 189, 248, 0.14)",
            borderRadius: 16,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            padding: "16px 20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
          }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          {/* Status summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.62rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginRight: 4,
              }}
            >
              Status:
            </span>

            <button
              type="button"
              onClick={() => setFilterStatus("All")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                border: `1px solid ${filterStatus === "All" ? "rgba(34, 211, 238, 0.6)" : "rgba(255, 255, 255, 0.08)"}`,
                background: filterStatus === "All" ? "rgba(34, 211, 238, 0.12)" : "rgba(15, 23, 42, 0.5)",
                cursor: "pointer",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.66rem",
                fontWeight: 700,
                color: filterStatus === "All" ? "#22d3ee" : "#94a3b8",
                transition: "all 0.15s",
              }}
            >
              All Records
              <span style={{ color: filterStatus === "All" ? "#22d3ee" : "#64748b" }}>
                {counts.All}
              </span>
            </button>

            {STATUS_OPTIONS.map((opt) => {
              const count = counts[opt.value as keyof typeof counts] || 0;
              const isSelected = filterStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilterStatus(isSelected ? "All" : opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `1px solid ${isSelected ? `${opt.color}90` : "rgba(255, 255, 255, 0.08)"}`,
                    background: isSelected ? `${opt.color}20` : "rgba(15, 23, 42, 0.5)",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    color: isSelected ? opt.color : "#94a3b8",
                    boxShadow: isSelected ? `0 0 12px ${opt.color}35` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: opt.color,
                    }}
                  />
                  {opt.label}
                  <span style={{ color: isSelected ? opt.color : "#64748b" }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Type filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 mr-1 text-slate-500">
              <Filter size={12} />
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Category:
              </span>
            </div>

            {ALL_TYPES.map((t) => {
              const isSelected = filterType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: `1px solid ${isSelected ? "rgba(34, 211, 238, 0.5)" : "rgba(255, 255, 255, 0.07)"}`,
                    background: isSelected ? "rgba(34, 211, 238, 0.12)" : "transparent",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.62rem",
                    color: isSelected ? "#22d3ee" : "#94a3b8",
                    transition: "all 0.15s",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Feedback Banner */}
        <AnimatePresence>
          {actionFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 10,
                background:
                  actionFeedback.type === "success"
                    ? "rgba(22, 163, 74, 0.16)"
                    : "rgba(239, 68, 68, 0.16)",
                border: `1px solid ${actionFeedback.type === "success" ? "#16A34A" : "#EF4444"}`,
                color: actionFeedback.type === "success" ? "#86efac" : "#fca5a5",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.72rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              }}
            >
              {actionFeedback.type === "success" ? (
                <CheckCircle2 size={15} />
              ) : (
                <AlertCircle size={15} />
              )}
              <span>{actionFeedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Content Area ─────────────────────────────────────────── */}
        {isLoading ? (
          <div
            style={{
              background: "rgba(13, 22, 45, 0.65)",
              border: "1px solid rgba(56, 189, 248, 0.14)",
              borderRadius: 16,
              padding: "70px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <Loader2 className="animate-spin" size={28} color="#22d3ee" />
            <span
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.75rem",
                color: "#94a3b8",
              }}
            >
              Loading citizen complaints queue...
            </span>
          </div>
        ) : error ? (
          <div
            style={{
              background: "rgba(13, 22, 45, 0.7)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 16,
              padding: "28px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              color: "#f87171",
            }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={22} />
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.78rem",
                }}
              >
                Failed to load complaints from backend API. Please ensure the backend server is running.
              </span>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                cursor: "pointer",
                fontSize: "0.72rem",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontWeight: 600,
              }}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <AnimatePresence>
              {filtered.map((complaint, idx) => {
                const meta = getComplaintStatusMeta(complaint.status);
                const typeColor = TYPE_CONFIG[complaint.title] || "#94a3b8";
                const isDropdownOpen = openDropdownId === complaint.id;
                const isUpdatingThis =
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.complaintId === complaint.id;
                const hasCoords = isValidComplaintCoordinate(
                  complaint.latitude,
                  complaint.longitude
                );

                return (
                  <motion.div
                    key={complaint.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.22, delay: Math.min(idx * 0.02, 0.25) }}
                    style={{
                      background: "rgba(14, 25, 52, 0.72)",
                      border: isDropdownOpen
                        ? "1px solid rgba(34, 211, 238, 0.45)"
                        : "1px solid rgba(56, 189, 248, 0.16)",
                      borderRadius: 16,
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      boxShadow: isDropdownOpen
                        ? "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.12)"
                        : "0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                      padding: "16px 20px",
                      position: "relative",
                      zIndex: isDropdownOpen ? 30 : 1,
                      transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/35 hover:bg-[#101e40]"
                  >
                    {/* Left: main complaint content (Clickable to open centered modal) */}
                    <div
                      onClick={() => setSelectedDetailId(complaint.id)}
                      style={{ cursor: "pointer" }}
                      className="flex-1 flex flex-col gap-2.5"
                    >
                      {/* Top row: Reference ID + Category Pill */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          style={{
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#22d3ee",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {complaint.reference_number}
                        </span>

                        <span
                          style={{
                            padding: "2px 9px",
                            borderRadius: 999,
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            color: typeColor,
                            background: `${typeColor}15`,
                            border: `1px solid ${typeColor}30`,
                          }}
                        >
                          {complaint.title || "Complaint"}
                        </span>
                      </div>

                      {/* Citizen info + Date + Geolocation */}
                      <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User size={13} color="#64748b" />
                          <span
                            style={{
                              fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              color: "#cbd5e1",
                            }}
                          >
                            {complaint.citizen_name || "Anonymous Citizen"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock size={12} color="#64748b" />
                          <span
                            style={{
                              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                              fontSize: "0.66rem",
                              color: "#94a3b8",
                            }}
                          >
                            {complaint.created_at
                              ? new Date(complaint.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin
                            size={13}
                            color={hasCoords ? "#22d3ee" : "#f87171"}
                            style={{ flexShrink: 0 }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                              fontSize: "0.72rem",
                              color: hasCoords ? "#94a3b8" : "#fca5a5",
                            }}
                          >
                            {complaint.location_name
                              ? hasCoords
                                ? `${complaint.location_name} (${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)})`
                                : `${complaint.location_name} · Location coordinates unavailable`
                              : hasCoords
                                ? `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`
                                : "Location coordinates unavailable"}
                          </span>
                        </div>
                      </div>

                      {/* Description preview */}
                      <p
                        style={{
                          fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                          fontSize: "0.74rem",
                          color: "#94a3b8",
                          lineHeight: 1.5,
                          margin: 0,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                          overflow: "hidden",
                        }}
                      >
                        {complaint.description || "No narrative details provided."}
                      </p>
                    </div>

                    {/* Right: Actions & Status Control */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* View Details Modal Trigger */}
                      <button
                        type="button"
                        title="Open centered complaint detail modal"
                        onClick={() => setSelectedDetailId(complaint.id)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 9,
                          border: "1px solid rgba(56, 189, 248, 0.2)",
                          background: "rgba(34, 211, 238, 0.06)",
                          color: "#38bdf8",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                          fontSize: "0.66rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(34, 211, 238, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.5)";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(34, 211, 238, 0.06)";
                          e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)";
                          e.currentTarget.style.color = "#38bdf8";
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>

                      {/* Interactive Status Dropdown Menu */}
                      <div
                        ref={isDropdownOpen ? dropdownRef : undefined}
                        style={{ position: "relative" }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(isDropdownOpen ? null : complaint.id);
                          }}
                          disabled={isUpdatingThis}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 9,
                            border: `1px solid ${meta.badgeBorder}`,
                            background: meta.badgeBg,
                            cursor: isUpdatingThis ? "wait" : "pointer",
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            color: meta.color,
                            whiteSpace: "nowrap",
                            transition: "all 0.15s",
                            outline: "none",
                          }}
                        >
                          {isUpdatingThis ? (
                            <Loader2 className="animate-spin" size={12} color={meta.color} />
                          ) : (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                background: meta.dotColor,
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span>{meta.label}</span>
                          <ChevronDown
                            size={12}
                            style={{
                              transition: "transform 0.2s",
                              transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                          />
                        </button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.98 }}
                              transition={{ duration: 0.12 }}
                              style={{
                                position: "absolute",
                                top: "calc(100% + 6px)",
                                right: 0,
                                zIndex: 100,
                                minWidth: 190,
                                background: "rgba(10, 18, 38, 0.98)",
                                border: "1px solid rgba(56, 189, 248, 0.25)",
                                borderRadius: 12,
                                boxShadow: "0 12px 40px rgba(0, 0, 0, 0.75)",
                                backdropFilter: "blur(24px)",
                                overflow: "hidden",
                                padding: "5px 0",
                              }}
                            >
                              <div
                                style={{
                                  padding: "6px 14px 4px",
                                  fontSize: "0.58rem",
                                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                  color: "#64748b",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                }}
                              >
                                Update Status
                              </div>
                              {STATUS_OPTIONS.map((opt) => {
                                const isCurrent =
                                  opt.value.toLowerCase() ===
                                    (complaint.status || "").toLowerCase() ||
                                  (opt.value === "New" && complaint.status === "SUBMITTED");
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      advanceStatus(complaint.id, opt.value);
                                    }}
                                    style={{
                                      width: "100%",
                                      padding: "8px 14px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      background: isCurrent ? `${opt.color}15` : "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                                      fontSize: "0.68rem",
                                      fontWeight: isCurrent ? 700 : 500,
                                      color: isCurrent ? opt.color : "#94a3b8",
                                      textAlign: "left",
                                      transition: "background 0.12s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isCurrent)
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                          "rgba(255,255,255,0.06)";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isCurrent)
                                        (e.currentTarget as HTMLButtonElement).style.background =
                                          "transparent";
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: opt.color,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span>{opt.label}</span>
                                    {isCurrent && (
                                      <span
                                        style={{
                                          marginLeft: "auto",
                                          fontSize: "0.58rem",
                                          opacity: 0.85,
                                          color: opt.color,
                                        }}
                                      >
                                        active
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
                  background: "rgba(13, 22, 45, 0.65)",
                  border: "1px solid rgba(56, 189, 248, 0.14)",
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.78rem",
                    color: "#94a3b8",
                  }}
                >
                  No citizen complaints match the selected filters.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("All");
                    setFilterStatus("All");
                  }}
                  style={{
                    marginTop: 6,
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "rgba(34, 211, 238, 0.08)",
                    border: "1px solid rgba(34, 211, 238, 0.25)",
                    color: "#22d3ee",
                    cursor: "pointer",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.68rem",
                  }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Centered Complaint Detail Modal ───────────────────────────── */}
      <ComplaintDetailModal
        complaint={selectedDetailComplaint}
        isOpen={!!selectedDetailComplaint}
        onClose={() => setSelectedDetailId(null)}
      />
    </div>
  );
}
