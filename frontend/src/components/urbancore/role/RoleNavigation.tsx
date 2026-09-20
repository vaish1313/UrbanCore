import { useState } from "react";
import { motion } from "motion/react";
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
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import type { RoleFeatureMenuItem } from "./RoleFeaturesDropdown";

export type RoleFeatureMenuConfig = {
  menuLabel: string;
  features: RoleFeatureMenuItem[];
  activeFeatureId: string;
  onSelectFeature: (feature: RoleFeatureMenuItem) => void;
};

export function RoleNavigation({
  role,
  activeTab,
  onTabChange,
  onBack,
  workspaceFeatureId,
  onResetWorkspaceFeature,
  featureMenu,
}: {
  role: RoleType;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onBack: () => void;
  workspaceFeatureId?: string;
  onResetWorkspaceFeature?: () => void;
  featureMenu?: RoleFeatureMenuConfig;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const RoleIcon = role === "builder" ? Building2 : role === "municipal" ? Landmark : Users;
  const showFeatureMenu = (role === "builder" || role === "municipal") && !!featureMenu;

  const homeTab =
    role === "builder" ? "overview" : role === "municipal" ? "command" : "explore";

  const roleTitle =
    role === "builder" || role === "municipal" ? "CITY EXPLORER" : "CITY EXPLORER";

  const userInitial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : "M";
  const username = user?.full_name || "mankar purva8";

  return (
    <>
      <motion.header
        className={`sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur-md px-4 py-3 sm:px-8 ${
          role === "citizen" ? "bg-black/60 shadow-sm" : "bg-black/80 shadow-md"
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (
                  showFeatureMenu &&
                  workspaceFeatureId &&
                  workspaceFeatureId !== "overview"
                ) {
                  onResetWorkspaceFeature?.();
                } else if (activeTab === "my-reports") {
                  onTabChange(homeTab);
                } else {
                  onBack();
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all duration-300 hover:border-cyan-500/50 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {showFeatureMenu && (
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-[#0d1527] text-cyan-400 hover:border-cyan-500/60 hover:bg-[#131f38] transition-all duration-200 cursor-pointer shadow-md"
                aria-label={`Toggle ${featureMenu.menuLabel}`}
              >
                {isMenuOpen ? (
                  <X className="h-4 w-4 text-cyan-300" />
                ) : (
                  <Menu className="h-4 w-4 text-cyan-300" />
                )}
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                <RoleIcon className="h-4 w-4" />
              </span>
              <span className="font-display text-sm font-semibold tracking-wider text-white">
                {roleTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 pr-3.5 transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 outline-none cursor-pointer">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-xs font-bold text-cyan-300 uppercase">
                  {userInitial}
                </div>
                <span className="text-xs font-medium text-slate-200">{username}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className={`w-48 border mt-2 shadow-2xl rounded-2xl p-1.5 ${
                  role === "citizen"
                    ? "bg-[#0a0f1d]/90 backdrop-blur-xl border-white/10"
                    : "bg-[#0a0f1d] border-slate-800 backdrop-blur-none z-50"
                }`}
              >
                <DropdownMenuItem
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium text-slate-200 transition-colors hover:bg-white/10 focus:bg-white/10 focus:text-white outline-none"
                >
                  <User className="h-4 w-4 text-cyan-400" />
                  <span>My Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onTabChange("my-reports")}
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

      {showFeatureMenu && (
        <WorkspaceSidebar
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          menuLabel={featureMenu.menuLabel}
          features={featureMenu.features}
          activeFeatureId={featureMenu.activeFeatureId}
          onSelectFeature={featureMenu.onSelectFeature}
          roleLabel={
            role === "municipal"
              ? "Municipal Authority"
              : role === "builder"
                ? "Builder Workspace"
                : "City Explorer"
          }
        />
      )}
    </>
  );
}
