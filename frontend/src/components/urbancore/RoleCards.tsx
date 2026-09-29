import { motion } from "motion/react";
import { Building2, Landmark, Users, ArrowUpRight } from "lucide-react";
import type { RoleType } from "@/types/urbancore";

const HERO_CARDS = [
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
      {HERO_CARDS.map(({ id, title, detail, Icon }, i) => (
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
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.98 }}
          style={{
            x: pointer.x * (10 + i * 5),
            pointerEvents: visible ? "auto" : "none",
          }}
          className="group relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl border border-white/5 bg-black/80 p-6 text-left backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/20 hover:bg-black/90 hover:shadow-[0_0_30px_rgba(34,211,238,0.07)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-40"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 120%, rgba(34,211,238,0.1) 0%, transparent 65%)",
              mixBlendMode: "screen",
            }}
          />

          <div className="flex w-full items-center justify-between">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 transition-all duration-500 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Icon className="h-5 w-5" strokeWidth={1.4} />
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:rotate-12">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>

          <span className="relative z-10">
            <span className="block font-display text-[15px] font-medium tracking-tight text-white transition-colors duration-300 group-hover:text-cyan-400">
              {title}
            </span>
            <span className="mt-2 block text-[13px] font-light leading-relaxed text-slate-400">
              {detail}
            </span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}
