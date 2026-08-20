import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

type P = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  d: number;
  r: number;
  hue: 0 | 1;
};

/**
 * Phase 1 — the city literally builds the wordmark.
 * Glowing geospatial particles lift off from roads, buildings and water,
 * drift toward the centre of the frame and assemble "URBANCORE".
 */
export function LogoReveal({
  active,
  onAssembled,
  docked,
}: {
  active: boolean;
  onAssembled: () => void;
  docked: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduce = useReducedMotion();
  const [assembled, setAssembled] = useState(false);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let particles: P[] = [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Render the wordmark offscreen and sample its pixels for targets.
      const off = document.createElement("canvas");
      off.width = Math.floor(w);
      off.height = Math.floor(h);
      const o = off.getContext("2d");
      if (!o) return;
      const size = Math.min(w * 0.115, 118);
      o.fillStyle = "#fff";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.font = `300 ${size}px Sora, system-ui, sans-serif`;
      const letters = "URBANCORE";
      const track = size * 0.14;
      const total = o.measureText(letters).width + track * (letters.length - 1);
      let cx = w / 2 - total / 2;
      for (const ch of letters) {
        const cw = o.measureText(ch).width;
        o.fillText(ch, cx + cw / 2, h / 2);
        cx += cw + track;
      }

      const data = o.getImageData(0, 0, off.width, off.height).data;
      const step = w < 640 ? 2 : 3;
      const next: P[] = [];
      let li = 0;
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const a = data[(y * off.width + x) * 4 + 3]!;
          if (a < 128) continue;
          li += 1;
          // origin: scattered across the city, biased to the lower frame
          const ox = Math.random() * w;
          const oy = h * 0.45 + Math.random() * h * 0.6;
          next.push({
            x: ox,
            y: oy,
            tx: x,
            ty: y,
            vx: 0,
            vy: 0,
            // letters assemble at different times / from different directions
            d: (x / w) * 0.55 + Math.random() * 0.5,
            r: 0.7 + Math.random() * 0.9,
            hue: li % 7 === 0 ? 1 : 0,
          });
        }
      }
      particles = next;
    };

    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize);

    const start = performance.now();
    let raf = 0;
    let done = false;

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      let settled = 0;
      for (const p of particles) {
        const local = t - p.d;
        if (local > 0) {
          const k = 0.055 + Math.min(0.09, local * 0.05);
          p.vx += (p.tx - p.x) * k;
          p.vy += (p.ty - p.y) * k;
          p.vx *= 0.78;
          p.vy *= 0.78;
          p.x += p.vx;
          p.y += p.vy;
        } else {
          p.y -= 0.35;
        }
        const dist = Math.hypot(p.tx - p.x, p.ty - p.y);
        if (dist < 1.2) settled += 1;
        const appear = Math.max(0, Math.min(1, local * 2.2));
        const alpha = appear * (dist > 6 ? 0.55 : 0.95);
        ctx.fillStyle =
          p.hue === 1
            ? `rgba(150, 236, 190, ${alpha})`
            : `rgba(226, 240, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, dist > 6 ? p.r * 1.15 : p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!done && particles.length > 0 && settled / particles.length > 0.9) {
        done = true;
        setAssembled(true);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (reduce) {
      setAssembled(true);
      const t = window.setTimeout(onAssembled, 900);
      return () => window.clearTimeout(t);
    }
    if (!assembled) return;
    const t = window.setTimeout(onAssembled, 2000);
    return () => window.clearTimeout(t);
  }, [active, assembled, reduce, onAssembled]);

  if (!active) return null;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center"
      animate={
        docked
          ? { opacity: 0, scale: 0.16, x: "-38%", y: "-42vh", filter: "blur(2px)" }
          : { opacity: 1, scale: 1, x: 0, y: 0, filter: "blur(0px)" }
      }
      transition={{ duration: docked ? 1.5 : 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* holographic geographic grid, expands then fades */}
      <motion.svg
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2"
        viewBox="0 0 200 200"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.5, 0], scale: [0.6, 1.35, 1.7] }}
        transition={{ duration: 4.2, times: [0, 0.4, 1], ease: "easeOut", delay: 0.6 }}
      >
        <g stroke="var(--primary)" strokeWidth="0.25" fill="none" opacity="0.7">
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`h${i}`} x1="0" x2="200" y1={i * 20} y2={i * 20} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} y1="0" y2="200" x1={i * 20} x2={i * 20} />
          ))}
          <circle cx="100" cy="100" r="52" />
          <circle cx="100" cy="100" r="82" />
        </g>
      </motion.svg>

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      {/* accessible + typographic anchor */}
      <span className="sr-only">UrbanCore</span>

      <motion.p
        className="absolute left-1/2 top-1/2 mt-[8vmin] -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.42em] text-muted-foreground sm:text-[11px]"
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={
          assembled
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 10, filter: "blur(8px)" }
        }
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        AI Urban Intelligence
      </motion.p>
    </motion.div>
  );
}
