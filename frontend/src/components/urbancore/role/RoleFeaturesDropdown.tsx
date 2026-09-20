import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RoleFeatureMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isReportModalTrigger?: boolean;
};

type RoleFeaturesDropdownProps = {
  menuLabel: string;
  features: RoleFeatureMenuItem[];
  activeFeatureId: string;
  onSelectFeature: (feature: RoleFeatureMenuItem) => void;
  ariaLabel?: string;
};

/** Builder & municipal workspace feature menu — same dropdown UI. */
export function RoleFeaturesDropdown({
  menuLabel,
  features,
  activeFeatureId,
  onSelectFeature,
  ariaLabel = "Toggle workspace features menu",
}: RoleFeaturesDropdownProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 transition-all duration-300 hover:border-cyan-500/50 hover:bg-cyan-500/20 focus:outline-none cursor-pointer"
        >
          {isMenuOpen ? (
            <X className="h-4 w-4 text-cyan-300" />
          ) : (
            <Menu className="h-4 w-4 text-cyan-300" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-56 bg-[#0a0f1d] border border-white/10 shadow-2xl rounded-2xl p-1.5 z-50 opacity-100 backdrop-blur-none"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-semibold">
            {menuLabel}
          </span>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
            {features.length}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeatureId === feature.id;
            return (
              <DropdownMenuItem
                key={feature.id}
                onClick={() => {
                  setIsMenuOpen(false);
                  onSelectFeature(feature);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-xl text-xs font-medium transition-colors outline-none ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium"
                    : "text-slate-200 hover:bg-white/10 focus:bg-white/10 focus:text-white border border-transparent"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-cyan-400" />
                <span className="truncate">{feature.label}</span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
