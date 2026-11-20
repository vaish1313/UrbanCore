import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import {
  X,
  MessageSquare,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  ArrowRight,
} from "lucide-react";
import type { MunicipalComplaint } from "@/types/urbancore";
import { getComplaintStatusMeta, isValidComplaintCoordinate } from "@/utils/complaintMapUtils";
import { useUpdateComplaintStatus } from "@/hooks/use-municipal";

export type ComplaintDetailModalProps = {
  complaint: MunicipalComplaint | null;
  isOpen: boolean;
  onClose: () => void;
};

const STATUS_OPTIONS = [
  { value: "New", label: "New", color: "#F59E0B" },
  { value: "Under Review", label: "Under Review", color: "#3B82F6" },
  { value: "Action Taken", label: "Action Taken", color: "#8B5CF6" },
  { value: "Closed", label: "Closed", color: "#16A34A" },
] as const;

const TYPE_CONFIG: Record<string, string> = {
  "Illegal Construction": "#f87171",
  "Encroachment": "#fb923c",
  "Building Safety": "#fbbf24",
  "Zoning Violation": "#c084fc",
  "Road Obstruction": "#38bdf8",
  "Demolition Request": "#94a3b8",
};

export function ComplaintDetailModal({
  complaint,
  isOpen,
  onClose,
}: ComplaintDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [modalTargetStatus, setModalTargetStatus] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const updateStatusMutation = useUpdateComplaintStatus();

  // SSR safeguard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync target status whenever complaint changes
  useEffect(() => {
    if (complaint) {
      const currentMeta = getComplaintStatusMeta(complaint.status);
      const matchedOption = STATUS_OPTIONS.find(
        (o) => getComplaintStatusMeta(o.value).category === currentMeta.category
      );
      setModalTargetStatus(matchedOption ? matchedOption.value : "New");
      setActionFeedback(null);
    } else {
      setModalTargetStatus(null);
      setActionFeedback(null);
    }
  }, [complaint]);

  // Keyboard (Escape) & background scroll locking
  useEffect(() => {
    if (!isOpen || !complaint) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, complaint, onClose]);

  const handleApplyStatus = useCallback(async () => {
    if (!complaint || !modalTargetStatus) return;
    setActionFeedback(null);
    try {
      await updateStatusMutation.mutateAsync({
        complaintId: complaint.id,
        status: modalTargetStatus,
      });
      setActionFeedback({
        type: "success",
        message: `Status updated to "${modalTargetStatus}" successfully`,
      });
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to update complaint status";
      setActionFeedback({ type: "error", message: errMsg });
    }
  }, [complaint, modalTargetStatus, updateStatusMutation]);

  if (!mounted || !isOpen || !complaint) {
    return null;
  }

  const hasCoords = isValidComplaintCoordinate(complaint.latitude, complaint.longitude);
  const typeColor = TYPE_CONFIG[complaint.title] || "#94a3b8";

  return createPortal(
    <div
      id="complaint-detail-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 7, 18, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complaint-detail-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 680,
          maxHeight: "min(90vh, 820px)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(11, 19, 40, 0.98)",
          border: "1px solid rgba(56, 189, 248, 0.28)",
          borderRadius: 20,
          boxShadow:
            "0 25px 70px -10px rgba(0, 0, 0, 0.85), 0 0 35px rgba(34, 211, 238, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
            background: "rgba(14, 25, 52, 0.5)",
          }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.78rem",
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

            <h2
              id="complaint-detail-modal-title"
              style={{
                fontFamily: "var(--font-display,'Sora',sans-serif)",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#f8fafc",
                margin: 0,
              }}
            >
              {complaint.title || "Citizen Complaint Details"}
            </h2>
          </div>

          <button
            type="button"
            aria-label="Close complaint details"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.color = "#94a3b8";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            padding: "20px 24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Status Workflow Selector & Persistence Action */}
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(14, 25, 52, 0.65)",
              border: "1px solid rgba(56, 189, 248, 0.22)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span
                  style={{
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#22d3ee",
                    display: "block",
                    fontWeight: 700,
                  }}
                >
                  STATUS WORKFLOW & RESOLUTION
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                    fontSize: "0.74rem",
                    color: "#cbd5e1",
                  }}
                >
                  Select a resolution stage and apply updates directly to PostgreSQL.
                </span>
              </div>

              {/* Current Saved Status Badge */}
              {(() => {
                const curMeta = getComplaintStatusMeta(complaint.status);
                return (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: curMeta.badgeBg,
                      border: `1px solid ${curMeta.badgeBorder}`,
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.64rem",
                      fontWeight: 700,
                      color: curMeta.color,
                      alignSelf: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: curMeta.dotColor,
                      }}
                    />
                    Current: {curMeta.label}
                  </div>
                );
              })()}
            </div>

            {/* Interactive Status Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isTarget = modalTargetStatus === opt.value;
                const isCurrentlySaved =
                  getComplaintStatusMeta(complaint.status).category ===
                  getComplaintStatusMeta(opt.value).category;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setModalTargetStatus(opt.value)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: isTarget
                        ? `1.5px solid ${opt.color}`
                        : "1px solid rgba(255, 255, 255, 0.08)",
                      background: isTarget ? `${opt.color}18` : "rgba(255, 255, 255, 0.02)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      boxShadow: isTarget ? `0 0 16px ${opt.color}25` : "none",
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: opt.color,
                        }}
                      />
                      {isCurrentlySaved && (
                        <span
                          style={{
                            fontSize: "0.55rem",
                            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                            color: opt.color,
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          active
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: isTarget ? opt.color : "#cbd5e1",
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Save Action & Feedback */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div>
                {actionFeedback ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 10px",
                      borderRadius: 8,
                      background:
                        actionFeedback.type === "success"
                          ? "rgba(22, 163, 74, 0.18)"
                          : "rgba(239, 68, 68, 0.18)",
                      border: `1px solid ${actionFeedback.type === "success" ? "#16A34A" : "#EF4444"}`,
                      color: actionFeedback.type === "success" ? "#86efac" : "#fca5a5",
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.66rem",
                    }}
                  >
                    {actionFeedback.type === "success" ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <AlertCircle size={13} />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.62rem",
                      color: "#64748b",
                    }}
                  >
                    {modalTargetStatus &&
                    getComplaintStatusMeta(complaint.status).category !==
                      getComplaintStatusMeta(modalTargetStatus).category
                      ? `Pending change: ${getComplaintStatusMeta(complaint.status).label} → ${modalTargetStatus}`
                      : "Status is up to date."}
                  </span>
                )}
              </div>

              {(() => {
                const isPending =
                  updateStatusMutation.isPending &&
                  updateStatusMutation.variables?.complaintId === complaint.id;
                const hasChanged =
                  modalTargetStatus &&
                  getComplaintStatusMeta(complaint.status).category !==
                    getComplaintStatusMeta(modalTargetStatus).category;

                return (
                  <button
                    type="button"
                    disabled={!hasChanged || isPending}
                    onClick={handleApplyStatus}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "8px 18px",
                      borderRadius: 9,
                      background: hasChanged
                        ? "linear-gradient(135deg, #06b6d4, #3b82f6)"
                        : "rgba(255, 255, 255, 0.05)",
                      border: hasChanged ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: hasChanged ? "#ffffff" : "#64748b",
                      cursor: hasChanged && !isPending ? "pointer" : "not-allowed",
                      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      boxShadow: hasChanged ? "0 4px 18px rgba(6, 182, 212, 0.35)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={13} />
                        <span>Saving to Database...</span>
                      </>
                    ) : hasChanged ? (
                      <>
                        <span>Apply Status Update</span>
                        <ArrowRight size={13} />
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Status Active</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Spatial & Citizen Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px 18px",
              padding: "16px 18px",
              borderRadius: 14,
              background: "rgba(14, 25, 52, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Citizen Reporter
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "#f1f5f9",
                  fontWeight: 600,
                  fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                }}
              >
                {complaint.citizen_name || "Anonymous Citizen"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Submission Date & Time
              </span>
              <span
                style={{
                  fontSize: "0.76rem",
                  color: "#cbd5e1",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                }}
              >
                {complaint.created_at
                  ? new Date(complaint.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Location Name
              </span>
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "#cbd5e1",
                  fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                }}
              >
                {complaint.location_name || "Nashik Municipal Area"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                GPS Coordinates
              </span>
              {hasCoords ? (
                <span
                  style={{
                    fontSize: "0.76rem",
                    color: "#22d3ee",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontWeight: 600,
                  }}
                >
                  {complaint.latitude!.toFixed(5)}° N, {complaint.longitude!.toFixed(5)}° E
                </span>
              ) : (
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#f87171",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontWeight: 500,
                  }}
                >
                  Location coordinates unavailable
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Spatial Geometry Type
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: hasCoords ? "#34d399" : "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                }}
              >
                {hasCoords ? "geometry(Point, 4326) Verified" : "NULL (Unmapped Report)"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Database Record ID
              </span>
              <span
                style={{
                  fontSize: "0.66rem",
                  color: "#64748b",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                }}
                title={complaint.id}
              >
                {complaint.id}
              </span>
            </div>
          </div>

          {/* Official Complaint Narrative */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "14px 18px",
              borderRadius: 14,
              background: "rgba(14, 25, 52, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <span
              style={{
                fontSize: "0.62rem",
                color: "#22d3ee",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Official Complaint Narrative
            </span>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
                margin: 0,
                fontFamily: "var(--font-sans,'Manrope',sans-serif)",
              }}
            >
              {complaint.description || "No narrative details provided."}
            </p>
          </div>

          {/* Evidence or Attachment Information */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 18px",
              borderRadius: 14,
              background: "rgba(14, 25, 52, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div className="flex items-center gap-2.5">
              <FileText size={16} color="#22d3ee" />
              <div>
                <span
                  style={{
                    fontSize: "0.62rem",
                    color: "#64748b",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    display: "block",
                    textTransform: "uppercase",
                  }}
                >
                  Evidence & Attachment Reference
                </span>
                <span
                  style={{
                    fontSize: "0.76rem",
                    color: complaint.evidence_reference ? "#cbd5e1" : "#64748b",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  }}
                >
                  {complaint.evidence_reference ||
                    "No external satellite or photo evidence attached."}
                </span>
              </div>
            </div>

            <a
              href={`http://localhost:8000/api/v1/complaints/${complaint.reference_number}/receipt`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(34, 211, 238, 0.08)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
                color: "#22d3ee",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.65rem",
                fontWeight: 700,
                textDecoration: "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.16)";
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(34, 211, 238, 0.08)";
                e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.25)";
              }}
            >
              <Download size={13} />
              <span>Download PDF Receipt</span>
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.07)",
            background: "rgba(14, 25, 52, 0.5)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.62rem",
              color: "#64748b",
            }}
          >
            Press{" "}
            <kbd
              style={{
                padding: "1px 5px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#cbd5e1",
              }}
            >
              ESC
            </kbd>{" "}
            or click outside to dismiss
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 9,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              color: "#f1f5f9",
              cursor: "pointer",
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.7rem",
              fontWeight: 600,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
            }}
          >
            Close Modal
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
