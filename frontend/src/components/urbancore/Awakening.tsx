import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { AWAKENING } from "./StoryChapters";

const ease = [0.16, 1, 0.3, 1] as const;

/** The city being understood — not a loading screen. */
export function Awakening({ active }: { active: boolean }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!active) {
      setI(0);
      return;
    }
    const t = window.setInterval(() => {
      setI((p) => Math.min(AWAKENING.length - 1, p + 1));
    }, 1900);
    return () => window.clearInterval(t);
  }, [active]);

  const line = AWAKENING[i]!;
  const done = i === AWAKENING.length - 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[22vh] flex justify-center px-6">
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={line}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
            transition={{ duration: 0.9, ease }}
          >
            <span
              className="breathe h-1.5 w-1.5 rounded-full"
              style={{
                background: done ? "var(--gis)" : "var(--primary)",
                boxShadow: `0 0 16px 5px ${done ? "var(--gis)" : "var(--atmos)"}`,
              }}
            />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.28em]"
              style={{ color: done ? "var(--accent)" : "var(--muted-foreground)" }}
            >
              {line}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
