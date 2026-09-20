import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  { id: "overview", label: "Overview", icon: Compass },
  { id: "suitability", label: "Land Suitability", icon: SlidersHorizontal },
  { id: "terrain", label: "Terrain Analysis", icon: Activity },
  { id: "constraints", label: "Zoning & Constraints", icon: AlertTriangle },
  { id: "history", label: "Construction History", icon: TrendingUp },
  { id: "risk", label: "Risk Assessment", icon: ShieldCheck },
  { id: "reports", label: "Land Reports", icon: FileText },
];

export function RoleNavigation({
  role,
  activeTab,
  onTabChange,
  onBack,
  builderFeatureId = "overview",
  onSelectBuilderFeature,
}: {
  role: RoleType;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onBack: () => void;
  builderFeatureId?: string;
  onSelectBuilderFeature?: (featureId: string) => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-md px-4 py-3 sm:px-8 shadow-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left Side: Back Arrow → Hamburger Menu → Building Icon → CITY EXPLORER */}
          <div className="flex items-center gap-3">
            {/* Back Arrow Button */}
            <button
              type="button"
              onClick={() => {
                if (role === "builder" && builderFeatureId && builderFeatureId !== "overview") {
                  onSelectBuilderFeature?.("overview");
                } else if (activeTab === "my-reports") {
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

            {/* Hamburger Menu (☰) Icon Button */}
            {role === "builder" && (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-[#0d1527] text-cyan-400 hover:border-cyan-500/60 hover:bg-[#131f38] transition-all duration-200 cursor-pointer shadow-md"
                aria-label="Toggle Builder Features Menu"
              >
                {isMenuOpen ? <X className="h-4 w-4 text-cyan-300" /> : <Menu className="h-4 w-4 text-cyan-300" />}
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
                className="w-48 bg-[#0a0f1d] border border-slate-800 mt-2 shadow-2xl rounded-2xl p-1.5 z-50 backdrop-blur-none"
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

      {/* Extreme Left-Anchored Builder Features Panel */}
      <AnimatePresence>
        {role === "builder" && isMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Left Edge Anchored Panel */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-0 top-[60px] z-50 w-[300px] bg-[#0a0f1d] border-r border-b border-slate-800 shadow-2xl rounded-br-2xl p-3 opacity-100 backdrop-blur-none"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-semibold">
                  BUILDER FEATURES
                </span>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
                  7
                </span>
              </div>

              <div className="flex flex-col gap-1">
                {BUILDER_SIDEBAR_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = builderFeatureId === feature.id;
                  return (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onSelectBuilderFeature?.(feature.id);
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
    </>
  );
}
