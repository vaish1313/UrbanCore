import { TIMELINE_YEARS, TIMELINE_DATA } from "@/data/citizenMockData";
import { Building2, MapPin } from "lucide-react";
import { motion, type Variants } from "motion/react";

interface ConstructionTimelineProps {
  onReportConcern?: () => void;
}

export function ConstructionTimeline({ onReportConcern }: ConstructionTimelineProps) {
  // --- Animation Variants ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.6, // Stagger each card appearance
      },
    },
  };

  const lineVariants: Variants = {
    hidden: { scaleX: 0 },
    show: {
      scaleX: 1,
      transition: { duration: 3.5, ease: "linear" }, // Slow line connecting the cards
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, type: "spring", bounce: 0.4 },
    },
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
      {/* Outer true glassmorphic container */}
      <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-white/5 blur-[100px] pointer-events-none" />

        {/* Header & Legend */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-8 gap-4 relative z-10">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
              <span className="text-[#38bdf8]">Multi-Year</span> Construction Timeline{" "}
              <span className="text-[#38bdf8]">(2021-2025)</span>
            </h2>
            <p className="text-sm md:text-base text-slate-400 mt-2">
              Observe how the region has been developed over the last 5 years.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center flex-wrap gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <span className="text-xs text-slate-300 font-medium">No Construction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div>
              <span className="text-xs text-slate-300 font-medium">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
              <span className="text-xs text-slate-300 font-medium">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
              <span className="text-xs text-slate-300 font-medium">High</span>
            </div>
          </div>
        </div>

        {/* Timeline Scrolling Container */}
        <div className="w-full overflow-x-auto pb-8 hide-scrollbar relative z-10 cursor-grab active:cursor-grabbing">
          <div className="relative min-w-[max-content] pt-12 px-2">
            {/* Background Timeline Axis */}
            <div className="absolute top-4 left-0 w-full h-1 bg-slate-800 rounded-full" />

            {/* Animated Active Timeline Axis */}
            <motion.div
              variants={lineVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="absolute top-4 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full origin-left shadow-[0_0_15px_rgba(6,182,212,0.6)]"
            />

            {/* Cards Flex Row */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              className="flex gap-6 md:gap-8 items-start"
            >
              {TIMELINE_YEARS.map((year) => {
                const data = TIMELINE_DATA[year]!;
                const intensity = year - 2021; // 0 to 4

                // Seeded random positions for the heatmap blobs
                const basePositions = [
                  { top: "35%", left: "25%" },
                  { top: "65%", left: "75%" },
                  { top: "45%", left: "85%" },
                  { top: "75%", left: "35%" },
                  { top: "25%", left: "55%" },
                  { top: "85%", left: "55%" },
                  { top: "50%", left: "50%" },
                  { top: "20%", left: "80%" },
                ];

                const blobs = [];

                for (let i = 0; i <= intensity + 3; i++) {
                  const pos = basePositions[i % basePositions.length];
                  // Green base
                  blobs.push({
                    ...pos,
                    size: "80px",
                    color: "bg-[#22c55e]/30",
                    blur: "blur-xl",
                    z: 1,
                  });
                  if (intensity >= 1 || i < 2) {
                    // Yellow mid
                    blobs.push({
                      ...pos,
                      size: "60px",
                      color: "bg-[#facc15]/40",
                      blur: "blur-lg",
                      z: 2,
                    });
                  }
                  if (intensity >= 2 && i < intensity + 2) {
                    // Orange focused
                    blobs.push({
                      ...pos,
                      size: "40px",
                      color: "bg-[#f97316]/50",
                      blur: "blur-md",
                      z: 3,
                    });
                  }
                  if (intensity >= 3 && i < intensity + 1) {
                    // Red hotspot
                    blobs.push({
                      ...pos,
                      size: "20px",
                      color: "bg-[#dc2626]/80",
                      blur: "blur-sm",
                      z: 4,
                    });
                  }
                }

                return (
                  <motion.div
                    key={year}
                    variants={cardVariants}
                    className="relative flex-shrink-0 w-[300px] md:w-[320px] flex flex-col bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl hover:border-white/30 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Timeline Node Connector */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-white/50 shadow-[0_0_12px_rgba(255,255,255,0.5)] z-20" />
                    {/* Vertical Connector Line */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[2px] h-10 bg-gradient-to-b from-white/30 to-transparent z-10" />

                    {/* Image Section */}
                    <div className="aspect-[4/3] w-full relative bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center overflow-hidden border-b border-white/10">
                      <div className="absolute inset-0 bg-black/30" />

                      {/* Year Badge */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-xl text-white font-bold text-sm border border-white/20 shadow-lg z-10">
                        {year}
                      </div>

                      {/* Heatmap Overlay */}
                      <div className="absolute inset-0 overflow-hidden mix-blend-screen">
                        {blobs.map((blob, idx) => (
                          <div
                            key={idx}
                            className={`absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 ${blob.color} ${blob.blur}`}
                            style={{
                              top: blob.top,
                              left: blob.left,
                              width: blob.size,
                              height: blob.size,
                              zIndex: blob.z,
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats Section */}
                    <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-xl">
                      {/* New Constructions */}
                      <div className="flex items-center gap-3 w-1/2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-900/30 border border-cyan-800/50 text-cyan-400 flex-shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5 leading-tight">
                            New
                            <br />
                            Constructions
                          </span>
                          <span className="text-xl font-bold text-white leading-none mt-1">
                            {data.newConstructions}
                          </span>
                        </div>
                      </div>

                      {/* Divider Line */}
                      <div className="w-[1px] h-10 bg-slate-800 mx-1"></div>

                      {/* Area Covered */}
                      <div className="flex items-center gap-3 w-1/2 pl-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-900/30 border border-orange-800/50 text-orange-400 flex-shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5 leading-tight">
                            Area
                            <br />
                            Covered
                          </span>
                          <span className="text-xl font-bold text-white leading-none mt-1">
                            {data.areaCovered}{" "}
                            <span className="text-xs font-normal text-slate-300">sq km</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
