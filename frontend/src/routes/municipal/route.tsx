/**
 * /municipal — Layout route (shared shell for all municipal sub-pages).
 *
 * TanStack Router picks this file up as the parent layout for every
 * route under /municipal/*.  The <Outlet /> renders whichever child
 * route is currently active — nothing else is mounted.
 *
 * Navigation between features is driven by the sidebar
 * (RoleFeaturesSidebar) whose onSelectFeature now calls useNavigate
 * instead of setting local state, so the URL updates and only the
 * active page's component is mounted.
 */

import { useState } from "react";
import { createFileRoute, Outlet, useNavigate, useMatchRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { RoleNavigation } from "@/components/urbancore/role/RoleNavigation";
import { MUNICIPAL_FEATURE_MENU } from "@/components/urbancore/role/roleFeatureMenus";
import type { RoleFeatureMenuItem } from "@/components/urbancore/role/RoleFeaturesDropdown";

export const Route = createFileRoute("/municipal")({
  head: () => ({
    meta: [{ title: "UrbanCore GIS — Municipal Corporation Dashboard" }],
  }),
  component: MunicipalLayout,
});

// Map feature-menu ids → nested route paths (relative to /municipal)
const FEATURE_ROUTE_MAP: Record<string, string> = {
  overview: "/municipal",
  "district-map": "/municipal/district-map",
  encroachment: "/municipal/encroachment",
  forensics: "/municipal/forensics",
  heatmap: "/municipal/heatmap",
  legal: "/municipal/legal",
  export: "/municipal/export",
};

function MunicipalLayout() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  // Derive activeFeatureId from the current URL so the sidebar
  // highlights the correct item without extra state.
  const activeFeatureId = (() => {
    for (const [id, path] of Object.entries(FEATURE_ROUTE_MAP)) {
      if (matchRoute({ to: path, fuzzy: path === "/municipal" ? false : true })) return id;
    }
    return "overview";
  })();

  const handleFeatureSelect = (feature: RoleFeatureMenuItem) => {
    // "compliance" is a modal trigger, not a route
    if (feature.isReportModalTrigger) {
      setIsDraftOpen(true);
      return;
    }
    const path = FEATURE_ROUTE_MAP[feature.id] ?? "/municipal";
    navigate({ to: path });
  };

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background/60 backdrop-blur-md">
      <RoleNavigation
        role="municipal"
        activeTab="command"
        onTabChange={() => { }}
        onBack={() => navigate({ to: "/" })}
        workspaceFeatureId={activeFeatureId}
        onResetWorkspaceFeature={() => navigate({ to: "/municipal" })}
        featureMenu={{
          menuLabel: "MUNICIPAL FEATURES",
          features: MUNICIPAL_FEATURE_MENU,
          activeFeatureId,
          onSelectFeature: handleFeatureSelect,
        }}
        sidebarMode="overlay"
      />

      {/* Only the active child route is mounted here */}
      <motion.div
        key={activeFeatureId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <Outlet />
      </motion.div>

      {/* Compliance draft modal — available from any sub-page */}
      {isDraftOpen && <ComplianceDraftPortal onClose={() => setIsDraftOpen(false)} />}
    </div>
  );
}

// Lazy-import the compliance modal only when opened
import { lazy, Suspense } from "react";
import { MUNICIPAL_ALERTS } from "@/data/municipalData";

const ComplianceReportModal = lazy(() =>
  import("@/components/urbancore/municipal/ComplianceReportModal").then((m) => ({
    default: m.ComplianceReportModal,
  })),
);

function ComplianceDraftPortal({ onClose }: { onClose: () => void }) {
  return (
    <Suspense fallback={null}>
      <ComplianceReportModal alert={MUNICIPAL_ALERTS[0]!} isOpen onClose={onClose} />
    </Suspense>
  );
}
