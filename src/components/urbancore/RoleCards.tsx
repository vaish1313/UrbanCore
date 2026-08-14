import { motion } from "motion/react";
import { Building2, Landmark, Users } from "lucide-react";

const ROLES = [
  {
    title: "Builder / Developer",
    detail: "Evaluate land before investment.",
    Icon: Building2,
  },
  {
    title: "Municipal Authority",
    detail: "Monitor urban development and zoning compliance.",
    Icon: Landmark,
  },
  {
    title: "Citizen",
    detail: "Explore your city and report concerns.",
    Icon: Users,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function RoleCards({
  pointer,
  visible,
}: {
  pointer: { x: number; y: number };
  visible: boolean;
}) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {ROLES.map(({ title, detail, Icon }, i) => (
        <motion.button
          key={title}
          type="button"
          initial={false}
          animate={
            visible
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 30, filter: "blur(12px)" }
          }
          transition={{ duration: 1.3, delay: visible ? 0.25 + i * 0.16 : 0, ease }}
          whileHover={{ y: -8 }}
          style={{
            x: pointer.x * (10 + i * 5),
            pointerEvents: visible ? "auto" : "none",
          }}
          className="glass-panel group relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl p-5 text-left transition-colors duration-500 hover:border-primary/40"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-60"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 120%, var(--atmos) 0%, transparent 65%)",
              mixBlendMode: "screen",
            }}
          />

          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-foreground/[0.04] text-primary transition-transform duration-500 group-hover:scale-110">
            <Icon className="h-4 w-4" strokeWidth={1.4} />
          </span>
          <span className="relative">
            <span className="block font-display text-[15px] font-medium tracking-tight text-foreground">
              {title}
            </span>
            <span className="mt-1.5 block text-[12.5px] font-light leading-relaxed text-muted-foreground">
              {detail}
            </span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
