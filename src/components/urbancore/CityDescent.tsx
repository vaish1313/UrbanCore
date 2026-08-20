import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import earth from "@/assets/earth-space.jpg";
import region from "@/assets/region-maharashtra.jpg";
import city from "@/assets/city-nashik.jpg";
import { MapOverlays, type Layers } from "./MapOverlays";

const ease = [0.22, 0.9, 0.14, 1] as const;

const PHASES = [300, 2400, 5000, 7400, 9000];

export function useDescent() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? 5 : 0);

  useEffect(() => {
    if (reduce) return;
    const timers = PHASES.map((t, i) => window.setTimeout(() => setPhase(i + 1), t));
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  return phase;
}

export function CityDescent({
  phase,
  pointer,
  layers,
  cityZoom = 0,
  orbit = { yaw: 0, tilt: 0 },
  depth = 0,
}: {
  phase: number;
  pointer: { x: number; y: number };
  layers: Layers;
  cityZoom?: number;
  /** user-driven orbit of the digital twin, in degrees */
  orbit?: { yaw: number; tilt: number };
  /** 0..1 — how spatial the twin has become */
  depth?: number;
}) {
  const earthScale = phase >= 4 ? 11 : phase >= 3 ? 4.6 : phase >= 2 ? 1.75 : 0.92;
  const regionScale = phase >= 4 ? 3.4 : phase >= 3 ? 1.9 : 1.25;
  const cityScale = phase >= 5 ? 1.06 + cityZoom * 0.14 : phase >= 4 ? 1.16 : 1.5;



  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      {/* Space */}
      <div className="absolute inset-0" style={{ background: "var(--gradient-space)" }} />

      {/* Earth */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 0 ? 0 : phase >= 4 ? 0 : 1 }}
        transition={{ duration: phase >= 4 ? 2.6 : 2.4, ease }}
      >
        <motion.img
          src={earth}
          alt="Earth viewed from orbit with the Indian subcontinent illuminated"
          width={1536}
          height={1536}
          className="atmos-glow h-[92vmin] w-[92vmin] rounded-full object-cover"
          initial={{ scale: 0.9, rotate: -6 }}
          animate={{ scale: earthScale, rotate: phase >= 2 ? 2 : -6 }}
          transition={{ duration: 5.4, ease }}
          style={{
            x: pointer.x * -18,
            y: pointer.y * -14,
            transformOrigin: "42% 46%",
          }}
        />
      </motion.div>

      {/* Region: Maharashtra */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 5 ? 0 : phase >= 3 ? 1 : 0 }}
        transition={{ duration: 2.8, ease }}
      >
        <motion.img
          src={region}
          alt="Satellite terrain of the Maharashtra plateau"
          width={1536}
          height={1536}
          loading="lazy"
          className="h-full w-full object-cover"
          initial={{ scale: 1.25 }}
          animate={{ scale: regionScale }}
          transition={{ duration: 6, ease }}
          style={{ x: pointer.x * -26, y: pointer.y * -20, transformOrigin: "58% 52%" }}
        />
      </motion.div>

      {/* City: Nashik */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 4 ? 1 : 0 }}
        transition={{ duration: 3, ease }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.5 }}
          animate={{ scale: cityScale }}
          transition={{ duration: 7, ease }}
          style={{ x: pointer.x * -34, y: pointer.y * -24, transformOrigin: "50% 48%" }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              rotateX: depth * 26 + orbit.tilt,
              rotateZ: orbit.yaw,
              y: depth * -26,
            }}
            transition={{ type: "spring", stiffness: 40, damping: 18, mass: 0.9 }}
            style={{
              transformPerspective: 1500,
              transformOrigin: "50% 72%",
              transformStyle: "preserve-3d",
            }}
          >
            <img
              src={city}
              alt="High resolution satellite imagery of Nashik's urban fabric and the Godavari river"
              width={1920}
              height={1280}
              loading="lazy"
              className="h-full w-full object-cover opacity-90"
            />
            <MapOverlays {...layers} />
          </motion.div>
        </motion.div>
      </motion.div>


      {/* Depth & vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--gradient-vignette)" }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 42% at 50% 46%, oklch(0.14 0.008 250 / 78%) 0%, oklch(0.14 0.008 250 / 0%) 100%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/90 to-transparent" />
    </div>
  );
}
