import { useState } from "react";
import { GrowthTimeline } from "../GrowthTimeline";

export function ChangeTimeline() {
  const [yearIndex, setYearIndex] = useState(4);
  const years = [2021, 2022, 2023, 2024, 2025];
  const currentYear = years[yearIndex]!;

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            TIME LAPSE EXPLORER
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            See How Nashik Changed ({currentYear})
          </h3>
        </div>
        <span className="font-mono text-xs font-semibold text-accent">
          Year {currentYear} View
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Drag the timeline scrubber below to observe satellite-detected building footprint emergence and green space evolution between 2021 and 2025.
      </p>

      <div className="py-2">
        <GrowthTimeline value={yearIndex} onChange={setYearIndex} visible={true} />
      </div>
    </div>
  );
}
