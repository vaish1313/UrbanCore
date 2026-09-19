import { MapPin, RotateCcw, Globe, Hash } from "lucide-react";
import type { AOI } from "@/types/urbancore";

interface SelectedSiteCardProps {
  aoi: AOI;
  onChangeLocation: () => void;
}

export function SelectedSiteCard({ aoi, onChangeLocation }: SelectedSiteCardProps) {
  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6 border border-border/80 bg-background/50 backdrop-blur-xl shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              SELECTED SITE / AOI
            </span>
            <h2 className="font-display text-xl font-bold text-foreground">
              {aoi.name}
            </h2>
            <p className="text-xs text-muted-foreground font-light">
              {aoi.location || "Nashik, Maharashtra"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangeLocation}
          className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Change Location</span>
        </button>
      </div>

      {/* Grid of Key Location Identifiers */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Latitude</span>
          </div>
          <span className="font-mono text-sm font-semibold text-foreground">
            {aoi.coords.lat.toFixed(4)}° N
          </span>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Longitude</span>
          </div>
          <span className="font-mono text-sm font-semibold text-foreground">
            {aoi.coords.lng.toFixed(4)}° E
          </span>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Hash className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">AOI ID</span>
          </div>
          <span className="font-mono text-sm font-semibold text-foreground">
            {aoi.id}
          </span>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-3.5">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider">Category</span>
          </div>
          <span className="font-mono text-sm font-semibold text-foreground capitalize">
            {aoi.category}
          </span>
        </div>
      </div>
    </div>
  );
}
