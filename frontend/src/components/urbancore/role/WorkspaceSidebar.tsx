/**
 * WorkspaceSidebar
 *
 * Full-height slide-from-left drawer used by all three role dashboards
 * (Municipal, Builder, Citizen).  It slides in from the left edge,
 * spans 100% viewport height, and sits on top of everything.
 *
 * Props are identical to the old RoleFeaturesSidebar so the swap in
 * RoleNavigation is a one-line import change.
 */

import { motion, AnimatePresence } from "motion/react";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

export type WorkspaceSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  menuLabel: string;
  features: RoleFeatureMenuItem[];
  activeFeatureId: string;
  onSelectFeature: (feature: RoleFeatureMenuItem) => void;
  /** Optional role name shown at the top — e.g. "Municipal Authority" */
  roleLabel?: string;
};

export function WorkspaceSidebar({
  isOpen,
  onClose,
  menuLabel,
  features,
  activeFeatureId,
  onSelectFeature,
  roleLabel,
}: WorkspaceSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — semi-transparent, closes sidebar on click */}
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
              zIndex: 45,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              cursor: "pointer",
            }}
          />

          {/* Drawer panel — full height, slides in from left */}
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
              zIndex: 50,
              width: 280,
              display: "flex",
              flexDirection: "column",
              background: "rgba(8, 13, 28, 0.97)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRight: "1px solid rgba(34,211,238,0.15)",
              boxShadow: "4px 0 40px rgba(0,0,0,0.6)",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {roleLabel && (
                  <span style={{
                    fontFamily: "var(--font-display,'Sora',sans-serif)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#f1f5f9",
                    letterSpacing: "0.01em",
                  }}>
                    {roleLabel}
                  </span>
                )}
                <span style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#22d3ee",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "#22d3ee",
                    boxShadow: "0 0 6px #22d3ee",
                    display: "inline-block",
                    animation: "ws-pulse 2s ease-in-out infinite",
                  }} />
                  {menuLabel}
                </span>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close sidebar"
                style={{
                  width: 32, height: 32,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#94a3b8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                }}
              >
                {/* ✕ icon */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Feature list */}
            <nav style={{ flex: 1, padding: "12px 12px 24px", display: "flex", flexDirection: "column", gap: 2 }}>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeatureId === feature.id;

                return (
                  <motion.button
                    key={feature.id}
                    type="button"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04, ease: [0.16,1,0.3,1] }}
                    onClick={() => {
                      onClose();
                      onSelectFeature(feature);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 12,
                      border: isActive
                        ? "1px solid rgba(34,211,238,0.35)"
                        : "1px solid transparent",
                      background: isActive
                        ? "rgba(34,211,238,0.12)"
                        : "transparent",
                      color: isActive ? "#22d3ee" : "#cbd5e1",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                    whileHover={{
                      background: isActive
                        ? "rgba(34,211,238,0.16)"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-bar"
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "20%",
                          bottom: "20%",
                          width: 3,
                          borderRadius: 999,
                          background: "linear-gradient(180deg,#06b6d4,#3b82f6)",
                          boxShadow: "0 0 10px rgba(34,211,238,0.5)",
                        }}
                        transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                      />
                    )}

                    {/* Icon */}
                    <span style={{
                      width: 34, height: 34,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: isActive
                        ? "rgba(34,211,238,0.15)"
                        : "rgba(255,255,255,0.04)",
                      border: isActive
                        ? "1px solid rgba(34,211,238,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      color: isActive ? "#22d3ee" : "#64748b",
                      transition: "all 0.15s",
                    }}>
                      <Icon className="h-4 w-4" />
                    </span>

                    {/* Label */}
                    <span style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: isActive ? "#f1f5f9" : "#cbd5e1",
                    }}>
                      {feature.label}
                    </span>

                    {/* Active chevron */}
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: "#22d3ee" }}>
                        <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            {/* Footer */}
            <div style={{
              padding: "16px 20px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#334155",
              }}>
                UrbanCore · AI Urban Intelligence
              </span>
            </div>
          </motion.aside>

          {/* Pulse keyframe */}
          <style>{`
            @keyframes ws-pulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
