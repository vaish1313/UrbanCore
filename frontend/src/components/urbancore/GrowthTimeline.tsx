import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

// Default years for backward compatibility
const DEFAULT_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

type GrowthTimelineProps =
  // New API: dynamic years with play/pause
  | {
    years: number[];
    selectedYear: number;
    onYearChange: (year: number) => void;
    visible: boolean;
    showPlayPause?: boolean;
    // Old API properties must not be present
    value?: never;
    onChange?: never;
  }
  // Old API: index-based (backward compatible)
  | {
    value: number;
    onChange: (v: number) => void;
    visible: boolean;
    // New API properties must not be present
    years?: never;
    selectedYear?: never;
    onYearChange?: never;
    showPlayPause?: never;
  };

/** Timeline with backward compatibility and dynamic years support */
export function GrowthTimeline(props: GrowthTimelineProps) {
  // Determine which API is being used
  const isNewAPI = "years" in props && props.years !== undefined;

  // Handle old API: value/onChange based on index
  if (!isNewAPI && "value" in props) {
    const { value, onChange, visible } = props;
    const years = Array.from(DEFAULT_YEARS);
    const MAX = years.length - 1;
    const ratio = value / MAX;
    const year = years[Math.min(MAX, Math.round(value))] ?? years[MAX];

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
            {years.map((y, i) => (
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
            {years.map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // Handle new API: years/selectedYear with optional play/pause
  const { years, selectedYear, onYearChange, visible, showPlayPause = false } = props as any;
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout>();

  const MAX = years.length - 1;
  const selectedIndex = years.indexOf(selectedYear);
  const ratio = MAX > 0 ? selectedIndex / MAX : 0;

  // Play/pause functionality
  useEffect(() => {
    if (isPlaying && years.length > 1) {
      playIntervalRef.current = setInterval(() => {
        const currentIndex = years.indexOf(selectedYear);
        const nextIndex = currentIndex + 1;

        if (nextIndex < years.length) {
          onYearChange(years[nextIndex]);
        } else {
          // Reached the end, stop playing
          setIsPlaying(false);
        }
      }, 1500); // 1.5 seconds per year
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, selectedYear, years, onYearChange]);

  const handlePlay = () => {
    if (selectedYear === years[years.length - 1]) {
      // If at the end, restart from beginning
      onYearChange(years[0]);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      className="flex justify-center"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16 }}
      transition={{ duration: 1, ease }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div className="glass-panel w-[min(92vw,520px)] rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              Construction monitoring
            </span>
            {showPlayPause && years.length > 1 && (
              <button
                onClick={handlePlay}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 px-2.5 py-1 transition-colors"
                title={isPlaying ? "Pause timeline" : "Play timeline"}
              >
                {isPlaying ? (
                  <Pause className="h-3 w-3 text-primary" />
                ) : (
                  <Play className="h-3 w-3 text-primary" />
                )}
                <span className="font-mono text-[8px] uppercase tracking-wider text-primary">
                  {isPlaying ? "pause" : "play"}
                </span>
              </button>
            )}
          </div>
          <span className="font-display text-[15px] font-medium tracking-tight text-foreground">
            {selectedYear}
          </span>
        </div>

        <div className="relative mt-3 h-6">
          {/* track */}
          <span className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <span
            className="absolute top-1/2 h-px -translate-y-1/2 bg-primary transition-[width] duration-300"
            style={{ left: 0, width: `${ratio * 100}%` }}
          />
          {/* year ticks */}
          {years.map((year, i) => (
            <span
              key={year}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 cursor-pointer hover:scale-125"
              style={{
                left: `${(i / MAX) * 100}%`,
                background: selectedIndex >= i ? "var(--primary)" : "var(--border)",
              }}
              onClick={() => onYearChange(year)}
              title={`Go to ${year}`}
            />
          ))}
          {/* handle */}
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary cursor-grab active:cursor-grabbing"
            style={{
              left: `${ratio * 100}%`,
              boxShadow: "0 0 22px 6px var(--atmos)",
            }}
          />
          <input
            type="range"
            min={0}
            max={MAX}
            step={1}
            value={selectedIndex}
            aria-label="Urban growth year"
            onChange={(e) => {
              const index = Number(e.target.value);
              onYearChange(years[index]);
            }}
            className="absolute inset-0 h-full w-full cursor-grab opacity-0"
          />
        </div>

        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
          <span>{years[0] || ""}</span>
          <span>{years[years.length - 1] || ""}</span>
        </div>
      </div>
    </motion.div>
  );
}
