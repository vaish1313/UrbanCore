import { motion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  Landmark,
  Users,
  Compass,
  SlidersHorizontal,
  AlertTriangle,
  FileText,
  Search,
  Activity,
  ShieldCheck,
  MapPin,
  User,
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
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

type SectionTab = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const BUILDER_SECTIONS: SectionTab[] = [
  { id: "overview", label: "Overview", icon: Compass },
  { id: "suitability", label: "Suitability", icon: SlidersHorizontal },
  { id: "readiness", label: "Site Readiness", icon: Activity },
  { id: "constraints", label: "Constraints", icon: AlertTriangle },
  { id: "growth", label: "Growth History", icon: Activity },
  { id: "compare", label: "Compare Areas", icon: SlidersHorizontal },
  { id: "report", label: "Intelligence Report", icon: FileText },
];

const MUNICIPAL_SECTIONS: SectionTab[] = [
  { id: "command", label: "Command Center", icon: Compass },
  { id: "encroachment", label: "Encroachment Watch", icon: AlertTriangle },
  { id: "monitoring", label: "Construction Monitoring", icon: Search },
  { id: "zones", label: "Zoning & Layers", icon: ShieldCheck },
  { id: "evidence", label: "Evidence Viewer", icon: Activity },
  { id: "hotspots", label: "Growth Hotspots", icon: Activity },
  { id: "reports", label: "Compliance Reports", icon: FileText },
];

const CITIZEN_SECTIONS: SectionTab[] = [
  { id: "explore", label: "Explore City", icon: MapPin },
  { id: "changing", label: "What's Changing", icon: Activity },
  { id: "insights", label: "Area Insights", icon: Compass },
  { id: "report", label: "Report a Concern", icon: AlertTriangle },
  { id: "my-reports", label: "My Submitted Reports", icon: FileText },
];

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

  const sections =
    role === "builder"
      ? BUILDER_SECTIONS
      : role === "municipal"
        ? MUNICIPAL_SECTIONS
        : CITIZEN_SECTIONS;

  const RoleIcon = role === "builder" ? Building2 : role === "municipal" ? Landmark : Users;

  const roleTitle =
    role === "builder"
      ? "BUILDER INTELLIGENCE"
      : role === "municipal"
        ? "MUNICIPAL INTELLIGENCE"
        : "CITY EXPLORER";

  return (
    <motion.header
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/50 backdrop-blur-md px-4 py-3 sm:px-8 shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Left: Back button & Role Branding */}
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
            className="glass-panel group flex items-center justify-center h-8 w-8 rounded-xl text-slate-300 transition-colors duration-300 hover:border-cyan-500/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </button>

          <div className="hidden h-5 w-px bg-white/15 sm:block" />

          <div className="flex items-center gap-2 pl-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              <RoleIcon className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-sm font-semibold tracking-wider text-white">
              {roleTitle}
            </span>
          </div>
        </div>

        {/* Right: Section Navigation Tabs */}
        {role !== "citizen" ? (
          <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {sections.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_12px_rgba(114,180,255,0.2)]"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-1.5 py-1.5 pr-3 transition-colors hover:bg-primary/10 outline-none">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary uppercase">
                  {user?.full_name ? user.full_name.charAt(0) : <User className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {user?.full_name || "User"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-[#0a0f1d]/80 backdrop-blur-xl border border-white/10 mt-2 shadow-2xl rounded-xl"
              >
                <DropdownMenuItem
                  onClick={() => setIsProfileOpen(true)}
                  className="gap-2 cursor-pointer text-sm text-slate-200 hover:bg-white/5 focus:bg-white/5"
                >
                  <User className="h-4 w-4 text-cyan-400" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onTabChange("my-reports")}
                  className="gap-2 cursor-pointer text-sm text-slate-200 hover:bg-white/5 focus:bg-white/5"
                >
                  <FileText className="h-4 w-4 text-cyan-400" />
                  My Reports
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    onBack();
                  }}
                  className="gap-2 cursor-pointer text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </motion.header>
  );
}
