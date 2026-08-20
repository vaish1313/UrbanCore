import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Printer, Download, X, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import type { AOI } from "@/types/urbancore";
import { MOCK_BUILDER_REPORT_DATA } from "@/data/builderData";

const STEPS = [
  "Resolving satellite imagery...",
  "Analyzing terrain DEM & slope contours...",
  "Checking river, forest & greenbelt constraints...",
  "Reviewing 2021–2025 construction change history...",
  "Calculating multi-factor suitability score...",
  "Compiling UrbanCore Land Intelligence Report...",
];

export function BuilderReportModal({
  aoi,
  isOpen,
  onClose,
}: {
  aoi: AOI;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsGenerating(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          setIsGenerating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <motion.div
        className="glass-panel relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {isGenerating ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h4 className="mt-6 font-display text-xl font-medium text-foreground">
              Compiling Land Intelligence Report
            </h4>
            <div className="mt-4 flex items-center gap-2 font-mono text-xs text-primary">
              <span>{STEPS[stepIndex]}</span>
            </div>
            <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-border/40">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Report Header */}
            <div className="border-b border-border/50 pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                    URBANCORE · LAND INTELLIGENCE REPORT
                  </span>
                  <h2 className="font-display text-2xl font-semibold text-foreground mt-1">
                    {aoi.name} Site Evaluation
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span>Report ID: UC-REP-2026-88</span>
                  <span>·</span>
                  <span>{MOCK_BUILDER_REPORT_DATA.generatedDate}</span>
                </div>
              </div>
            </div>

            {/* Score & Executive Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Suitability Score</span>
                <div className="font-display text-4xl font-bold text-primary mt-1">{aoi.suitabilityScore}/100</div>
                <span className="font-mono text-[11px] font-semibold text-accent mt-1 block">HIGH SUITABILITY</span>
              </div>
              <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 sm:col-span-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Executive Summary</span>
                <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                  {aoi.summary} Terrain is characterized as {aoi.terrain.roughness} with {aoi.terrain.flatLandPercent}% buildable plane.
                </p>
              </div>
            </div>

            {/* Key Audit Sections */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-4">
                <h4 className="font-mono text-xs uppercase tracking-wider text-primary mb-2">Terrain & Readiness Audit</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>Elevation:</span> <strong className="text-foreground font-mono">{aoi.terrain.elevation} m MSL</strong></li>
                  <li className="flex justify-between"><span>Average Slope:</span> <strong className="text-foreground font-mono">{aoi.terrain.slope}°</strong></li>
                  <li className="flex justify-between"><span>Flat Area Availability:</span> <strong className="text-foreground font-mono">{aoi.terrain.flatLandPercent}%</strong></li>
                  <li className="flex justify-between"><span>Site Preparation Level:</span> <strong className="text-accent font-mono">{aoi.terrain.readiness}</strong></li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/40 bg-foreground/[0.02] p-4">
                <h4 className="font-mono text-xs uppercase tracking-wider text-primary mb-2">Constraints & Risk Audit</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex justify-between"><span>River Flood Overlap:</span> <strong className="text-foreground font-mono">{aoi.constraints.floodZoneOverlapPercent}%</strong></li>
                  <li className="flex justify-between"><span>Forest Boundary Overlap:</span> <strong className="text-foreground font-mono">{aoi.constraints.forestBoundaryOverlapPercent}%</strong></li>
                  <li className="flex justify-between"><span>Greenbelt Overlap:</span> <strong className="text-foreground font-mono">{aoi.constraints.greenBeltOverlapPercent}%</strong></li>
                  <li className="flex justify-between"><span>Environmental Risk:</span> <strong className="text-amber-400 font-mono">{aoi.constraints.environmentalRestriction}</strong></li>
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-accent mb-1">
                <CheckCircle2 className="h-4 w-4" /> Recommendation
              </div>
              <p className="text-xs text-foreground/90">
                Suitable for residential/mixed-use investment. Ensure 100m statutory river set-back compliance prior to layout approval submission.
              </p>
            </div>

            {/* Legal Notice */}
            <div className="rounded-xl border border-border/40 bg-foreground/[0.01] p-3 text-[10px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{MOCK_BUILDER_REPORT_DATA.disclaimer}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="glass-panel flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs text-foreground hover:border-primary/50"
              >
                <Printer className="h-3.5 w-3.5" /> Print / Export PDF
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
