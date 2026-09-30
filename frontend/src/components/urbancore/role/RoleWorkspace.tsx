import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import type { RoleType, AOI } from "@/types/urbancore";
import { RoleNavigation } from "./RoleNavigation";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";
import { BUILDER_FEATURE_MENU } from "./roleFeatureMenus";
import { BuilderDashboard } from "../builder/BuilderDashboard";
import { CitizenDashboard } from "../citizen/CitizenDashboard";

export function RoleWorkspace({
  role,
  onBack,
  onSelectAoi,
}: {
  role: RoleType;
  onBack: () => void;
  onSelectAoi?: ((aoi: AOI) => void) | undefined;
  onSelectAlert?: ((alertId: string) => void) | undefined;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(role === "builder" ? "overview" : "explore");
  const [builderFeatureId, setBuilderFeatureId] = useState("overview");

  // Municipal is a full routed workspace — navigate to /municipal immediately
  useEffect(() => {
    if (role === "municipal") {
      navigate({ to: "/municipal" });
    }
  }, [role, navigate]);

  // Render nothing while the navigation is in flight
  if (!role || role === "municipal") return null;

  const featureMenu =
    role === "builder"
      ? {
          menuLabel: "BUILDER DASHBOARD",
          features: BUILDER_FEATURE_MENU,
          activeFeatureId: builderFeatureId,
          onSelectFeature: (feature: RoleFeatureMenuItem) => setBuilderFeatureId(feature.id),
        }
      : undefined;

  return (
    <motion.div
      className="relative min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <RoleNavigation
        role={role}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
        workspaceFeatureId={role === "builder" ? builderFeatureId : undefined}
        onResetWorkspaceFeature={() => {
          if (role === "builder") setBuilderFeatureId("overview");
        }}
        featureMenu={featureMenu}
      />

      <AnimatePresence mode="wait">
        {role === "builder" && (
          <BuilderDashboard
            key="builder"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSelectAoi={onSelectAoi}
            activeFeatureId={builderFeatureId}
            onFeatureChange={setBuilderFeatureId}
          />
        )}
        {role === "citizen" && (
          <CitizenDashboard key="citizen" activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
