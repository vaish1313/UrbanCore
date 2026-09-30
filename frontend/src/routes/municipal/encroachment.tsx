/**
 * /municipal/encroachment — Encroachment Watch
 *
 * Map-first layout. Map takes ~72 % of height.
 * Red highlighted polygons for flagged AOIs directly on map.
 * Floating legend bottom-left.
 * Right panel: compact alert cards (no huge tables).
 * Mark as Reviewed + Flag for Action are pure React state.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert, MapPin, CheckCircle2, Flag, AlertTriangle,
  ChevronRight, X,
} from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MUNICIPAL_ALERTS } from "@/data/municipalData";
import type { MunicipalAlert } from "@/types/urbancore";
import { NASHIK_AOIS } from "@/data/nashikAois";

export const Route = createFileRoute("/municipal/encroachment")({
  head: () => ({ meta: [{ title: "Encroachment Watch — Municipal Authority" }] }),
  component: EncroachmentPage,
});

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.84)",
  border: "1px solid rgba(34,211,238,0.13)",
  borderRadius: 16,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.42)",
};

/* Build GeoJSON for flagged encroachment AOIs */
function buildEncroachmentGeoJSON(alerts: MunicipalAlert[], highlightId?: string) {
  const features = alerts
    .map((alert) => {
      const aoi = NASHIK_AOIS.find((a) => a.id === alert.aoiId);
      if (!aoi?.geometry) return null;
      return {
        type: "Feature" as const,
        properties: {
          id: alert.id,
          aoiId: alert.aoiId,
          severity: alert.severity,
          isHighlighted: alert.id === highlightId,
        },
        geometry: aoi.geometry,
      };
    })
    .filter(Boolean);

  return { type: "FeatureCollection" as const, features: features as NonNullable<typeof features[0]>[] };
}

type ReviewState = Record<string, "pending" | "reviewed" | "flagged">;

function EncroachmentPage() {
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState<MunicipalAlert>(MUNICIPAL_ALERTS[0]!);
  const [reviewState,   setReviewState]   = useState<ReviewState>(() =>
    Object.fromEntries(MUNICIPAL_ALERTS.map((a) => [a.id, "pending"])),
  );

  const encroachGeoJSON = buildEncroachmentGeoJSON(MUNICIPAL_ALERTS, selectedAlert.id);

  const focusAoi = NASHIK_AOIS.find((a) => a.id === selectedAlert.aoiId);
  const mapCenter = focusAoi
    ? { longitude: focusAoi.coords.lng, latitude: focusAoi.coords.lat, zoom: 13 }
    : { longitude: 73.72, latitude: 20.00, zoom: 11 };

  const markReviewed = (id: string) =>
    setReviewState((prev) => ({ ...prev, [id]: "reviewed" }));
  const flagAction = (id: string) =>
    setReviewState((prev) => ({ ...prev, [id]: "flagged" }));

  const stateColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    pending:  { bg: "rgba(100,116,139,0.10)", border: "rgba(100,116,139,0.3)", text: "#94a3b8", label: "Pending" },
    reviewed: { bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.35)", text: "#34d399", label: "Reviewed ✓" },
    flagged:  { bg: "rgba(251,146,60,0.10)",  border: "rgba(251,146,60,0.35)", text: "#fb923c", label: "Action Required" },
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px)",
        position: "fixed",
        inset: 0,
        top: 56,
        zIndex: 0,
      }}
    >
      {/* ── MAP (top ~70 %) ───────────────────────────────────────────────── */}
      <div style={{ flex: "0 0 68%", position: "relative" }}>
        <Map
          key={`${mapCenter.longitude}-${mapCenter.latitude}`}
          initialViewState={mapCenter}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" style={{ marginBottom: 8 }} />

          {/* Encroachment polygons */}
          <Source id="encroach" type="geojson" data={encroachGeoJSON}>
            <Layer
              id="encroach-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  ["get", "isHighlighted"], "rgba(239,68,68,0.35)",
                  "rgba(239,68,68,0.15)",
                ],
                "fill-outline-color": "transparent",
              }}
            />
            <Layer
              id="encroach-stroke"
              type="line"
              paint={{
                "line-color": "#f87171",
                "line-width": ["case", ["get", "isHighlighted"], 2.5, 1.5],
                "line-opacity": ["case", ["get", "isHighlighted"], 1, 0.6],
                "line-dasharray": [4, 2],
              }}
            />
          </Source>

          {/* Alert markers */}
          {MUNICIPAL_ALERTS.map((alert) => {
            const aoi = NASHIK_AOIS.find((a) => a.id === alert.aoiId);
            if (!aoi) return null;
            const isSel = alert.id === selectedAlert.id;
            return (
              <Marker
                key={alert.id}
                longitude={aoi.coords.lng}
                latitude={aoi.coords.lat}
                anchor="center"
              >
                <button
                  type="button"
                  onClick={() => setSelectedAlert(alert)}
                  style={{
                    width: isSel ? 20 : 13,
                    height: isSel ? 20 : 13,
                    borderRadius: "50%",
                    background: isSel ? "#ef4444" : "rgba(239,68,68,0.7)",
                    border: `2px solid ${isSel ? "#fff" : "#f87171"}`,
                    boxShadow: `0 0 ${isSel ? 18 : 8}px rgba(239,68,68,0.6)`,
                    cursor: "pointer",
                    padding: 0,
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                />
              </Marker>
            );
          })}
        </Map>

        {/* Floating legend bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 14,
            zIndex: 10,
            ...PANEL,
            padding: "8px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#475569",
            }}
          >
            ENCROACHMENT FLAGS
          </span>
          {(["HIGH", "MEDIUM"] as const).map((sev) => (
            <div key={sev} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: sev === "HIGH" ? "#ef4444" : "#fbbf24",
                  boxShadow: `0 0 6px ${sev === "HIGH" ? "rgba(239,68,68,0.7)" : "rgba(251,191,36,0.7)"}`,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.65rem",
                  color: "#94a3b8",
                }}
              >
                {sev} Severity
              </span>
            </div>
          ))}
        </div>

        {/* header chip top-left */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            zIndex: 10,
            ...PANEL,
            padding: "7px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldAlert size={14} color="#f87171" />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display,'Sora',sans-serif)",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#f1f5f9",
              }}
            >
              Encroachment Watch
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.58rem",
                color: "#f87171",
                letterSpacing: "0.1em",
              }}
            >
              {MUNICIPAL_ALERTS.length} ACTIVE FLAGS · NASHIK
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERT CARDS (bottom ~30 %) ────────────────────────────────────── */}
      <div
        style={{
          flex: "1 1 0",
          background: "rgba(8,13,28,0.92)",
          borderTop: "1px solid rgba(34,211,238,0.10)",
          backdropFilter: "blur(20px)",
          overflowX: "auto",
          overflowY: "hidden",
          display: "flex",
          alignItems: "stretch",
          gap: 12,
          padding: "12px 16px",
        }}
      >
        {MUNICIPAL_ALERTS.map((alert) => {
          const isSel  = alert.id === selectedAlert.id;
          const state  = reviewState[alert.id] ?? "pending";
          const sc     = stateColors[state];
          const isHigh = alert.severity === "HIGH";

          return (
            <motion.div
              key={alert.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedAlert(alert)}
              style={{
                minWidth: 240,
                maxWidth: 280,
                flexShrink: 0,
                borderRadius: 14,
                background: isSel
                  ? "rgba(34,211,238,0.07)"
                  : state === "flagged"
                  ? "rgba(251,146,60,0.07)"
                  : "rgba(255,255,255,0.02)",
                border: isSel
                  ? "1px solid rgba(34,211,238,0.35)"
                  : state === "flagged"
                  ? "1px solid rgba(251,146,60,0.35)"
                  : "1px solid rgba(255,255,255,0.07)",
                cursor: "pointer",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                transition: "all 0.2s",
              }}
            >
              {/* severity + status row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: isHigh ? "rgba(239,68,68,0.15)" : "rgba(251,191,36,0.15)",
                    border: isHigh ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(251,191,36,0.3)",
                    color: isHigh ? "#f87171" : "#fbbf24",
                  }}
                >
                  {alert.severity}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    color: sc.text,
                  }}
                >
                  {sc.label}
                </span>
              </div>

              {/* title */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <AlertTriangle size={13} color={isHigh ? "#f87171" : "#fbbf24"} style={{ marginTop: 1, flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-display,'Sora',sans-serif)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#e2e8f0",
                    lineHeight: 1.35,
                  }}
                >
                  {alert.title}
                </span>
              </div>

              {/* location + area */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} color="#22d3ee" style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: "var(--font-sans,'Manrope',sans-serif)",
                    fontSize: "0.68rem",
                    color: "#64748b",
                  }}
                >
                  {alert.location}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.62rem",
                  color: "#475569",
                }}
              >
                {alert.detectedYear} · {alert.affectedAreaSqM.toLocaleString()} m²
              </div>

              {/* action buttons */}
              <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); markReviewed(alert.id); }}
                  disabled={state === "reviewed"}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    borderRadius: 8,
                    border: "1px solid rgba(52,211,153,0.3)",
                    background: state === "reviewed" ? "rgba(52,211,153,0.12)" : "rgba(52,211,153,0.06)",
                    color: "#34d399",
                    cursor: state === "reviewed" ? "default" : "pointer",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    opacity: state === "reviewed" ? 0.7 : 1,
                  }}
                >
                  <CheckCircle2 size={11} />
                  {state === "reviewed" ? "Reviewed" : "Review"}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); flagAction(alert.id); }}
                  disabled={state === "flagged"}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    borderRadius: 8,
                    border: "1px solid rgba(251,146,60,0.3)",
                    background: state === "flagged" ? "rgba(251,146,60,0.14)" : "rgba(251,146,60,0.06)",
                    color: "#fb923c",
                    cursor: state === "flagged" ? "default" : "pointer",
                    fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    opacity: state === "flagged" ? 0.7 : 1,
                  }}
                >
                  <Flag size={11} />
                  {state === "flagged" ? "Flagged" : "Flag"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate({ to: "/municipal/case-detail" });
                  }}
                  style={{
                    padding: "5px 8px",
                    borderRadius: 8,
                    border: "1px solid rgba(34,211,238,0.2)",
                    background: "rgba(34,211,238,0.06)",
                    color: "#22d3ee",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
