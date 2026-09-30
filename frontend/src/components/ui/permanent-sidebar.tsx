/**
 * PermanentSidebar
 * 
 * A reusable full-height sidebar component that spans the entire viewport height.
 * Can be used for navigation, feature menus, or any sidebar content.
 * Features:
 * - Full viewport height (100vh)
 * - Fixed positioning option
 * - Responsive design
 * - Customizable styling
 * - Glass morphism effect
 */

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface PermanentSidebarProps {
  /** Content to be displayed in the sidebar */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Width of the sidebar */
  width?: number | string;
  /** Whether the sidebar should be fixed positioned */
  fixed?: boolean;
  /** Position of the sidebar */
  position?: "left" | "right";
  /** Whether to show the glass morphism effect */
  glassMorphism?: boolean;
  /** Custom background */
  background?: string;
  /** Whether the sidebar is collapsible */
  collapsible?: boolean;
  /** Whether the sidebar is collapsed (when collapsible is true) */
  collapsed?: boolean;
  /** Collapsed width */
  collapsedWidth?: number | string;
  /** Z-index value */
  zIndex?: number;
}

export function PermanentSidebar({
  children,
  className,
  width = 280,
  fixed = true,
  position = "left",
  glassMorphism = true,
  background,
  collapsible = false,
  collapsed = false,
  collapsedWidth = 64,
  zIndex = 40,
  ...props
}: PermanentSidebarProps) {
  const sidebarWidth = collapsible && collapsed ? collapsedWidth : width;
  
  const defaultBackground = glassMorphism
    ? "rgba(8, 13, 28, 0.95)"
    : "rgba(8, 13, 28, 1)";

  const sidebarStyles: React.CSSProperties = {
    width: typeof sidebarWidth === "number" ? `${sidebarWidth}px` : sidebarWidth,
    height: "100vh",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: background || defaultBackground,
    borderRight: position === "left" ? "1px solid rgba(34, 211, 238, 0.15)" : undefined,
    borderLeft: position === "right" ? "1px solid rgba(34, 211, 238, 0.15)" : undefined,
    zIndex,
    ...(glassMorphism && {
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
    }),
    ...(fixed && {
      position: "fixed",
      top: 0,
      [position]: 0,
    }),
  };

  return (
    <motion.aside
      className={cn(
        "flex flex-col overflow-hidden",
        fixed && position === "left" && "fixed left-0 top-0",
        fixed && position === "right" && "fixed right-0 top-0",
        className
      )}
      style={sidebarStyles}
      initial={collapsible ? { width: collapsed ? collapsedWidth : width } : false}
      animate={collapsible ? { width: collapsed ? collapsedWidth : width } : undefined}
      transition={collapsible ? { duration: 0.3, ease: [0.16, 1, 0.3, 1] } : undefined}
      {...props}
    >
      {children}
    </motion.aside>
  );
}

/**
 * PermanentSidebarHeader
 * Header section for the permanent sidebar
 */
export interface PermanentSidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PermanentSidebarHeader({ children, className }: PermanentSidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 border-b border-white/7 p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PermanentSidebarContent
 * Main content area for the permanent sidebar with scrolling
 */
export interface PermanentSidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PermanentSidebarContent({ children, className }: PermanentSidebarContentProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden p-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PermanentSidebarFooter
 * Footer section for the permanent sidebar
 */
export interface PermanentSidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function PermanentSidebarFooter({ children, className }: PermanentSidebarFooterProps) {
  return (
    <div
      className={cn(
        "flex-shrink-0 border-t border-white/6 p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PermanentSidebarNavItem
 * Navigation item component for the sidebar
 */
export interface PermanentSidebarNavItemProps {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

export function PermanentSidebarNavItem({ 
  children, 
  isActive = false, 
  onClick, 
  icon,
  className,
  collapsed = false 
}: PermanentSidebarNavItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200",
        "hover:bg-white/5",
        isActive && "bg-primary/12 text-primary border border-primary/35",
        !isActive && "text-slate-300 hover:text-white",
        collapsed && "justify-center",
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-primary/50"
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* Icon */}
      {icon && (
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
            isActive 
              ? "bg-primary/15 border border-primary/30 text-primary" 
              : "bg-white/4 border border-white/6 text-slate-400"
          )}
        >
          {icon}
        </span>
      )}

      {/* Label - hidden when collapsed */}
      {!collapsed && (
        <span className="flex-1 truncate font-medium">
          {children}
        </span>
      )}

      {/* Active chevron - hidden when collapsed */}
      {isActive && !collapsed && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="flex-shrink-0 text-primary"
        >
          <path
            d="M5 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}

/**
 * PermanentSidebarGroup
 * Group container for related sidebar items
 */
export interface PermanentSidebarGroupProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  collapsed?: boolean;
}

export function PermanentSidebarGroup({ children, title, className, collapsed = false }: PermanentSidebarGroupProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {title && !collapsed && (
        <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}