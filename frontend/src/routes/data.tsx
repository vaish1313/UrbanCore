import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
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
  
  // Section 1: Timeline State
  const [activeYear, setActiveYear] = useState(2025);
  
  // Section 2: Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <NashikBackgroundCarousel />
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />
      
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
              Explore multi-temporal satellite observations to understand where and how built-up areas change.
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
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <div className="w-full aspect-video rounded-3xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl mb-12">
            <img src={heroBg} alt="Map Timeline" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen grayscale" />
            
            {/* Dynamic footprint simulation based on year */}
            <motion.div 
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent mix-blend-screen"
              animate={{ scale: 1 + (activeYear - 2021) * 0.15, opacity: 0.2 + (activeYear - 2021) * 0.1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div 
                className="w-32 h-32 border border-cyan-500/50 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            
            <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md">
              <span className="font-mono text-xl text-cyan-400">{activeYear}</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full relative max-w-3xl mx-auto">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 -translate-y-1/2 z-0" />
            {[2021, 2022, 2023, 2024, 2025].map(year => (
              <button 
                key={year}
                onClick={() => setActiveYear(year)}
                className={`relative z-10 w-12 h-12 rounded-full border flex items-center justify-center transition-all bg-[#03060d] ${activeYear === year ? 'border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'border-white/20 text-slate-400 hover:border-white/40'}`}
              >
                <span className="font-mono text-xs">{year}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 - BUILT-UP CHANGE, MADE VISIBLE */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">
            Built-up change, made visible.
          </h2>
          <p className="text-slate-400 font-light">Drag the slider to compare historical and current footprints.</p>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <div 
            ref={sliderRef}
            className="w-full aspect-[4/3] sm:aspect-video rounded-3xl border border-white/10 overflow-hidden relative cursor-ew-resize select-none"
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
          >
            {/* Right Side (Underneath) - 2025 */}
            <div className="absolute inset-0 bg-[#050a15]">
              <img src={heroBg} alt="2025 Map" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen grayscale" />
              <div className="absolute inset-0 bg-cyan-900/20 mix-blend-color" />
              <div className="absolute top-1/3 left-1/3 w-1/2 h-1/2 bg-cyan-500/20 border border-cyan-400/50 backdrop-blur-[2px] rounded-xl" />
              {/* Highlighted Change in center */}
              <div className="absolute top-[40%] right-[30%] w-32 h-32 border-2 border-orange-500 border-dashed bg-orange-500/20 flex items-center justify-center rounded-lg animate-pulse">
                <span className="font-mono text-[10px] text-orange-200">NEW CHANGE</span>
              </div>
              <div className="absolute top-6 right-6 px-3 py-1 bg-black/80 border border-cyan-500/30 rounded backdrop-blur-md">
                <span className="font-mono text-xs text-cyan-400">2025 FOOTPRINT</span>
              </div>
            </div>

            {/* Left Side (On top, clipped) - 2021 */}
            <div 
              className="absolute inset-0 bg-[#050a15] border-r border-white shadow-[2px_0_20px_rgba(0,0,0,0.8)] z-10"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img src={heroBg} alt="2021 Map" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen grayscale" />
              <div className="absolute inset-0 bg-slate-900/40 mix-blend-color" />
              <div className="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-slate-500/20 border border-slate-400/50 backdrop-blur-[1px] rounded-xl" />
              <div className="absolute top-6 left-6 px-3 py-1 bg-black/80 border border-slate-500/30 rounded backdrop-blur-md">
                <span className="font-mono text-xs text-slate-300">2021 FOOTPRINT</span>
              </div>
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_10px_rgba(255,255,255,0.5)] flex items-center justify-center -ml-[2px] pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="flex gap-1">
                  <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
                  <div className="w-0.5 h-3 bg-slate-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - EXPLORE AN AREA */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-12 text-center">
            Explore an area.
          </h2>

          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-[#050a15] p-4 backdrop-blur-xl shadow-2xl relative">
            <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl border border-white/5 overflow-hidden relative">
              <img src={heroBg} alt="App Interface" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              
              {/* Fake UI Overlays */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <div className="px-4 py-2 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-[11px] text-white">Search Location...</span>
                </div>
                <div className="px-4 py-2 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-[11px] text-white">2021 - 2025</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <div className="p-3 bg-black/80 border border-white/10 rounded-lg backdrop-blur-md flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-cyan-500 rounded border border-cyan-400" />
                    <span className="font-mono text-[10px] text-slate-300">Built-up</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded border border-orange-400" />
                    <span className="font-mono text-[10px] text-slate-300">Detected Change</span>
                  </div>
                </div>
              </div>

              {/* Map drawing bounding box */}
              <div className="absolute top-1/4 left-1/4 w-96 h-64 border-2 border-dashed border-white/50 bg-white/5 flex items-center justify-center">
                <span className="font-mono text-[10px] bg-black/80 px-2 py-1 rounded text-white border border-white/20 backdrop-blur-sm">AOI SELECTION</span>
              </div>
            </div>
          </div>
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
                  <motion.div initial={{ height: "30%" }} whileInView={{ height: "40%" }} transition={{ duration: 1 }} className="w-full bg-cyan-500/40 border-t border-cyan-400" />
                  <motion.div initial={{ height: "30%" }} whileInView={{ height: "60%" }} transition={{ duration: 1, delay: 0.2 }} className="w-full bg-cyan-500/60 border-t border-cyan-400" />
                  <motion.div initial={{ height: "30%" }} whileInView={{ height: "90%" }} transition={{ duration: 1, delay: 0.4 }} className="w-full bg-cyan-500/80 border-t border-cyan-400" />
                </div>
              </div>
              <h3 className="font-mono text-sm text-cyan-400 mb-2">Built-up Expansion</h3>
              <p className="text-slate-400 font-light text-sm">Track the outward sprawl of urban boundaries year-over-year.</p>
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
              <p className="text-slate-400 font-light text-sm">Isolate newly developed zones between specific date ranges.</p>
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
              <p className="text-slate-400 font-light text-sm">Compare development rates across different municipal wards or zones.</p>
            </div>

            {/* Urban Growth Pattern */}
            <div className="p-8 rounded-2xl bg-[#03060d] border border-white/5 hover:border-emerald-500/30 transition-colors group">
              <div className="h-40 mb-6 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent rounded-lg" />
                <Network className="w-16 h-16 text-emerald-400 opacity-80" />
              </div>
              <h3 className="font-mono text-sm text-emerald-400 mb-2">Urban Growth Pattern</h3>
              <p className="text-slate-400 font-light text-sm">Visualize clustering and dispersion patterns in new construction.</p>
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
