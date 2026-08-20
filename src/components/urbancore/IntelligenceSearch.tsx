import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Sparkles, X, Loader2, Bot, MapPin } from "lucide-react";
import type { RoleType } from "@/types/urbancore";

const EXAMPLES = [
  "Find suitable residential land near Gangapur Road",
  "Show potential encroachments near Godavari River",
  "Compare Gangapur Road and Pathardi Phata",
  "What changed near Panchavati between 2021 and 2025?",
  "Generate a Builder Intelligence Report",
];

const ease = [0.16, 1, 0.3, 1] as const;

export function IntelligenceSearch({
  visible,
  activeRole,
  onSelectRole,
}: {
  visible: boolean;
  activeRole?: RoleType;
  onSelectRole?: (role: "builder" | "municipal" | "citizen") => void;
}) {
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<{ title: string; body: string; targetRole?: "builder" | "municipal" | "citizen" } | null>(null);

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

  const handleSearchSubmit = (queryText: string) => {
    const text = queryText.trim() || typed || EXAMPLES[0]!;
    setIsAiThinking(true);
    setAiAnswer(null);

    setTimeout(() => {
      setIsAiThinking(false);
      if (text.toLowerCase().includes("encroach") || text.toLowerCase().includes("godavari")) {
        setAiAnswer({
          title: "Godavari Floodplain & Encroachment Intelligence",
          body: "Multi-temporal satellite change analysis detected 12 active potential encroachments. High severity alert: 3-storey structure detected 42m from Ramkund 100m statutory river blue line.",
          targetRole: "municipal",
        });
      } else if (text.toLowerCase().includes("panchavati") || text.toLowerCase().includes("changed")) {
        setAiAnswer({
          title: "Panchavati Historical Change (2021–2025)",
          body: "Structural density increased by 12.1% (51 new buildings detected). Greenery canopy remains steady (-2% NDVI). Water channel NDWI index indicates high river presence.",
          targetRole: "citizen",
        });
      } else {
        setAiAnswer({
          title: "Gangapur Road Parcel #88 Suitability Analysis",
          body: "Overall Suitability Score: 82/100 (HIGH). Elevation: 612m, Average slope: 8.4° (Flat land: 74%). Minor 12% flood buffer overlap detected on eastern boundary.",
          targetRole: "builder",
        });
      }
    }, 900);
  };

  return (
    <div className="w-full" style={{ pointerEvents: visible ? "auto" : "none" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(value);
        }}
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
            onClick={() => {
              setValue(ex);
              handleSearchSubmit(ex);
            }}
            initial={false}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ delay: visible ? 0.4 + i * 0.1 : 0, duration: 0.9, ease }}
            className="rounded-full border border-border/70 px-3.5 py-1.5 text-[11px] font-light tracking-wide text-muted-foreground transition-colors duration-300 hover:border-primary/40 hover:text-foreground"
          >
            {ex}
          </motion.button>
        ))}
      </div>

      {/* AI Answer Modal */}
      <AnimatePresence>
        {(isAiThinking || aiAnswer) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-panel relative w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsAiThinking(false);
                  setAiAnswer(null);
                }}
                className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-foreground/5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              {isAiThinking ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="mt-4 font-mono text-xs text-primary animate-pulse">
                    Synthesizing multi-year Sentinel-2 imagery & SRTM DEM...
                  </span>
                </div>
              ) : (
                aiAnswer && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Bot className="h-5 w-5" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                        URBANCORE AI GEOSPATIAL INTELLIGENCE
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {aiAnswer.title}
                    </h3>

                    <p className="text-xs text-foreground/90 leading-relaxed bg-foreground/[0.02] p-4 rounded-2xl border border-border/40">
                      {aiAnswer.body}
                    </p>

                    {aiAnswer.targetRole && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Explore deeper in dedicated workspace:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const role = aiAnswer.targetRole!;
                            setIsAiThinking(false);
                            setAiAnswer(null);
                            onSelectRole?.(role);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Open {aiAnswer.targetRole.toUpperCase()} Workspace <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
