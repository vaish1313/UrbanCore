import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, CheckCircle2, XCircle, Download, Cpu, Satellite, Database } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface AnalysisProgressProps {
  analysisId: string;
  onComplete?: () => void;
}

interface GEETask {
  year: number;
  filename: string;
}

interface AnalysisData {
  status: string;
  error?: string;
  message?: string;
  gee_tasks?: GEETask[];
}

const STATUS_CONFIG = {
  queued: {
    icon: Loader2,
    label: "Queued",
    description: "Waiting to start...",
    color: "text-slate-400",
  },
  exporting: {
    icon: Satellite,
    label: "Exporting",
    description: "Submitting satellite export tasks...",
    color: "text-blue-400",
  },
  exports_submitted: {
    icon: Satellite,
    label: "GEE Processing",
    description: "Google Earth Engine is exporting imagery...",
    color: "text-cyan-400",
  },
  monitoring_exports: {
    icon: Database,
    label: "Monitoring",
    description: "Checking export progress...",
    color: "text-indigo-400",
  },
  exports_completed: {
    icon: CheckCircle2,
    label: "Exports Done",
    description: "Imagery ready, starting download...",
    color: "text-green-400",
  },
  downloading: {
    icon: Download,
    label: "Downloading",
    description: "Retrieving GeoTIFF files from Google Drive...",
    color: "text-purple-400",
  },
  processing: {
    icon: Cpu,
    label: "Running AI",
    description: "UNet model analyzing imagery...",
    color: "text-pink-400",
  },
  visualizing: {
    icon: Cpu,
    label: "Visualizing",
    description: "Creating SAM-3D segmentation maps...",
    color: "text-orange-400",
  },
  completed: {
    icon: CheckCircle2,
    label: "Complete",
    description: "Analysis ready!",
    color: "text-green-500",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    description: "An error occurred",
    color: "text-red-500",
  },
};

export function AnalysisProgress({ analysisId, onComplete }: AnalysisProgressProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/analyses/${analysisId}`);
        if (!response.ok) throw new Error("Failed to fetch analysis status");

        const data = await response.json();
        setAnalysis(data);
        setLoading(false);

        // Stop polling when completed or failed
        if (data.status === "completed") {
          clearInterval(intervalId);
          onComplete?.();
        } else if (data.status === "failed") {
          clearInterval(intervalId);
          setError(data.error || "Analysis failed");
        }
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    const intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, [analysisId, onComplete]);

  if (loading && !analysis) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 py-16">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold text-red-500 mb-2">Analysis Error</h3>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_CONFIG[analysis?.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.queued;
  const StatusIcon = statusConfig.icon;
  const isProcessing = !["completed", "failed"].includes(analysis?.status);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-cyan-500/10 blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 text-center mb-12">
          <motion.div
            animate={isProcessing ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 mb-6"
          >
            <StatusIcon
              className={`w-10 h-10 ${statusConfig.color} ${isProcessing ? "animate-pulse" : ""}`}
            />
          </motion.div>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            <span className="text-cyan-400">{statusConfig.label}</span>
          </h2>
          <p className="text-lg text-slate-400">{statusConfig.description}</p>
        </div>

        {/* Progress Details */}
        <div className="relative z-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Analysis Info */}
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-xs text-slate-500 font-medium mb-1">Location</div>
            <div className="text-white font-mono text-sm">
              {analysis?.latitude.toFixed(4)}°, {analysis?.longitude.toFixed(4)}°
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-xs text-slate-500 font-medium mb-1">Years Analyzed</div>
            <div className="text-white font-semibold">
              {analysis?.years?.[0]} - {analysis?.years?.[analysis.years.length - 1]}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-5">
            <div className="text-xs text-slate-500 font-medium mb-1">Coverage</div>
            <div className="text-white font-semibold">{analysis?.radius_m}m radius</div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative z-10 space-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = analysis?.status === key;
            const statuses = Object.keys(STATUS_CONFIG);
            const currentIndex = statuses.indexOf(analysis?.status);
            const stepIndex = statuses.indexOf(key);
            const isComplete = stepIndex < currentIndex || analysis?.status === "completed";
            const isFailed = analysis?.status === "failed" && isActive;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: stepIndex * 0.1 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${isActive ? "bg-cyan-500/10 border-cyan-500/30" : "bg-black/20 border-white/5"}
                  ${isComplete && !isActive ? "opacity-50" : ""}
                `}
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all
                    ${isActive ? "bg-cyan-500/20 border-2 border-cyan-500" : "bg-white/5 border border-white/10"}
                    ${isComplete && !isActive ? "bg-green-500/20 border-green-500" : ""}
                    ${isFailed ? "bg-red-500/20 border-red-500" : ""}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 
                      ${isActive ? "text-cyan-400 animate-pulse" : "text-slate-500"}
                      ${isComplete && !isActive ? "text-green-500" : ""}
                      ${isFailed ? "text-red-500" : ""}
                    `}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{config.label}</div>
                  <div className="text-xs text-slate-400">{config.description}</div>
                </div>
                {isActive && isProcessing && (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                )}
                {isComplete && !isActive && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </motion.div>
            );
          })}
        </div>

        {/* GEE Tasks Details */}
        {analysis?.gee_tasks && analysis.gee_tasks.length > 0 && (
          <div className="relative z-10 mt-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Satellite className="w-5 h-5 text-cyan-400" />
              Earth Engine Export Tasks
            </h3>
            <div className="space-y-2">
              {analysis.gee_tasks.map((task: GEETask, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Year {task.year}</span>
                  <span className="text-slate-500 font-mono text-xs">{task.filename}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        {analysis?.message && (
          <div className="relative z-10 mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300">{analysis.message}</p>
          </div>
        )}

        {/* Error */}
        {analysis?.error && (
          <div className="relative z-10 mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-300">{analysis.error}</p>
          </div>
        )}

        {/* Estimated Time */}
        {isProcessing && analysis?.status === "exports_submitted" && (
          <div className="relative z-10 mt-6 text-center">
            <p className="text-xs text-slate-500">
              Earth Engine exports typically complete in 5-15 minutes
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
