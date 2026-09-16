import { TrendingUp, Flame, MapPin } from "lucide-react";
import { GROWTH_HOTSPOTS } from "@/data/municipalData";

export function GrowthAnalytics({ onSelectHotspot }: { onSelectHotspot?: (id: string) => void }) {
  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            SATELLITE CHANGE METRICS (2021–2025)
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Growth Analytics & High-Growth Hotspots
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
          <Flame className="h-3.5 w-3.5" /> High-Growth Corridors
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GROWTH_HOTSPOTS.map((hotspot) => (
          <div
            key={hotspot.id}
            onClick={() => onSelectHotspot?.(hotspot.id)}
            className="group cursor-pointer rounded-2xl border border-border/50 bg-foreground/[0.02] p-4 transition-all duration-300 hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{hotspot.category}</span>
              <MapPin className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            </div>

            <h4 className="mt-2 font-display text-base font-semibold text-foreground">
              {hotspot.name}
            </h4>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-bold text-accent">+{hotspot.growthPercent}%</span>
              <span className="font-mono text-xs text-muted-foreground">+{hotspot.buildingsAdded} structures</span>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${Math.min(100, hotspot.growthPercent / 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
