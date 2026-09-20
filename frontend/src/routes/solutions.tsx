import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
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
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Satellite Map" 
            className="w-full h-full object-cover opacity-40 mix-blend-screen scale-105" 
          />
          {/* Subtle grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.2]" 
            style={{ backgroundImage: "linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-[#03060d]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/60 to-black" />
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
      <section className="relative z-10 py-24 sm:py-32 w-full bg-[#03060d] border-t border-white/5">
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
          
          <div className="lg:w-1/2 w-full relative">
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl">
              <img src={heroBg} alt="Builder Map" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen" />
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent" />
              {/* Fake Zoning Grid */}
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-dashed border-orange-400/50 bg-orange-400/10 flex items-center justify-center backdrop-blur-sm">
                <span className="font-mono text-[10px] text-orange-400 tracking-wider">RESTRICTED ZONE</span>
              </div>
              <div className="absolute top-1/2 right-1/4 w-1/3 h-1/3 border border-cyan-400 bg-cyan-400/20 flex items-center justify-center">
                <span className="font-mono text-[10px] text-cyan-300 tracking-wider">HIGH SUITABILITY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - MUNICIPAL AUTHORITY */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full relative">
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl">
              <img src={heroBg} alt="Municipal Map" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen" />
              {/* Fake Command Center Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent mix-blend-overlay" />
              <div className="absolute top-4 left-4 p-3 bg-black/80 border border-cyan-500/30 rounded-lg backdrop-blur-md">
                <p className="font-mono text-[9px] text-cyan-400 mb-1">CONSTRUCTION DETECTED</p>
                <p className="text-xl font-light text-white">+14.2%</p>
              </div>
              <div className="absolute bottom-1/3 right-1/3 w-32 h-32 border-2 border-red-500/50 bg-red-500/20 rounded-full animate-pulse flex items-center justify-center">
                <Activity className="h-6 w-6 text-red-400" />
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
      <section className="relative z-10 py-24 sm:py-32 w-full bg-[#03060d] border-y border-white/5">
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
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl group">
              <img src={heroBg} alt="Citizen Map" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000" />
              {/* Fake Slider Line */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg z-10">
                <span className="text-[8px] font-bold tracking-widest">VS</span>
              </div>
              <div className="absolute bottom-4 left-4 p-2 bg-black/80 border border-white/10 rounded backdrop-blur-md">
                <p className="font-mono text-[10px] text-white">2021</p>
              </div>
              <div className="absolute bottom-4 right-4 p-2 bg-black/80 border border-cyan-500/30 rounded backdrop-blur-md">
                <p className="font-mono text-[10px] text-cyan-400">2025</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - ONE SHARED MAP */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black">
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
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center justify-center text-center px-6 border-t border-white/5 bg-[#03060d]">
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
