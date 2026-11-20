/**
 * /municipal — Layout route (shared shell for all municipal sub-pages).
 *
 * Sidebar contains 5 items:
 *   Command Overview · District Map · Encroachment Watch · Case Detail · Citizen Complaints
 *
 * Behaviour:
 *   - When the current URL is /municipal (Command Overview), all sidebar clicks
 *     dispatch a "municipal-feature-select" custom event so index.tsx can swap
 *     the feature section in-page — no route change needed.
 *   - When the current URL is any other /municipal/* sub-route, clicks navigate
 *     back to /municipal and the event is still dispatched so the right feature
 *     renders immediately on arrival.
 *
 * Sidebar fix:
 *   The wrapper uses `relative min-h-screen` (NOT `fixed overflow-y-auto`).
 *   The sidebar itself is position:fixed so it stays put while the page scrolls.
 */

import { createFileRoute, Outlet, useNavigate, useMatchRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { RoleNavigation } from "@/components/urbancore/role/RoleNavigation";
import { MUNICIPAL_FEATURE_MENU } from "@/components/urbancore/role/roleFeatureMenus";
import type { RoleFeatureMenuItem } from "@/components/urbancore/role/RoleFeaturesDropdown";
import { Footer } from "@/components/urbancore/Footer";

export const Route = createFileRoute("/municipal")({
  head: () => ({
    meta: [{ title: "UrbanCore GIS — Municipal Corporation Dashboard" }],
  }),
  component: MunicipalLayout,
});

/** Dispatch the custom event that index.tsx listens for */
function dispatchFeatureSelect(featureId: string) {
  window.dispatchEvent(
    new CustomEvent("municipal-feature-select", { detail: { featureId } }),
  );
}

function MunicipalLayout() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  /* Determine which sidebar item is visually active */
  const activeFeatureId = (() => {
    if (matchRoute({ to: "/municipal/district-map" })) return "district-map";
    if (matchRoute({ to: "/municipal/encroachment" })) return "encroachment";
    if (matchRoute({ to: "/municipal/case-detail" })) return "case-detail";
    if (matchRoute({ to: "/municipal/complaints" })) return "complaints";
    /* On /municipal itself the active item is tracked by index.tsx's local state;
       fall back to "overview" so the nav header shows the right label. */
    return "overview";
  })();

  const handleFeatureSelect = (feature: RoleFeatureMenuItem) => {
    if (feature.id === "case-detail") {
      navigate({ to: "/municipal/case-detail" });
      return;
    }

    if (feature.id === "overview") {
      navigate({ to: "/municipal" });
      dispatchFeatureSelect("overview");
      return;
    }

    const isOnOverviewPage = !!matchRoute({ to: "/municipal" });

    if (isOnOverviewPage) {
      /* Already on the overview page — switch the feature section in-place */
      dispatchFeatureSelect(feature.id);
    } else {
      /* On a sub-route — navigate back to overview, then switch feature */
      navigate({ to: "/municipal" }).then(() => {
        /* Small delay so index.tsx has mounted before the event fires */
        setTimeout(() => dispatchFeatureSelect(feature.id), 100);
      });
    }
  };

  return (
    /*
     * NO backdrop-filter / blur on this wrapper.
     * backdrop-filter creates a new stacking context that traps
     * position:fixed children — the sidebar would get clipped inside it.
     * The page content (index.tsx, sub-routes) handles its own background.
     */
    <div className="relative min-h-screen flex flex-col">
      <RoleNavigation
        role="municipal"
        activeTab="command"
        onTabChange={() => { }}
        onBack={() => navigate({ to: "/" })}
        workspaceFeatureId={activeFeatureId}
        onResetWorkspaceFeature={() => {
          navigate({ to: "/municipal" });
          dispatchFeatureSelect("overview");
        }}
        featureMenu={{
          menuLabel: "MUNICIPAL FEATURES",
          features: MUNICIPAL_FEATURE_MENU,
          activeFeatureId,
          onSelectFeature: handleFeatureSelect,
        }}
        sidebarMode="overlay"
      />

      <motion.div
        key={activeFeatureId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1"
      >
        <Outlet />
      </motion.div>

      <Footer />
    </div>
  );
}
