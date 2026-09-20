import { useState, useRef, useCallback } from "react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";

import { HeroSearch } from "../citizen/HeroSearch";
import { SelectedSiteCard } from "./SelectedSiteCard";
import { BuilderMap } from "./BuilderMap";
import { SuitabilityScore } from "./SuitabilityScore";
import { SiteReadiness } from "./SiteReadiness";
import { ConstraintPanel } from "./ConstraintPanel";
import { ConstructionHistory } from "./ConstructionHistory";
import { AreaComparison } from "./AreaComparison";
import { BuilderReportModal } from "./BuilderReportModal";
import { LandReportsPanel } from "./LandReportsPanel";
import { SectionDivider } from "./SectionDivider";

const FEATURE_LABELS: Record<string, string> = {
  overview: "Overview",
  suitability: "Land Suitability",
  terrain: "Terrain Analysis",
  constraints: "Zoning & Constraints",
  history: "Construction History",
  risk: "Risk Assessment",
  reports: "Land Reports",
};

export function BuilderDashboard({
  activeTab,
  onTabChange,
  onSelectAoi,
  activeFeatureId = "overview",
  onSelectFeature,
}: {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onSelectAoi?: ((aoi: AOI) => void) | undefined;
  activeFeatureId?: string;
  onSelectFeature?: (featureId: string) => void;
}) {
  const [selectedAoi, setSelectedAoi] = useState<AOI>(NASHIK_AOIS[0]!);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const scrollToMap = useCallback(() => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleChangeLocation = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const input = document.getElementById("hero-search-input") as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleSearch = useCallback(
    (suggestion: { label: string; lat: number; lng: number }) => {
      const qLower = suggestion.label.toLowerCase();
      const matched = NASHIK_AOIS.find(
        (a) =>
          a.name.toLowerCase().includes(qLower) ||
          (a.location && a.location.toLowerCase().includes(qLower)) ||
          a.id.toLowerCase().includes(qLower),
      );

      if (matched) {
        setSelectedAoi(matched);
        onSelectAoi?.(matched);
      } else {
        const customAoi: AOI = {
          id: `aoi-${Date.now()}`,
          name: suggestion.label,
          location: suggestion.label,
          category: "residential",
          coords: {
            lat: suggestion.lat,
            lng: suggestion.lng,
            x: 50,
            y: 50,
          },
          suitabilityScore: 82,
          terrain: {
            elevation: 600,
            slope: 5,
            roughness: "Flat Plains",
            flatLandPercent: 85,
            readiness: "HIGH",
          },
          accessibilityScore: 85,
          waterAvailabilityScore: 80,
          environmentalRiskScore: 85,
          developmentPotentialScore: 85,
          constructionHistory: [],
          constraints: {
            floodZoneOverlapPercent: 0,
            forestBoundaryOverlapPercent: 0,
            greenBeltOverlapPercent: 0,
            protectedAreaOverlapPercent: 0,
            environmentalRestriction: "Low",
          },
          summary: `Site intelligence analysis for ${suggestion.label}.`,
        };
        setSelectedAoi(customAoi);
        onSelectAoi?.(customAoi);
      }
      scrollToMap();
    },
    [onSelectAoi, scrollToMap],
  );

  const isFeatureOnlyPage = activeFeatureId && activeFeatureId !== "overview";

  return (
    <>
      {/* Scoped base styles matching Citizen Dashboard 1:1 */}
      <style>{`
        .cs-page {
          position: relative;
          width: 100%;
          min-height: 100vh;
          margin-top: -68px;
          padding-top: 68px;
          overflow-x: hidden;
          background: transparent;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
        }
        .cs-page-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          height: 100%;
          background-image: url("/citizen-bg-new.jpg");
          background-size: cover;
          background-position: center top;
          opacity: 0.25;
          z-index: -1;
          pointer-events: none;
        }
        .cs-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 24px;
        }
        .cs-section-divider {
          display: flex; align-items: center; gap: 16px;
          width: 100%; max-width: 1280px;
          padding: 0 24px; margin: 0 auto 32px;
        }
        .cs-section-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .cs-section-divider-label {
          font-family: var(--font-mono,monospace);
          font-size: 0.625rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: #334155; white-space: nowrap;
        }
      `}</style>

      <div className="cs-page">
        <div className="cs-page-bg" />
        <div className="cs-content">
          <div className="w-full max-w-[1280px] px-4 sm:px-6 pb-24">
            {isFeatureOnlyPage ? (
              /* FEATURE-ONLY PAGE: Renders ONLY the selected feature page */
              <div className="w-full pt-4">
                <SectionDivider label={`MODULE FEATURE: ${FEATURE_LABELS[activeFeatureId] || activeFeatureId}`} />

                {activeFeatureId === "suitability" && <SuitabilityScore aoi={selectedAoi} />}
                {activeFeatureId === "terrain" && <SiteReadiness aoi={selectedAoi} />}
                {activeFeatureId === "constraints" && <ConstraintPanel aoi={selectedAoi} />}
                {activeFeatureId === "history" && <ConstructionHistory aoi={selectedAoi} />}
                {activeFeatureId === "risk" && <AreaComparison aoi={selectedAoi} />}
                {activeFeatureId === "reports" && (
                  <LandReportsPanel aoi={selectedAoi} onGenerateReport={() => setIsReportOpen(true)} />
                )}
              </div>
            ) : (
              /* DEFAULT DASHBOARD: Navbar + Hero + Search + Map */
              <div className="flex flex-col gap-6 w-full">
                <HeroSearch
                  mode="builder"
                  badgeText="AI URBAN INTELLIGENCE · NASHIK 2026"
                  titlePrefix="Builder"
                  titleSuffix="Intelligence"
                  subtitle="Explore your site using satellite intelligence, analyze land suitability, monitor development, and generate AI-powered location insights."
                  onSearch={handleSearch}
                  onDropPin={scrollToMap}
                />

                <div ref={mapSectionRef} className="w-full flex flex-col gap-6">
                  <SelectedSiteCard aoi={selectedAoi} onChangeLocation={handleChangeLocation} />
                  <BuilderMap aoi={selectedAoi} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Land Intelligence Report Modal */}
        <BuilderReportModal
          aoi={selectedAoi}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </div>
    </>
  );
}
