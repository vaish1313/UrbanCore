import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Landmark,
  Users,
  User,
  FileText,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Compass,
  SlidersHorizontal,
  Activity,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RoleType } from "@/types/urbancore";
import { ProfileModal } from "./ProfileModal";
import { useAuth } from "@/contexts/AuthContext";

const BUILDER_SIDEBAR_FEATURES = [
  { id: "overview", label: "Overview", icon: Compass, to: "/builder/overview" },
  { id: "suitability", label: "Land Suitability", icon: SlidersHorizontal, to: "/builder/land-suitability" },
  { id: "terrain", label: "Terrain Analysis", icon: Activity, to: "/builder/terrain-analysis" },
  { id: "constraints", label: "Zoning & Constraints", icon: AlertTriangle, to: "/builder/zoning-constraints" },
  { id: "history", label: "Construction History", icon: TrendingUp, to: "/builder/construction-history" },
  { id: "risk", label: "Risk Assessment", icon: ShieldCheck, to: "/builder/risk-assessment" },
  { id: "reports", label: "Land Reports", icon: FileText, to: "/builder/land-reports" },
];

export function RoleNavigation({
  role,
  activeTab,
  onTabChange,
  onBack,
}: {
  role: RoleType;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack: () => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const RoleIcon = role === "builder" ? Building2 : role === "municipal" ? Landmark : Users;

  const roleTitle =
    role === "builder"
      ? "CITY EXPLORER"
      : role === "municipal"
        ? "MUNICIPAL INTELLIGENCE"
        : "CITY EXPLORER";

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "M";
  const username = user?.full_name || "mankar purva8";

  return (
    <>
      <motion.header
        className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-md px-4 py-3 sm:px-8 shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left Side: Back Arrow → Hamburger Menu → Building Icon → CITY EXPLORER */}
          <div className="flex items-center gap-3">
            {/* Back Arrow */}
            <button
              type="button"
              onClick={() => {
                if (activeTab === "my-reports") {
                  onTabChange?.("explore");
                } else {
                  onBack();
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all duration-300 hover:border-cyan-500/50 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Hamburger Menu Icon (☰) - between Back Arrow and Building Icon */}
            {role === "builder" && (
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 hover:text-cyan-300 cursor-pointer shadow-[0_0_12px_rgba(34,211,238,0.15)]"
                aria-label="Toggle Builder Modules Sidebar"
              >
                {isSidebarOpen ? <X className="h-4 w-4 text-cyan-300" /> : <Menu className="h-4 w-4 text-cyan-300" />}
              </button>
            )}

            {/* Building Icon & Title */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                <RoleIcon className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-semibold tracking-wider text-white">
                {roleTitle}
              </span>
            </div>
          </div>

          {/* Right Side: User Profile Pill & Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 pr-3.5 transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 outline-none cursor-pointer">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 uppercase">
                  {userInitial}
                </div>
                <span className="text-xs font-medium text-slate-200">
                  {username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#0a0f1d]/90 backdrop-blur-xl border border-white/10 mt-2 shadow-2xl rounded-2xl p-1.5"
              >
                <DropdownMenuItem
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 focus:bg-white/10 focus:text-white outline-none"
                >
                  <User className="h-4 w-4 text-cyan-400" />
                  <span>My Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onTabChange?.("my-reports")}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 focus:bg-white/10 focus:text-white outline-none"
                >
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <span>My Reports</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    onBack();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 outline-none"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </motion.header>

      {/* Collapsible Left Sidebar Drawer for Builder Role */}
      {role === "builder" && (
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsSidebarOpen(false)}
              />

              {/* Sidebar Panel */}
              <motion.aside
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 32 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-72 sm:w-80 bg-[#090d16]/95 border-r border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-5 flex flex-col gap-5 overflow-y-auto"
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                    <span>BUILDER MODULES</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* 7 Feature Router Links */}
                <div className="flex flex-col gap-2 flex-1">
                  {BUILDER_SIDEBAR_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <Link
                        key={feature.id}
                        to={feature.to}
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-medium transition-all duration-200 cursor-pointer text-left w-full group text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                        activeProps={{
                          className:
                            "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer text-left w-full group bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.25)]",
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                                isActive
                                  ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                  : "bg-white/5 text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="truncate flex-1">{feature.label}</span>
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Sidebar Footer info */}
                <div className="pt-4 border-t border-white/10 text-center font-mono text-[10px] text-slate-500 tracking-wider">
                  URBANCORE DECISION SUPPORT
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
