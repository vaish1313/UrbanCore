import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Trees,
  Building2,
  Droplets,
  Mountain,
  ArrowUpFromLine,
  Route,
  HardHat,
  Leaf,
  Info,
} from "lucide-react";
import { PROPERTY_METRICS, OVERALL_SCORE } from "@/data/citizenMockData";
import type { PropertyMetric } from "@/data/citizenMockData";
import type { LocationInfo } from "@/data/citizenMockData";

const ease = [0.16, 1, 0.3, 1] as const;

const ICON_MAP: Record<string, React.ElementType> = {
  Trees,
  Building2,
  Droplets,
  Mountain,
  ArrowUpFromLine,
  Route,
  HardHat,
  Leaf,
};

interface PropertyAnalysisProps {
  location: LocationInfo;
}

// Animated counter hook
function useCounter(target: number, duration = 1200, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.round(start));
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return value;
}

// SVG Progress ring
function ProgressRing({
  value,
  max,
  color,
  size = 48,
  strokeWidth = 4,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setProgress(pct), 200);
    return () => clearTimeout(t);
  }, [pct]);

  const circleStyle: React.CSSProperties = {
    transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)",
  };

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" } as React.CSSProperties}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={circ - progress * circ}
        strokeLinecap="round"
        style={circleStyle}
      />
    </svg>
  );
}

// Large circular gauge for the overall score
function ScoreGauge({ score }: { score: number }) {
  const size = 160;
  const strokeWidth = 12;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const [progress, setProgress] = useState(0);
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !animated) {
        setAnimated(true);
        setProgress(score / 100);
      }
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [score, animated]);

  const displayScore = useCounter(score, 1400, animated);

  return (
    <div ref={ref} className="cs-gauge-wrapper">
      <div className="cs-gauge-container">
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circ}
            strokeDashoffset={circ - progress * circ}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)" }}
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="cs-gauge-center">
          <span className="cs-gauge-score">{displayScore}</span>
          <span className="cs-gauge-denom">/100</span>
        </div>
      </div>
      <div className="cs-gauge-label">
        <p className="cs-gauge-title">Location Intelligence Score</p>
        <p className="cs-gauge-sub">Analysed by UrbanCore AI · Sep 2026</p>
      </div>

      <style>{`
        .cs-gauge-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 24px 0;
        }
        .cs-gauge-container {
          position: relative;
          width: 160px; height: 160px;
        }
        .cs-gauge-center {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column;
        }
        .cs-gauge-score {
          font-family: var(--font-display,"Sora",sans-serif);
          font-size: 2.6rem; font-weight: 700;
          background: linear-gradient(90deg,#22d3ee,#818cf8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          line-height: 1;
        }
        .cs-gauge-denom { font-size: 0.875rem; color: #475569; font-weight: 500; margin-top: 2px; }
        .cs-gauge-label { text-align: center; }
        .cs-gauge-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 1rem; font-weight: 600; color: #f1f5f9; margin: 0; }
        .cs-gauge-sub { font-size: 0.75rem; color: #475569; margin: 4px 0 0; }
      `}</style>
    </div>
  );
}

// Single metric card
function MetricCard({ metric, index }: { metric: PropertyMetric; index: number }) {
  const Icon: any = ICON_MAP[metric.icon] ?? Leaf;
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const displayVal = useCounter(metric.value, 1000, visible);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e?.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const statusColors: Record<string, string> = {
    good: "#34d399",
    moderate: "#fbbf24",
    poor: "#f87171",
  };

  return (
    <motion.div
      ref={ref}
      className="cs-metric-card"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: index * 0.07, ease }}
      whileHover={{ y: -3, scale: 1.015 }}
    >
      {/* Top row */}
      <div className="cs-metric-top">
        <div className="cs-metric-icon" style={{ background: `${metric.color}15`, border: `1px solid ${metric.color}30` }}>
          <Icon className="h-4 w-4" style={{ color: metric.color }} />
        </div>
        <ProgressRing value={visible ? metric.value : 0} max={metric.max} color={metric.color} />
      </div>

      {/* Value */}
      <div className="cs-metric-value">
        <span className="cs-metric-number">{metric.displayValue.startsWith("+") ? metric.displayValue : displayVal}</span>
        <span className="cs-metric-unit">{metric.unit}</span>
      </div>

      {/* Label */}
      <p className="cs-metric-label">{metric.label}</p>

      {/* Status badge */}
      <div className="cs-metric-status" style={{ background: `${statusColors[metric.status]}14`, color: statusColors[metric.status], border: `1px solid ${statusColors[metric.status]}30` }}>
        {metric.statusLabel}
      </div>

      {/* Tooltip */}
      <div className="cs-metric-tooltip">
        <Info className="h-3 w-3" />
        <span className="cs-tooltip-text">{metric.tooltip}</span>
      </div>

      <style>{`
        .cs-metric-card {
          background: rgba(13,20,40,0.72);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 16px;
          display: flex; flex-direction: column; gap: 8px;
          cursor: default;
          transition: border-color 0.2s, box-shadow 0.2s;
          position: relative;
        }
        .cs-metric-card:hover { border-color: rgba(34,211,238,0.18); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .cs-metric-top { display: flex; align-items: center; justify-content: space-between; }
        .cs-metric-icon {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          border-radius: 10px;
        }
        .cs-metric-value { display: flex; align-items: baseline; gap: 2px; }
        .cs-metric-number { font-family: var(--font-display,"Sora",sans-serif); font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
        .cs-metric-unit { font-size: 0.75rem; color: #64748b; }
        .cs-metric-label { font-size: 0.8rem; color: #94a3b8; margin: 0; }
        .cs-metric-status {
          display: inline-block;
          font-size: 0.625rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 999px;
          width: fit-content;
        }
        .cs-metric-tooltip {
          position: absolute; top: 10px; right: 10px;
          color: #334155; cursor: help;
        }
        .cs-metric-tooltip:hover .cs-tooltip-text { display: block; }
        .cs-tooltip-text {
          display: none;
          position: absolute; right: 0; top: 20px; z-index: 20;
          background: rgba(6,9,20,0.96); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px; padding: 8px 12px;
          font-size: 0.7rem; color: #94a3b8;
          width: 180px; line-height: 1.5;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          white-space: normal;
        }
      `}</style>
    </motion.div>
  );
}

export function PropertyAnalysis({ location }: PropertyAnalysisProps) {
  return (
    <motion.section
      className="cs-analysis-section"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease }}
    >
      {/* Section header */}
      <div className="cs-analysis-header">
        <div>
          <p className="cs-analysis-eyebrow">AI Powered</p>
          <h2 className="cs-analysis-title">Location Analysis</h2>
          <p className="cs-analysis-subtitle">
            Satellite-derived intelligence for{" "}
            <span className="text-cyan-400">{location.village}</span>
          </p>
        </div>
        <div className="cs-analysis-tag">
          <span>Live Analysis</span>
          <span className="cs-analysis-tag-dot" />
        </div>
      </div>

      {/* Metric grid */}
      <div className="cs-metrics-grid">
        {PROPERTY_METRICS.map((m, i) => (
          <MetricCard key={m.id} metric={m} index={i} />
        ))}
      </div>

      {/* Score gauge */}
      <div className="cs-gauge-card">
        <ScoreGauge score={OVERALL_SCORE} />
      </div>

      <style>{`
        .cs-analysis-section {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px 52px;
        }
        .cs-analysis-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          margin-bottom: 24px;
        }
        .cs-analysis-eyebrow {
          font-family: var(--font-mono,monospace);
          font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: #22d3ee; margin: 0 0 4px;
        }
        .cs-analysis-title {
          font-family: var(--font-display,"Sora",sans-serif);
          font-size: 1.75rem; font-weight: 700; color: #f1f5f9;
          margin: 0 0 4px;
        }
        .cs-analysis-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
        .cs-analysis-tag {
          display: flex; align-items: center; gap: 8px;
          background: rgba(34,211,238,0.07);
          border: 1px solid rgba(34,211,238,0.2);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.75rem; color: #67e8f9;
          font-weight: 500;
        }
        .cs-analysis-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #22d3ee;
          animation: cs-pulse 1.8s ease-in-out infinite;
        }
        @keyframes cs-pulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        .cs-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 1024px) { .cs-metrics-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px) { .cs-metrics-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px) { .cs-metrics-grid { grid-template-columns: 1fr; } }
        .cs-gauge-card {
          background: rgba(13,20,40,0.72);
          border: 1px solid rgba(34,211,238,0.12);
          border-radius: 20px;
          margin-top: 20px;
          display: flex; justify-content: center;
          padding: 32px;
          backdrop-filter: blur(24px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.3);
        }
        @media (max-width: 640px) { .cs-analysis-section { padding: 0 16px 36px; } }
      `}</style>
    </motion.section>
  );
}
