import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3 } from "lucide-react";

import { HeroSearch } from "./HeroSearch";
import { InteractiveMap } from "./InteractiveMap";
import { AnalysisProgress } from "./AnalysisProgress";
import { ConstructionTimeline } from "./ConstructionTimeline";
import { MyReports } from "./MyReports";
import { ComplaintReportModal } from "./ComplaintReportModal";

import type { LocationInfo } from "@/data/citizenMockData";
import { DEFAULT_LOCATION } from "@/data/citizenMockData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const ease = [0.16, 1, 0.3, 1] as const;

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="cs-section-divider">
      <div className="cs-section-divider-line" />
      <span className="cs-section-divider-label">{label}</span>
      <div className="cs-section-divider-line" />
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
function DashboardFooter() {
  return (
    <footer className="cs-footer">
      <div className="cs-footer-inner">
        <div className="cs-footer-brand">
          <BarChart3 className="h-4 w-4 text-cyan-500" />
          <span className="text-slate-300 font-medium">UrbanCore</span>
          <span className="cs-footer-sep">|</span>
          <span className="text-slate-500">Citizen Intelligence</span>
        </div>
        <nav className="cs-footer-links">
          <a href="#" className="cs-footer-link">
            Privacy Policy
          </a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">
            Terms of Use
          </a>
          <span className="cs-footer-dot">|</span>
          <a href="#" className="cs-footer-link">
            Contact
          </a>
        </nav>
      </div>
      <style>{`
        .cs-footer { width: 100%; border-top: 1px solid rgba(255,255,255,0.06); padding: 22px 0; margin-top: 12px; }
        .cs-footer-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .cs-footer-brand { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
        .cs-footer-sep { color: rgba(255,255,255,0.18); }
        .cs-footer-links { display: flex; align-items: center; gap: 8px; }
        .cs-footer-link { font-size: 0.75rem; color: #334155; text-decoration: none; transition: color 0.15s; }
        .cs-footer-link:hover { color: #94a3b8; }
        .cs-footer-dot { font-size: 0.75rem; color: rgba(255,255,255,0.12); }
        @media (max-width: 640px) { .cs-footer-inner { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </footer>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function CitizenDashboard({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}) {
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{
    label: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const scrollToMap = useCallback(() => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const scrollToTimeline = useCallback(() => {
    setTimeout(() => {
      document
        .getElementById("construction-timeline-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }, []);

  const handleSearch = useCallback(
    (suggestion: { label: string; lat: number; lng: number }) => {
      setSearchLocation(suggestion);
      scrollToMap();
    },
    [scrollToMap],
  );

  const handleLocationSelected = useCallback((loc: LocationInfo) => {
    setSelectedLocation(loc);
  }, []);

  const handleAnalyse = useCallback(async (loc: LocationInfo) => {
    setSelectedLocation(loc);
    setAnalysisTriggered(true);
    setAnalysisCompleted(false);
    setAnalysisStatus("Submitting six-year satellite analysis…");

    try {
      const response = await fetch(`${API_BASE_URL}/analyses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: loc.lat,
          longitude: loc.lng,
          radius_m: 2000,
          end_year: new Date().getFullYear(),
        }),
      });

      if (!response.ok) throw new Error("Unable to submit analysis");

      const analysis = await response.json();
      setAnalysisId(analysis.id);
      setAnalysisStatus(`Analysis started! ID: ${analysis.id}`);

      // Scroll to progress section
      setTimeout(() => {
        document
          .getElementById("construction-timeline-section")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (error) {
      setAnalysisStatus(error instanceof Error ? error.message : "Unable to submit analysis.");
      console.error("Analysis error:", error);
    }
  }, []);

  return (
    <>
      {/* Scoped base styles */}
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
          {activeTab === "my-reports" ? (
            <div className="w-full flex-1 pt-6 pb-24">
              <MyReports onNewReport={() => setIsEvidenceModalOpen(true)} />
            </div>
          ) : (
            <>
              {/* ── 1. Hero Search ── */}
              <HeroSearch onSearch={handleSearch} onDropPin={scrollToMap} />

              {/* ── 2. Interactive Map ── */}
              <div ref={mapSectionRef} style={{ width: "100%" }}>
                <InteractiveMap
                  onLocationSelected={handleAnalyse}
                  externalSearchLocation={searchLocation}
                />
              </div>
              {analysisStatus && (
                <p className="mb-6 text-center text-sm text-cyan-300">{analysisStatus}</p>
              )}

              {/* ── 4. Construction Timeline or Analysis Progress ── */}
              <AnimatePresence>
                {(selectedLocation || analysisTriggered) && (
                  <motion.div
                    id="construction-timeline-section"
                    key="timeline"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: "100%" }}
                  >
                    {analysisTriggered && analysisId && !analysisCompleted ? (
                      <AnalysisProgress
                        analysisId={analysisId}
                        onComplete={() => setAnalysisCompleted(true)}
                      />
                    ) : analysisCompleted && analysisId ? (
                      <>
                        <SectionDivider label="Construction Timeline 2021 – 2025" />
                        <ConstructionTimeline
                          analysisId={analysisId}
                          onReportConcern={() => setIsEvidenceModalOpen(true)}
                        />
                      </>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <DashboardFooter />
      </div>

      {/* ── Evidence / Complaint Modal ── */}
      <ComplaintReportModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        locationName={selectedLocation?.village ?? "Selected Location"}
        coordinates={
          selectedLocation
            ? `Lat: ${selectedLocation.lat}, Lng: ${selectedLocation.lng}`
            : "Lat: 20.0059, Lng: 73.7912"
        }
        yearAppeared="2025"
      />
    </>
  );
}
