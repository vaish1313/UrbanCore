import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/urbancore/Navbar";
import { Footer } from "@/components/urbancore/Footer";
import { NashikBackgroundCarousel } from "@/components/urbancore/NashikBackgroundCarousel";
import { UrbanTimeline } from "@/components/urbancore/UrbanTimeline";
import { Sparkles, ArrowRight, TrendingUp, TreePine, Shield, AlertTriangle, Brain, MapPin } from "lucide-react";
import { NashikLiveMap } from "@/components/urbancore/NashikLiveMap";
import type { RoleType } from "@/types/urbancore";

export const Route = createFileRoute("/data")({
  component: DataInsightsPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Static mock analytics data ─────────────────────────────────────── */

const CONSTRUCTION_TREND = [
  { year: "2021", value: 18 },
  { year: "2022", value: 26 },
  { year: "2023", value: 38 },
  { year: "2024", value: 52 },
  { year: "2025", value: 68 },
];

const VEGETATION_BARS = [
  { year: "2021", pct: 62 },
  { year: "2022", pct: 58 },
  { year: "2023", pct: 54 },
  { year: "2024", pct: 50 },
  { year: "2025", pct: 46 },
];

const ENCROACHMENT_DIST = [
  { label: "High Risk",   pct: 28, color: "#ef4444" },
  { label: "Medium Risk", pct: 45, color: "#f59e0b" },
  { label: "Low Risk",    pct: 27, color: "#22c55e" },
];

const TOP_AOIS = [
  { rank: 1, name: "Panchavati",      pct: "+36.6 %", status: "red"    },
  { rank: 2, name: "Gangapur Road",   pct: "+27.4 %", status: "yellow" },
  { rank: 3, name: "Satpur MIDC",     pct: "+20.0 %", status: "yellow" },
  { rank: 4, name: "Ambad MIDC",      pct: "+14.2 %", status: "green"  },
  { rank: 5, name: "CIDCO",           pct: "+8.3 %",  status: "green"  },
];

const STATUS_COLOR: Record<string, string> = {
  red: "#ef4444", yellow: "#f59e0b", green: "#22c55e",
};

const TIMELINE_STEPS = [
  { year: "2021", label: "Baseline",         bars: 2, color: "#22d3ee" },
  { year: "2022", label: "+8.4%",            bars: 3, color: "#38bdf8" },
  { year: "2023", label: "+17.6%",           bars: 4, color: "#f59e0b" },
  { year: "2024", label: "+27.4%",           bars: 5, color: "#fb923c" },
  { year: "2025", label: "+36.6%",           bars: 6, color: "#ef4444" },
];

/* ─── Tiny SVG line chart ─────────────────────────────────────────────── */
function MiniLineChart({ data, color = "#22d3ee", height = 48 }: {
  data: { value: number }[];
  color?: string;
  height?: number;
}) {
  const W = 120; const H = height;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(" ") + ` L${W},${H} L0,${H} Z`;
  const line = `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg-area)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* last point dot */}
      <circle cx={pts[pts.length - 1]!.split(",")[0]} cy={pts[pts.length - 1]!.split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

/* ─── Donut gauge ─────────────────────────────────────────────────────── */
function DonutGauge({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const R = size * 0.38; const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.1} />
      <circle cx={size/2} cy={size/2} r={R} fill="none" stroke={color} strokeWidth={size*0.1}
        strokeDasharray={`${dash} ${C}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
    </svg>
  );
}

/* ─── Animated counter ────────────────────────────────────────────────── */
function AnimCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      obs.disconnect();
      let start: number | null = null;
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1200, 1);
        setVal(Math.round(p * to));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Card wrapper ────────────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: "rgba(10,16,34,0.72)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.05)",
  padding: "22px 24px",
};

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(34,211,238,0.22), inset 0 1px 0 rgba(255,255,255,0.07)" }}
      transition={{ duration: 0.25 }}
      className={className}
      style={{ ...CARD, ...style }}
    >
      {children}
    </motion.div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#475569", marginBottom: 6 }}>
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */

function DataInsightsPage() {
  const [activeRole, setActiveRole] = useState<RoleType>(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      <NashikBackgroundCarousel />
      <Navbar entered={true} activeRole={activeRole} onLoginClick={() => {}} />

      {/* ── HERO SECTION (unchanged) ────────────────────────────────── */}
      <section className="relative w-full min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease }}>
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-cyan-400 mb-6">Data & Insights</p>
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white mb-6 leading-[1.1]">
              Watch the urban footprint <br className="hidden sm:block" /> evolve.
            </h1>
            <p className="max-w-2xl mx-auto text-[14px] sm:text-[15px] font-light leading-relaxed text-slate-300 mb-10">
              Explore multi-temporal satellite observations to understand where and how built-up areas change.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 1 (unchanged) ───────────────────────────────────── */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">Five years. One landscape.</h2>
          <p className="text-slate-400 font-light text-sm max-w-xl mx-auto">
            Only a small fraction of Nashik's landscape changes each year. The timeline below captures exactly where and how.
          </p>
        </div>
        <div className="w-full max-w-5xl mx-auto px-6 sm:px-10">
          <UrbanTimeline />
        </div>
      </section>

      {/* ══ SECTION 2 — URBAN ANALYTICS DASHBOARD (replaces map) ═══════ */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">

          {/* section header */}
          <div className="text-center mb-16">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-400 mb-4">Urban Analytics · Nashik 2021–2025</p>
            <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-4">Built-up change, made visible.</h2>
            <p className="text-slate-400 font-light text-sm max-w-xl mx-auto">
              AI-powered geospatial analysis across 30 monitored areas in Nashik district.
            </p>
          </div>

          {/* ── ROW 1: 3 KPI cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">

            {/* Construction Growth */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                  </span>
                  <CardLabel>Construction Growth</CardLabel>
                </div>
                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.65rem", padding:"2px 8px", borderRadius:999, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.28)", color:"#f87171" }}>
                  ↑ High
                </span>
              </div>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"2.2rem", fontWeight:700, color:"#f1f5f9", lineHeight:1, marginBottom:4 }}>
                <AnimCounter to={36} suffix="%" />
              </div>
              <p style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.72rem", color:"#64748b", marginBottom:12 }}>
                Built-up expansion 2021–2025
              </p>
              <MiniLineChart data={CONSTRUCTION_TREND} color="#22d3ee" height={48} />
              <div className="flex justify-between mt-1" style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", color:"#334155" }}>
                {CONSTRUCTION_TREND.map((d) => <span key={d.year}>{d.year}</span>)}
              </div>
            </Card>

            {/* Vegetation Change */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                  <TreePine className="h-4 w-4 text-green-400" />
                </span>
                <CardLabel>Vegetation Cover</CardLabel>
              </div>
              <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"2.2rem", fontWeight:700, color:"#f1f5f9", lineHeight:1, marginBottom:4 }}>
                <AnimCounter to={46} suffix="%" />
              </div>
              <p style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.72rem", color:"#64748b", marginBottom:14 }}>
                Green cover 2025 &nbsp;
                <span style={{ color:"#f87171", fontWeight:600 }}>−16 pp from 2021</span>
              </p>
              {/* bar chart */}
              <div className="flex items-end gap-1.5" style={{ height:44 }}>
                {VEGETATION_BARS.map((b) => (
                  <div key={b.year} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(b.pct / 70) * 40}px` }}
                      transition={{ duration: 0.8, delay: 0.1 * VEGETATION_BARS.indexOf(b), ease: [0.16,1,0.3,1] }}
                      viewport={{ once: true }}
                      style={{ background: `rgba(34,197,94,${0.25 + (b.pct/62)*0.4})`, borderRadius:4, width:"100%" }}
                    />
                    <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.55rem", color:"#334155" }}>{b.year}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Confidence */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                  <Brain className="h-4 w-4 text-violet-400" />
                </span>
                <CardLabel>Model Confidence</CardLabel>
              </div>
              <div className="flex items-center gap-5 mt-2">
                <div className="relative flex-shrink-0">
                  <DonutGauge pct={96} color="#a78bfa" size={88} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"1.3rem", fontWeight:700, color:"#f1f5f9", lineHeight:1 }}>
                      <AnimCounter to={96} suffix="%" />
                    </span>
                  </div>
                </div>
                <div>
                  <p style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.82rem", fontWeight:600, color:"#f1f5f9", marginBottom:6 }}>
                    ResNet-UNet V1
                  </p>
                  {[
                    { label: "Precision", val: "94.2 %" },
                    { label: "Recall",    val: "97.1 %" },
                    { label: "F1 Score",  val: "95.6 %" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between gap-6 mb-1">
                      <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.68rem", color:"#475569" }}>{label}</span>
                      <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", color:"#a78bfa", fontWeight:600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ── ROW 2: 2 wide cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

            {/* Protected Zone Monitoring */}
            <Card>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Shield className="h-4 w-4 text-blue-400" />
                  </span>
                  <CardLabel>Protected Zone Monitoring</CardLabel>
                </div>
                <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.6rem", padding:"2px 8px", borderRadius:999, background:"rgba(59,130,246,0.10)", border:"1px solid rgba(59,130,246,0.25)", color:"#60a5fa" }}>
                  12 Zones Active
                </span>
              </div>
              <div className="flex items-center gap-8">
                <div className="relative flex-shrink-0">
                  <DonutGauge pct={74} color="#3b82f6" size={100} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"1.4rem", fontWeight:700, color:"#f1f5f9", lineHeight:1 }}>
                      <AnimCounter to={74} suffix="%" />
                    </span>
                    <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.52rem", color:"#475569", letterSpacing:"0.1em" }}>MONITORED</span>
                  </div>
                </div>
                <div className="flex-1">
                  {[
                    { label: "River Buffers",     pct: 88, color: "#3b82f6" },
                    { label: "Forest Reserves",   pct: 65, color: "#22c55e" },
                    { label: "Eco-sensitive",      pct: 72, color: "#f59e0b" },
                    { label: "Heritage Zones",    pct: 58, color: "#a78bfa" },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.7rem", color:"#94a3b8" }}>{label}</span>
                        <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.68rem", color, fontWeight:600 }}>{pct}%</span>
                      </div>
                      <div style={{ height:4, borderRadius:999, background:"rgba(255,255,255,0.05)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, ease:[0.16,1,0.3,1] }}
                          viewport={{ once: true }}
                          style={{ height:"100%", borderRadius:999, background:color, boxShadow:`0 0 8px ${color}60` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Encroachment Risk Distribution */}
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </span>
                <CardLabel>Encroachment Risk Distribution</CardLabel>
              </div>
              <div className="flex flex-col gap-4">
                {ENCROACHMENT_DIST.map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ width:8, height:8, borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}`, display:"inline-block" }} />
                        <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.78rem", color:"#cbd5e1", fontWeight:500 }}>{label}</span>
                      </div>
                      <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.75rem", color, fontWeight:700 }}>{pct}%</span>
                    </div>
                    <div style={{ height:8, borderRadius:999, background:"rgba(255,255,255,0.05)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease:[0.16,1,0.3,1] }}
                        viewport={{ once: true }}
                        style={{ height:"100%", borderRadius:999, background:`linear-gradient(90deg,${color}99,${color})`, boxShadow:`0 0 10px ${color}50` }}
                      />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:8, padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex justify-between">
                    {[
                      { label:"Total Alerts",  val:"47",  color:"#f87171" },
                      { label:"Reviewed",      val:"31",  color:"#34d399" },
                      { label:"Pending",       val:"16",  color:"#fbbf24" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="text-center">
                        <div style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"1.4rem", fontWeight:700, color, lineHeight:1, marginBottom:3 }}>
                          <AnimCounter to={Number(val)} />
                        </div>
                        <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.58rem", color:"#475569", textTransform:"uppercase", letterSpacing:"0.12em" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ── ROW 3: Timeline + Top AOIs ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Construction Timeline */}
            <Card>
              <CardLabel>Construction Timeline · Gangapur Road AOI</CardLabel>
              <p style={{ fontFamily:"var(--font-display,'Sora',sans-serif)", fontSize:"0.9rem", fontWeight:600, color:"#f1f5f9", marginBottom:20 }}>
                Year-on-year built-up growth
              </p>
              <div className="flex flex-col gap-3">
                {TIMELINE_STEPS.map((step, i) => (
                  <div key={step.year} className="flex items-center gap-4">
                    {/* year node */}
                    <div style={{ width:44, flexShrink:0, textAlign:"center" }}>
                      <div style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.72rem", fontWeight:700, color:step.color }}>{step.year}</div>
                    </div>
                    {/* connector */}
                    <div style={{ width:1, height:step.year === "2025" ? 0 : 0, background:"rgba(255,255,255,0.08)" }} />
                    {/* bars */}
                    <div className="flex gap-1 items-end flex-1">
                      {Array.from({ length: step.bars }).map((_, j) => (
                        <motion.div key={j}
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          transition={{ duration: 0.4, delay: i * 0.08 + j * 0.04, ease:[0.16,1,0.3,1] }}
                          viewport={{ once: true }}
                          style={{ width:14, height: 10 + j * 4, background: step.color, borderRadius:3, opacity: 0.75 + j * 0.05, transformOrigin:"bottom", boxShadow:`0 0 6px ${step.color}60` }}
                        />
                      ))}
                    </div>
                    {/* label */}
                    <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.65rem", color:"#64748b", marginLeft:"auto", whiteSpace:"nowrap" }}>
                      {step.label}
                    </span>
                    {/* arrow connector */}
                    {i < TIMELINE_STEPS.length - 1 && (
                      <span style={{ color:"rgba(255,255,255,0.15)", fontSize:"0.7rem", marginLeft:4 }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Changing AOIs */}
            <Card>
              <div className="flex items-center gap-2 mb-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <MapPin className="h-4 w-4 text-orange-400" />
                </span>
                <CardLabel>Top Changing AOIs · 2021–2025</CardLabel>
              </div>
              <div className="flex flex-col gap-1">
                {TOP_AOIS.map((aoi, i) => (
                  <motion.div key={aoi.name}
                    initial={{ opacity:0, x:12 }}
                    whileInView={{ opacity:1, x:0 }}
                    transition={{ duration:0.35, delay:i*0.07, ease:[0.16,1,0.3,1] }}
                    viewport={{ once:true }}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:12, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", marginBottom:2 }}
                  >
                    {/* rank */}
                    <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.7rem", color:"#334155", width:16, flexShrink:0 }}>
                      {aoi.rank}
                    </span>
                    {/* status dot */}
                    <span style={{ width:8, height:8, borderRadius:"50%", background:STATUS_COLOR[aoi.status], boxShadow:`0 0 8px ${STATUS_COLOR[aoi.status]}`, flexShrink:0 }} />
                    {/* name */}
                    <span style={{ fontFamily:"var(--font-sans,'Manrope',sans-serif)", fontSize:"0.82rem", color:"#cbd5e1", fontWeight:500, flex:1 }}>
                      {aoi.name}
                    </span>
                    {/* pct */}
                    <span style={{ fontFamily:"var(--font-mono,'JetBrains Mono',monospace)", fontSize:"0.72rem", color:STATUS_COLOR[aoi.status], fontWeight:700 }}>
                      {aoi.pct}
                    </span>
                    {/* mini bar */}
                    <div style={{ width:52, height:4, borderRadius:999, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                      <motion.div
                        initial={{ width:0 }}
                        whileInView={{ width:`${Math.abs(parseFloat(aoi.pct))}%` }}
                        transition={{ duration:0.7, delay:i*0.08, ease:[0.16,1,0.3,1] }}
                        viewport={{ once:true }}
                        style={{ height:"100%", borderRadius:999, background:STATUS_COLOR[aoi.status], boxShadow:`0 0 6px ${STATUS_COLOR[aoi.status]}60` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — EXPLORE AN AREA (restored) ────────────────── */}
      <section className="relative z-10 py-24 sm:py-32 w-full bg-black/30 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col items-center">
          <h2 className="font-display text-3xl sm:text-4xl font-light text-white mb-12 text-center">
            Explore an area.
          </h2>
          <NashikLiveMap />
        </div>
      </section>

      {/* ── ASK THE CITY (unchanged) ────────────────────────────────── */}
      <section className="relative z-10 py-32 sm:py-48 flex flex-col items-center text-center px-6 border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <h2 className="font-display text-4xl sm:text-5xl font-light text-white mb-12">Ask the city.</h2>
        <div className="w-full max-w-3xl mx-auto mb-16">
          <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center w-full h-16 sm:h-20 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-6 sm:px-8 shadow-2xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mr-4" />
              <div className="flex-1 overflow-hidden h-full flex items-center">
                <motion.div
                  animate={{ y: ["0%", "-33.33%", "-66.66%", "0%"] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "circInOut" }}
                  className="flex flex-col w-full text-left"
                >
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">"Show built-up growth near Panchavati from 2021 to 2025."</span>
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">"How did this area change between 2022 and 2025?"</span>
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">"Where did built-up land expand?"</span>
                  <span className="h-16 sm:h-20 flex items-center text-sm sm:text-lg text-slate-300 font-light truncate">"Show built-up growth near Panchavati from 2021 to 2025."</span>
                </motion.div>
              </div>
              <button className="hidden sm:flex ml-4 p-3 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors">
                <ArrowRight className="w-5 h-5 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>
        <button className="text-[13px] font-bold uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 px-10 py-4 rounded-full transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
          Launch UrbanCore ↗
        </button>
      </section>

      <Footer />
    </div>
  );
}
