import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "@tanstack/react-router";
import type { RoleType, AOI } from "@/types/urbancore";
import { RoleNavigation } from "./RoleNavigation";
import { CitizenDashboard } from "../citizen/CitizenDashboard";

export function RoleWorkspace({
  role,
  onBack,
}: {
  role: RoleType;
  onBack: () => void;
  onSelectAoi?: ((aoi: AOI) => void) | undefined;
  onSelectAlert?: ((alertId: string) => void) | undefined;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("explore");

  // Both municipal and builder are full routed workspaces — navigate immediately
  useEffect(() => {
    if (role === "municipal") navigate({ to: "/municipal" });
    if (role === "builder")   navigate({ to: "/builder/overview" });
  }, [role, navigate]);

  // Render nothing while navigation is in flight
  if (!role || role === "municipal" || role === "builder") return null;

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
      />

      <AnimatePresence mode="wait">
        {role === "citizen" && (
          <CitizenDashboard key="citizen" activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
