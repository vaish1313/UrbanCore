import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { RoleCards } from "@/components/urbancore/RoleCards";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import { WorkflowVisualization } from "@/components/urbancore/WorkflowVisualization";
import heroBg from "@/assets/hero-bg.png";
import {
  Layers,
  Map,
  Radar,
  BarChart3,
  ArrowRight,
  Activity,
  ScanSearch,
  MapPin,
  Database,
  Binary,
  Clock,
  Satellite,
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";

export const Route = createFileRoute("/platform")({
  component: PlatformPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function PlatformPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      {/* ── Nashik landmark vertical sliding background — sits behind everything ── */}
      <NashikBackgroundCarousel />

      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => { }} />

      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        {/* Subtle accent overlays on top of the global carousel background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Scanline grid accent */}
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* Bottom fade so hero blends into next section */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-400 mb-6">
              Urban Intelligence Platform
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              See the city <br className="hidden sm:block" /> beneath the surface.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              UrbanCore transforms satellite imagery into spatial intelligence, helping reveal how
              built-up areas evolve across time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto text-[12px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-8 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:-translate-y-0.5">
                Launch UrbanCore <span className="text-[11px] leading-none mb-[1px]">↗</span>
              </button>
              <button className="w-full sm:w-auto text-[12px] font-semibold uppercase tracking-wider text-white bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-3.5 rounded-full transition-all flex items-center justify-center gap-2 backdrop-blur-md hover:border-white/20">
                Explore Change Detection
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. CORE PLATFORM CAPABILITIES */}
      <section className="relative z-10 py-24 sm:py-32 w-full max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white">
            One platform. A changing city.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Urban Change Detection",
              desc: "Identify where built-up areas have expanded or transformed across time.",
              icon: Layers,
            },
            {
              title: "Multi-Temporal Analysis",
              desc: "Compare satellite observations across multiple years to reveal urban evolution.",
              icon: Radar,
            },
            {
              title: "Land Monitoring",
              desc: "Observe changes in the built environment using consistent satellite-derived data.",
              icon: Map,
            },
            {
              title: "Urban Insights",
              desc: "Turn spatial change into interpretable visual insights.",
              icon: BarChart3,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: i * 0.1, ease }}
              className="group relative flex flex-col items-start gap-4 p-8 rounded-3xl border border-white/5 bg-[#050a15]/80 backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/20 hover:bg-[#0a1224]/90 hover:shadow-[0_0_30px_rgba(34,211,238,0.07)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/10 bg-cyan-500/5 text-cyan-400 transition-all duration-500 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/30 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm font-light text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. HOW URBANCORE SEES A CITY (Visual Pipeline) */}
      <section className="relative z-10 py-24 border-y border-white/5 overflow-hidden backdrop-blur-sm bg-black/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-400 mb-4">
              Pipeline
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white">
              How UrbanCore sees a city
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between w-full max-w-5xl mx-auto gap-4 lg:gap-0 relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-[5%] right-[5%] h-px bg-white/10 -translate-y-1/2 overflow-hidden">
              <motion.div
                className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {[
              { label: "Sentinel-2", icon: Satellite },
              { label: "Preprocessing", icon: Binary },
              { label: "Spectral Features", icon: Activity },
              { label: "U-Net / ResNet18", icon: Database },
              { label: "Built-up Seg.", icon: ScanSearch },
              { label: "Temporal Comp.", icon: Clock },
              { label: "Urban Change", icon: Layers },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                {i > 0 && <div className="h-6 w-px bg-white/10 lg:hidden" />}
                <div className="w-14 h-14 rounded-full border border-white/10 bg-[#050a15] flex items-center justify-center text-slate-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <step.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-300 text-center w-24">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LIVE PRODUCT PREVIEW */}
      <section className="relative z-10 py-24 sm:py-32 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
        <div className="w-full rounded-2xl border border-white/10 bg-[#050a15] p-2 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          {/* Mac window header */}
          <div className="h-8 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          </div>
          {/* Satellite Change Detection Map */}
          <div className="relative w-full aspect-video overflow-hidden">
            <WorkflowVisualization />
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="text-[12px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-8 py-3.5 rounded-full transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]">
            Explore UrbanCore ↗
          </button>
        </div>
      </section>

      {/* 5. BUILT FOR DIFFERENT USERS */}
      <section className="relative z-10 py-24 sm:py-32 w-full max-w-7xl mx-auto px-6 sm:px-10">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white">
            Built for different users
          </h2>
        </div>
        <RoleCards pointer={{ x: 0, y: 0 }} visible={true} />
      </section>

      {/* 6. TECHNICAL FOUNDATION */}
      <section className="relative z-10 py-24 border-t border-white/5 backdrop-blur-sm bg-black/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          <h2 className="font-display text-2xl font-light text-slate-300 mb-12 uppercase tracking-[0.2em]">
            Technical Foundation
          </h2>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-16">
            {["Sentinel-2", "Google Earth Engine", "U-Net", "ResNet18", "GIS", "Multi-temporal Analysis"].map(tech => (
              <span key={tech} className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-[12px] text-slate-300 font-mono tracking-wide backdrop-blur-md">
                {tech}
              </span>
            ))}
          </div>

          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] font-mono text-cyan-500/70 uppercase tracking-[0.3em] mb-6">
              10 Spectral Inputs
            </p>
            <div className="flex flex-col items-center gap-3 font-mono text-sm sm:text-lg text-slate-400 font-light tracking-[0.2em]">
              <p>B2 · B3 · B4 · B8 · B11 · B12</p>
              <p className="text-cyan-400/80">NDVI · NDBI · NDWI · BSI</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center justify-center text-center px-6">
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-8">
          Understand how your city is changing.
        </h2>
        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Launch UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
