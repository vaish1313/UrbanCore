import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { RoleType, AOI } from "@/types/urbancore";
import { RoleNavigation } from "./RoleNavigation";
import { BuilderDashboard } from "../builder/BuilderDashboard";
import { MunicipalDashboard } from "../municipal/MunicipalDashboard";
import { CitizenDashboard } from "../citizen/CitizenDashboard";

export function RoleWorkspace({
  role,
  onBack,
  onSelectAoi,
  onSelectAlert,
}: {
  role: RoleType;
  onBack: () => void;
  onSelectAoi?: ((aoi: AOI) => void) | undefined;
  onSelectAlert?: ((alertId: string) => void) | undefined;
}) {
  const [activeTab, setActiveTab] = useState(
    role === "builder" ? "overview" : role === "municipal" ? "command" : "explore"
  );

  if (!role) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40 overflow-y-auto bg-background/60 backdrop-blur-md"
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
        {role === "builder" && (
          <BuilderDashboard key="builder" activeTab={activeTab} onTabChange={setActiveTab} onSelectAoi={onSelectAoi} />
        )}
        {role === "municipal" && (
          <MunicipalDashboard key="municipal" activeTab={activeTab} onTabChange={setActiveTab} onSelectAlert={onSelectAlert} />
        )}
        {role === "citizen" && (
          <CitizenDashboard key="citizen" activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
