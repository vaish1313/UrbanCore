/**
 * /municipal/forensics — Case Forensics & Change Telemetry page.
 * Renders the CaseForensics section from MunicipalGISDashboard in isolation.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Satellite, MapPin, FileText, CheckCircle2, Flag } from "lucide-react";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/forensics")({
  head: () => ({
    meta: [{ title: "Case Forensics — Municipal Authority" }],
  }),
  component: ForensicsPage,
});

const T = {
  cyan: "#22d3ee", cyan500: "#06b6d4", blue500: "#3b82f6",
  slate100: "#f1f5f9", slate200: "#e2e8f0", slate300: "#cbd5e1",
  slate400: "#94a3b8", slate500: "#64748b",
  sevHigh: { bg: "rgba(239,68,68,0.15)", text: "#f87171", border: "rgba(239,68,68,0.3)" },
} as const;

const PANEL: React.CSSProperties = {
  background: "rgba(13,20,40,0.72)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
};

const YEAR_NODES = [
  { year: 2021, left: "2%",  top: "78%" },
  { year: 2022, left: "26%", top: "35%" },
  { year: 2023, left: "50%", top: "8%"  },
  { year: 2024, left: "74%", top: "35%" },
  { year: 2025, left: "98%", top: "78%" },
];

function StatusPill({ label, colors }: { label: string; colors: { bg: string; text: string; border: string } }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "3px 10px",
      borderRadius: 999, border: `1px solid ${colors.border}`,
      background: colors.bg, color: colors.text,
      fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
    }}>
      {label}
    </span>
  );
}

function ForensicsPage() {
  const navigate = useNavigate();
  const [val, setVal] = useState(2021);
  const t = (val - 2021) / 4;
  const intensity = Math.round(8 + t * 84);
  const stage = intensity < 25 ? "Pristine" : intensity < 55 ? "Emerging" : intensity < 80 ? "Active Incursion" : "Critical";
  const velocity = Math.round(t * 84);
  const nearest = Math.round(val);

  return (
    <MunicipalPageShell
      eyebrow="Deep Investigation"
      eyebrowIcon={<Eye size={13} />}
      title="Case Forensics & Change Telemetry"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>

        {/* Chrono-dial */}
        <motion.div whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
          style={{ ...PANEL, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: T.cyan, flexShrink: 0 }}>
                <Satellite size={18} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: 14, color: T.slate100, fontWeight: 700 }}>Construction Heatmap (2021–2025)</div>
                <div style={{ fontSize: 12, color: T.slate500, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>Scrub through 5 years of change</div>
              </div>
            </div>
            <span style={{ padding: "5px 14px", borderRadius: 999, background: `linear-gradient(135deg,${T.cyan500},${T.blue500})`, color: "#fff", fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap", fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>Chrono Scrub</span>
          </div>

          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", height: 240, background: "rgba(5,10,25,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ position: "absolute", inset: 0, transition: "opacity 0.2s", background: "linear-gradient(135deg,rgba(127,0,0,0.7) 0%,rgba(180,80,10,0.4) 50%,transparent 100%)", mixBlendMode: "color-dodge", opacity: 0.05 + t * 0.75 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(5,10,25,0.15) 0%,transparent 40%,rgba(5,10,25,0.9) 100%)" }} />
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 10, border: "1px solid rgba(34,211,238,0.25)", background: "rgba(13,20,40,0.85)", backdropFilter: "blur(8px)" }}>
              <MapPin size={12} color={T.cyan} />
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.slate300 }}>AOI-07 · Gangapur Road</span>
            </div>
            <div style={{ position: "absolute", top: 10, right: 12 }}>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 20, color: T.slate100, fontWeight: 700 }}>{val.toFixed(1)}</span>
              <div style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.slate500, textTransform: "uppercase", letterSpacing: "0.18em" }}>Epoch</div>
            </div>
            <div style={{ position: "absolute", bottom: 72, right: 12, display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(13,20,40,0.85)", backdropFilter: "blur(8px)" }}>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.slate500, textTransform: "uppercase", letterSpacing: "0.12em" }}>Construction Intensity</span>
              <div style={{ width: 112, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${intensity}%`, background: "linear-gradient(90deg,#10b981,#fbbf24,#ef4444)", transition: "width 0.1s" }} />
              </div>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 9, color: T.slate400 }}>{intensity}% · {stage}</span>
            </div>
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "92%", maxWidth: 380, height: 60 }}>
                <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 400 64" preserveAspectRatio="none">
                  <path d="M10,54 Q200,-6 390,54" fill="none" stroke="rgba(34,211,238,0.3)" strokeWidth="2" />
                </svg>
                {YEAR_NODES.map(({ year, left, top }) => {
                  const active = year === nearest;
                  return (
                    <button key={year} type="button" onClick={() => setVal(year)}
                      style={{ position: "absolute", left, top, transform: `translateX(-50%) scale(${active ? 1.1 : 1})`, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", display: "block", background: active ? T.cyan : "rgba(255,255,255,0.18)", border: `1px solid ${active ? T.cyan : "rgba(255,255,255,0.28)"}`, boxShadow: active ? `0 0 10px ${T.cyan}` : "none" }} />
                      <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10, color: year === 2025 && !active ? "#f87171" : active ? T.cyan : T.slate500, fontWeight: year === 2025 ? 700 : 400 }}>{year}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(5,10,25,0.7)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <input type="range" min={2021} max={2025} step={0.05} value={val} onChange={e => setVal(parseFloat(e.target.value))} style={{ width: "100%", height: 5, borderRadius: 999, accentColor: T.cyan, cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.slate500 }}>Pristine 2021</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: T.cyan }}>+{velocity} m²/yr</span>
              <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, color: "#f87171", fontWeight: 700 }}>Critical 2025</span>
            </div>
          </div>
        </motion.div>

        {/* Case Details */}
        <motion.div whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
          style={{ ...PANEL, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} color={T.cyan} />
                <span style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: 17, color: T.slate100, fontWeight: 700 }}>Case Details</span>
              </div>
              <StatusPill label="High Priority" colors={T.sevHigh} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {([
                ["Case ID", "UC-2025-0894", true, T.slate100],
                ["Location", "Gangapur Road, Nashik", false, T.slate200],
                ["Latitude", "20.0124° N", true, T.cyan],
                ["Longitude", "73.7548° E", true, T.cyan],
                ["Protected Zone", "River Buffer Zone (100m)", false, "#fbbf24"],
                ["Detected Year", "2024 – 2025 Incursion", true, T.slate200],
                ["Confidence", "97% Corroborated", true, "#34d399"],
                ["Area Affected", "420 m²", true, "#f87171"],
                ["Change Type", "New Commercial Plinth Footprint", false, T.slate200],
              ] as [string, string, boolean, string][]).map(([label, value, mono, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 12 }}>
                  <span style={{ fontSize: 12, color: T.slate500, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>{label}</span>
                  <span style={{ fontFamily: mono ? "var(--font-mono,'JetBrains Mono',monospace)" : "var(--font-sans,'Manrope',sans-serif)", fontSize: 12, color, fontWeight: 600, textAlign: "right" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.1)", color: "#34d399", cursor: "pointer", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <CheckCircle2 size={14} /> Mark Reviewed
            </motion.button>
            <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid rgba(248,113,113,0.4)", background: "rgba(248,113,113,0.1)", color: "#f87171", cursor: "pointer", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Flag size={14} /> Flag for Action
            </motion.button>
          </div>
        </motion.div>
      </div>
    </MunicipalPageShell>
  );
}
