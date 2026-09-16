import { motion } from "motion/react";
import { FileText, Printer, ShieldAlert, X, Check } from "lucide-react";
import type { MunicipalAlert } from "@/types/urbancore";

export function ComplianceReportModal({
  alert,
  isOpen,
  onClose,
}: {
  alert: MunicipalAlert;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        className="glass-panel relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-6">
          {/* Official AI Notice Header */}
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 text-destructive font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" /> AI-GENERATED DRAFT — REQUIRES OFFICIAL REVIEW
            </div>
            <p className="mt-1 text-[11px] text-destructive/80">
              This notice is generated automatically from satellite multi-temporal change detection algorithms. It serves as an initial spatial audit draft and does not constitute a legal enforcement notice without official municipal officer sign-off.
            </p>
          </div>

          <div className="border-b border-border/40 pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              NASHIK MUNICIPAL CORPORATION · ZONING COMPLIANCE DRAFT
            </span>
            <h2 className="font-display text-xl font-semibold text-foreground mt-1">
              Notice of Spatial Deviation Audit
            </h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              Case Ref: NMC-ZON-{alert.id.toUpperCase()} · Flagged Date: {alert.evidence.detectionDate}
            </p>
          </div>

          <div className="space-y-3 text-xs text-foreground/90 leading-relaxed">
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px] bg-foreground/[0.02] p-3 rounded-xl border border-border/40">
              <div><span className="text-muted-foreground">Target Location:</span> {alert.location}</div>
              <div><span className="text-muted-foreground font-sans">GPS Coords:</span> {alert.evidence.gpsCoords}</div>
              <div><span className="text-muted-foreground font-sans">Detected Area:</span> {alert.affectedAreaSqM} sq. meters</div>
              <div><span className="text-muted-foreground font-sans">Affected Zone:</span> {alert.category}</div>
            </div>

            <div>
              <strong className="block font-mono text-[11px] text-primary uppercase">1. Detection Summary</strong>
              <p className="mt-1 text-muted-foreground">{alert.description}</p>
            </div>

            <div>
              <strong className="block font-mono text-[11px] text-primary uppercase">2. Satellite Evidence Base</strong>
              <p className="mt-1 text-muted-foreground">{alert.evidence.buildingFootprint}. Sensor data source: {alert.evidence.satelliteSensor}.</p>
            </div>

            <div>
              <strong className="block font-mono text-[11px] text-primary uppercase">3. Recommended Municipal Action</strong>
              <p className="mt-1 text-muted-foreground">Dispatch field survey team for physical ground-truth inspection and cross-reference against DP 2036 sanctioned building permits.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="glass-panel flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs text-foreground hover:border-primary/50"
              >
                <Printer className="h-3.5 w-3.5" /> Print Draft Notice
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-3.5 w-3.5" /> Confirm & Forward for Officer Review
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
