import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { RoleType } from "@/types/urbancore";
import { ComparativeVisualization } from "./ComparativeVisualization";

const TARGET_QUERY =
  "What changed near Panchvati near 2021 and 2025 in the terms of lands like building etc and build a builders report for that report by comparing both the years";

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
  const [typed, setTyped] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const typingStarted = useRef(false);

  useEffect(() => {
    if (!visible || isSubmitted || typingStarted.current) return;
    typingStarted.current = true;

    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(TARGET_QUERY.slice(0, i));
      if (i >= TARGET_QUERY.length) {
        window.clearInterval(tick);
        window.setTimeout(() => {
          setIsSubmitted(true);
        }, 800); // Wait 800ms after finishing typing, then auto-submit
      }
    }, 45); // Adjust typing speed here

    return () => {
      window.clearInterval(tick);
    };
  }, [visible, isSubmitted]);

  return (
    <div className="w-full" style={{ pointerEvents: visible ? "auto" : "none" }}>
      <AnimatePresence mode="wait">
        {!isSubmitted || isCompleted ? (
          <motion.div
            key="search-box"
            initial={{
              opacity: isCompleted ? 0 : 1,
              scale: isCompleted ? 0.95 : 1,
              y: isCompleted ? 20 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="glass-panel group relative flex items-center gap-4 rounded-2xl px-5 py-4 transition-[box-shadow,border-color] duration-500 focus-within:border-primary/40"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                <span className="breathe absolute inset-0 rounded-full bg-accent shadow-[0_0_16px_4px_var(--gis)]" />
              </span>

              <div className="relative flex-1">
                <input
                  readOnly
                  value={typed}
                  aria-label="Ask UrbanCore about this land"
                  className="w-full bg-transparent text-base font-light tracking-tight text-foreground outline-none sm:text-lg cursor-default"
                />
                {typed.length < TARGET_QUERY.length && (
                  <span
                    className="absolute right-auto inline-block h-[1.1em] w-px bg-primary align-middle breathe"
                    style={{ left: `${typed.length}ch`, display: "none" }}
                  />
                )}
              </div>

              <button
                type="button"
                disabled
                aria-label="Ask UrbanCore"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border ${
                  isCompleted ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
                } transition-colors duration-300`}
              >
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="visualization"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)", y: -20 }}
            transition={{ duration: 0.8, ease, delay: 0.2 }}
          >
            <ComparativeVisualization onComplete={() => setIsCompleted(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
