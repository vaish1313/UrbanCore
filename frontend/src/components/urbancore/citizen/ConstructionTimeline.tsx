import { useState, useEffect } from "react";
import { Building2, Loader2, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

export function ConstructionTimeline({ analysisId, onReportConcern }: ConstructionTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearlyData, setYearlyData] = useState<Record<number, YearData>>({});
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

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

  const currentYearData = yearlyData[selectedYear];

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
            U-Net model analysis showing construction development over {availableYears.length} years
          </p>
        </div>

        {/* Year Slider */}
        <div className="relative z-10 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                Select Year
              </span>
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
                  onClick={() => setSelectedYear(year)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
                    ${
                      selectedYear === year
                        ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-400"
                        : "bg-black/60 text-slate-400 border border-white/10 hover:border-cyan-400/50 hover:text-cyan-300"
                    }
                  `}
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
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                style={{
                  background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((selectedYear - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%, rgb(30 41 59) ${((selectedYear - availableYears[0]) / (availableYears[availableYears.length - 1] - availableYears[0])) * 100}%, rgb(30 41 59) 100%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>{availableYears[0]}</span>
                <span>{availableYears[availableYears.length - 1]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current Year Data Display */}
        <AnimatePresence mode="wait">
          {currentYearData && (
            <motion.div
              key={selectedYear}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              {/* Statistics Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Construction Percentage */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Construction Area
                    </span>
                    <Building2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {currentYearData.construction_percentage.toFixed(1)}
                    </span>
                    <span className="text-2xl text-cyan-400">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">of analyzed region</p>
                </div>

                {/* Construction Pixels */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Construction Pixels
                    </span>
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      {currentYearData.construction_pixels.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    of {currentYearData.total_pixels.toLocaleString()} total pixels
                  </p>
                </div>

                {/* Year Label */}
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
                    <span className="text-white font-medium">ResNet34 U-Net</span>
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

        {/* Growth Comparison (if multiple years available) */}
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
                        transition={{ duration: 0.8, delay: year * 0.1 }}
                        className={`h-full rounded-full ${
                          year === selectedYear
                            ? "bg-gradient-to-r from-cyan-500 to-blue-500"
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
