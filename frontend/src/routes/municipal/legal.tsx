/**
 * /municipal/legal — AI Legal Notice Generator page.
 * Renders the AILegalNotice section from MunicipalGISDashboard in isolation.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, RefreshCw, CheckCircle2 } from "lucide-react";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/legal")({
  head: () => ({
    meta: [{ title: "AI Legal Notice — Municipal Authority" }],
  }),
  component: LegalPage,
});

const T = {
  cyan: "#22d3ee", cyan500: "#06b6d4", blue500: "#3b82f6",
  slate100: "#f1f5f9", slate200: "#e2e8f0", slate300: "#cbd5e1",
  slate400: "#94a3b8", slate500: "#64748b",
} as const;

const PANEL: React.CSSProperties = {
  background: "rgba(13,20,40,0.72)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
};

const PIPELINE_STEPS = [
  { label: "Preparing satellite evidence...",  done: true  },
  { label: "Collecting GPS coordinates...",    done: true  },
  { label: "Compiling multi-year timeline...", done: true  },
  { label: "Generating official notice...",    done: false },
];

function LegalPage() {
  const navigate = useNavigate();
  return (
    <MunicipalPageShell
      eyebrow="AI Complaint Letter Generator"
      eyebrowIcon={<ShieldAlert size={13} />}
      title="Auto-Generated Legal Notice"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <motion.div whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        style={{ ...PANEL, padding: 24, display: "flex", flexWrap: "wrap", gap: 24 }}>

        {/* Pipeline status */}
        <div style={{ flex: "1 1 240px", minWidth: 220, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, background: "rgba(5,10,25,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: T.slate500, fontWeight: 600 }}>Automated Compilation Pipeline</span>
            {PIPELINE_STEPS.map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: `1px solid ${s.done ? "rgba(52,211,153,0.25)" : "rgba(34,211,238,0.3)"}`, background: s.done ? "rgba(52,211,153,0.07)" : "rgba(34,211,238,0.1)" }}>
                {s.done
                  ? <CheckCircle2 size={17} color="#34d399" style={{ flexShrink: 0 }} />
                  : <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCw size={17} color={T.cyan} style={{ flexShrink: 0 }} />
                    </motion.div>
                }
                <span style={{ fontSize: 12, color: s.done ? T.slate300 : T.cyan, fontWeight: s.done ? 500 : 600, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(34,211,238,0.04)", border: "1px solid rgba(34,211,238,0.1)", fontSize: 11, color: T.slate400, alignItems: "flex-start", fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>
            <ShieldAlert size={14} color={T.cyan} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Digital seal cryptographically attached to Section 53 MRTP Act statutory complaint.</span>
          </div>
        </div>

        {/* White paper notice */}
        <div style={{ flex: "2 1 340px", background: "#fff", borderRadius: 14, padding: 28, color: "#1e293b", boxShadow: "0 4px 24px rgba(0,0,0,0.35)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -30, bottom: -30, opacity: 0.04, color: "#1e293b", pointerEvents: "none", userSelect: "none" }}>
            <ShieldAlert size={200} />
          </div>
          <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "2px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldAlert size={32} color="#1e293b" />
              <div>
                <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontWeight: 700, fontSize: "clamp(12px,1.5vw,15px)", textTransform: "uppercase", letterSpacing: "-0.01em", color: "#1e293b" }}>Nashik Municipal Corporation</div>
                <div style={{ fontSize: 11, color: "#475569" }}>Town Planning &amp; Encroachment Removal Department</div>
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#475569", textAlign: "right" }}>
              <div>REF: NMC/TPD/2025/0894</div>
              <div>DATE: 18 SEP 2025</div>
            </div>
          </div>
          <h5 style={{ textAlign: "center", fontWeight: 700, fontSize: "clamp(10px,1.2vw,12px)", textTransform: "uppercase", letterSpacing: "0.06em", textDecoration: "underline", color: "#1e293b", marginBottom: 12 }}>
            NOTICE OF UNAUTHORIZED CONSTRUCTION UNDER SECTION 53, MRTP ACT, 1966
          </h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, background: "#f1f5f9", padding: 10, borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: "#1e293b", marginBottom: 12 }}>
            <div><strong>Case ID:</strong> UC-2025-0894</div>
            <div><strong>Location:</strong> Gangapur Rd, Plot 4A</div>
            <div><strong>Coordinates:</strong> 20.0124°N, 73.7548°E</div>
            <div><strong>Violation:</strong> −18.4m inside 100m River Setback</div>
          </div>
          <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, marginBottom: 8 }}>
            This is to formally notify that an unauthorized commercial foundation footprint of approximately{" "}
            <strong>420 sq. meters</strong> has been detected through multispectral satellite telemetry and
            verified by designated Ward 4 inspectors. The construction directly infringes upon the statutory
            Godavari River riparian green corridor.
          </p>
          <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            You are hereby commanded to halt all ongoing masonry and excavation operations immediately and
            show cause within <strong>48 hours</strong> of service, failing which summary demolition will
            proceed under Municipal Code.
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} color="#047857" />
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#475569" }}>Digital Signature ID: #NK-9921-VERIFIED</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Municipal Commissioner</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>Nashik Municipal Corporation</div>
            </div>
          </div>
        </div>
      </motion.div>
    </MunicipalPageShell>
  );
}
