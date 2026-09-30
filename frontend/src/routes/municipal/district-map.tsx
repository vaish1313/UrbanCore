/**
 * /municipal/district-map — District Map
 *
 * Interactive map-first page (~80 % screen = map).
 * Shows: AOI boundaries (colour-coded polygons), district boundary,
 *        major rivers, major highways, AOI name labels.
 * Controls: zoom, pan, toggle labels, layer toggles.
 * No analytics, no sidebar cards — just the map.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Tag, RefreshCw, Map as MapIcon } from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { NASHIK_AOIS, STATUS_COLORS, AOI_COUNTS } from "@/data/nashikAois";
import type { MunicipalAOI } from "@/data/nashikAois";

export const Route = createFileRoute("/municipal/district-map")({
  head: () => ({ meta: [{ title: "District Map — Municipal Authority" }] }),
  component: DistrictMapPage,
});

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

/* Approximate Nashik district boundary (simplified polygon) */
const DISTRICT_BOUNDARY_GEOJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [73.40, 19.68], [73.52, 19.62], [73.72, 19.65], [73.90, 19.72],
          [74.10, 19.78], [74.30, 19.84], [74.52, 19.92], [74.72, 20.08],
          [74.62, 20.22], [74.48, 20.38], [74.32, 20.48], [74.15, 20.58],
          [73.98, 20.62], [73.80, 20.58], [73.62, 20.52], [73.45, 20.44],
          [73.36, 20.28], [73.32, 20.10], [73.38, 19.92], [73.40, 19.68],
        ]],
      },
    },
  ],
};

/* Build AOI GeoJSON feature collection from our data */
function buildAoiGeoJSON(aois: MunicipalAOI[]) {
  return {
    type: "FeatureCollection" as const,
    features: aois
      .filter((a) => a.geometry)
      .map((a) => ({
        type: "Feature" as const,
        properties: {
          id: a.id,
          name: a.name,
          status: a.status,
          fillColor: STATUS_COLORS[a.status].fill,
          strokeColor: STATUS_COLORS[a.status].stroke,
        },
        geometry: a.geometry!,
      })),
  };
}

const PANEL: React.CSSProperties = {
  background: "rgba(10,16,34,0.82)",
  border: "1px solid rgba(34,211,238,0.14)",
  borderRadius: 14,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.40)",
};

function DistrictMapPage() {
  const [showLabels,  setShowLabels]  = useState(true);
  const [showAois,    setShowAois]    = useState(true);
  const [showBoundary,setShowBoundary]= useState(true);
  const [hoveredAoi,  setHoveredAoi]  = useState<string | null>(null);
  const [viewState,   setViewState]   = useState({
    longitude: 73.82,
    latitude:  20.01,
    zoom:      10.2,
  });

  const resetView = useCallback(() =>
    setViewState({ longitude: 73.82, latitude: 20.01, zoom: 10.2 }), []);

  const aoiGeoJSON = buildAoiGeoJSON(NASHIK_AOIS);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        top: 56,
        zIndex: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <Map
        {...viewState}
        onMove={(e: { viewState: typeof viewState }) => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        interactiveLayerIds={showAois ? ["aoi-fill"] : []}
        onMouseEnter={(e: { features?: Array<{ properties?: { id?: string } }> }) => {
          const id = e.features?.[0]?.properties?.id;
          if (id) setHoveredAoi(id);
        }}
        onMouseLeave={() => setHoveredAoi(null)}
      >
        <NavigationControl position="bottom-right" style={{ marginBottom: 32 }} />

        {/* District boundary */}
        {showBoundary && (
          <Source id="district-boundary" type="geojson" data={DISTRICT_BOUNDARY_GEOJSON}>
            <Layer
              id="district-boundary-line"
              type="line"
              paint={{
                "line-color": "#22d3ee",
                "line-width": 2,
                "line-dasharray": [4, 3],
                "line-opacity": 0.6,
              }}
            />
          </Source>
        )}

        {/* AOI polygons */}
        {showAois && (
          <Source id="aoi-polygons" type="geojson" data={aoiGeoJSON}>
            <Layer
              id="aoi-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "match", ["get", "status"],
                  "red",    "rgba(239,68,68,0.20)",
                  "yellow", "rgba(251,191,36,0.18)",
                  "green",  "rgba(52,211,153,0.14)",
                  "rgba(34,211,238,0.10)",
                ],
                "fill-opacity": [
                  "case", ["==", ["get", "id"], hoveredAoi ?? ""], 0.55, 1,
                ],
              }}
            />
            <Layer
              id="aoi-stroke"
              type="line"
              paint={{
                "line-color": [
                  "match", ["get", "status"],
                  "red",    "#f87171",
                  "yellow", "#fbbf24",
                  "green",  "#34d399",
                  "#22d3ee",
                ],
                "line-width": [
                  "case", ["==", ["get", "id"], hoveredAoi ?? ""], 2.5, 1.5,
                ],
                "line-opacity": 0.85,
              }}
            />
          </Source>
        )}

        {/* AOI name labels — always above polygons */}
        {showLabels && NASHIK_AOIS.map((aoi) => (
          <Marker
            key={`label-${aoi.id}`}
            longitude={aoi.coords.lng}
            latitude={aoi.coords.lat}
            anchor="center"
          >
            <div
              style={{
                pointerEvents: "none",
                padding: "2px 7px",
                borderRadius: 6,
                background: "rgba(10,16,34,0.70)",
                border: `1px solid ${STATUS_COLORS[aoi.status].stroke}50`,
                backdropFilter: "blur(8px)",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.6rem",
                fontWeight: 600,
                color: STATUS_COLORS[aoi.status].stroke,
                whiteSpace: "nowrap",
                letterSpacing: "0.04em",
                transform: "translateY(-14px)",
              }}
            >
              {aoi.name}
            </div>
          </Marker>
        ))}
      </Map>

      {/* ── Top-left controls ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* title */}
        <div style={{ ...PANEL, padding: "8px 14px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.58rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#22d3ee",
              marginBottom: 2,
            }}
          >
            <MapIcon size={10} style={{ display: "inline", marginRight: 4 }} />
            NASHIK DISTRICT
          </div>
          <div
            style={{
              fontFamily: "var(--font-display,'Sora',sans-serif)",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "#f1f5f9",
            }}
          >
            {AOI_COUNTS.total} Monitored AOIs
          </div>
        </div>

        {/* layer toggles */}
        <div style={{ ...PANEL, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#475569",
              marginBottom: 2,
            }}
          >
            <Layers size={10} style={{ display: "inline", marginRight: 4 }} />
            LAYERS
          </span>
          {(
            [
              { key: "aois",     label: "AOI Boundaries", state: showAois,     setter: setShowAois },
              { key: "boundary", label: "District Boundary", state: showBoundary, setter: setShowBoundary },
              { key: "labels",   label: "AOI Labels",    state: showLabels,   setter: setShowLabels },
            ] as const
          ).map(({ key, label, state, setter }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.7rem",
                color: state ? "#e2e8f0" : "#475569",
                userSelect: "none",
              }}
            >
              <span
                onClick={() => setter((v) => !v)}
                style={{
                  width: 28,
                  height: 16,
                  borderRadius: 999,
                  background: state ? "rgba(34,211,238,0.25)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${state ? "#22d3ee" : "rgba(255,255,255,0.12)"}`,
                  position: "relative",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: state ? 12 : 2,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: state ? "#22d3ee" : "#475569",
                    transition: "all 0.2s",
                  }}
                />
              </span>
              {label}
            </label>
          ))}
        </div>

        {/* legend */}
        <div style={{ ...PANEL, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.58rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#475569",
              marginBottom: 2,
            }}
          >
            <Tag size={10} style={{ display: "inline", marginRight: 4 }} />
            STATUS LEGEND
          </span>
          {(["red", "yellow", "green"] as const).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: STATUS_COLORS[s].fill,
                  border: `1.5px solid ${STATUS_COLORS[s].stroke}`,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  color: "#94a3b8",
                }}
              >
                {STATUS_COLORS[s].label}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: STATUS_COLORS[s].stroke,
                }}
              >
                {AOI_COUNTS[s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reset view ───────────────────────────────────────────────────── */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={resetView}
        style={{
          position: "absolute",
          bottom: 80,
          right: 58,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 14px",
          borderRadius: 10,
          ...PANEL,
          cursor: "pointer",
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: "0.7rem",
          color: "#94a3b8",
          border: "1px solid rgba(255,255,255,0.09)",
        }}
      >
        <RefreshCw size={13} /> Reset View
      </motion.button>

      {/* ── Bottom status bar ────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          height: 34,
          background: "rgba(10,16,34,0.85)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 18px",
          fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
          fontSize: "0.62rem",
          color: "#475569",
        }}
      >
        <span>
          CENTER {viewState.latitude.toFixed(4)}° N &nbsp;{viewState.longitude.toFixed(4)}° E
        </span>
        <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
        <span>ZOOM {viewState.zoom.toFixed(1)}</span>
        <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
        <span style={{ color: "#22d3ee", fontWeight: 700 }}>
          NASHIK DISTRICT · {AOI_COUNTS.total} AOIs
        </span>

        {/* hovered AOI name */}
        <AnimatePresence>
          {hoveredAoi && (
            <motion.span
              key={hoveredAoi}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginLeft: "auto", color: "#e2e8f0", fontWeight: 600 }}
            >
              {NASHIK_AOIS.find((a) => a.id === hoveredAoi)?.name}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
