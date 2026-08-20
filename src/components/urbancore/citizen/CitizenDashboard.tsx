import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { INITIAL_CITIZEN_REPORTS } from "@/data/citizenData";
import type { CitizenReport } from "@/types/urbancore";

import { CityExplorer } from "./CityExplorer";
import { AreaInsights } from "./AreaInsights";
import { ChangeTimeline } from "./ChangeTimeline";
import { ReportConcernModal } from "./ReportConcernModal";

export function CitizenDashboard({
  activeTab,
  onTabChange,
  onSelectNeighborhood,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onSelectNeighborhood?: ((id: string) => void) | undefined;
}) {
  const [selectedStoryId, setSelectedStoryId] = useState("panchavati");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reports, setReports] = useState<CitizenReport[]>(INITIAL_CITIZEN_REPORTS);

  const handleSelectStory = (id: string) => {
    setSelectedStoryId(id);
    onSelectNeighborhood?.(id);
  };

  const handleAddReport = (newReport: CitizenReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  return (
    <motion.div
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Citizen Header */}
      <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
            CIVIC INTELLIGENCE PLATFORM
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            City Explorer
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore Nashik. Understand how your neighborhood is changing and voice community concerns.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-primary/20 px-5 py-3 font-mono text-xs font-semibold text-primary hover:bg-primary/30 transition-all shadow-[0_0_20px_rgba(114,180,255,0.25)]"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Report a Concern</span>
        </button>
      </div>

      {/* Main Sections */}
      <div className="flex flex-col gap-8">
        {/* City Explorer Map */}
        <section id="explore">
          <CityExplorer selectedStoryId={selectedStoryId} onSelectStory={handleSelectStory} />
        </section>

        {/* Area Insights */}
        <section id="insights">
          <AreaInsights storyId={selectedStoryId} />
        </section>

        {/* What's Changing Timeline */}
        <section id="changing">
          <ChangeTimeline />
        </section>

        {/* My Submitted Reports */}
        <section id="my-reports" className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
                COMMUNITY SUBMISSIONS
              </span>
              <h3 className="font-display text-lg font-medium text-foreground">
                Registered Citizen Reports ({reports.length})
              </h3>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Live Tracker
            </span>
          </div>

          <div className="grid gap-3">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/40 bg-foreground/[0.02] p-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{rep.referenceNumber}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">· {rep.submittedAt}</span>
                  </div>
                  <h4 className="mt-1 font-semibold text-foreground">{rep.concernType}</h4>
                  <p className="mt-0.5 text-muted-foreground text-[11px]">{rep.location} — {rep.description}</p>
                </div>
                <span className={`self-start sm:self-center shrink-0 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                  rep.status === "Pending Review" ? "border-amber-400/40 bg-amber-400/10 text-amber-400" : "border-accent/40 bg-accent/10 text-accent"
                }`}>
                  {rep.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Report Concern Modal */}
      <ReportConcernModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleAddReport}
      />
    </motion.div>
  );
}
