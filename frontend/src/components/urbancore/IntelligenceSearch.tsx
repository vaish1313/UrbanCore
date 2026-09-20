import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, Search } from "lucide-react";
import type { RoleType } from "@/types/urbancore";
import { ComparativeVisualization } from "./ComparativeVisualization";

const TARGET_QUERY =
  "Show built-up growth near Panchavati from 2021 to 2025.";

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
              className="group relative flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 pl-5 backdrop-blur-2xl transition-[box-shadow,border-color] duration-500 focus-within:border-cyan-400/40"
            >
              <Search className="h-4 w-4 text-blue-500 shrink-0" />

              <div className="relative flex-1">
                <input
                  readOnly
                  value={typed}
                  placeholder="Search Address, PIN Code, Village, Latitude..."
                  aria-label="Ask UrbanCore about this land"
                  className="w-full bg-transparent text-sm font-light tracking-tight text-white outline-none sm:text-[15px] cursor-default placeholder:text-slate-500"
                />
                {typed.length < TARGET_QUERY.length && typed.length > 0 && (
                  <span
                    className="absolute right-auto inline-block h-[1.1em] w-px bg-cyan-400 align-middle breathe"
                    style={{ left: `${typed.length}ch`, display: "none" }}
                  />
                )}
              </div>

              <button
                type="button"
                disabled
                aria-label="Search"
                className={`flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all duration-300 ${
                  isCompleted 
                    ? "bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-blue-500/20" 
                    : "bg-gradient-to-br from-cyan-500 to-blue-500 opacity-80"
                }`}
              >
                Search
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
