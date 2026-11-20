import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  FileText,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import { useMunicipalComplaints } from "@/hooks/use-municipal";
import type { MunicipalComplaint } from "@/types/urbancore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const ease = [0.16, 1, 0.3, 1] as const;

type CitizenStatus = "New" | "Under Review" | "Action Taken" | "Closed";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ElementType; label: string }
> = {
  New: {
    bg: "rgba(99,102,241,0.1)",
    text: "#a5b4fc",
    border: "rgba(99,102,241,0.3)",
    icon: Clock,
    label: "New",
  },
  SUBMITTED: {
    bg: "rgba(99,102,241,0.1)",
    text: "#a5b4fc",
    border: "rgba(99,102,241,0.3)",
    icon: Clock,
    label: "Submitted",
  },
  "Under Review": {
    bg: "rgba(251,191,36,0.1)",
    text: "#fbbf24",
    border: "rgba(251,191,36,0.3)",
    icon: Search,
    label: "Under Review",
  },
  "Action Taken": {
    bg: "rgba(251,146,60,0.1)",
    text: "#fb923c",
    border: "rgba(251,146,60,0.3)",
    icon: AlertCircle,
    label: "Action Taken",
  },
  Closed: {
    bg: "rgba(52,211,153,0.1)",
    text: "#34d399",
    border: "rgba(52,211,153,0.3)",
    icon: CheckCircle2,
    label: "Closed",
  },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["New"];
  const Icon: React.ElementType = s.icon;
  const style: React.CSSProperties = { background: s.bg, color: s.text, borderColor: s.border };
  return (
    <span className="cs-report-status" style={style}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

function ReportCard({ complaint }: { complaint: MunicipalComplaint }) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = complaint.created_at
    ? new Date(complaint.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  return (
    <motion.div
      layout
      className="cs-myr-card"
      whileHover={expanded ? {} : { y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      transition={{ duration: 0.3 }}
    >
      {/* Card header (always visible) */}
      <button
        type="button"
        className="cs-myr-card-btn"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="cs-myr-card-left">
          <span className="cs-myr-refid">{complaint.reference_number}</span>
          <StatusBadge status={complaint.status} />
        </div>
        <div className="cs-myr-card-info">
          <p className="cs-myr-location">{complaint.location_name || "Nashik Location"}</p>
          <p className="cs-myr-meta">
            {complaint.title || "Citizen Report"} · {formattedDate}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="cs-myr-chevron"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease }}
            className="cs-myr-expanded"
          >
            <div className="cs-myr-expanded-inner">
              {/* Description */}
              <div className="cs-myr-block">
                <h4 className="cs-myr-block-title">Description</h4>
                <p className="cs-myr-block-text">{complaint.description}</p>
              </div>

              {/* Citizen Details */}
              <div className="cs-myr-block">
                <h4 className="cs-myr-block-title">Complainant / Coordinates</h4>
                <div className="cs-myr-remarks">
                  <p className="cs-myr-block-text">
                    <strong>Reported by:</strong> {complaint.citizen_name || "Citizen"}<br />
                    <strong>GPS Coordinates:</strong> {complaint.latitude?.toFixed(4)}° N, {complaint.longitude?.toFixed(4)}° E
                    {complaint.evidence_reference && (
                      <>
                        <br />
                        <strong>Reference Link:</strong> {complaint.evidence_reference}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Status & PDF Receipt */}
              <div className="cs-myr-block">
                <h4 className="cs-myr-block-title">Official Documentation</h4>
                <div className="flex items-center gap-3 pt-1">
                  <a
                    href={`${API_BASE_URL}/complaints/${complaint.reference_number}/receipt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Sworn PDF Receipt
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MyReportsProps {
  onNewReport: () => void;
}

export function MyReports({ onNewReport }: MyReportsProps) {
  const [filter, setFilter] = useState<string>("All");
  const filters = ["All", "New", "Under Review", "Action Taken", "Closed"];

  const { data, isLoading, error } = useMunicipalComplaints(100, 0);
  const complaints = data?.complaints || [];

  const filtered =
    filter === "All"
      ? complaints
      : complaints.filter((c) => {
          if (filter === "New") {
            return c.status === "New" || c.status === "SUBMITTED";
          }
          return c.status === filter;
        });

  return (
    <motion.section
      className="cs-myr-section"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease }}
    >
      {/* Header */}
      <div className="cs-myr-header">
        <div>
          <p className="cs-myr-eyebrow">
            <FileText className="h-3 w-3 inline mr-1 -mt-0.5" />
            Citizen Portal
          </p>
          <h2 className="cs-myr-title">My Submitted Reports</h2>
          <p className="cs-myr-subtitle">
            {isLoading ? "Fetching reports..." : `${complaints.length} registered reports · click to expand`}
          </p>
        </div>
        <motion.button
          type="button"
          id="new-report-btn"
          whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(34,211,238,0.25)" }}
          whileTap={{ scale: 0.97 }}
          className="cs-myr-new-btn cursor-pointer"
          onClick={onNewReport}
        >
          + New Report
        </motion.button>
      </div>

      {/* Filter chips */}
      <div className="cs-myr-filters">
        {filters.map((f) => {
          const count =
            f === "All"
              ? complaints.length
              : complaints.filter((c) =>
                  f === "New" ? c.status === "New" || c.status === "SUBMITTED" : c.status === f
                ).length;

          return (
            <button
              key={f}
              type="button"
              id={`filter-${f.toLowerCase().replace(" ", "-")}-btn`}
              className={`cs-filter-chip ${filter === f ? "cs-filter-chip--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
              {f !== "All" && <span className="cs-filter-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Reports */}
      <div className="cs-myr-list">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            <span>Loading registered complaints...</span>
          </div>
        ) : error ? (
          <div className="cs-myr-empty">
            <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
            <p className="text-rose-300">Unable to load complaints from server.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, delay: i * 0.04, ease }}
              >
                <ReportCard complaint={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="cs-myr-empty">
            <Eye className="h-8 w-8 text-slate-600 mb-2" />
            <p>No complaints found with this status.</p>
          </div>
        )}
      </div>

      <style>{`
        .cs-myr-section { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 24px 52px; }
        .cs-myr-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .cs-myr-eyebrow { font-family: var(--font-mono,monospace); font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: #22d3ee; margin: 0 0 4px; }
        .cs-myr-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 1.75rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
        .cs-myr-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
        .cs-myr-new-btn {
          background: linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);
          color: #fff; border: none; border-radius: 12px;
          padding: 11px 22px; font-size: 0.875rem; font-weight: 600;
          cursor: pointer; white-space: nowrap;
        }

        /* Filters */
        .cs-myr-filters { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
        .cs-filter-chip {
          display: flex; align-items: center; gap: 6px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #64748b;
          border-radius: 999px; padding: 6px 14px;
          font-size: 0.8125rem; cursor: pointer;
          transition: all 0.2s;
        }
        .cs-filter-chip--active { background: rgba(34,211,238,0.1); color: #22d3ee; border-color: rgba(34,211,238,0.3); }
        .cs-filter-count {
          background: rgba(255,255,255,0.08); border-radius: 999px;
          padding: 1px 7px; font-size: 0.7rem;
        }

        /* Cards */
        .cs-myr-list { display: flex; flex-direction: column; gap: 10px; }
        .cs-myr-card {
          background: rgba(13,20,40,0.72);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .cs-myr-card:hover { border-color: rgba(34,211,238,0.15); }
        .cs-myr-card-btn {
          width: 100%; display: flex; align-items: center; gap: 14px;
          padding: 16px 18px;
          background: none; border: none; cursor: pointer;
          text-align: left; flex-wrap: wrap;
        }
        .cs-myr-card-left { display: flex; align-items: center; gap: 10px; flex-shrink: 0; min-width: 220px; }
        .cs-myr-refid { font-family: var(--font-mono,monospace); font-size: 0.8125rem; color: #22d3ee; font-weight: 500; }
        .cs-report-status {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 999px; border: 1px solid;
          white-space: nowrap;
        }
        .cs-myr-card-info { flex: 1; min-width: 200px; }
        .cs-myr-location { font-size: 0.9375rem; color: #e2e8f0; font-weight: 500; margin: 0 0 2px; }
        .cs-myr-meta { font-size: 0.75rem; color: #475569; margin: 0; }
        .cs-myr-chevron { color: #334155; margin-left: auto; flex-shrink: 0; }

        /* Expanded */
        .cs-myr-expanded { overflow: hidden; }
        .cs-myr-expanded-inner { padding: 0 18px 18px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
        .cs-myr-block { display: flex; flex-direction: column; gap: 6px; }
        .cs-myr-block-title { font-size: 0.75rem; font-family: var(--font-mono,monospace); text-transform: uppercase; letter-spacing: 0.12em; color: #475569; margin: 0; }
        .cs-myr-block-text { font-size: 0.875rem; color: #94a3b8; line-height: 1.65; margin: 0; }
        .cs-myr-remarks { display: flex; gap: 8px; align-items: flex-start; background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.12); border-radius: 10px; padding: 10px 12px; }

        /* Timeline steps */
        .cs-tl-steps { display: flex; flex-wrap: wrap; gap: 0; }
        .cs-tl-step { display: flex; align-items: flex-start; gap: 8px; min-width: 110px; flex: 1; position: relative; padding-right: 16px; }
        .cs-tl-step::after { content: ""; position: absolute; right: 0; top: 10px; width: 80%; height: 1px; background: rgba(255,255,255,0.08); }
        .cs-tl-step:last-child::after { display: none; }
        .cs-tl-dot {
          width: 22px; height: 22px; border-radius: 50%;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          color: #334155; flex-shrink: 0;
          transition: all 0.2s;
        }
        .cs-tl-dot--done { background: rgba(52,211,153,0.15); border-color: rgba(52,211,153,0.4); color: #34d399; }
        .cs-tl-step-label { font-size: 0.75rem; color: #94a3b8; margin: 0 0 2px; font-weight: 500; }
        .cs-tl-step-date { font-size: 0.65rem; color: #475569; margin: 0; font-family: var(--font-mono,monospace); }

        /* Evidence */
        .cs-myr-evidence { display: flex; gap: 10px; flex-wrap: wrap; }
        .cs-myr-thumb { display: flex; flex-direction: column; gap: 4px; }
        .cs-myr-thumb-img { width: 120px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
        .cs-myr-thumb-label { font-size: 0.65rem; color: #475569; text-transform: uppercase; font-family: var(--font-mono,monospace); text-align: center; }

        /* Empty state */
        .cs-myr-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px; color: #475569; font-size: 0.9rem; }
        @media (max-width: 640px) { .cs-myr-section { padding: 0 16px 36px; } .cs-myr-card-left { min-width: unset; } }
      `}</style>
    </motion.section>
  );
}
