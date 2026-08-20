import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Bottom → top, exactly as UrbanCore stacks its datasets. */
export const STACK = [
  { id: "imagery", label: "Satellite imagery", hint: "0.5 m multispectral basemap" },
  { id: "terrain", label: "Terrain", hint: "Elevation · slope · aspect" },
  { id: "vegetation", label: "Vegetation", hint: "Canopy & green cover index" },
  { id: "roads", label: "Roads", hint: "Network graph & accessibility" },
  { id: "buildings", label: "Buildings", hint: "Detected footprints 2021–2025" },
  { id: "zones", label: "Protected zones", hint: "River buffer · forest · flood" },
  { id: "intelligence", label: "Urban intelligence", hint: "Suitability & decision layer" },
] as const;

export type StackId = (typeof STACK)[number]["id"];

export function LayerStack({
  visible,
  yaw,
  tilt,
  focused,
  onFocus,
}: {
  visible: boolean;
  yaw: number;
  tilt: number;
  focused: StackId | null;
  onFocus: (id: StackId | null) => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.4, ease }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <div
        className="relative"
        style={{
          width: "min(58vw, 620px)",
          height: "min(40vw, 420px)",
          transformStyle: "preserve-3d",
          perspective: 1400,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${58 + tilt * 0.4}deg) rotateZ(${yaw * 0.6 - 24}deg)`,
            transition: "transform 900ms cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          {STACK.map((layer, i) => {
            const dim = focused !== null && focused !== layer.id;
            const lift = visible ? i * 46 : 0;
            return (
              <motion.button
                key={layer.id}
                type="button"
                onClick={() => onFocus(focused === layer.id ? null : layer.id)}
                className="absolute inset-0 rounded-[22px] border text-left"
                initial={false}
                animate={{
                  opacity: dim ? 0.22 : 1,
                  z: lift + (focused === layer.id ? 18 : 0),
                }}
                transition={{ duration: 1.2, delay: visible ? i * 0.08 : 0, ease }}
                style={{
                  transformStyle: "preserve-3d",
                  borderColor:
                    focused === layer.id ? "var(--primary)" : "var(--glass-border)",
                  background:
                    i === STACK.length - 1
                      ? "linear-gradient(135deg, oklch(0.72 0.14 235 / 16%), oklch(0.8 0.14 160 / 10%))"
                      : "var(--glass)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "var(--shadow-float)",
                }}
              >
                <span
                  className="absolute left-5 top-4 font-mono text-[9px] uppercase tracking-[0.2em]"
                  style={{
                    color: focused === layer.id ? "var(--primary)" : "var(--muted-foreground)",
                  }}
                >
                  {layer.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend rail — clicking emphasises a dataset */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 sm:flex">
        {[...STACK].reverse().map((layer) => {
          const active = focused === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              onClick={() => onFocus(active ? null : layer.id)}
              className="group flex items-center gap-3 rounded-full px-3 py-1.5 transition-colors duration-300"
              style={{ background: active ? "var(--glass)" : "transparent" }}
            >
              <span className="text-right">
                <span
                  className="block font-mono text-[9px] uppercase tracking-[0.18em] transition-colors duration-300"
                  style={{ color: active ? "var(--foreground)" : "var(--muted-foreground)" }}
                >
                  {layer.label}
                </span>
                <span className="block text-[10px] font-light text-muted-foreground/70">
                  {layer.hint}
                </span>
              </span>
              <span
                className="h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{
                  background: active ? "var(--primary)" : "var(--border)",
                  boxShadow: active ? "0 0 14px 4px var(--atmos)" : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
