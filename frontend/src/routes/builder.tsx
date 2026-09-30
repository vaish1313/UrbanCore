/**
 * /builder — Layout route
 *
 * Same mechanism as /municipal/route.tsx:
 *  - RoleNavigation header with portal-based WorkspaceSidebar
 *  - Clicking a sidebar item navigates to the corresponding /builder/* sub-route
 *  - Each sub-route renders only its feature content (no full dashboard)
 *  - /builder/overview shows the hero + map (first feature visible on open)
 *  - All other sub-routes show just their feature, no hero
 *
 * BuilderContext is provided here so every sub-route shares the same
 * selectedAoi state — picking a location on Overview persists to all features.
 *
 * Nothing in the municipal dashboard was touched.
 */

import { createFileRoute, Outlet, useNavigate, useMatchRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";
import { BuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderReportModal } from "@/components/urbancore/builder/BuilderReportModal";
import { RoleNavigation } from "@/components/urbancore/role/RoleNavigation";
import { BUILDER_FEATURE_MENU } from "@/components/urbancore/role/roleFeatureMenus";
import type { RoleFeatureMenuItem } from "@/components/urbancore/role/RoleFeaturesDropdown";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [{ title: "UrbanCore — Builder Intelligence Workspace" }],
  }),
  component: BuilderLayout,
});

/* Map sidebar feature id → sub-route path */
const FEATURE_ROUTE_MAP: Record<string, string> = {
  overview:     "/builder/overview",
  suitability:  "/builder/land-suitability",
  terrain:      "/builder/terrain-analysis",
  constraints:  "/builder/zoning-constraints",
  history:      "/builder/construction-history",
  risk:         "/builder/risk-assessment",
};

function BuilderLayout() {
  const navigate   = useNavigate();
  const matchRoute = useMatchRoute();

  /* Shared AOI state — survives navigation between sub-routes */
  const [selectedAoi, setSelectedAoi] = useState<AOI>(NASHIK_AOIS[0]!);
  const [isReportOpen, setIsReportOpen] = useState(false);

  /* Determine active sidebar item from current URL */
  const activeFeatureId = (() => {
    for (const [id, path] of Object.entries(FEATURE_ROUTE_MAP)) {
      if (matchRoute({ to: path })) return id;
    }
    return "overview";
  })();

  const handleFeatureSelect = (feature: RoleFeatureMenuItem) => {
    const path = FEATURE_ROUTE_MAP[feature.id] ?? "/builder/overview";
    navigate({ to: path });
  };

  return (
    /*
     * NO backdrop-filter / overflow-y-auto on this wrapper.
     * Same reasoning as /municipal — backdrop-filter creates a stacking
     * context that traps the portal sidebar inside it.
     */
    <div className="relative min-h-screen">
      <RoleNavigation
        role="builder"
        activeTab="overview"
        onTabChange={() => {}}
        onBack={() => navigate({ to: "/" })}
        workspaceFeatureId={activeFeatureId}
        onResetWorkspaceFeature={() => navigate({ to: "/builder/overview" })}
        featureMenu={{
          menuLabel: "BUILDER FEATURES",
          features: BUILDER_FEATURE_MENU,
          activeFeatureId,
          onSelectFeature: handleFeatureSelect,
        }}
        sidebarMode="overlay"
      />

      {/* Provide shared AOI context to all sub-routes */}
      <BuilderContext.Provider value={{ selectedAoi, setSelectedAoi, setIsReportOpen }}>
        <motion.div
          key={activeFeatureId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* cs-page wrapper identical to CitizenDashboard / BuilderDashboard */}
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: "100vh",
              marginTop: -68,
              paddingTop: 68,
              overflowX: "hidden",
              color: "#e2e8f0",
            }}
          >
            {/* citizen-bg-new.jpg at 0.25 opacity */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: "url('/citizen-bg-new.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center top",
                opacity: 0.25,
                zIndex: -1,
                pointerEvents: "none",
              }}
            />

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: 24,
              }}
            >
              <div className="w-full max-w-[1280px] px-4 sm:px-6 pb-24">
                <Outlet />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Report modal lives here so any sub-route can open it */}
        <BuilderReportModal
          aoi={selectedAoi}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </BuilderContext.Provider>
    </div>
  );
}
