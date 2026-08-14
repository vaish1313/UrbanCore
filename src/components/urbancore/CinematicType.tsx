import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Typography that assembles out of satellite/data particles.
 * Each glyph drifts in from a scattered position, blurred, then settles.
 */
export function CinematicType({
  lines,
  tone = "default",
  delay = 0,
}: {
  lines: readonly string[];
  tone?: "default" | "accent" | "stack";
  delay?: number;
}) {
  let index = 0;

  return (
    <div className={tone === "stack" ? "flex flex-col items-center gap-1" : undefined}>
      {lines.map((line, li) => (
        <p
          key={`${line}-${li}`}
          className={
            tone === "stack"
              ? "font-display text-xl font-light tracking-tight text-foreground/90 sm:text-3xl"
              : "text-balance-tight font-display text-[26px] font-light leading-[1.08] text-foreground sm:text-5xl"
          }
        >
          {Array.from(line).map((ch, ci) => {
            const i = index++;
            const seed = (i * 9301 + 49297) % 233280;
            const rnd = seed / 233280;
            return (
              <motion.span
                key={`${ci}-${ch}`}
                className="inline-block"
                style={{ whiteSpace: ch === " " ? "pre" : undefined }}
                initial={{
                  opacity: 0,
                  filter: "blur(10px)",
                  y: (rnd - 0.5) * 26,
                  x: (rnd - 0.5) * 18,
                  scale: 0.86,
                }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                transition={{
                  duration: 1.1,
                  delay: delay + i * 0.018 + rnd * 0.12,
                  ease,
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            );
          })}
        </p>
      ))}
    </div>
  );
}
