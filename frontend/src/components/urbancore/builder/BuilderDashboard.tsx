import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";
import { BuilderReportModal } from "./BuilderReportModal";
import { BuilderContext } from "./BuilderContext";

export function BuilderDashboard() {
  const [selectedAoi, setSelectedAoi] = useState<AOI>(NASHIK_AOIS[0]!);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <BuilderContext.Provider value={{ selectedAoi, setSelectedAoi, setIsReportOpen }}>
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
            <Outlet />
          </div>
        </div>

        {/* Land Intelligence Report Modal */}
        <BuilderReportModal
          aoi={selectedAoi}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </div>
    </BuilderContext.Provider>
  );
}
