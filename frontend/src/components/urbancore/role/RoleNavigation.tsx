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

export function RoleNavigation({
  role,
  activeTab,
  onTabChange,
  onBack,
}: {
  role: RoleType;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onBack: () => void;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
    <motion.header
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/60 backdrop-blur-md px-4 py-3 sm:px-8 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        {/* Left Side: Circular back button, cyan outlined icon & title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeTab === "my-reports") {
                onTabChange("explore");
              } else {
                onBack();
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-all duration-300 hover:border-cyan-500/50 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

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
  );
}
