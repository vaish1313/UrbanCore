import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import { UrbanTimeline } from "@/components/urbancore/UrbanTimeline";
import {
  Satellite, Radar, BrainCircuit, Activity, Layers, Play
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";


export const Route = createFileRoute("/how-it-works")({
  component: HowItWorksPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <NashikBackgroundCarousel />
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-400 mb-6">
              How UrbanCore Works
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              From satellite pixels <br className="hidden sm:block" /> to urban intelligence.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              UrbanCore combines multispectral satellite imagery, spectral features, AI segmentation and multi-temporal analysis to reveal urban change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STEP 1 - SATELLITE OBSERVATION */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 rounded-full">STEP 01</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Start with Earth observation.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-10">
              UrbanCore uses Sentinel-2 multispectral satellite imagery to observe selected areas across multiple years.
            </p>
          </div>
          
          <div className="lg:w-1/2 w-full relative">
            {/* 6-band grid with horizontal timeline connectors */}
            <div className="flex flex-col gap-3">
              {[
                [
                  { band: "B2",  file: "b2.png",  title: "B2 (Blue Band)",    sub: "Water Bodies",                  color: "#38bdf8" },
                  { band: "B3",  file: "b3.png",  title: "B3 (Green Band)",   sub: "Vegetation",                    color: "#4ade80" },
                  { band: "B4",  file: "b4.png",  title: "B4 (Red Band)",     sub: "Urban and Built-up Areas",      color: "#f87171" },
                ],
                [
                  { band: "B8",  file: "b8.png",  title: "B8 (NIR Band)",     sub: "Vegetation and Biomass",        color: "#4ade80" },
                  { band: "B11", file: "b11.png", title: "B11 (SWIR 1 Band)", sub: "Dry Areas, Soil and Materials", color: "#fb923c" },
                  { band: "B12", file: "b12.png", title: "B12 (SWIR 2 Band)", sub: "Soil, City and Infrastructure", color: "#e879f9" },
                ],
              ].map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-0">
                  {row.map(({ band, file, title, sub, color }, idx) => (
                    <div key={band} className="flex items-center flex-1 min-w-0">

                      {/* ── Card ──────────────────────────────────────────── */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (rowIdx * 3 + idx) * 0.08 }}
                        className="relative flex-1 min-w-0 overflow-hidden rounded-xl group transition-transform duration-500 ease-out hover:-translate-y-2"
                        style={{ aspectRatio: "4/3" }}
                      >
                        <img
                          src={`/${file}`}
                          alt={`Sentinel-2 ${band} band`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 px-2.5 pt-2 pb-4 bg-gradient-to-b from-black/85 to-transparent">
                          <p className="font-mono text-[9px] font-semibold leading-tight" style={{ color }}>{title}</p>
                          <p className="font-mono text-[7.5px] text-white/55 leading-tight mt-0.5">{sub}</p>
                        </div>

                        {/* Bottom label */}
                        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                          <span className="font-mono text-[10px] font-bold tracking-widest" style={{ color }}>{band}</span>
                        </div>

                        {/* Neon border glow on hover */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ boxShadow: `inset 0 0 0 1.5px ${color}88, 0 0 16px ${color}44` }}
                        />

                        {/* Top radial glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 50% 0%, ${color}18 0%, transparent 65%)` }}
                        />
                      </motion.div>

                      {/* ── Horizontal connector (between cards, not after last) ── */}
                      {idx < row.length - 1 && (
                        <div className="flex items-center flex-shrink-0 mx-0" style={{ width: "28px" }}>
                          {/* Left dot */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "#38bdf8", boxShadow: "0 0 6px 2px rgba(34,211,238,0.7)" }}
                          />
                          {/* Line */}
                          <div
                            className="flex-1 h-[1.5px]"
                            style={{
                              background: "linear-gradient(to right, #22d3ee, #0ea5e9)",
                              boxShadow: "0 0 6px 1px rgba(34,211,238,0.5)",
                            }}
                          />
                          {/* Right dot */}
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "#38bdf8", boxShadow: "0 0 6px 2px rgba(34,211,238,0.7)" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2 - SPECTRAL FEATURES */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full relative">
            <div className="rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
              style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.22), 0 0 40px -8px rgba(34,211,238,0.12), 0 25px 50px -12px rgba(0,0,0,0.7)" }}>
              <img
                src="/step2-howitworks.png"
                alt="Spectral indices — NDVI, NDBI, NDWI, BSI computation pipeline"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-orange-400 border border-orange-500/20 bg-orange-500/10 px-3 py-1 rounded-full">STEP 02</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Give every pixel more context.</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { name: "NDVI", desc: "Normalized Difference Vegetation Index — highlights vegetation health and density." },
                { name: "NDBI", desc: "Normalized Difference Built-up Index — maps urban, concrete, and built environments." },
                { name: "NDWI", desc: "Normalized Difference Water Index — isolates water bodies and moisture levels." },
                { name: "BSI", desc: "Bare Soil Index — identifies barren land and unpaved soil variations." }
              ].map((item) => (
                <div key={item.name} className="flex gap-4 items-start p-4 bg-white/5 border border-white/10 rounded-xl">
                  <span className="font-mono text-sm text-orange-400 mt-1">{item.name}</span>
                  <p className="text-sm font-light text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3 - AI SEGMENTATION */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-purple-400 border border-purple-500/20 bg-purple-500/10 px-3 py-1 rounded-full">STEP 03</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Let the model see the built environment.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-6">
              The trained segmentation model classifies pixels into built-up and non-built-up regions using advanced neural networks.
            </p>
            <div className="flex gap-3 mb-10">
              <span className="px-3 py-1 rounded text-xs font-mono border border-white/20 bg-white/5 text-slate-300">U-Net</span>
              <span className="px-3 py-1 rounded text-xs font-mono border border-white/20 bg-white/5 text-slate-300">ResNet18 Encoder</span>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full relative">
            <div className="rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2"
              style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.22), 0 0 40px -8px rgba(34,211,238,0.12), 0 25px 50px -12px rgba(0,0,0,0.7)" }}>
              <img
                src="/step03-howitworks.png"
                alt="AI segmentation — U-Net built-up detection"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STEP 4 - TEMPORAL COMPARISON */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="font-mono text-xs text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full">STEP 04</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">
            One year tells a story.<br/>Multiple years reveal change.
          </h2>
          <p className="text-slate-400 font-light text-sm max-w-xl mx-auto">
            Only 5–10% of the city changes each year. The rest stays identical — that's what makes urban growth visible.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <UrbanTimeline />
        </div>
      </section>

      {/* STEP 5 - CHANGE DETECTION */}
      <section className="relative z-10 py-24 sm:py-32 w-full border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-start gap-10">

          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 px-3 py-1 rounded-full">STEP 05</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white">Reveal where the city moved.</h2>
          </div>

          {/* Full Footprint image — hover lift */}
          <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_32px_64px_rgba(0,0,0,0.5)] hover:border-white/20 cursor-default">
            <img
              src="/Footprint.png"
              alt="Urban footprint comparison — Previous · Current · Detected Change"
              className="w-full h-auto block transition-transform duration-500 hover:scale-[1.01]"
              draggable={false}
            />
          </div>

        </div>
      </section>


      {/* TECHNICAL STRIP */}
      <section className="relative z-10 py-12 bg-white/[0.02] border-y border-white/5 overflow-hidden">
        <div className="flex items-center whitespace-nowrap overflow-hidden opacity-40">
           <motion.div 
             className="flex gap-16 px-8 font-mono text-sm tracking-[0.2em] uppercase text-white"
             animate={{ x: ["0%", "-50%"] }}
             transition={{ ease: "linear", duration: 20, repeat: Infinity }}
           >
             <span>Sentinel-2</span><span>•</span>
             <span>Google Earth Engine</span><span>•</span>
             <span>10-channel input</span><span>•</span>
             <span>U-Net</span><span>•</span>
             <span>ResNet18</span><span>•</span>
             <span>Multi-temporal analysis</span><span>•</span>
             <span>Sentinel-2</span><span>•</span>
             <span>Google Earth Engine</span><span>•</span>
             <span>10-channel input</span><span>•</span>
             <span>U-Net</span><span>•</span>
             <span>ResNet18</span><span>•</span>
             <span>Multi-temporal analysis</span>
           </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center justify-center text-center px-6 bg-black/30 backdrop-blur-sm">
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-8">
          See UrbanCore in action.
        </h2>
        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Launch UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
