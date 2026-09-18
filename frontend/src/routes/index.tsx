import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { CityDescent, useDescent } from "@/components/urbancore/CityDescent";
import { IntelligenceSearch } from "@/components/urbancore/IntelligenceSearch";
import { RoleCards } from "@/components/urbancore/RoleCards";
import { GrowthTimeline } from "@/components/urbancore/GrowthTimeline";
import { CinematicType } from "@/components/urbancore/CinematicType";
import { CHAPTERS } from "@/components/urbancore/StoryChapters";
import { RisingCity } from "@/components/urbancore/RisingCity";
import { SelectionPanel } from "@/components/urbancore/SelectionPanel";
import { Awakening } from "@/components/urbancore/Awakening";
import { LogoReveal } from "@/components/urbancore/LogoReveal";
import type { Feature } from "@/components/urbancore/MapOverlays";
import { RoleWorkspace } from "@/components/urbancore/role/RoleWorkspace";
import { AuthModal } from "@/components/urbancore/AuthModal";
import type { RoleType } from "@/types/urbancore";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UrbanCore — AI Urban Intelligence for Nashik" },
      {
        name: "description",
        content:
          "Enter a living digital twin of Nashik. UrbanCore turns satellite imagery into terrain, urban growth, protected zone and land suitability intelligence.",
      },
      { property: "og:title", content: "UrbanCore — AI Urban Intelligence for Nashik" },
      {
        property: "og:description",
        content:
          "A cinematic digital twin: multi-year construction monitoring, terrain intelligence, protected zones and AI geospatial decision support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ease = [0.16, 1, 0.3, 1] as const;

/** chapter stages + workspace */
const WORKSPACE = CHAPTERS.length;
const STAGES = WORKSPACE + 1;

/** which chapter turns on which dataset */
const S_TWIN = 1;
const S_GROWTH = 2;
const S_TERRAIN = 3;
const S_ZONES = 4;
const S_STACK = 5;
const S_SUIT = 6;
const S_AI = 7;

function Index() {
  const phase = useDescent();
  const arrived = phase >= 5;
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();

  /** Phase 1 — the wordmark is built by the city, then docks into the nav. */
  const [reveal, setReveal] = useState<"idle" | "building" | "docking" | "done">("idle");
  const entered = reveal === "done" || reveal === "docking";

  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [year, setYear] = useState(0);
  const [orbit, setOrbit] = useState({ yaw: 0, tilt: 0 });
  const [feature, setFeature] = useState<Feature | null>(null);

  /** Active role workspace state */
  const [activeRole, setActiveRole] = useState<RoleType>(null);
  const [pendingAuthRole, setPendingAuthRole] = useState<RoleType>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; tilt: number } | null>(null);

  /** one calm second over Nashik before the city starts assembling the logo */
  useEffect(() => {
    if (!arrived || reveal !== "idle") return;
    const t = window.setTimeout(() => setReveal("building"), 1000);
    return () => window.clearTimeout(t);
  }, [arrived, reveal]);

  const onAssembled = useCallback(() => {
    setReveal("docking");
    window.setTimeout(() => setReveal("done"), 1500);
  }, []);

  /** lock scrolling permanently */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.scrollTo({ top: 0 });
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // Disabled pointer move and orbit dragging so elements are static
  }, []);

  useEffect(() => {
    // Removed scroll listener so no components move on scroll
    setProgress(0);
  }, []);

  // Directly jump to workspace after the initial logo reveal
  const stage = arrived && entered ? WORKSPACE : -1;
  const inWorkspace = stage >= WORKSPACE;
  const inStack = false;

  const chapter = CHAPTERS[0]!;
  const beatIndex = 0;
  const beat = chapter.beats[beatIndex]!;

  const growth = 4;
  const depth = reduce || isMobile ? 0 : inWorkspace ? 1 : 0;

  const onSelect = useCallback((f: Feature) => setFeature(f), []);

  const show = (id: "imagery" | "terrain" | "vegetation" | "roads" | "buildings" | "zones" | "intelligence" | null, on: boolean) =>
    on && !inStack;

  return (
    <main className="relative bg-background">
      {/* The city never leaves — it is the whole experience */}
      <div className="fixed inset-0 z-0">
        <CityDescent
          phase={phase}
          pointer={pointer}
          cityZoom={inWorkspace ? 1 : 0}
          orbit={reduce ? { yaw: 0, tilt: 0 } : orbit}
          depth={inStack ? 0.2 : depth}
          layers={{
            roads: show("roads", arrived),
            buildings: show("buildings", arrived),
            water: show("imagery", arrived),
            vegetation: show("vegetation", arrived && stage >= S_TWIN),
            contours: show("terrain", arrived && stage >= S_TERRAIN - 1),
            terrain: show("terrain", stage === S_TERRAIN),
            zones: show("zones", stage >= S_ZONES && stage !== S_STACK),
            suitability: show("intelligence", stage >= S_SUIT),
            awaken: stage >= S_AI,
            insights: stage >= S_AI,
            growth,
            depth,
            interactive: arrived && !inStack,
            onSelect,
            activeRole,
          }}
        />

        {/* The digital twin grows into a spatial city during this chapter. */}
        <RisingCity
          visible={inStack}
          yaw={orbit.yaw}
          tilt={orbit.tilt}
        />

        {/* Calming scrim so materialising UI stays legible */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: inWorkspace || stage >= S_AI ? 1 : 0 }}
          transition={{ duration: 1.6, ease }}
          style={{
            background:
              "radial-gradient(70% 60% at 50% 55%, oklch(0.14 0.008 250 / 72%) 0%, oklch(0.14 0.008 250 / 30%) 100%)",
          }}
        />

        <Awakening active={arrived && stage === S_AI} />

        <LogoReveal
          active={reveal === "building" || reveal === "docking"}
          docked={reveal === "docking"}
          onAssembled={onAssembled}
        />

        {/* Cinematic typography — part of the environment */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[27vh] z-20 flex flex-col items-center px-6 text-center">
          <AnimatePresence mode="wait">
            {entered && !inWorkspace && (
              <motion.div
                key={`${stage}-${beatIndex}`}
                className="max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.5 } }}
              >
                <motion.p
                  className="mb-4 font-mono text-[10px] uppercase tracking-[0.32em] text-primary/90"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease }}
                >
                  {chapter.eyebrow}
                </motion.p>
                <CinematicType lines={beat.lines} tone={beat.tone ?? "default"} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20">
          <SelectionPanel feature={feature} onClose={() => setFeature(null)} />
        </div>
      </div>

      {/* Ambient status rail */}
      <motion.header
        className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 sm:px-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: entered && !activeRole ? 1 : 0 }}
        transition={{ duration: 1.6, ease }}
      >
        <span className="font-display text-[13px] font-medium tracking-[0.22em] text-foreground/80">
          URBANCORE
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-accent">●</span> Nashik · 19.99°N 73.79°E
        </span>
      </motion.header>

      {/* Layer rail — materialises around the map */}
      <motion.aside
        className="pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2.5 sm:flex"
        animate={{ opacity: entered && !inWorkspace && !activeRole ? 1 : 0, x: entered ? 0 : -16 }}
        transition={{ duration: 1.4, ease }}
      >
        {CHAPTERS.map((c, i) => (
          <div key={c.eyebrow} className="flex items-center gap-2.5">
            <span
              className="h-px transition-all duration-700"
              style={{
                width: i <= stage ? 26 : 12,
                background: i <= stage ? "var(--primary)" : "var(--border)",
              }}
            />
            <span
              className="font-mono text-[9px] uppercase tracking-[0.18em] transition-colors duration-700"
              style={{
                color: i <= stage ? "var(--foreground)" : "var(--muted-foreground)",
                opacity: i <= stage ? 0.85 : 0.4,
              }}
            >
              {c.eyebrow}
            </span>
          </div>
        ))}
      </motion.aside>

      {/* Timeline scrubber for the construction chapter */}
      <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 px-6">
        <GrowthTimeline value={year} onChange={setYear} visible={stage === S_GROWTH && !activeRole} />
      </div>


      {/* Workspace — grows out of the map, never a new page */}
      <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-6">
        <motion.div
          className="flex w-full max-w-3xl flex-col items-center text-center"
          initial={false}
          animate={
            inWorkspace && !activeRole && !pendingAuthRole
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 34, filter: "blur(16px)" }
          }
          transition={{ duration: 1.6, ease }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-primary/90">
            AI urban intelligence · Nashik
          </p>
          <h1 className="text-balance-tight mt-5 font-display text-[30px] font-light leading-[1.1] text-foreground sm:text-6xl">
            Where shall we begin
            <motion.span
              aria-hidden
              className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.08em] rounded-full bg-primary align-middle"
              animate={{ opacity: [1, 1, 0, 0] }}
              transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 1] }}
            />
          </h1>
          <p className="mt-4 text-[13px] font-light text-muted-foreground">
            Ask the city anything — it already knows its own shape.
          </p>

          <div className="mt-10 w-full">
            <IntelligenceSearch visible={inWorkspace && !activeRole && !pendingAuthRole} activeRole={activeRole} onSelectRole={setPendingAuthRole} />
          </div>

          <div className="mt-12 w-full max-w-3xl">
            <RoleCards pointer={pointer} visible={inWorkspace && !activeRole && !pendingAuthRole} onSelectRole={setPendingAuthRole} />
          </div>
        </motion.div>
      </div>

      {/* Interactive Role Workspace Modal overlay */}
      <AnimatePresence>
        {activeRole && (
          <RoleWorkspace role={activeRole} onBack={() => setActiveRole(null)} />
        )}
      </AnimatePresence>

      <AuthModal
        role={pendingAuthRole}
        onClose={() => setPendingAuthRole(null)}
        onSuccess={() => {
          setActiveRole(pendingAuthRole);
          setPendingAuthRole(null);
        }}
      />

      {/* Descent caption while the camera falls */}
      <motion.p
        className="pointer-events-none fixed bottom-10 left-1/2 z-30 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.34em] text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: arrived ? 0 : 1 }}
        transition={{ duration: 1.2, ease }}
      >
        {phase >= 4
          ? "Resolving Nashik"
          : phase >= 3
            ? "Maharashtra"
            : phase >= 2
              ? "Approaching India"
              : "Establishing orbit"}
      </motion.p>


    </main>
  );
}
