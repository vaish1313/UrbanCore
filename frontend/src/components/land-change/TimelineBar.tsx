import { useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { useLandChangeStore } from "@/store/landChangeStore";

const STEP_MS = 1000;

export function TimelineBar() {
  const years = useLandChangeStore((s) => s.years);
  const year = useLandChangeStore((s) => s.year);
  const playing = useLandChangeStore((s) => s.playing);
  const setYear = useLandChangeStore((s) => s.setYear);
  const setPlaying = useLandChangeStore((s) => s.setPlaying);
  const togglePlaying = useLandChangeStore((s) => s.togglePlaying);

  useEffect(() => {
    if (!playing || years.length < 2) return;
    const id = window.setInterval(() => {
      const idx = years.indexOf(year);
      if (idx < 0 || idx >= years.length - 1) {
        setPlaying(false);
        return;
      }
      setYear(years[idx + 1] ?? year);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [playing, year, years, setYear, setPlaying]);

  if (!years.length) return null;

  const min = years[0] ?? 0;
  const max = years[years.length - 1] ?? 0;

  const onPlay = () => {
    if (year === max) setYear(min);
    togglePlaying();
  };

  const onSlider = (value: number) => {
    // Snap to nearest available year
    let nearest = years[0] ?? 0;
    let best = Infinity;
    for (const y of years) {
      const d = Math.abs(y - value);
      if (d < best) {
        best = d;
        nearest = y;
      }
    }
    setYear(nearest);
  };

  return (
    <div
      className="lce-inner-panel lce-timeline-bg"
      style={{
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(4,10,20,0.45)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "16px 20px",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPlay}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center transition"
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(56,189,248,0.10)",
            color: "#7dd3fc",
          }}
          aria-label={playing ? "Pause timeline" : "Play timeline"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <div
          className="min-w-[4.5rem] text-center text-3xl font-bold tabular-nums sm:text-4xl"
          style={{
            fontFamily: "var(--font-sans,'Manrope',sans-serif)",
            color: "#f1f5f9",
          }}
          aria-live="polite"
        >
          {year}
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={year}
            onChange={(e) => onSlider(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full accent-sky-400"
            style={{ background: "#1e293b" }}
            aria-label="Year"
          />
          <div
            className="mt-2 flex justify-between gap-1 text-[10px] uppercase tracking-wider"
            style={{ color: "#64748b" }}
          >
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setYear(y)}
                className="min-h-[28px] px-1 transition"
                style={{ color: y === year ? "#38bdf8" : "#64748b" }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
