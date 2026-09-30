/**
 * WorkspaceSidebar
 *
 * Full-height permanent sidebar used by all three role dashboards
 * (Municipal, Builder, Citizen). Now uses the PermanentSidebar component
 * to ensure full viewport height coverage.
 *
 * Can be toggled between permanent mode (always visible) and overlay mode (slide-in).
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";
import {
  PermanentSidebar,
  PermanentSidebarHeader,
  PermanentSidebarContent,
  PermanentSidebarFooter,
  PermanentSidebarNavItem,
  PermanentSidebarGroup
} from "@/components/ui/permanent-sidebar";

export type WorkspaceSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  menuLabel: string;
  features: RoleFeatureMenuItem[];
  activeFeatureId: string;
  onSelectFeature: (feature: RoleFeatureMenuItem) => void;
  /** Optional role name shown at the top — e.g. "Municipal Authority" */
  roleLabel?: string;
  /** Whether to render as permanent (always visible) or overlay (slide-in) */
  mode?: "permanent" | "overlay";
};

export function WorkspaceSidebar({
  isOpen,
  onClose,
  menuLabel,
  features,
  activeFeatureId,
  onSelectFeature,
  roleLabel,
  mode = "overlay",
}: WorkspaceSidebarProps) {

  // Permanent mode - always visible sidebar
  if (mode === "permanent") {
    return (
      <PermanentSidebar
        width={280}
        fixed={true}
        position="left"
        glassMorphism={true}
        zIndex={40}
        className="shadow-2xl"
      >
        {/* Header */}
        <PermanentSidebarHeader>
          <div className="flex flex-col gap-1">
            {roleLabel && (
              <span className="font-display text-sm font-semibold text-slate-100 tracking-tight">
                {roleLabel}
              </span>
            )}
            <div className="flex items-center gap-2">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-primary shadow-lg shadow-primary/50"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                {menuLabel}
              </span>
            </div>
          </div>
        </PermanentSidebarHeader>

        {/* Navigation */}
        <PermanentSidebarContent>
          <PermanentSidebarGroup>
            <div className="space-y-1">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isActive = activeFeatureId === feature.id;

                return (
                  <PermanentSidebarNavItem
                    key={feature.id}
                    isActive={isActive}
                    onClick={() => onSelectFeature(feature)}
                    icon={<Icon className="h-4 w-4" />}
                  >
                    {feature.label}
                  </PermanentSidebarNavItem>
                );
              })}
            </div>
          </PermanentSidebarGroup>
        </PermanentSidebarContent>

        {/* Footer */}
        <PermanentSidebarFooter>
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600">
            UrbanCore · AI Urban Intelligence
          </span>
        </PermanentSidebarFooter>
      </PermanentSidebar>
    );
  }

  // Overlay mode — portal-based so it escapes all parent stacking contexts.
  // useEffect ensures we only run on client (avoids SSR document error).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const sidebarContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              cursor: "pointer",
            }}
          />

          {/* Drawer panel */}
          <motion.aside
            key="sidebar-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 9999,
              width: 280,
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              background: "rgba(8,13,28,0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRight: "1px solid rgba(34,211,238,0.15)",
              boxShadow: "4px 0 40px rgba(0,0,0,0.6)",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-white/7 flex-shrink-0">
              <div className="flex flex-col gap-1">
                {roleLabel && (
                  <span className="font-display text-sm font-semibold text-slate-100 tracking-tight">
                    {roleLabel}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-primary shadow-lg shadow-primary/50"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                    {menuLabel}
                  </span>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                className="h-8 w-8 rounded-full border border-white/12 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-100 transition-all duration-150 flex items-center justify-center flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Feature list */}
            <nav className="flex-1 p-3 flex flex-col gap-1">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeatureId === feature.id;

                return (
                  <motion.button
                    key={feature.id}
                    type="button"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      onClose();
                      onSelectFeature(feature);
                    }}
                    className={`
                      relative flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all duration-150
                      ${isActive
                        ? "bg-primary/12 text-primary border border-primary/35"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-primary/50"
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      />
                    )}

                    <span className={`
                      h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                      ${isActive
                        ? "bg-primary/15 border border-primary/30 text-primary"
                        : "bg-white/4 border border-white/6 text-slate-400"
                      }
                    `}>
                      <Icon className="h-4 w-4" />
                    </span>

                    <span className={`
                      flex-1 truncate font-medium text-sm
                      ${isActive ? "text-slate-100" : "text-slate-300"}
                    `}>
                      {feature.label}
                    </span>

                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-primary">
                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/6 flex-shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600">
                UrbanCore · AI Urban Intelligence
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // Only render portal on client after mount
  if (!mounted) return null;
  return createPortal(sidebarContent, document.body);
}
