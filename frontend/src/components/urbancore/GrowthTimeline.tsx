import { motion } from "motion/react";

import { GROWTH_YEARS } from "./MapOverlays";

const ease = [0.16, 1, 0.3, 1] as const;
const MAX = GROWTH_YEARS.length - 1;

/** Draggable time scrubber — buildings physically grow as it moves. */
export function GrowthTimeline({
  value,
  onChange,
  visible,
}: {
  value: number;
  onChange: (v: number) => void;
  visible: boolean;
}) {
  const ratio = value / MAX;
  const year =
    GROWTH_YEARS[Math.min(MAX, Math.round(value))] ?? GROWTH_YEARS[MAX];

  return (
    <motion.div
      className="flex justify-center"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={{ duration: 1, ease }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="glass-panel w-[min(92vw,520px)] rounded-2xl px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            Construction monitoring
          </span>
          <span className="font-display text-[15px] font-medium tracking-tight text-foreground">
            {year}
          </span>
        </div>

        <div className="relative mt-3 h-6">
          {/* track */}
          <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <span
            className="absolute top-1/2 h-px -translate-y-1/2 bg-primary transition-[width] duration-200"
            style={{ left: 0, width: `${ratio * 100}%` }}
          />
          {/* year ticks */}
          {GROWTH_YEARS.map((y, i) => (
            <span
              key={y}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300"
              style={{
                left: `${(i / MAX) * 100}%`,
                background: value >= i - 0.01 ? "var(--primary)" : "var(--border)",
              }}
            />
          ))}
          {/* handle */}
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{
              left: `${ratio * 100}%`,
              boxShadow: "0 0 22px 6px var(--atmos)",
            }}
          />
          <input
            type="range"
            min={0}
            max={MAX}
            step={0.02}
            value={value}
            aria-label="Urban growth year"
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-grab opacity-0"
          />
        </div>

        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {GROWTH_YEARS.map((y) => (
            <span key={y}>{y}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
