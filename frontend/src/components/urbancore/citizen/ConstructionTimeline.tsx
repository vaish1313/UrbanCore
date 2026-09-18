import { TIMELINE_YEARS, TIMELINE_DATA } from "@/data/citizenMockData";
import { ShieldAlert, Info } from "lucide-react";
import { motion } from "motion/react";

interface ConstructionTimelineProps {
  onReportConcern: () => void;
}

export function ConstructionTimeline({ onReportConcern }: ConstructionTimelineProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Construction Heatmap (2021-2025)</h2>
          <p className="text-sm text-slate-400">Observe how the region has been developed over the last 5 years.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TIMELINE_YEARS.map((year, index) => {
          const data = TIMELINE_DATA[year]!;
          const intensity = year - 2021; // 0 to 4
          
          // Seeded random positions for the heatmap blobs so they stay consistent per year
          const blobs = [];
          for (let i = 0; i < intensity * 2; i++) {
            blobs.push({
              id: i,
              width: 30 + (Math.sin(year + i) * 20),
              height: 30 + (Math.cos(year + i) * 20),
              top: 20 + Math.abs(Math.sin(year * i) * 50) + '%',
              left: 20 + Math.abs(Math.cos(year * i) * 50) + '%'
            });
          }

          return (
            <motion.div 
              key={year}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: index * 0.15, type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col bg-[#0a0f1d]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all group"
            >
              {/* Heatmap Box */}
              <div className="aspect-square w-full relative bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center overflow-hidden">
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Year Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white font-mono font-bold text-xs border border-white/10">
                  {year}
                </div>

                {/* No Construction State */}
                {intensity === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-medium shadow-lg backdrop-blur-md">
                      ✅ No Construction
                    </div>
                  </div>
                )}

                {/* Heatmap Overlay */}
                {intensity > 0 && (
                  <div className="absolute inset-0">
                    <div className="w-full h-full bg-red-500/5 mix-blend-overlay" />
                    {blobs.map(blob => (
                      <div 
                        key={blob.id} 
                        className="absolute bg-red-500/70 blur-md rounded-full mix-blend-screen opacity-80"
                        style={{ 
                          width: blob.width, 
                          height: blob.height,
                          top: blob.top,
                          left: blob.left
                        }} 
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
