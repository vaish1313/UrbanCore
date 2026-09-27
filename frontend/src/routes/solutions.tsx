import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import { MapComparisonSlider } from "@/components/urbancore/MapComparisonSlider";
import heroBg from "@/assets/hero-bg.png";
import {
  Building2, Landmark, Users, CheckCircle2, Search, ArrowRight, Activity, Map
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";

export const Route = createFileRoute("/solutions")({
  component: SolutionsPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function SolutionsPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);
  const [activeTab, setActiveTab] = useState<"builder" | "authority" | "citizen">("builder");

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
          {/* Subtle grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.10]" 
            style={{ backgroundImage: "linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-orange-400 mb-6">
              Solutions for a changing city
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              One city. <br className="hidden sm:block" /> Different perspectives.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              UrbanCore turns satellite-derived urban intelligence into a shared view of how places evolve.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 - BUILDER / DEVELOPER */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Building2 className="h-5 w-5" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400">Builder / Developer</p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">See the context before you build.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-10">
              Understand surrounding urban development and how the built environment has evolved over time.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Land Suitability", "Site Readiness", "Zonal Constraints", "Urban Growth Context"].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full relative flex justify-center">
            <div className="w-full max-w-sm rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-3 cursor-pointer"
              style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.25), 0 0 40px -8px rgba(34,211,238,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(34,211,238,0.45), 0 0 60px -6px rgba(34,211,238,0.25), 0 40px 80px -12px rgba(0,0,0,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(34,211,238,0.25), 0 0 40px -8px rgba(34,211,238,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)")}
            >
              <img
                src="/builder-report.png"
                alt="Land Suitability Report — Gangapur Road, Nashik"
                className="w-full h-auto object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - MUNICIPAL AUTHORITY */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full relative">
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:-translate-y-3 cursor-pointer relative"
              style={{ boxShadow: "0 0 0 1px rgba(34,211,238,0.25), 0 0 40px -8px rgba(34,211,238,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(34,211,238,0.45), 0 0 60px -6px rgba(34,211,238,0.25), 0 40px 80px -12px rgba(0,0,0,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(34,211,238,0.25), 0 0 40px -8px rgba(34,211,238,0.15), 0 25px 50px -12px rgba(0,0,0,0.6)")}
            >
              <img
                src="/municipalnsk-heatmap.png"
                alt="Nashik municipal zone heatmap — change detection"
                className="w-full h-full object-cover object-center"
              />

              {/* Color legend overlay */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(4,10,22,0.82)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}>
                <p className="font-mono text-[8px] text-white/40 tracking-widest uppercase mb-1">Zone Legend</p>
                {[
                  { color: "#ef4444", label: "High Construction Activity" },
                  { color: "#f97316", label: "Moderate Growth"           },
                  { color: "#eab308", label: "New Development"           },
                  { color: "#22c55e", label: "Stable / Residential"      },
                  { color: "#3b82f6", label: "Water Bodies"              },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                    <span className="font-mono text-[9px] text-white/70 tracking-wide whitespace-nowrap">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Landmark className="h-5 w-5" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-blue-400">Municipal Authority</p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Monitor the city as it changes.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-10">
              Use multi-temporal spatial intelligence to observe built-up expansion and changing urban patterns.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Urban Monitoring", "Construction Change", "Encroachment Watch", "Change Timeline"].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - CITIZEN */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="h-5 w-5" />
              </span>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-purple-400">Citizen</p>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">See how your city has changed.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-10">
              Explore the transformation of familiar places through satellite imagery and historical comparison.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["City Explorer", "Change Timeline", "Area Comparison", "Urban Growth View"].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full relative">
            <MapComparisonSlider />
          </div>
        </div>
      </section>

      {/* SECTION 4 - ONE SHARED MAP */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">One Shared Map</h2>
          <p className="text-slate-400 font-light">Experience the same location through three distinct lenses.</p>
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10">
          {/* Custom Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button 
              onClick={() => setActiveTab("builder")}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === "builder" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"}`}
            >
              Builder Context
            </button>
            <button 
              onClick={() => setActiveTab("authority")}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === "authority" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"}`}
            >
              Authority View
            </button>
            <button 
              onClick={() => setActiveTab("citizen")}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${activeTab === "citizen" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10"}`}
            >
              Citizen Explorer
            </button>
          </div>

          <div className="w-full h-[60vh] rounded-3xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl">
            <img src={heroBg} alt="Base Map" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            
            <AnimatePresence mode="wait">
              {activeTab === "builder" && (
                <motion.div 
                  key="builder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-orange-900/10 mix-blend-color" />
                  <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 border-2 border-orange-400 bg-orange-400/20 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Map className="h-8 w-8 text-orange-400 mb-2" />
                    <span className="font-mono text-[12px] text-orange-200 tracking-widest">DEVELOPMENT ZONE</span>
                  </div>
                </motion.div>
              )}
              
              {activeTab === "authority" && (
                <motion.div 
                  key="authority"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-blue-900/20 mix-blend-color" />
                  <div className="absolute top-1/3 right-1/4 w-64 h-64 border border-blue-400/50 bg-blue-500/10 rounded-full flex flex-col items-center justify-center backdrop-blur-sm">
                    <Radar className="h-8 w-8 text-blue-400 mb-2 animate-spin-slow" />
                    <span className="font-mono text-[10px] text-blue-200 tracking-widest">MONITORING ACTIVE</span>
                  </div>
                </motion.div>
              )}

              {activeTab === "citizen" && (
                <motion.div 
                  key="citizen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-purple-900/10 mix-blend-color" />
                  <div className="absolute bottom-1/4 left-1/3 flex items-center gap-2 p-3 bg-black/80 border border-purple-500/30 rounded-xl backdrop-blur-md shadow-2xl">
                    <Search className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="font-mono text-[10px] text-purple-300">Panchavati Region</p>
                      <p className="text-sm font-light text-white">Historical growth view enabled</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center justify-center text-center px-6 border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-8">
          Explore your city <br className="hidden sm:block" /> through a different lens.
        </h2>
        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Launch UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
