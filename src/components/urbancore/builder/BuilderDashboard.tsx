import { useState } from "react";
import { motion } from "motion/react";
import { FileText } from "lucide-react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";

import { SiteSearch } from "./SiteSearch";
import { SuitabilityScore } from "./SuitabilityScore";
import { SiteReadiness } from "./SiteReadiness";
import { ConstraintPanel } from "./ConstraintPanel";
import { AreaComparison } from "./AreaComparison";
import { BuilderReportModal } from "./BuilderReportModal";
import { GrowthTimeline } from "../GrowthTimeline";

export function BuilderDashboard({
  activeTab,
  onTabChange,
  onSelectAoi,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onSelectAoi?: ((aoi: AOI) => void) | undefined;
}) {
  const [selectedAoi, setSelectedAoi] = useState<AOI>(NASHIK_AOIS[0]!);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [year, setYear] = useState(4); // 2025 default

  const handleSelectAoi = (aoi: AOI) => {
    setSelectedAoi(aoi);
    onSelectAoi?.(aoi);
  };

  return (
    <motion.div
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Workspace Subtitle Banner */}
      <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            DECISION SUPPORT WORKSPACE
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Builder Intelligence
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Evaluate land suitability, terrain readiness, constraints, and construction history before investment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/20 px-5 py-3 font-mono text-xs font-semibold text-primary transition-all duration-300 hover:bg-primary/30 shadow-[0_0_20px_rgba(114,180,255,0.25)]"
        >
          <FileText className="h-4 w-4" />
          <span>Generate Land Report</span>
        </button>
      </div>

      {/* Prominent Site Search */}
      <SiteSearch selectedAoi={selectedAoi} onSelectAoi={handleSelectAoi} />

      {/* Main Grid View */}
      <div className="flex flex-col gap-8">
        {/* Suitability Index */}
        <section id="suitability">
          <SuitabilityScore aoi={selectedAoi} />
        </section>

        {/* Site Readiness */}
        <section id="readiness">
          <SiteReadiness aoi={selectedAoi} />
        </section>

        {/* Constraints Audit */}
        <section id="constraints">
          <ConstraintPanel aoi={selectedAoi} />
        </section>

        {/* Construction Timeline Scrubber */}
        <section id="growth" className="glass-panel flex flex-col gap-4 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
                HISTORICAL GROWTH (2021–2025)
              </span>
              <h3 className="font-display text-lg font-medium text-foreground">
                Construction Timeline & Structure Detection
              </h3>
            </div>
            <span className="font-mono text-xs text-accent">
              {selectedAoi.constructionHistory[year]?.buildingsCount || 194} Structures Detected
            </span>
          </div>

          <div className="py-2">
            <GrowthTimeline value={year} onChange={setYear} visible={true} />
          </div>
        </section>

        {/* Area Comparison */}
        <section id="compare">
          <AreaComparison />
        </section>
      </div>

      {/* Land Intelligence Report Modal */}
      <BuilderReportModal
        aoi={selectedAoi}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </motion.div>
  );
}
