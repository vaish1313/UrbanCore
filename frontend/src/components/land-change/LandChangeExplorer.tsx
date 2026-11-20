import { useEffect, useState } from "react";
import { useLandChangeAnalysis } from "@/hooks/useLandChangeAnalysis";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { LandChangeScene } from "@/scene/LandChangeScene";
import { useLandChangeStore } from "@/store/landChangeStore";
import { ControlChips } from "./ControlChips";
import { ExplorerHeader } from "./ExplorerHeader";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  ScanningOverlay,
} from "./ExplorerStates";
import { Legend } from "./Legend";
import { StatsStrip } from "./StatsStrip";
import { TimelineBar } from "./TimelineBar";
import { ChangeDetailPanel } from "./ChangeDetailPanel";

interface Props {
  analysisId?: string | null;
  locationLabel?: string;
  scanCoords?: { latitude: number; longitude: number; radius_m?: number } | null;
  onReportConcern?: () => void;
  showChangeDetail?: boolean;
}

export function LandChangeExplorer({
  analysisId,
  locationLabel,
  scanCoords,
  onReportConcern,
  showChangeDetail = true,
}: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const viewMode = useLandChangeStore((s) => s.viewMode);
  const autoRotate = useLandChangeStore((s) => s.autoRotate);
  const changesOnly = useLandChangeStore((s) => s.changesOnly);
  const { setSelectedCellId, setHoveredCellId } = useLandChangeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const {
    currentGrid,
    grids,
    phase,
    error,
    scanning,
    stats,
    locationLabel: label,
    scan,
    retry,
    record,
  } = useLandChangeAnalysis({
    analysisId: analysisId ?? null,
    locationLabel,
    scanCoords: scanCoords ?? null,
  });

  const startYear = grids[0]?.year ?? 0;
  const showStage =
    phase === "ready" && currentGrid != null
      ? "ready"
      : phase === "scanning"
        ? "scanning"
        : phase === "loading"
          ? "loading"
          : phase === "error"
            ? "error"
            : phase === "empty" || phase === "idle"
              ? "empty"
              : "loading";

  return (
    <>
      {/* ── Scoped styles for the explorer card ── */}
      <style>{`
        @keyframes lce-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lce-card {
          animation: lce-fadein 300ms ease both;
        }
        /* Slider thumb: cyan accent */
        .lce-timeline-range::-webkit-slider-thumb { accent-color: #38bdf8; }
        .lce-timeline-range::-moz-range-thumb { background: #38bdf8; }

        /* Chip hover glow */
        .lce-chip:not([aria-pressed="true"]):hover {
          border-color: rgba(56,189,248,0.35) !important;
          background: rgba(56,189,248,0.08) !important;
          box-shadow: 0 0 0 1px rgba(56,189,248,0.15);
          transition: background 200ms, border-color 200ms, box-shadow 200ms;
        }

        /* ── Glass card pseudo-element highlight ── */
        .lce-glass-card {
          position: relative;
        }
        .lce-glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at 0% 0%, rgba(56,189,248,0.14), transparent 45%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── Inner panel glass hover ── */
        .lce-inner-panel {
          transition: background 200ms, border-color 200ms;
        }
        .lce-inner-panel:hover {
          background: rgba(255,255,255,0.07) !important;
          border-color: rgba(56,189,248,0.35) !important;
        }

        /* ── Backdrop-filter fallback for browsers without support ── */
        @supports not (backdrop-filter: blur(1px)) {
          .lce-glass-card-bg { background: rgba(8,21,37,0.92) !important; }
          .lce-inner-panel   { background: rgba(8,21,37,0.80) !important; }
          .lce-timeline-bg   { background: rgba(4,10,20,0.95) !important; }
        }
      `}</style>

      <section
        className="lce-card mx-auto mb-16 px-4"
        style={{
          width: "94vw",
          maxWidth: "1400px",
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: "24px",
        }}
      >
        {/* ── Main card ── */}
        <div
          className="lce-glass-card relative overflow-hidden"
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.14)",
            borderTop: "1px solid rgba(255,255,255,0.22)",
            borderLeft: "1px solid rgba(255,255,255,0.22)",
            background: [
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(56,189,248,0.05) 100%)",
              "rgba(8,21,37,0.45)",
            ].join(", "),
            backdropFilter: "blur(22px) saturate(160%)",
            WebkitBackdropFilter: "blur(22px) saturate(160%)",
            boxShadow:
              "0 25px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 50px rgba(56,189,248,0.07)",
            padding: "28px 32px",
          }}
        >
          {/* Ambient glow blob */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-96px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "66%",
              height: "192px",
              borderRadius: "9999px",
              background: "rgba(14,165,233,0.09)",
              filter: "blur(90px)",
              pointerEvents: "none",
            }}
          />

          <div className="relative z-10 flex flex-col gap-6">
            <ExplorerHeader
              locationLabel={label}
              scanning={scanning || phase === "scanning"}
              disabled={scanning || phase === "scanning"}
              onScan={scan}
            />

            {showStage === "loading" && <LoadingSkeleton />}
            {showStage === "scanning" && <ScanningOverlay />}

            {showStage === "empty" && (
              <>
                <EmptyState />
                <p className="text-center text-xs text-slate-500">
                  Use Scan to run the real backend analysis for this pin.
                </p>
              </>
            )}

            {showStage === "error" && (
              <ErrorState message={error || "Backend unavailable"} onRetry={retry} />
            )}

            {showStage === "ready" && currentGrid && (
              /* ── Two-column layout ── */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.15fr 0.85fr",
                  gap: "28px",
                  alignItems: "start",
                }}
                className="lce-two-col"
              >
                {/* ── LEFT: 3D view + controls + stats ── */}
                <div className="flex flex-col gap-4 min-w-0">
                  {/* 3D canvas */}
                  <div
                    style={{
                      minHeight: "460px",
                      aspectRatio: "16/10",
                      borderRadius: "18px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(4,10,20,0.55)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      overflow: "hidden",
                    }}
                  >
                    {mounted ? (
                      <LandChangeScene
                        grid={currentGrid}
                        viewMode={viewMode}
                        autoRotate={autoRotate}
                        changesOnly={changesOnly}
                        reduceMotion={reduceMotion}
                        onCellSelect={(_row, _col, cellId) => setSelectedCellId(cellId)}
                        onCellHover={(_row, _col, cellId) => setHoveredCellId(cellId)}
                      />
                    ) : (
                      <div
                        style={{ height: "100%" }}
                        className="flex items-center justify-center text-sm text-slate-500"
                      >
                        Loading 3D scene…
                      </div>
                    )}
                  </div>

                  {/* Legend — one horizontal row */}
                  <Legend />

                  {/* Control chips — one row */}
                  <ControlChips reduceMotion={reduceMotion} />

                  {/* Timeline — full width */}
                  <TimelineBar />

                  {/* Stats strip — always 3 equal cols */}
                  <StatsStrip
                    builtUpPct={stats.builtUpPct}
                    newCells={stats.newCells}
                    totalChangeSinceStart={stats.totalChangeSinceStart}
                    startYear={startYear}
                  />

                  {onReportConcern && (
                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={onReportConcern}
                        className="min-h-[44px] rounded-full border border-orange-400/30 bg-orange-400/10 px-5 py-2 text-sm font-medium text-orange-300 transition hover:bg-orange-400/20"
                      >
                        Report concern
                      </button>
                    </div>
                  )}

                  <p className="text-center text-[10px] uppercase tracking-wider text-slate-600">
                    Grid source: {currentGrid.source}
                    {grids.length > 0 ? ` · ${grids.length} years cached` : null}
                  </p>
                </div>

                {/* ── Thin vertical divider ── */}
                <div
                  style={{
                    position: "absolute",
                    top: "28px",
                    bottom: "28px",
                    left: "calc(1.15fr / 2)",
                    width: "1px",
                    background: "rgba(255,255,255,0.06)",
                    pointerEvents: "none",
                    display: "none", // shown via CSS below
                  }}
                />

                {/* ── RIGHT: detail panel ── */}
                {showChangeDetail && (
                  <div
                    className="lce-inner-panel"
                    style={{
                      borderRadius: "18px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.04)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      overflow: "hidden",
                      minHeight: "460px",
                    }}
                  >
                    <ChangeDetailPanel
                      grids={grids}
                      analysisId={analysisId ?? undefined}
                      analysisLat={record?.latitude}
                      analysisLng={record?.longitude}
                      analysisRadius={record?.radius_m}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Responsive single-column below 1024 px ── */}
        <style>{`
          @media (max-width: 1024px) {
            .lce-two-col {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 640px) {
            .lce-card {
              width: 100% !important;
              padding-left: 16px !important;
              padding-right: 16px !important;
            }
          }
        `}</style>
      </section>
    </>
  );
}
