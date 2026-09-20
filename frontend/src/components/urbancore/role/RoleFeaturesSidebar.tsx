import { motion, AnimatePresence } from "motion/react";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

type RoleFeaturesSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  menuLabel: string;
  features: RoleFeatureMenuItem[];
  activeFeatureId: string;
  onSelectFeature: (feature: RoleFeatureMenuItem) => void;
};

/** Left-anchored feature panel — matches builder navbar sidebar. */
export function RoleFeaturesSidebar({
  isOpen,
  onClose,
  menuLabel,
  features,
  activeFeatureId,
  onSelectFeature,
}: RoleFeaturesSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-[60px] z-50 w-[300px] bg-[#0a0f1d] border-r border-b border-slate-800 shadow-2xl rounded-br-2xl p-3"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                {menuLabel}
              </span>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
                {features.length}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isActive = activeFeatureId === feature.id;
                return (
                  <button
                    key={feature.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectFeature(feature);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium transition-colors outline-none text-left w-full ${
                      isActive
                        ? "bg-cyan-500/20 text-white font-semibold border border-cyan-500/40"
                        : "text-white hover:bg-slate-800/80 focus:bg-slate-800/80 border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span className="text-white truncate">{feature.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
