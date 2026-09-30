/**
 * /municipal/complaints — Citizen Complaints Queue
 *
 * Static mock data. No backend, no API.
 * Status workflow: New → Under Review → Action Taken → Closed
 * Status persists in React state only.
 * Design matches existing UrbanCore dark glassmorphism theme.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, MapPin, Clock, ChevronDown, User, Filter } from "lucide-react";

export const Route = createFileRoute("/municipal/complaints")({
  head: () => ({ meta: [{ title: "Citizen Complaints — Municipal Authority" }] }),
  component: ComplaintsPage,
});

/* ─── Mock data ──────────────────────────────────────────────────────────── */

export type ComplaintStatus = "New" | "Under Review" | "Action Taken" | "Closed";
export type ComplaintType   =
  | "Illegal Construction"
  | "Encroachment"
  | "Building Safety"
  | "Zoning Violation"
  | "Road Obstruction"
  | "Demolition Request";

interface Complaint {
  id:           string;
  citizenName:  string;
  location:     string;
  type:         ComplaintType;
  reportedDate: string;
  description:  string;
  status:       ComplaintStatus;
}

const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "CMP-2025-0041",
    citizenName:  "Rajesh Patil",
    location:     "Gangapur Road, Plot 14A, Nashik",
    type:         "Illegal Construction",
    reportedDate: "12 Jan 2025",
    description:  "7-storey commercial building being constructed without visible approval notice on site. Work ongoing past 10 PM.",
    status:       "New",
  },
  {
    id: "CMP-2025-0039",
    citizenName:  "Sunita Deshmukh",
    location:     "Godavari Floodplain, Panchavati, Nashik",
    type:         "Encroachment",
    reportedDate: "10 Jan 2025",
    description:  "New concrete foundation poured within the 50m Godavari river buffer. Construction visible from Ramkund Ghat.",
    status:       "Under Review",
  },
  {
    id: "CMP-2025-0037",
    citizenName:  "Amol Shinde",
    location:     "Anjaneri Hill Reserve, Nashik",
    type:         "Zoning Violation",
    reportedDate: "08 Jan 2025",
    description:  "Heavy machinery clearing forest near boundary pillars of Anjaneri reserved forest. No forest department notice posted.",
    status:       "Under Review",
  },
  {
    id: "CMP-2025-0034",
    citizenName:  "Priya Kulkarni",
    location:     "Trimbakeshwar Foothills",
    type:         "Building Safety",
    reportedDate: "05 Jan 2025",
    description:  "Unsupported retaining wall built on steep slope (approx 25° gradient). Poses landslide risk to nearby residences.",
    status:       "Action Taken",
  },
  {
    id: "CMP-2025-0031",
    citizenName:  "Vinod Jadhav",
    location:     "Pathardi Phata Sector 3, Nashik",
    type:         "Illegal Construction",
    reportedDate: "02 Jan 2025",
    description:  "10-floor residential tower started without civic amenity clearance. Development plan shows only 4-floor permissible.",
    status:       "New",
  },
  {
    id: "CMP-2024-0198",
    citizenName:  "Meena Sawant",
    location:     "Satpur MIDC, Phase 2, Nashik",
    type:         "Road Obstruction",
    reportedDate: "28 Dec 2024",
    description:  "Industrial construction material stacked on public service road for 3 weeks. Emergency vehicles cannot pass.",
    status:       "Action Taken",
  },
  {
    id: "CMP-2024-0187",
    citizenName:  "Deepak More",
    location:     "Canada Corner, Nashik",
    type:         "Demolition Request",
    reportedDate: "20 Dec 2024",
    description:  "Dilapidated 3-storey structure adjacent to a school. Portion of roof collapsed after monsoon. Structural survey requested.",
    status:       "Closed",
  },
  {
    id: "CMP-2024-0175",
    citizenName:  "Kavita Borse",
    location:     "Indira Nagar, Nashik",
    type:         "Zoning Violation",
    reportedDate: "15 Dec 2024",
    description:  "Residential plot converted to commercial wedding hall without change of use permission. Parking spills onto public road.",
    status:       "Closed",
  },
  {
    id: "CMP-2025-0044",
    citizenName:  "Sanjay Nikam",
    location:     "Ambad MIDC Plot 88",
    type:         "Building Safety",
    reportedDate: "15 Jan 2025",
    description:  "Industrial shed wall visibly tilting after monsoon damage. Temporary props installed but permanent repair not done.",
    status:       "New",
  },
  {
    id: "CMP-2025-0046",
    citizenName:  "Lata Wagh",
    location:     "CBS Bus Stand Area, Nashik",
    type:         "Encroachment",
    reportedDate: "16 Jan 2025",
    description:  "Footpath encroached by permanent kiosk structure. Originally granted temporary permission in 2022, never vacated.",
    status:       "New",
  },
];

/* ─── Design tokens ──────────────────────────────────────────────────────── */

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.80)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 16,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.38)",
};

const STATUS_CONFIG: Record<ComplaintStatus, {
  bg: string; border: string; text: string; dot: string;
}> = {
  "New":          { bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.30)",  text: "#a5b4fc", dot: "#818cf8" },
  "Under Review": { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.30)",  text: "#fbbf24", dot: "#fbbf24" },
  "Action Taken": { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.30)",  text: "#fb923c", dot: "#fb923c" },
  "Closed":       { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.30)",  text: "#34d399", dot: "#34d399" },
};

const TYPE_CONFIG: Record<ComplaintType, string> = {
  "Illegal Construction": "#f87171",
  "Encroachment":         "#fb923c",
  "Building Safety":      "#fbbf24",
  "Zoning Violation":     "#c084fc",
  "Road Obstruction":     "#38bdf8",
  "Demolition Request":   "#94a3b8",
};

const STATUS_ORDER: ComplaintStatus[] = ["New", "Under Review", "Action Taken", "Closed"];
const ALL_TYPES = ["All", "Illegal Construction", "Encroachment", "Building Safety", "Zoning Violation", "Road Obstruction", "Demolition Request"] as const;

/* ─── Component ─────────────────────────────────────────────────────────── */

function ComplaintsPage() {
  const [statuses, setStatuses] = useState<Record<string, ComplaintStatus>>(
    () => Object.fromEntries(MOCK_COMPLAINTS.map((c) => [c.id, c.status])),
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [filterType,   setFilterType]   = useState<typeof ALL_TYPES[number]>("All");
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "All">("All");

  const advanceStatus = (id: string, next: ComplaintStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: next }));
    setOpenDropdown(null);
  };

  const filtered = MOCK_COMPLAINTS.filter((c) => {
    if (filterType   !== "All" && c.type   !== filterType)            return false;
    if (filterStatus !== "All" && statuses[c.id] !== filterStatus)    return false;
    return true;
  });

  /* summary counts */
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = Object.values(statuses).filter((v) => v === s).length;
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
                  {counts[s]}
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

      {/* ── Complaint list ────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence>
          {filtered.map((complaint, idx) => {
            const status = statuses[complaint.id] ?? complaint.status;
            const cfg    = STATUS_CONFIG[status];
            const typeColor = TYPE_CONFIG[complaint.type];
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
                      {complaint.id}
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
                      {complaint.type}
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
                        {complaint.citizenName}
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
                        {complaint.reportedDate}
                      </span>
                    </div>
                  </div>

                  {/* location */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={11} color="#22d3ee" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                        fontSize: "0.68rem",
                        color: "#64748b",
                      }}
                    >
                      {complaint.location}
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 12px",
                        borderRadius: 8,
                        border: `1px solid ${cfg.border}`,
                        background: cfg.bg,
                        cursor: "pointer",
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

        {filtered.length === 0 && (
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
