import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import type { Feature } from "./MapOverlays";

const ease = [0.16, 1, 0.3, 1] as const;

export function SelectionPanel({
  feature,
  onClose,
}: {
  feature: Feature | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {feature && (
        <motion.aside
          key={feature.label}
          className="glass-panel pointer-events-auto absolute bottom-24 left-6 w-[min(86vw,320px)] rounded-2xl p-4 sm:bottom-10 sm:left-10"
          initial={{ opacity: 0, y: 18, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/90">
              {feature.kind === "building"
                ? "Selected parcel"
                : feature.kind === "water"
                  ? "Hydrology"
                  : "Constraint"}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close selection"
              className="text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <p className="mt-2 font-display text-[15px] font-medium tracking-tight text-foreground">
            {feature.label}
          </p>
          <p className="mt-1.5 text-[12.5px] font-light leading-relaxed text-muted-foreground">
            {feature.detail}
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-foreground/55">
            {feature.meta}
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
