import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  TrendingUp,
  Trees,
  Droplets,
  Mountain,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Download,
  Share2,
  FileJson,
  Copy,
  Check,
} from "lucide-react";
import { AI_REPORT_SECTIONS } from "@/data/citizenMockData";
import type { AIReportSection } from "@/data/citizenMockData";
import type { LocationInfo } from "@/data/citizenMockData";

const ease = [0.16, 1, 0.3, 1] as const;

const SECTION_ICONS: Record<string, React.ElementType> = {
  BarChart3,
  TrendingUp,
  Trees,
  Droplets,
  Mountain,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
};

const SENTIMENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  positive: { bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.2)", text: "#34d399" },
  neutral: { bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  warning: { bg: "rgba(251,146,60,0.07)", border: "rgba(251,146,60,0.2)", text: "#fb923c" },
  critical: { bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)", text: "#f87171" },
};

// Typing animation hook
function useTyping(text: string, active: boolean, speed = 30): string {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, active, speed]);
  return displayed;
}

function ReportSectionCard({ section, index, visible }: { section: AIReportSection; index: number; visible: boolean }) {
  const Icon: any = SECTION_ICONS[section.icon] ?? BarChart3;
  const style = SENTIMENT_COLORS[section.sentiment] ?? SENTIMENT_COLORS['neutral']!;
  const lines = section.content.split("\n");

  const cardStyle: any = { background: style.bg, borderColor: style.border };
  const iconStyle: any = { background: `${style.text}18`, border: `1px solid ${style.text}28` };
  const badgeStyle: any = { background: `${style.text}15`, color: style.text, borderColor: `${style.text}30` };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease }}
      className="cs-report-section"
      style={cardStyle}
    >
      <div className="cs-report-sec-header">
        <div className="cs-report-sec-icon" style={iconStyle}>
          <Icon className="h-4 w-4" style={{ color: style.text }} />
        </div>
        <h3 className="cs-report-sec-title">{section.title}</h3>
        <span className="cs-report-sec-badge" style={badgeStyle}>
          {section.sentiment.charAt(0).toUpperCase() + section.sentiment.slice(1)}
        </span>
      </div>
      <div className="cs-report-sec-content">
        {lines.map((line, i) => (
          <p key={i} style={{ margin: "0 0 4px", fontSize: "0.875rem", color: "#94a3b8", lineHeight: 1.65 }}>
            {line}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

interface AIReportProps {
  location: LocationInfo;
}

export function AIReport({ location }: AIReportProps) {
  const [phase, setPhase] = useState<"idle" | "typing" | "loaded">("idle");
  const [sectionsVisible, setSectionsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting && phase === "idle") setPhase("typing");
    }, { threshold: 0.2 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [phase]);

  useEffect(() => {
    if (phase === "typing") {
      const t = setTimeout(() => {
        setPhase("loaded");
        setTimeout(() => setSectionsVisible(true), 200);
      }, 2400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  const typingText = useTyping("Analysing selected location — gathering satellite data, running AI classification, computing risk indices…", phase === "typing", 28);

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_REPORT_SECTIONS.map((s) => `## ${s.title}\n${s.content}`).join("\n\n")).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.section
      ref={sectionRef}
      className="cs-air-section"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease }}
    >
      {/* Header */}
      <div className="cs-air-header">
        <div>
          <p className="cs-air-eyebrow">
            <Sparkles className="h-3 w-3 inline mr-1 -mt-0.5" />
            Powered by UrbanCore AI
          </p>
          <h2 className="cs-air-title">AI Location Report</h2>
          <p className="cs-air-subtitle">
            Generated for <span className="text-cyan-400">{location.village}</span> · {location.lat.toFixed(4)}°N {location.lng.toFixed(4)}°E
          </p>
        </div>

        {/* Action buttons */}
        <div className="cs-air-actions">
          <button type="button" id="download-pdf-btn" className="cs-air-action-btn">
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
          <button type="button" id="export-json-btn" className="cs-air-action-btn">
            <FileJson className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
          <button type="button" id="copy-report-btn" className="cs-air-action-btn" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
          <button type="button" id="share-report-btn" className="cs-air-action-btn">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Report card */}
      <div className="cs-air-card">
        {/* Card header */}
        <div className="cs-air-card-header">
          <div className="flex items-center gap-3">
            <div className="cs-air-logo">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="cs-air-card-title">UrbanCore AI Report</p>
              <p className="cs-air-card-sub">Automated · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="cs-air-status-dot">
            <span className="cs-air-status-pulse" />
            AI Generated
          </div>
        </div>

        {/* Typing animation / content */}
        <div className="cs-air-body">
          {phase === "typing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cs-air-typing">
              <div className="cs-air-typing-icon">
                <motion.div
                  className="cs-air-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                />
              </div>
              <p className="cs-air-typing-text">
                {typingText}
                <motion.span
                  className="cs-air-cursor"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >|</motion.span>
              </p>
            </motion.div>
          )}

          {(phase === "loaded") && (
            <AnimatePresence>
              <div className="cs-report-sections">
                {AI_REPORT_SECTIONS.map((s, i) => (
                  <ReportSectionCard key={s.id} section={s} index={i} visible={sectionsVisible} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <style>{`
        .cs-air-section { width: 100%; max-width: 1280px; margin: 0 auto; padding: 0 24px 52px; }
        .cs-air-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
        .cs-air-eyebrow { font-family: var(--font-mono,monospace); font-size: 0.65rem; letter-spacing: 0.15em; text-transform: uppercase; color: #818cf8; margin: 0 0 4px; }
        .cs-air-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 1.75rem; font-weight: 700; color: #f1f5f9; margin: 0 0 4px; }
        .cs-air-subtitle { font-size: 0.875rem; color: #64748b; margin: 0; }
        .cs-air-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .cs-air-action-btn {
          display: flex; align-items: center; gap: 6px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
          border-radius: 10px; padding: 7px 14px;
          font-size: 0.8125rem; cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .cs-air-action-btn:hover { border-color: rgba(34,211,238,0.25); color: #e2e8f0; background: rgba(34,211,238,0.05); }

        /* Card */
        .cs-air-card {
          background: rgba(13,20,40,0.78);
          border: 1px solid rgba(34,211,238,0.12);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(24px);
          box-shadow: 0 4px 40px rgba(0,0,0,0.4);
        }
        .cs-air-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          flex-wrap: wrap; gap: 10px;
        }
        .cs-air-logo {
          width: 36px; height: 36px;
          background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.2);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
        }
        .cs-air-card-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 0.9375rem; font-weight: 600; color: #f1f5f9; margin: 0; }
        .cs-air-card-sub { font-size: 0.75rem; color: #475569; margin: 2px 0 0; }
        .cs-air-status-dot {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.75rem; color: #818cf8;
          background: rgba(129,140,248,0.08);
          border: 1px solid rgba(129,140,248,0.2);
          border-radius: 999px; padding: 5px 12px;
        }
        .cs-air-status-pulse {
          width: 6px; height: 6px; border-radius: 50%;
          background: #818cf8; animation: cs-pulse 1.5s ease-in-out infinite;
        }
        @keyframes cs-pulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        .cs-air-body { padding: 24px 22px; min-height: 120px; }

        /* Typing */
        .cs-air-typing { display: flex; gap: 14px; align-items: flex-start; }
        .cs-air-typing-icon { flex-shrink: 0; padding-top: 2px; }
        .cs-air-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(129,140,248,0.3);
          border-top-color: #818cf8;
        }
        .cs-air-typing-text { font-size: 0.9375rem; color: #64748b; line-height: 1.7; }
        .cs-air-cursor { color: #818cf8; font-weight: 300; }

        /* Report sections */
        .cs-report-sections { display: flex; flex-direction: column; gap: 12px; }
        .cs-report-section { border: 1px solid; border-radius: 14px; padding: 16px; }
        .cs-report-sec-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
        .cs-report-sec-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cs-report-sec-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 0.9375rem; font-weight: 600; color: #f1f5f9; flex: 1; margin: 0; }
        .cs-report-sec-badge { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; border: 1px solid; flex-shrink: 0; }
        .cs-report-sec-content { display: flex; flex-direction: column; gap: 2px; }
        @media (max-width: 640px) { .cs-air-section { padding: 0 16px 36px; } .cs-air-actions { gap: 6px; } .cs-air-action-btn span { display: none; } }
      `}</style>
    </motion.section>
  );
}
