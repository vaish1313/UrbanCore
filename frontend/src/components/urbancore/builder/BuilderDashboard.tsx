import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  X,
  Compass,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";

import { SiteSearch } from "./SiteSearch";
import { SelectedSiteCard } from "./SelectedSiteCard";
import { BuilderMap } from "./BuilderMap";
import { SuitabilityScore } from "./SuitabilityScore";
import { SiteReadiness } from "./SiteReadiness";
import { ConstraintPanel } from "./ConstraintPanel";
import { ConstructionHistory } from "./ConstructionHistory";
import { AreaComparison } from "./AreaComparison";
import { BuilderReportModal } from "./BuilderReportModal";

interface SidebarFeature {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isReportModalTrigger?: boolean;
}

const SIDEBAR_FEATURES: SidebarFeature[] = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "suitability", label: "Land Suitability", icon: SlidersHorizontal },
  { id: "terrain", label: "Terrain Analysis", icon: Activity },
  { id: "constraints", label: "Zoning & Constraints", icon: AlertTriangle },
  { id: "history", label: "Construction History", icon: TrendingUp },
  { id: "risk", label: "Risk Assessment", icon: ShieldCheck },
  { id: "reports", label: "Land Reports", icon: FileText, isReportModalTrigger: true },
];

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 w-full my-6">
      <div className="flex-1 h-[1px] bg-slate-800" />
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-400 font-semibold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/10">
        {label}
      </span>
      <div className="flex-1 h-[1px] bg-slate-800" />
    </div>
  );
}

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
  const [activeFeatureId, setActiveFeatureId] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const featureSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectAoi = (aoi: AOI) => {
    setSelectedAoi(aoi);
    onSelectAoi?.(aoi);
  };

  const handleChangeLocation = () => {
    if (searchSectionRef.current) {
      searchSectionRef.current.scrollIntoView({ behavior: "smooth" });
      const input = searchSectionRef.current.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    }
  };

  const handleFeatureClick = (feature: SidebarFeature) => {
    setIsMenuOpen(false);
    if (feature.isReportModalTrigger) {
      setIsReportOpen(true);
      return;
    }
    setActiveFeatureId(feature.id);
    if (feature.id === "overview") {
      searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      setTimeout(() => {
        featureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const activeFeature = SIDEBAR_FEATURES.find((f) => f.id === activeFeatureId) || SIDEBAR_FEATURES[0]!;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Main Builder Dashboard Content */}
      <motion.div
        className="flex flex-1 flex-col gap-8 min-w-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Workspace Subtitle Banner with Hamburger Dropdown */}
        <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {/* Compact Circular Hamburger Button & Solid Dark 7-Feature Dropdown (Matching Profile Dropdown 1:1) */}
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Toggle Builder Features Menu"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 focus:outline-none cursor-pointer"
                  >
                    {isMenuOpen ? (
                      <X className="h-4 w-4 text-cyan-300" />
                    ) : (
                      <Menu className="h-4 w-4 text-cyan-300" />
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-56 bg-[#0a0f1d] border border-white/10 shadow-2xl rounded-2xl p-1.5 z-50 opacity-100 backdrop-blur-none"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                      BUILDER FEATURES
                    </span>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
                      7
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    {SIDEBAR_FEATURES.map((feature) => {
                      const Icon = feature.icon;
                      const isActive = activeFeatureId === feature.id;
                      return (
                        <DropdownMenuItem
                          key={feature.id}
                          onClick={() => handleFeatureClick(feature)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium transition-colors outline-none ${
                            isActive
                              ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium"
                              : "text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white border border-transparent"
                          }`}
                        >
                          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-cyan-400" : "text-cyan-400"}`} />
                          <span className="truncate">{feature.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span>DECISION SUPPORT WORKSPACE</span>
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
              <span>Builder </span>
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">Intelligence</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              Evaluate land suitability, terrain readiness, constraints, and construction history before investment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/50 bg-cyan-500/20 px-5 py-3 font-mono text-xs font-semibold text-cyan-300 transition-all duration-300 hover:bg-cyan-500/30 hover:border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)] shrink-0 cursor-pointer"
          >
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>Generate Land Report</span>
          </button>
        </div>

        {/* Default View Step 1: Prominent Site Search */}
        <div ref={searchSectionRef} id="search-section">
          <SiteSearch selectedAoi={selectedAoi} onSelectAoi={handleSelectAoi} />
        </div>

        {/* Default View Step 2: Selected Site Information Card */}
        <SelectedSiteCard aoi={selectedAoi} onChangeLocation={handleChangeLocation} />

        {/* Default View Step 3: Interactive Map & AOI Vector Boundary */}
        <BuilderMap aoi={selectedAoi} />

        {/* Dynamically Rendered Single Feature Section Below Map (Citizen Dashboard Interaction Pattern) */}
        <div ref={featureSectionRef} id="selected-feature-section">
          <AnimatePresence mode="wait">
            {activeFeatureId !== "overview" && (
              <motion.div
                key={activeFeatureId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <SectionDivider label={`MODULE FEATURE: ${activeFeature.label}`} />

                {activeFeatureId === "suitability" && <SuitabilityScore aoi={selectedAoi} />}
                {activeFeatureId === "terrain" && <SiteReadiness aoi={selectedAoi} />}
                {activeFeatureId === "constraints" && <ConstraintPanel aoi={selectedAoi} />}
                {activeFeatureId === "history" && <ConstructionHistory aoi={selectedAoi} />}
                {activeFeatureId === "risk" && <AreaComparison aoi={selectedAoi} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Land Intelligence Report Modal */}
        <BuilderReportModal
          aoi={selectedAoi}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </motion.div>
    </div>
  );
}
