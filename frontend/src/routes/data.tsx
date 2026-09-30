import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import { ComparativeVisualization } from "@/components/urbancore/ComparativeVisualization";
import { NashikLiveMap } from "@/components/urbancore/NashikLiveMap";
import { UrbanTimeline } from "@/components/urbancore/UrbanTimeline";
import heroBg from "@/assets/hero-bg.png";
import {
  Clock, TrendingUp, Search, Sparkles, Map, Network, ArrowRight
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";

export const Route = createFileRoute("/data")({
  component: DataInsightsPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function DataInsightsPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <NashikBackgroundCarousel />
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => { }} />

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle Data Overlays */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-400 mb-6">
              Data & Insights
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              Watch the urban footprint <br className="hidden sm:block" /> evolve.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              Explore multi-temporal satellite observations to understand where and how built-up
              areas change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 - FIVE YEARS. ONE LANDSCAPE. */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">
            Five years. One landscape.
          </h2>
          <p className="text-slate-400 font-light text-sm max-w-xl mx-auto">
            Only a small fraction of Nashik's landscape changes each year. The timeline below captures exactly where and how.
          </p>
        </div>
        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <UrbanTimeline />
        </div>
      </section>

      {/* SECTION 2 - BUILT-UP CHANGE, MADE VISIBLE */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">
            Built-up change, made visible.
          </h2>
          <p className="text-slate-400 font-light">
            See how Nashik's urban footprint evolved from 2021 to 2025 through satellite analysis.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <ComparativeVisualization onComplete={() => { }} />
        </div>
      </section>

      {/* SECTION 3 - EXPLORE AN AREA */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-12 text-center">
            Explore an area.
          </h2>

          <NashikLiveMap />
        </div>
      </section>

      {/* SECTION 4 - INSIGHT CARDS */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Built-up Expansion */}
            <div className="p-8 rounded-2xl bg-[#03060d] border border-white/5 hover:border-cyan-500/30 transition-colors group">
              <div className="h-40 mb-6 flex items-end justify-center pb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-transparent rounded-lg" />
                <div className="w-full max-w-[200px] h-32 border-b border-l border-white/20 relative flex items-end gap-2 px-2">
                  <motion.div
                    initial={{ height: "30%" }}
                    whileInView={{ height: "40%" }}
                    transition={{ duration: 1 }}
                    className="w-full bg-cyan-500/40 border-t border-cyan-400"
                  />
                  <motion.div
                    initial={{ height: "30%" }}
                    whileInView={{ height: "60%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="w-full bg-cyan-500/60 border-t border-cyan-400"
                  />
                  <motion.div
                    initial={{ height: "30%" }}
                    whileInView={{ height: "90%" }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="w-full bg-cyan-500/80 border-t border-cyan-400"
                  />
                </div>
              </div>
              <h3 className="font-mono text-sm text-cyan-400 mb-2">Built-up Expansion</h3>
              <p className="text-slate-400 font-light text-sm">
                Track the outward sprawl of urban boundaries year-over-year.
              </p>
            </div>

            {/* Temporal Change */}
            <div className="p-8 rounded-2xl bg-[#03060d] border border-white/5 hover:border-orange-500/30 transition-colors group">
              <div className="h-40 mb-6 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent rounded-lg" />
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded bg-slate-800 border border-slate-600 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-8 h-8 bg-slate-600" />
                  </div>
                  <TrendingUp className="text-orange-400 w-6 h-6 my-auto" />
                  <div className="w-16 h-16 rounded bg-slate-800 border border-orange-500 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-8 h-8 bg-slate-600" />
                    <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500" />
                  </div>
                </div>
              </div>
              <h3 className="font-mono text-sm text-orange-400 mb-2">Temporal Change</h3>
              <p className="text-slate-400 font-light text-sm">
                Isolate newly developed zones between specific date ranges.
              </p>
            </div>

            {/* Area Comparison */}
            <div className="p-8 rounded-2xl bg-[#03060d] border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="h-40 mb-6 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent rounded-lg" />
                <div className="w-32 h-32 rounded-full border border-purple-500/50 flex items-center justify-center">
                  <div className="w-1/2 h-full bg-purple-500/20 border-r border-purple-400 flex items-center justify-center">
                    <span className="font-mono text-[10px] text-purple-300">ZONE A</span>
                  </div>
                  <div className="w-1/2 h-full bg-transparent flex items-center justify-center">
                    <span className="font-mono text-[10px] text-slate-500">ZONE B</span>
                  </div>
                </div>
              </div>
              <h3 className="font-mono text-sm text-purple-400 mb-2">Area Comparison</h3>
              <p className="text-slate-400 font-light text-sm">
                Compare development rates across different municipal wards or zones.
              </p>
            </div>

            {/* Urban Growth Pattern */}
            <div className="p-8 rounded-2xl bg-[#03060d] border border-white/5 hover:border-emerald-500/30 transition-colors group">
              <div className="h-40 mb-6 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent rounded-lg" />
                <Network className="w-16 h-16 text-emerald-400 opacity-80" />
              </div>
              <h3 className="font-mono text-sm text-emerald-400 mb-2">Urban Growth Pattern</h3>
              <p className="text-slate-400 font-light text-sm">
                Visualize clustering and dispersion patterns in new construction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - ASK THE CITY */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center text-center px-6 border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-12">
          Ask the city.
        </h2>

        <div className="w-full max-w-3xl mx-auto mb-16">
          <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center w-full h-16 sm:h-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 sm:px-8 shadow-2xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mr-4" />
              <div className="flex-1 overflow-hidden h-full flex items-center">
                <motion.div
                  animate={{ y: ["0%", "-33.33%", "-66.66%", "0%"] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "circInOut" }}
                  className="flex flex-col w-full text-left"
                >
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">
                    "Show built-up growth near Panchavati from 2021 to 2025."
                  </span>
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">
                    "How did this area change between 2022 and 2025?"
                  </span>
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">
                    "Where did built-up land expand?"
                  </span>
                  {/* Duplicate first item for smooth looping */}
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">
                    "Show built-up growth near Panchavati from 2021 to 2025."
                  </span>
                </motion.div>
              </div>
              <button className="hidden sm:flex ml-4 p-3 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>

        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Launch UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
