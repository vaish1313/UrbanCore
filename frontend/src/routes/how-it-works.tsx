import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import heroBg from "@/assets/hero-bg.png";
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
  const [activeYear, setActiveYear] = useState(2021);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg} 
            alt="Satellite Map" 
            className="w-full h-full object-cover opacity-30 mix-blend-screen scale-105" 
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
      <section className="relative z-10 py-24 sm:py-32 w-full bg-[#03060d] border-t border-white/5">
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
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl flex items-center justify-center">
              <img src={heroBg} alt="Satellite Map" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" />
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 w-full">
                {["B2", "B3", "B4", "B8", "B11", "B12"].map((band, idx) => (
                  <motion.div 
                    key={band} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="aspect-square rounded border border-white/20 bg-black/50 backdrop-blur flex items-center justify-center relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 opacity-20 mix-blend-color ${idx % 2 === 0 ? 'bg-cyan-500' : 'bg-blue-500'}`} />
                    <span className="font-mono text-sm tracking-widest text-white relative z-10">{band}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 2 - SPECTRAL FEATURES */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full relative">
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl group">
              <img src={heroBg} alt="Spectral Base" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              
              {/* CSS Animated False Color Overlays */}
              <motion.div 
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.5, 1], ease: "easeInOut" }}
                className="absolute inset-0 bg-green-500/20 mix-blend-screen"
              />
              <motion.div 
                animate={{ opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, times: [0, 0.5, 1], ease: "easeInOut" }}
                className="absolute inset-0 bg-cyan-500/20 mix-blend-screen"
              />
              
              {/* Grid Lines */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVMMCAwbDM5LjUgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-50" />
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
      <section className="relative z-10 py-24 sm:py-32 w-full bg-[#03060d] border-t border-white/5">
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
              <span className="px-3 py-1 rounded text-xs font-mono border border-white/20 bg-white/5 text-slate-300">ResNet34 Encoder</span>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full relative">
            <div className="aspect-square sm:aspect-[4/3] rounded-2xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl flex items-center group">
              <img src={heroBg} alt="Before AI" className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" />
              
              {/* Animated Segmentation Mask overlay */}
              <motion.div 
                className="absolute inset-y-0 left-0 bg-cyan-900/30 mix-blend-color border-r border-cyan-400 shadow-[2px_0_15px_rgba(34,211,238,0.5)] overflow-hidden"
                animate={{ width: ["0%", "100%", "0%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Fake Built-up Pixels */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/2 h-1/2 bg-cyan-400/20 backdrop-blur-[1px] border border-cyan-400/50 rounded-lg"></div>
                  <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-orange-400/20 backdrop-blur-[1px] border border-orange-400/50 rounded-md"></div>
                </div>
              </motion.div>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 border border-white/10 rounded-full backdrop-blur-md">
                <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-400">Segmentation Pass</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 4 - TEMPORAL COMPARISON */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="font-mono text-xs text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1 rounded-full">STEP 04</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">
            One year tells a story.<br/>Multiple years reveal change.
          </h2>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          {/* Interactive-looking Timeline */}
          <div className="flex items-center justify-between w-full max-w-2xl mb-12 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 -translate-y-1/2 z-0" />
            {[2021, 2022, 2023, 2024, 2025].map(year => (
              <button 
                key={year}
                onClick={() => setActiveYear(year)}
                className={`relative z-10 w-12 h-12 rounded-full border flex items-center justify-center transition-all bg-black ${activeYear === year ? 'border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/20 text-slate-400 hover:border-white/40'}`}
              >
                <span className="font-mono text-xs">{year}</span>
              </button>
            ))}
          </div>

          {/* Temporal Map Visual */}
          <div className="w-full aspect-video sm:aspect-[2/1] rounded-3xl border border-white/10 bg-[#050a15] overflow-hidden relative shadow-2xl">
             <img src={heroBg} alt="Temporal Map Base" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen" />
             
             {/* Simulate changing footprint based on year */}
             <motion.div 
               animate={{ scale: 1 + (activeYear - 2021) * 0.05, opacity: 0.3 + (activeYear - 2021) * 0.1 }}
               transition={{ duration: 0.5 }}
               className="absolute top-1/4 left-1/4 right-1/4 bottom-1/4 border-2 border-blue-400 bg-blue-400/10 rounded-3xl backdrop-blur-[2px]"
             />
             <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 border border-blue-500/30 rounded backdrop-blur-md">
                <p className="font-mono text-lg text-blue-400">{activeYear}</p>
             </div>
          </div>
        </div>
      </section>

      {/* STEP 5 - CHANGE DETECTION */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-[#03060d] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="lg:w-1/3">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-rose-400 border border-rose-500/20 bg-rose-500/10 px-3 py-1 rounded-full">STEP 05</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Reveal where the city moved.</h2>
          </div>

          <div className="lg:w-2/3 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 font-mono text-xs text-center w-full">
            <div className="flex-1 flex flex-col items-center gap-4 w-full">
              <div className="w-full aspect-square rounded-xl border border-white/10 bg-[#050a15] relative overflow-hidden flex items-center justify-center p-6">
                <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500 rounded" />
              </div>
              <span className="text-cyan-400 tracking-wider">PREVIOUS FOOTPRINT</span>
            </div>
            <div className="text-2xl text-slate-500 font-light">+</div>
            <div className="flex-1 flex flex-col items-center gap-4 w-full">
              <div className="w-full aspect-square rounded-xl border border-white/10 bg-[#050a15] relative overflow-hidden flex items-center justify-center p-6">
                <div className="w-24 h-24 bg-cyan-500/20 border border-cyan-500 rounded" />
              </div>
              <span className="text-cyan-400 tracking-wider">CURRENT FOOTPRINT</span>
            </div>
            <div className="text-2xl text-slate-500 font-light">=</div>
            <div className="flex-1 flex flex-col items-center gap-4 w-full">
              <div className="w-full aspect-square rounded-xl border border-white/10 bg-[#050a15] relative overflow-hidden flex items-center justify-center p-6">
                <div className="w-16 h-16 bg-cyan-500/20 border border-cyan-500 rounded absolute" />
                <div className="w-24 h-24 bg-transparent border-2 border-dashed border-orange-500 bg-orange-500/20 rounded absolute" />
              </div>
              <span className="text-orange-400 tracking-wider">DETECTED CHANGE</span>
            </div>
          </div>

        </div>
      </section>

      {/* STEP 6 - URBAN INSIGHT */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black border-t border-white/5 flex flex-col items-center text-center">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="font-mono text-xs text-cyan-400 border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 rounded-full">STEP 06</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">From detected change to visual understanding.</h2>
        </div>

        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10 mb-12">
           <div className="w-full rounded-2xl border border-white/10 bg-[#050a15] p-2 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            <div className="h-8 border-b border-white/5 flex items-center px-4 gap-2 bg-white/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="relative w-full aspect-video bg-black flex overflow-hidden">
              <img src={heroBg} alt="App Map" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen" />
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-orange-500/30 blur-xl rounded-full mix-blend-screen animate-pulse" />
              <div className="absolute bottom-1/4 left-1/3 w-48 h-24 bg-cyan-500/20 blur-xl rounded-full mix-blend-screen" />
            </div>
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
             <span>ResNet34</span><span>•</span>
             <span>Multi-temporal analysis</span><span>•</span>
             <span>Sentinel-2</span><span>•</span>
             <span>Google Earth Engine</span><span>•</span>
             <span>10-channel input</span><span>•</span>
             <span>U-Net</span><span>•</span>
             <span>ResNet34</span><span>•</span>
             <span>Multi-temporal analysis</span>
           </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center justify-center text-center px-6 bg-[#03060d]">
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
