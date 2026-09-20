/**
 * /municipal/export — Case Package Export page.
 * Renders the CaseExport section in isolation.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Download, Printer } from "lucide-react";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/export")({
  head: () => ({
    meta: [{ title: "Case Export — Municipal Authority" }],
  }),
  component: ExportPage,
});

const T = {
  cyan: "#22d3ee", cyan500: "#06b6d4", blue500: "#3b82f6",
  slate100: "#f1f5f9", slate300: "#cbd5e1", slate500: "#64748b",
} as const;

const PANEL: React.CSSProperties = {
  background: "rgba(13,20,40,0.72)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
};

function ExportPage() {
  const navigate = useNavigate();
  return (
    <MunicipalPageShell
      eyebrow="Report Generation and Export"
      eyebrowIcon={<Download size={13} />}
      title="Case Package Ready"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <motion.div whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        style={{ ...PANEL, padding: "24px 28px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: T.cyan, boxShadow: "0 0 20px rgba(34,211,238,0.15)" }}>
            <Download size={26} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: "clamp(15px,2vw,18px)", color: T.slate100, fontWeight: 700 }}>
              Case Package #UC-2025-0894 Ready
            </div>
            <div style={{ fontSize: 12, color: T.slate500, marginTop: 3, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>
              Includes high-res Sentinel-2 orthomosaic captures, timeline telemetry, and Section 53 MRTP statutory notice.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{ background: "rgba(255,255,255,0.04)", color: T.slate300, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 20px", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>
            <Printer size={16} /> Print Notice
          </motion.button>
          <motion.button type="button"
            whileHover={{ scale: 1.03, boxShadow: "0 0 28px rgba(34,211,238,0.25)" }}
            whileTap={{ scale: 0.97 }}
            style={{ background: `linear-gradient(135deg,${T.cyan500} 0%,${T.blue500} 100%)`, color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>
            <Download size={16} /> Export Official Case PDF
          </motion.button>
        </div>
      </motion.div>

      {/* Export checklist */}
      <motion.div whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        style={{ ...PANEL, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-display,'Sora',sans-serif)", fontSize: 15, color: T.slate100, fontWeight: 700 }}>Package Contents</div>
        {[
          "Sentinel-2 multispectral orthomosaic (2021–2025)",
          "Construction change detection heatmap (U-Net segmentation)",
          "Section 53 MRTP Act statutory notice draft",
          "GPS-verified coordinates and protected zone analysis",
          "Inspector field notes and digital signature",
          "Court-admissible PDF with watermark and seal",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.cyan, boxShadow: `0 0 6px ${T.cyan}`, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: T.slate300, fontFamily: "var(--font-sans,'Manrope',sans-serif)" }}>{item}</span>
          </div>
        ))}
      </motion.div>
    </MunicipalPageShell>
  );
}
