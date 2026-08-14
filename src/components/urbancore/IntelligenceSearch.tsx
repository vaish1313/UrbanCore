import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";

const EXAMPLES = [
  "Find suitable residential land near Gangapur Road",
  "Compare Nashik between 2021 and 2025",
  "Show construction after 2023",
  "Explain why this area is unsuitable for development",
  "Generate a Builder Report",
];

const ease = [0.16, 1, 0.3, 1] as const;

export function IntelligenceSearch({ visible }: { visible: boolean }) {
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!visible) return;
    const full = EXAMPLES[index] ?? "";
    let i = 0;
    let hold: number | undefined;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(tick);
        hold = window.setTimeout(() => setIndex((p) => (p + 1) % EXAMPLES.length), 2600);
      }
    }, 34);
    return () => {
      window.clearInterval(tick);
      if (hold) window.clearTimeout(hold);
    };
  }, [index, visible]);

  return (
    <div className="w-full" style={{ pointerEvents: visible ? "auto" : "none" }}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="glass-panel group relative flex items-center gap-4 rounded-2xl px-5 py-4 transition-[box-shadow,border-color] duration-500 focus-within:border-primary/40"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
          <span className="breathe absolute inset-0 rounded-full bg-accent shadow-[0_0_16px_4px_var(--gis)]" />
        </span>

        <div className="relative flex-1">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Ask UrbanCore about this land"
            className="w-full bg-transparent text-base font-light tracking-tight text-foreground outline-none placeholder:text-transparent sm:text-lg"
          />
          {value === "" && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base font-light tracking-tight text-muted-foreground sm:text-lg"
            >
              <span className="mr-2 text-foreground/45">Ask UrbanCore…</span>
              <span className="hidden sm:inline">{typed}</span>
              <span className="ml-0.5 inline-block h-[1.1em] w-px bg-primary align-middle breathe" />
            </span>
          )}
        </div>

        <button
          type="submit"
          aria-label="Ask UrbanCore"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-primary/15 text-primary transition-colors duration-300 hover:bg-primary/30"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex}
            type="button"
            onClick={() => setValue(ex)}
            initial={false}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: visible ? 0.4 + i * 0.1 : 0, duration: 0.9, ease }}
            className="rounded-full border border-border/70 px-3.5 py-1.5 text-[11px] font-light tracking-wide text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:text-foreground"
          >
            {ex}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
