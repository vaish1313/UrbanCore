import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, AlertTriangle, Building2, Eye, Activity } from "lucide-react";
import { MUNICIPAL_STATS, MUNICIPAL_ALERTS } from "@/data/municipalData";
import type { MunicipalAlert } from "@/types/urbancore";

import { EncroachmentWatch } from "./EncroachmentWatch";
import { ConstructionMonitor } from "./ConstructionMonitor";
import { GrowthAnalytics } from "./GrowthAnalytics";
import { EvidenceViewer } from "./EvidenceViewer";
import { ComplianceReportModal } from "./ComplianceReportModal";
import { MunicipalGISDashboard } from "./MunicipalGISDashboard";

export function MunicipalDashboard({
  activeTab,
  onTabChange,
  onSelectAlert,
  onBack,
  activeFeatureId,
  onFeatureChange,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onSelectAlert?: ((alertId: string) => void) | undefined;
  onBack?: () => void;
  activeFeatureId?: string;
  onFeatureChange?: (featureId: string) => void;
}) {
  const [selectedAlert, setSelectedAlert] = useState<MunicipalAlert>(MUNICIPAL_ALERTS[0]!);
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  const handleSelectAlert = (alert: MunicipalAlert) => {
    setSelectedAlert(alert);
    onSelectAlert?.(alert.id);
  };

  // ── Command Center tab → full GIS dashboard ──────────────────────────────
  if (activeTab === "command") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="gis-command"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          // The GIS dashboard is self-contained (its own header, backdrop, footer).
          // Remove the RoleWorkspace padding wrapper so it fills the overlay edge-to-edge.
          style={{ position: "relative", width: "100%" }}
        >
          <MunicipalGISDashboard
            activeTab={activeTab}
            onTabChange={onTabChange}
            onBack={onBack}
            activeFeatureId={activeFeatureId}
            onFeatureChange={onFeatureChange}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Other tabs → original sub-component views ────────────────────────────
  return (
    <motion.div
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Command Center Title Header */}
      <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            CITY COMMAND CENTER WORKSPACE
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Municipal Intelligence
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor urban development, zoning compliance, protected zones, and satellite-detected
            encroachments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDraftOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/50 bg-destructive/20 px-5 py-3 font-mono text-xs font-semibold text-destructive hover:bg-destructive/30 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <ShieldAlert className="h-4 w-4" />
          <span>Generate Complaint Draft</span>
        </button>
      </div>

      {/* Overview Top Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">New Structures</span>
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">
            {MUNICIPAL_STATS.newStructuresCount}
          </div>
          <span className="mt-1 block font-mono text-[10px] text-accent">Detected since 2024</span>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">
              Potential Encroachments
            </span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-destructive">
            {MUNICIPAL_STATS.potentialEncroachmentsCount}
          </div>
          <span className="mt-1 block font-mono text-[10px] text-destructive/80">
            Requires Priority Review
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">
              High Growth Areas
            </span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-amber-400">
            {MUNICIPAL_STATS.highPriorityAreasCount}
          </div>
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
            Pathardi Phata & Ambad
          </span>
        </div>

        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-mono text-[10px] uppercase tracking-wider">Monitored Zones</span>
            <Eye className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-foreground">
            {MUNICIPAL_STATS.areasMonitoredCount}
          </div>
          <span className="mt-1 block font-mono text-[10px] text-accent">Sentinel-2 Automated</span>
        </div>
      </div>

      {/* Tab-conditional sub-sections */}
      <div className="flex flex-col gap-8">
        {(activeTab === "encroachment" || activeTab === "evidence" || activeTab === "monitoring" || activeTab === "hotspots" || activeTab === "reports" || activeTab === "zones") && (
          <>
            {/* Encroachment Watch */}
            {(activeTab === "encroachment" || activeTab === "evidence") && (
              <section id="encroachment">
                <EncroachmentWatch selectedAlert={selectedAlert} onSelectAlert={handleSelectAlert} />
              </section>
            )}

            {/* Evidence Viewer */}
            {activeTab === "evidence" && (
              <section id="evidence">
                <EvidenceViewer alert={selectedAlert} onGenerateDraft={() => setIsDraftOpen(true)} />
              </section>
            )}

            {/* Construction Monitoring */}
            {activeTab === "monitoring" && (
              <section id="monitoring">
                <ConstructionMonitor />
              </section>
            )}

            {/* Growth Hotspots */}
            {(activeTab === "hotspots" || activeTab === "reports") && (
              <section id="hotspots">
                <GrowthAnalytics />
              </section>
            )}
          </>
        )}
      </div>

      {/* Compliance Draft Modal */}
      <ComplianceReportModal
        alert={selectedAlert}
        isOpen={isDraftOpen}
        onClose={() => setIsDraftOpen(false)}
      />
    </motion.div>
  );
}
