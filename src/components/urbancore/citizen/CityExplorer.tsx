import { MapPin, Compass, Trees, Droplets, Building } from "lucide-react";
import { CITIZEN_NEIGHBORHOOD_STORIES } from "@/data/citizenData";

export function CityExplorer({
  selectedStoryId,
  onSelectStory,
}: {
  selectedStoryId: string;
  onSelectStory: (id: string) => void;
}) {
  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            NEIGHBORHOOD INSIGHTS
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Explore Nashik Neighborhoods
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
          <Compass className="h-3.5 w-3.5" /> Interactive Map Explorer
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CITIZEN_NEIGHBORHOOD_STORIES.map((story) => {
          const isSelected = selectedStoryId === story.id;
          return (
            <div
              key={story.id}
              onClick={() => onSelectStory(story.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(114,180,255,0.2)]"
                  : "border-border/50 bg-foreground/[0.02] hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4 shrink-0" />
                <h4 className="font-display text-base font-semibold text-foreground">
                  {story.neighborhood}
                </h4>
              </div>

              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {story.summary}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-accent">
                  <Trees className="h-3 w-3 shrink-0" />
                  <span className="truncate">{story.greeneryTrend}</span>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Building className="h-3 w-3 shrink-0" />
                  <span className="truncate">{story.constructionTrend}</span>
                </div>
                <div className="flex items-center gap-1 text-atmos">
                  <Droplets className="h-3 w-3 shrink-0" />
                  <span className="truncate">{story.waterIndex}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
