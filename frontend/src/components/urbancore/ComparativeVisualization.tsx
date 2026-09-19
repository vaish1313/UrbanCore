import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, AlertTriangle, Building2, MapPin, ScanLine } from "lucide-react";

export function ComparativeVisualization({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"scan2021" | "scan2025" | "report">("scan2021");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("scan2025"), 2500); // 2.5s for 2021
    const t2 = setTimeout(() => setPhase("report"), 5000); // 2.5s for 2025
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 12000); // 7s to read report

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="w-full text-left"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="glass-panel relative overflow-hidden rounded-3xl border border-border/50 bg-background/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />

        <div className="relative flex flex-col gap-6">
          <header className="flex flex-col gap-1 text-center">
            <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
              {phase === "scan2021" && "Analyzing 2021 Baseline"}
              {phase === "scan2025" && "Processing 2025 Multispectral Data"}
              {phase === "report" && "Panchavati Change Intelligence Compiled"}
            </h3>
            <p className="text-xs font-light text-primary/80 animate-pulse flex items-center justify-center gap-1.5">
              <ScanLine className="h-3 w-3" />
              {phase !== "report" ? "Geospatial Scanning Active..." : "Analysis Complete."}
            </p>
          </header>

          <div
            className="relative w-full overflow-hidden rounded-2xl border border-border/40 bg-foreground/[0.02]"
            style={{ height: "300px" }}
          >
            <AnimatePresence mode="popLayout">
              {/* 2021 Map */}
              {phase === "scan2021" && (
                <motion.div
                  key="2021"
                  className="absolute inset-0 bg-[url('/src/assets/region-maharashtra.jpg')] bg-cover bg-center"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 1 }}
                >
                  <div className="absolute inset-0 bg-background/50 mix-blend-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-background/80 px-3 py-1 font-mono text-xs font-medium text-foreground backdrop-blur-sm border border-border/50">
                    2021 SAT
                  </div>
                  {/* Scanner line */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_20px_4px_rgba(114,180,255,0.6)] z-20"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
                  />
                </motion.div>
              )}

              {/* 2025 Map */}
              {phase === "scan2025" && (
                <motion.div
                  key="2025"
                  className="absolute inset-0 bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center"
                  initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 1 }}
                >
                  <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                  <div className="absolute right-4 top-4 z-10 rounded-full bg-primary/20 border border-primary/50 px-3 py-1 font-mono text-xs font-medium text-primary backdrop-blur-sm">
                    2025 SAT
                  </div>
                  {/* Scanner line */}
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_20px_4px_rgba(var(--accent-rgb),0.6)] z-20"
                    initial={{ top: "0%" }}
                    animate={{ top: "100%" }}
                    transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
                  />
                </motion.div>
              )}

              {/* Report Map overlaying both/zoomed */}
              {phase === "report" && (
                <motion.div
                  key="report"
                  className="absolute inset-0 bg-[url('/src/assets/city-nashik.jpg')] bg-cover bg-center"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                >
                  <div className="absolute inset-0 bg-background/70 mix-blend-multiply" />

                  {/* Scanned Points */}
                  <motion.div
                    className="absolute left-[30%] top-[40%] flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border border-accent/50"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(var(--accent-rgb),0.8)] animate-ping" />
                  </motion.div>

                  <motion.div
                    className="absolute right-[25%] top-[55%] flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 border border-primary/50"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_2px_rgba(114,180,255,0.8)] animate-ping" />
                  </motion.div>

                  <motion.div
                    className="absolute left-[50%] top-[25%] flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 border border-accent/50"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.1, type: "spring" }}
                  >
                    <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_2px_rgba(var(--accent-rgb),0.8)] animate-ping" />
                  </motion.div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-20">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <motion.div
                        className="flex flex-col gap-1 rounded-xl border border-border/40 bg-foreground/[0.02] p-3 backdrop-blur-md"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3 }}
                      >
                        <span className="text-[10px] uppercase text-muted-foreground">
                          New Structures
                        </span>
                        <span className="text-lg font-semibold text-foreground">+12.1%</span>
                      </motion.div>

                      <motion.div
                        className="flex flex-col gap-1 rounded-xl border border-accent/30 bg-accent/10 p-3 backdrop-blur-md"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                      >
                        <span className="text-[10px] uppercase text-accent">Risk Zones</span>
                        <span className="text-lg font-semibold text-foreground">3</span>
                      </motion.div>

                      <motion.div
                        className="flex flex-col gap-1 rounded-xl border border-border/40 bg-foreground/[0.02] p-3 backdrop-blur-md sm:col-span-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.7 }}
                      >
                        <span className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-primary" /> Takeaway
                        </span>
                        <span className="text-xs font-light text-foreground/90 leading-snug">
                          Rapid urbanization towards NE axis. Commercial suitability high. 3 new
                          encroachments flagged.
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
