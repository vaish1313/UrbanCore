import { Trees, Droplets, Building, ShieldCheck } from "lucide-react";
import { CITIZEN_NEIGHBORHOOD_STORIES } from "@/data/citizenData";

export function AreaInsights({ storyId }: { storyId: string }) {
  const story = CITIZEN_NEIGHBORHOOD_STORIES.find((s) => s.id === storyId) || CITIZEN_NEIGHBORHOOD_STORIES[0]!;

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
          AREA INTELLIGENCE PROFILE
        </span>
        <h3 className="font-display text-lg font-medium text-foreground">
          {story.neighborhood} Key Metrics
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between text-accent">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Green Coverage</span>
            <Trees className="h-4 w-4" />
          </div>
          <div className="mt-2 font-display text-xl font-bold text-foreground">{story.greeneryTrend}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Derived from Sentinel-2 NDVI satellite imagery</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between text-primary">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Construction Trend</span>
            <Building className="h-4 w-4" />
          </div>
          <div className="mt-2 font-display text-xl font-bold text-foreground">{story.constructionTrend}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Building footprint change 2021–2025</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between text-atmos">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Water Index</span>
            <Droplets className="h-4 w-4" />
          </div>
          <div className="mt-2 font-display text-xl font-bold text-foreground">{story.waterIndex}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">NDWI moisture & river channel proximity</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-foreground/[0.02] p-4">
          <div className="flex items-center justify-between text-accent">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Protected Status</span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="mt-2 font-display text-xl font-bold text-foreground">Regulated Zone</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Buffer protection & zoning active</p>
        </div>
      </div>
    </div>
  );
}
