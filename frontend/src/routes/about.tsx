import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import heroBg from "@/assets/hero-bg.png";
import {
  Satellite, BrainCircuit, Map, Clock, ArrowRight, Github, Mail, BookOpen
} from "lucide-react";
import type { RoleType } from "@/types/urbancore";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function AboutPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <NashikBackgroundCarousel />
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />
      
      {/* HERO SECTION */}
      <section className="relative w-full min-h-[85vh] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle Atmospheric Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease }}
          >
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-400 mb-6">
              About UrbanCore
            </p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              Understanding cities <br className="hidden sm:block" /> from above.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              UrbanCore explores how satellite imagery and artificial intelligence can reveal the changing shape of urban environments.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SECTION 1 - THE IDEA */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-8">Why UrbanCore?</h2>
            <div className="space-y-6 text-slate-300 font-light leading-relaxed">
              <p>
                Cities continuously change. New neighborhoods expand outward, industrial zones shift, and green spaces recede. However, understanding that change across large areas and multiple years is difficult using conventional observation alone.
              </p>
              <p>
                Manual surveying is slow and localized, while raw satellite data is incredibly dense and difficult to parse without specialized knowledge.
              </p>
              <p className="text-cyan-100">
                UrbanCore was developed to bridge this gap. By combining Sentinel-2 satellite observations with AI-based semantic segmentation, we make large-scale urban changes easier to visualize, track, and analyze.
              </p>
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full flex justify-center">
            {/* Conceptual Wireframe Orbit Visual */}
            <div className="w-80 h-80 relative flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-white/10 border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 rounded-full border border-cyan-500/20"
              />
              <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-cyan-900/40 to-black border border-cyan-500/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_50px_rgba(34,211,238,0.1)]">
                <Satellite className="w-12 h-12 text-cyan-400 opacity-80" />
              </div>
              {/* Orbiting blip */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 origin-center"
              >
                <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)] -mt-1.5 mx-auto" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - OUR APPROACH */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-20">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white">Our Approach</h2>
        </div>

        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10">
          {/* Desktop Horizontal Equation */}
          <div className="hidden lg:flex items-center justify-between gap-4 font-mono text-xs">
            
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-cyan-500/30 transition-colors">
                <Satellite className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-slate-300">Earth Observation</span>
            </div>

            <span className="text-2xl font-light text-slate-600">+</span>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-blue-500/30 transition-colors">
                <BrainCircuit className="w-8 h-8 text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <span className="text-slate-300">Artificial Intelligence</span>
            </div>

            <span className="text-2xl font-light text-slate-600">+</span>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-orange-500/30 transition-colors">
                <Map className="w-8 h-8 text-slate-400 group-hover:text-orange-400 transition-colors" />
              </div>
              <span className="text-slate-300">Geospatial Analysis</span>
            </div>

            <span className="text-2xl font-light text-slate-600">+</span>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-purple-500/30 transition-colors">
                <Clock className="w-8 h-8 text-slate-400 group-hover:text-purple-400 transition-colors" />
              </div>
              <span className="text-slate-300">Time</span>
            </div>

            <span className="text-2xl font-light text-cyan-400">=</span>

            <div className="flex flex-col items-center gap-6">
              <div className="w-40 h-24 rounded-2xl bg-cyan-900/20 border border-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="font-display text-lg tracking-wider text-cyan-300 uppercase">Intelligence</span>
              </div>
              <span className="text-cyan-400 tracking-widest font-bold">URBAN CHANGE</span>
            </div>

          </div>

          {/* Mobile Vertical Equation */}
          <div className="flex lg:hidden flex-col items-center gap-8 font-mono text-xs">
            <div className="flex items-center gap-6 w-full max-w-xs p-4 bg-white/5 border border-white/10 rounded-xl">
              <Satellite className="w-6 h-6 text-slate-400" />
              <span className="text-slate-300 text-sm">Earth Observation</span>
            </div>
            <span className="text-xl font-light text-slate-600">+</span>
            <div className="flex items-center gap-6 w-full max-w-xs p-4 bg-white/5 border border-white/10 rounded-xl">
              <BrainCircuit className="w-6 h-6 text-slate-400" />
              <span className="text-slate-300 text-sm">Artificial Intelligence</span>
            </div>
            <span className="text-xl font-light text-slate-600">+</span>
            <div className="flex items-center gap-6 w-full max-w-xs p-4 bg-white/5 border border-white/10 rounded-xl">
              <Map className="w-6 h-6 text-slate-400" />
              <span className="text-slate-300 text-sm">Geospatial Analysis</span>
            </div>
            <span className="text-xl font-light text-slate-600">+</span>
            <div className="flex items-center gap-6 w-full max-w-xs p-4 bg-white/5 border border-white/10 rounded-xl">
              <Clock className="w-6 h-6 text-slate-400" />
              <span className="text-slate-300 text-sm">Time</span>
            </div>
            <span className="text-2xl font-light text-cyan-400">=</span>
            <div className="flex items-center justify-center w-full max-w-xs p-6 bg-cyan-900/20 border border-cyan-500 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.2)]">
              <span className="text-cyan-400 tracking-widest font-bold text-sm text-center">URBAN CHANGE INTELLIGENCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - RESEARCH */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col lg:flex-row items-start gap-16">
          <div className="lg:w-1/3">
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-6">Built as a research-driven system.</h2>
            <p className="text-slate-400 font-light leading-relaxed mb-8">
              UrbanCore is grounded in established remote sensing principles and deep learning methodologies. 
              We rely on verifiable data sources and transparent processing pipelines rather than black-box approximations.
            </p>
            <button className="flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group">
              View Research / Methodology
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          <div className="lg:w-2/3 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Sentinel-2 Imagery",
                "Google Earth Engine",
                "U-Net Architecture",
                "ResNet34 Encoder",
                "Spectral Indices",
                "Multi-temporal Analysis"
              ].map(tech => (
                <div key={tech} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-center h-24 hover:bg-white/10 transition-colors">
                  <span className="font-mono text-xs text-slate-300">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - THE URBANCORE VISION */}
      <section className="relative z-10 py-32 w-full bg-black/30 backdrop-blur-sm border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Vision Map" className="w-full h-full object-cover opacity-20 mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-6">A clearer view of how cities evolve.</h2>
          <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
            Providing researchers, authorities, and citizens with the spatial intelligence required to understand and adapt to the continuous transformation of the built environment.
          </p>
        </div>
      </section>

      {/* SECTION 5 - CONTACT */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-12">Have a question about UrbanCore?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            <a href="#" className="flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
              <Mail className="w-8 h-8 text-slate-400 group-hover:text-cyan-400 mb-4 transition-colors" />
              <h3 className="text-white font-medium mb-1">Contact</h3>
              <p className="text-sm text-slate-400 font-light">Get in touch directly.</p>
            </a>
            
            <a href="#" className="flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
              <Github className="w-8 h-8 text-slate-400 group-hover:text-white mb-4 transition-colors" />
              <h3 className="text-white font-medium mb-1">GitHub</h3>
              <p className="text-sm text-slate-400 font-light">View the source code.</p>
            </a>
            
            <a href="#" className="flex flex-col items-center p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
              <BookOpen className="w-8 h-8 text-slate-400 group-hover:text-purple-400 mb-4 transition-colors" />
              <h3 className="text-white font-medium mb-1">Research</h3>
              <p className="text-sm text-slate-400 font-light">Read the methodology.</p>
            </a>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 pb-32 sm:pb-48 pt-12 flex flex-col items-center justify-center text-center px-6 bg-black/30 backdrop-blur-sm">
        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Explore UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
