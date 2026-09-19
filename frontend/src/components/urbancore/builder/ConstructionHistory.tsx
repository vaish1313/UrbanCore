import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  TrendingUp,
  Calendar,
  Layers,
  Loader2,
  RefreshCw,
  MapPin,
  Info,
  AlertTriangle,
  History,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AOI } from "@/types/urbancore";

const API_BASE_URL = "http://localhost:8000/api/v1";

interface ConstructionHistoryProps {
  aoi: AOI;
}

export interface YearHistoryItem {
  year: number;
  buildings_count: number;
  built_up_area_ha: number;
  built_up_change_percent: number;
}

interface BackendGrowthHistoryResponse {
  aoi_id: string;
  name: string;
  location?: string;
  years: number[];
  construction_history: YearHistoryItem[];
  first_year_area_ha: number;
  latest_year_area_ha: number;
  total_change_percent: number;
  analysis_period: string;
  largest_increase: {
    period: string;
    change_percent: number;
  };
  factual_observation: string;
}

const DEFAULT_YEAR_ITEM: YearHistoryItem = {
  year: 2025,
  buildings_count: 100,
  built_up_area_ha: 10.0,
  built_up_change_percent: 0.0,
};

export function ConstructionHistory({ aoi }: ConstructionHistoryProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendData, setBackendData] = useState<BackendGrowthHistoryResponse | null>(null);

  // Active selected year index
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(4); // Default latest

  // Fetch multi-year satellite construction history when active AOI changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchGrowthHistory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/detection/growth/history/${aoi.id}`);
        if (response.ok) {
          const data: BackendGrowthHistoryResponse = await response.json();
          if (isMounted) {
            setBackendData(data);
            setSelectedYearIndex(Math.max(0, data.construction_history.length - 1));
            setError(null);
          }
        } else {
          if (isMounted) {
            setBackendData(null);
          }
        }
      } catch (err) {
        console.warn("Backend growth history API unavailable. Using AOI fallback.", err);
        if (isMounted) {
          setBackendData(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGrowthHistory();

    return () => {
      isMounted = false;
    };
  }, [aoi.id]);

  // Construct fallback history from AOI props if backend endpoint is unavailable
  const fallbackHistory: YearHistoryItem[] = aoi.constructionHistory.map((item) => ({
    year: item.year,
    buildings_count: item.buildingsCount,
    built_up_area_ha: Math.round((item.buildingsCount * 0.1) * 10) / 10,
    built_up_change_percent: item.builtUpChangePercent,
  }));

  const historyList: YearHistoryItem[] =
    backendData?.construction_history && backendData.construction_history.length > 0
      ? backendData.construction_history
      : fallbackHistory.length > 0
        ? fallbackHistory
        : [DEFAULT_YEAR_ITEM];

  const safeIndex = Math.min(Math.max(0, selectedYearIndex), historyList.length - 1);
  const activeYearData: YearHistoryItem = historyList[safeIndex] ?? historyList[0] ?? DEFAULT_YEAR_ITEM;

  // Derived calculations
  const firstYearItem: YearHistoryItem = historyList[0] ?? DEFAULT_YEAR_ITEM;
  const latestYearItem: YearHistoryItem = historyList[historyList.length - 1] ?? DEFAULT_YEAR_ITEM;

  const firstAreaHa = backendData?.first_year_area_ha ?? firstYearItem.built_up_area_ha;
  const latestAreaHa = backendData?.latest_year_area_ha ?? latestYearItem.built_up_area_ha;

  const totalChangePercent =
    backendData?.total_change_percent ??
    (firstAreaHa > 0 ? Math.round(((latestAreaHa - firstAreaHa) / firstAreaHa) * 1000) / 10 : 0);

  const analysisPeriod =
    backendData?.analysis_period || `${firstYearItem.year}–${latestYearItem.year}`;

  // Compute largest YoY increase dynamically
  let largestIncreasePeriod = backendData?.largest_increase?.period || "N/A";
  let largestIncreasePercent = backendData?.largest_increase?.change_percent || 0;

  if (!backendData) {
    let maxChange = -1;
    for (let i = 1; i < historyList.length; i++) {
      const prev = historyList[i - 1];
      const curr = historyList[i];
      if (prev && curr) {
        const change = curr.built_up_change_percent;
        if (change > maxChange) {
          maxChange = change;
          largestIncreasePeriod = `${prev.year} → ${curr.year}`;
          largestIncreasePercent = Math.round(change * 10) / 10;
        }
      }
    }
  }

  const factualObservation =
    backendData?.factual_observation ||
    `Construction footprint increased from ${firstAreaHa} ha (${firstYearItem.buildings_count} structures) in ${firstYearItem.year} to ${latestAreaHa} ha (${latestYearItem.buildings_count} structures) in ${latestYearItem.year}. The largest single-year increase occurred between ${largestIncreasePeriod} (+${largestIncreasePercent}%).`;

  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6 border border-border/80 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

      {/* Dynamic Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
              ANALYZING SITE
            </span>
            <span className="h-1 w-1 rounded-full bg-primary/60" />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {aoi.location || "Nashik, Maharashtra"}
            </span>
          </div>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
            <span>{aoi.name}</span>
            <span className="text-muted-foreground font-normal text-base">— Construction History</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <History className="h-3.5 w-3.5" /> Multi-Year Satellite Analysis
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          /* Animated Skeleton Loading State */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6 py-4"
          >
            <div className="h-14 w-full rounded-2xl bg-foreground/[0.02] border border-border/40 animate-pulse" />
            <div className="h-64 w-full rounded-2xl bg-foreground/[0.02] border border-border/40 animate-pulse" />
            <div className="flex items-center justify-center py-4 text-center">
              <p className="font-mono text-xs text-primary animate-pulse flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing historical satellite construction data for {aoi.name}...
              </p>
            </div>
          </motion.div>
        ) : error ? (
          /* Error State UI */
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
            <h4 className="font-mono text-sm font-semibold text-rose-400 uppercase tracking-wider">
              Unable to load construction history
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              The historical satellite analysis could not be retrieved for {aoi.name}. Please retry.
            </p>
            <button
              type="button"
              onClick={() => setIsLoading(true)}
              className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/20 px-5 py-2.5 font-mono text-xs font-medium text-primary hover:bg-primary/30 transition-all shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            >
              <RefreshCw className="h-4 w-4" /> Retry Analysis
            </button>
          </motion.div>
        ) : (
          /* Main Construction History Content View */
          <motion.div
            key={`growth-${aoi.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            {/* Dynamic Year Selector Pills & Slider */}
            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> HISTORICAL SATELLITE TIMELINE
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  Selected Year: {activeYearData.year}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-1">
                {historyList.map((item, idx) => {
                  const isSelected = idx === safeIndex;
                  return (
                    <button
                      key={item.year}
                      type="button"
                      onClick={() => setSelectedYearIndex(idx)}
                      className={`flex flex-col items-center justify-center flex-1 min-w-[75px] py-2.5 px-3 rounded-xl border font-mono text-xs transition-all duration-300 ${
                        isSelected
                          ? "border-primary bg-primary/15 text-primary font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                          : "border-border/40 bg-foreground/[0.01] text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs">{item.year}</span>
                      <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                        {item.buildings_count} bldgs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Year Key Metrics Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* CARD 1: Structures Detected */}
              <div className="group rounded-2xl border border-border/60 bg-foreground/[0.02] p-4.5 transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Structures ({activeYearData.year})
                  </span>
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {activeYearData.buildings_count}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">structures</span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground font-light">
                  Detected building footprints via SAR/Optical sensors
                </p>
              </div>

              {/* CARD 2: Built-up Area */}
              <div className="group rounded-2xl border border-border/60 bg-foreground/[0.02] p-4.5 transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Built-up Area ({activeYearData.year})
                  </span>
                  <Layers className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-cyan-400">
                    {activeYearData.built_up_area_ha}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">hectares</span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground font-light">
                  Total footprint area (1 ha = 10,000 m²)
                </p>
              </div>

              {/* CARD 3: Year-over-Year Growth */}
              <div className="group rounded-2xl border border-border/60 bg-foreground/[0.02] p-4.5 transition-all hover:border-primary/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    YoY Change ({activeYearData.year})
                  </span>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-extrabold tracking-tight text-accent">
                    {activeYearData.built_up_change_percent > 0 ? "+" : ""}
                    {activeYearData.built_up_change_percent}%
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">vs previous</span>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground font-light">
                  Year-over-year built-up footprint velocity
                </p>
              </div>
            </div>

            {/* Time-Series Growth Area Chart */}
            <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-primary" /> CONSTRUCTION GROWTH TRAJECTORY
                  </span>
                  <p className="text-xs text-muted-foreground font-light mt-0.5">
                    Multi-year built-up footprint evolution (ha) for <strong className="text-foreground font-medium">{aoi.name}</strong>
                  </p>
                </div>
                <span className="font-mono text-[10px] rounded-lg border border-border/60 bg-foreground/[0.03] px-2.5 py-1 text-primary">
                  Period: {analysisPeriod}
                </span>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={historyList}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="year"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                      unit=" ha"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length && payload[0]?.payload) {
                          const data = payload[0].payload as YearHistoryItem;
                          return (
                            <div className="rounded-xl border border-primary/40 bg-slate-950/90 p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                              <span className="font-mono text-xs font-bold text-primary block border-b border-border/40 pb-1">
                                Year {data.year}
                              </span>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Built-up Area:</span>
                                <span className="font-mono font-bold text-foreground">
                                  {data.built_up_area_ha} ha
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Structures:</span>
                                <span className="font-mono font-bold text-foreground">
                                  {data.buildings_count}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">YoY Change:</span>
                                <span className="font-mono font-bold text-accent">
                                  +{data.built_up_change_percent}%
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="built_up_area_ha"
                      stroke="#38bdf8"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#growthGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Historical Growth Summary & Largest Increase */}
            <div className="grid gap-4 md:grid-cols-12">
              {/* HISTORICAL GROWTH SUMMARY CARD */}
              <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 md:col-span-6 flex flex-col justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                  HISTORICAL GROWTH SUMMARY
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Initial Area ({firstYearItem.year})
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground mt-0.5 block">
                      {firstAreaHa} ha
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Latest Area ({latestYearItem.year})
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-400 mt-0.5 block">
                      {latestAreaHa} ha
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Total Change
                    </span>
                    <span className="font-mono text-xs font-bold text-accent mt-0.5 block">
                      +{totalChangePercent}%
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-foreground/[0.02] p-2.5">
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                      Analysis Period
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground mt-0.5 block">
                      {analysisPeriod}
                    </span>
                  </div>
                </div>
              </div>

              {/* LARGEST RECORDED INCREASE CARD */}
              <div className="rounded-2xl border border-border/60 bg-foreground/[0.02] p-5 md:col-span-6 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                    <TrendingUp className="h-3.5 w-3.5 text-accent" /> LARGEST HISTORICAL INCREASE
                  </span>
                  <div className="flex items-baseline justify-between rounded-xl border border-accent/30 bg-accent/10 p-3">
                    <div>
                      <span className="font-mono text-[10px] text-muted-foreground uppercase block">
                        Peak Interval
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground mt-0.5 block">
                        {largestIncreasePeriod}
                      </span>
                    </div>
                    <span className="font-display text-2xl font-extrabold text-accent">
                      +{largestIncreasePercent}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-light mt-3">
                  Highest single-year construction expansion recorded in satellite dataset.
                </p>
              </div>
            </div>

            {/* Factual Historical Observation Box */}
            <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 shrink-0" /> HISTORICAL OBSERVATION
              </span>
              <p className="text-xs text-foreground/90 font-light leading-relaxed">
                "{factualObservation}"
              </p>
              <div className="mt-3 pt-2.5 border-t border-primary/20 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>Source: Sentinel-1 SAR & Sentinel-2 Optical Change Detection</span>
                <span className="text-primary flex items-center gap-1">
                  Historical Satellite Archive <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
