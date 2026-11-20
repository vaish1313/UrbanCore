import { useState, useEffect, useRef } from "react";
import { Building2, Loader2, AlertCircle, TrendingUp, Calendar, TrendingDown, Layers, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ConstructionHeatmapGrid } from "./ConstructionHeatmapGrid";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface ConstructionTimelineProps {
  analysisId?: string;
  onReportConcern?: () => void;
}

interface YearData {
  year: number;
  construction_percentage: number;
  construction_pixels: number;
  total_pixels: number;
  geojson_path?: string;
  mask_path?: string;
}

interface YearDataForGrid {
  year: number;
  built_up_pct: number;
}

// Helper function to count up numbers
function useCountUp(target: number, duration: number = 600) {
  const [current, setCurrent] = useState(target);
  const requestRef = useRef<number>();
  const startValueRef = useRef(target);

  useEffect(() => {
    const previousValue = startValueRef.current;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = previousValue + (target - previousValue) * eased;
      
      setCurrent(value);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        startValueRef.current = target;
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [target, duration]);

  return current;
}

export function ConstructionTimeline({ analysisId, onReportConcern }: ConstructionTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyData, setYearlyData] = useState<Record<number, YearData>>({});
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [fadeStats, setFadeStats] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!analysisId) {
      setLoading(false);
      setError("No analysis ID provided");
      return;
    }

    const fetchAnalysisResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch analysis results");
        }

        const analysis = await response.json();

        if (analysis.status !== "completed") {
          setError("Analysis is not yet completed");
          setLoading(false);
          return;
        }

        // Extract yearly data from inference_results
        const inference = analysis.inference_results || {};
        const years = analysis.years || [];

        const yearData: Record<number, YearData> = {};

        years.forEach((year: number) => {
          const inferenceResult = inference[year.toString()];
          if (inferenceResult) {
            yearData[year] = {
              year,
              construction_percentage: inferenceResult.construction_percentage || 0,
              construction_pixels: inferenceResult.construction_pixels || 0,
              total_pixels: inferenceResult.total_pixels || 0,
              geojson_path: inferenceResult.geojson_path,
              mask_path: inferenceResult.mask_path,
            };
          }
        });

        setYearlyData(yearData);
        setAvailableYears(years.sort());

        // Set default selected year to the most recent
        if (years.length > 0) {
          setSelectedYear(years[years.length - 1]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching analysis results:", err);
        setError(err instanceof Error ? err.message : "Failed to load analysis results");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisResults();
  }, [analysisId]);

  // Prepare data for the heatmap grid
  const gridData: YearDataForGrid[] = availableYears.map(year => ({
    year,
    built_up_pct: yearlyData[year]?.construction_percentage || 0
  }));

  // Play/pause functionality
  useEffect(() => {
    if (isPlaying && availableYears.length > 1) {
      playIntervalRef.current = setInterval(() => {
        const currentIndex = availableYears.indexOf(selectedYear);
        const nextIndex = currentIndex + 1;

        if (nextIndex < availableYears.length) {
          setSelectedYear(availableYears[nextIndex]);
        } else {
          // Reached the end, stop playing
          setIsPlaying(false);
        }
      }, 1500); // 1.5 seconds per year
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, selectedYear, availableYears]);

  const handlePlay = () => {
    if (selectedYear === availableYears[availableYears.length - 1]) {
      // If at the end, restart from beginning
      setSelectedYear(availableYears[0]);
    }
    setIsPlaying(!isPlaying);
  };

  // Year change animation for stats
  const handleYearChange = (year: number) => {
    setFadeStats(true);
    setTimeout(() => {
      setSelectedYear(year);
      setTimeout(() => setFadeStats(false), 300);
    }, 150);
  };

  const currentYearData = yearlyData[selectedYear];
  const currentYearIndex = availableYears.indexOf(selectedYear);
  const previousYearData = currentYearIndex > 0
    ? yearlyData[availableYears[currentYearIndex - 1]]
    : null;

  // Calculate growth percentage (percentage points)
  const growthPercentagePoints = previousYearData 
    ? ((currentYearData?.construction_percentage || 0) - previousYearData.construction_percentage) 
    : 0;

  // Growth trend
  const growthTrend = Math.abs(growthPercentagePoints) < 0.1 ? "Stable" : 
                     growthPercentagePoints > 0 ? "Increasing" : "Decreasing";

  // Animated values for stats
  const animatedPercentage = useCountUp(currentYearData?.construction_percentage || 0);
  const animatedPixels = useCountUp(currentYearData?.construction_pixels || 0);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
        <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <span className="ml-3 text-slate-400">Loading construction timeline...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
        <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Timeline</h3>
            <p className="text-slate-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (availableYears.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
        <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
            <p className="text-slate-400">No construction analysis data found for this location.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
      <div className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-cyan-500/10 blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide mb-2">
            <span className="text-cyan-400">Construction Timeline</span>{" "}
            <span className="text-slate-400">
              {availableYears[0]} – {availableYears[availableYears.length - 1]}
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-400">
            Grid visualization showing construction growth over {availableYears.length} years
          </p>
        </div>

        {/* HERO VISUALIZATION - 20x20 GRID */}
        <div className="relative z-10 mb-8 flex justify-center">
          <ConstructionHeatmapGrid
            yearlyData={gridData}
            selectedYear={selectedYear}
            availableYears={availableYears}
          />
        </div>

        {/* Year Selector with Play/Pause */}
        <div className="relative z-10 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Select Year
                </span>
                {availableYears.length > 1 && (
                  <button
                    onClick={handlePlay}
                    className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 transition-colors"
                    title={isPlaying ? "Pause timeline" : "Play timeline"}
                  >
                    {isPlaying ? (
                      <Pause className="h-3 w-3 text-cyan-400" />
                    ) : (
                      <Play className="h-3 w-3 text-cyan-400" />
                    )}
                    <span className="font-mono text-[8px] uppercase tracking-wider text-cyan-400">
                      {isPlaying ? "pause" : "play"}
                    </span>
                  </button>
                )}
              </div>
              <motion.span
                key={selectedYear}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl font-bold text-cyan-400"
              >
                {selectedYear}
              </motion.span>
            </div>

            {/* Year Pills */}
            <div className="flex gap-2 flex-wrap justify-center">
              {availableYears.map((year) => (
                <motion.button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                    ${selectedYear === year
                      ? "text-white shadow-[0_0_20px_rgba(247,147,26,0.5)] border-2 border-orange-400"
                      : "bg-black/60 text-slate-400 border border-white/10 hover:border-orange-400/50 hover:text-orange-300"
                    }
                  `}
                  style={{
                    backgroundColor: selectedYear === year ? '#f97316' : undefined
                  }}
                >
                  {year}
                </motion.button>
              ))}
            </div>

            {/* Year Range Slider */}
            <div className="mt-6">
              <input
                type="range"
                min={availableYears[0]}
                max={availableYears[availableYears.length - 1]}
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                style={{
                  accentColor: '#f97316'
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{availableYears[0]}</span>
                <span>{availableYears[availableYears.length - 1]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards with Fade Animation */}
        <AnimatePresence mode="wait">
          {currentYearData && (
            <motion.div
              key={selectedYear}
              initial={{ opacity: 0 }}
              animate={{ opacity: fadeStats ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: fadeStats ? 0.15 : 0.3 }}
              className="relative z-10"
            >
              {/* Statistics Cards */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                {/* Built-Up Area */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Built-Up Area
                    </span>
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {animatedPercentage.toFixed(1)}
                    </span>
                    <span className="text-2xl text-cyan-400">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">of analyzed region</p>
                </div>

                {/* New Construction (Percentage Points) */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      New Construction
                    </span>
                    {growthPercentagePoints >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  {previousYearData ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${growthPercentagePoints >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {growthPercentagePoints >= 0 ? '+' : ''}{growthPercentagePoints.toFixed(1)}
                        </span>
                        <span className="text-lg text-slate-400">pp</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        percentage points vs {availableYears[currentYearIndex - 1]}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-400">
                          Baseline Year
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        No previous data
                      </p>
                    </>
                  )}
                </div>

                {/* Growth Trend */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Growth Trend
                    </span>
                    <Layers className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${
                      growthTrend === 'Increasing' ? 'text-green-400' : 
                      growthTrend === 'Decreasing' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {growthTrend}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {Math.round(animatedPixels).toLocaleString()} pixels
                  </p>
                </div>

                {/* Analysis Year */}
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6 shadow-lg flex flex-col justify-center">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Analysis Year
                  </span>
                  <span className="text-5xl font-bold text-white">{currentYearData.year}</span>
                  <p className="text-xs text-slate-400 mt-2">Sentinel-2 Satellite Data</p>
                </div>
              </div>

              {/* Model Information */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  U-Net Model Analysis
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model Architecture:</span>
                    <span className="text-white font-medium">ResNet18 U-Net</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Input Channels:</span>
                    <span className="text-white font-medium">
                      10 (B2, B3, B4, B8, B11, B12, NDVI, NDBI, NDWI, BSI)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Segmentation Type:</span>
                    <span className="text-white font-medium">Binary (Built-up / Non-built-up)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Threshold:</span>
                    <span className="text-white font-medium">0.5 (50%)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Construction Growth Overview (Kept as requested) */}
        {availableYears.length > 1 && (
          <div className="relative z-10 mt-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Construction Growth Overview</h3>
            <div className="space-y-3">
              {availableYears.map((year) => {
                const data = yearlyData[year];
                if (!data) return null;

                const maxPercentage = Math.max(
                  ...availableYears.map((y) => yearlyData[y]?.construction_percentage || 0),
                );
                const barWidth = (data.construction_percentage / maxPercentage) * 100;

                return (
                  <div key={year} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-300 w-16">{year}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-8 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.8, delay: year * 0.05 }}
                        className={`h-full rounded-full ${year === selectedYear
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : "bg-gradient-to-r from-slate-600 to-slate-500"
                          }`}
                      />
                    </div>
                    <span className="text-sm font-semibold text-white w-20 text-right">
                      {data.construction_percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}