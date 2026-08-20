import { motion } from "motion/react";
import { Building2, Landmark, Users, ArrowUpRight } from "lucide-react";
import type { RoleType } from "@/types/urbancore";

const ROLES = [
  {
    id: "builder" as const,
    title: "Builder / Developer",
    detail: "Land Suitability, Site Readiness & Zonal Constraints.",
    Icon: Building2,
  },
  {
    id: "municipal" as const,
    title: "Municipal Authority",
    detail: "Urban Command Center, Construction & Encroachment Watch.",
    Icon: Landmark,
  },
  {
    id: "citizen" as const,
    title: "Citizen",
    detail: "City Explorer, Change Timeline & Concern Reporting.",
    Icon: Users,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function RoleCards({
  pointer,
  visible,
  onSelectRole,
}: {
  pointer: { x: number; y: number };
  visible: boolean;
  onSelectRole?: (role: "builder" | "municipal" | "citizen") => void;
}) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      {ROLES.map(({ id, title, detail, Icon }, i) => (
        <motion.button
          key={id}
          type="button"
          onClick={() => onSelectRole?.(id)}
          initial={false}
          animate={
            visible
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 30, filter: "blur(12px)" }
          }
          transition={{ duration: 1.3, delay: visible ? 0.25 + i * 0.16 : 0, ease }}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            x: pointer.x * (10 + i * 5),
            pointerEvents: visible ? "auto" : "none",
          }}
          className="glass-panel group relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl p-5 text-left transition-colors duration-500 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(114,180,255,0.2)]"
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

          <div className="flex w-full items-center justify-between">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-foreground/[0.04] text-primary transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary/20">
              <Icon className="h-4 w-4" strokeWidth={1.4} />
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-300 group-hover:border-primary group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>

          <span className="relative">
            <span className="block font-display text-[15px] font-medium tracking-tight text-foreground group-hover:text-primary transition-colors">
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
