import { motion, AnimatePresence } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export const STORY = [
  {
    eyebrow: "Living digital twin",
    text: "Nashik, rendered as a living city.",
  },
  {
    eyebrow: "Multi-year construction monitoring",
    text: "Understand how cities evolve over time.",
  },
  {
    eyebrow: "Terrain intelligence",
    text: "Evaluate land beyond what the eye can see.",
  },
  {
    eyebrow: "Protected zones & regulation",
    text: "Identify environmental and regulatory constraints.",
  },
  {
    eyebrow: "AI decision support",
    text: "Transform geospatial data into intelligent decisions.",
  },
] as const;

export function StoryCaption({ stage, visible }: { stage: number; visible: boolean }) {
  const item = STORY[Math.min(stage, STORY.length - 1)];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[16vh] z-20 flex justify-center px-6">
      <AnimatePresence mode="wait">
        {visible && item && (
          <motion.div
            key={item.text}
            className="max-w-xl text-center"
            initial={{ opacity: 0, y: 22, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -14, filter: "blur(12px)" }}
            transition={{ duration: 1.1, ease }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-primary/90">
              {item.eyebrow}
            </p>
            <p className="text-balance-tight mt-4 font-display text-2xl font-light text-foreground sm:text-4xl">
              {item.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
