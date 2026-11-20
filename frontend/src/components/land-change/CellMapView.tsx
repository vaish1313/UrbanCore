/**
 * CellMapView
 *
 * Renders a Mapbox map that flies to a grid cell's location, draws a pulsing
 * boundary polygon over that cell, and shows a small popup with cell metadata.
 * Designed to be shown instead of (or alongside) the 3-D scene when the user
 * clicks "Show on Map".
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Map, { Source, Layer, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapRef } from "react-map-gl/mapbox";
import { motion } from "motion/react";
import { X, ArrowLeft } from "lucide-react";
import type { CellChangeData } from "@/hooks/useCellChange";

const MAPBOX_TOKEN = import.meta.env["VITE_MAPBOX_TOKEN"] as string | undefined;

interface Props {
  cellChange: CellChangeData;
  beforeYear: number;
  afterYear: number;
  beforeClass: string;
  afterClass: string;
  onBack: () => void;
}

const classLabels: Record<string, string> = {
  land: "Open Land",
  existing: "Existing Construction",
  new: "New Construction",
};

export function CellMapView({
  cellChange,
  beforeYear,
  afterYear,
  beforeClass,
  afterClass,
  onBack,
}: Props) {
  const mapRef = useRef<MapRef | null>(null);
  const [popupOpen, setPopupOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  const { approximateLat: lat, approximateLng: lng, approximateBbox: bbox } = cellChange;

  // Initial view state — will be flyTo'd once map is loaded
  const [viewState, setViewState] = useState({
    longitude: lng ?? 73.7912,
    latitude: lat ?? 20.0059,
    zoom: 12,
  });

  // Fly to cell once map is ready and coordinates are available
  const flyToCell = useCallback(() => {
    if (!mapRef.current || !lat || !lng) return;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 17,
      speed: 1.4,
      curve: 1.4,
      essential: true,
    });
  }, [lat, lng]);

  useEffect(() => {
    if (mapReady) flyToCell();
  }, [mapReady, flyToCell]);

  // Build a GeoJSON polygon for the cell bbox
  const cellPolygon =
    bbox
      ? {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              geometry: {
                type: "Polygon" as const,
                coordinates: [
                  [
                    [bbox[0], bbox[1]],
                    [bbox[2], bbox[1]],
                    [bbox[2], bbox[3]],
                    [bbox[0], bbox[3]],
                    [bbox[0], bbox[1]],
                  ],
                ],
              },
              properties: {
                cellId: cellChange.cellId,
              },
            },
          ],
        }
      : null;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
        <p>Map unavailable – no Mapbox token configured.</p>
        <button
          onClick={onBack}
          className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to details
        </button>
      </div>
    );
  }

  if (!lat || !lng) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2 p-4 text-center">
        <p>No coordinates available for this cell. Cannot show on map.</p>
        <button
          onClick={onBack}
          className="mt-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to details
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10"
      style={{ minHeight: "480px", height: "480px" }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e: { viewState: typeof viewState }) => setViewState(e.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "480px" }}
        onLoad={() => setMapReady(true)}
        reuseMaps
      >
        <NavigationControl position="bottom-right" />

        {/* Cell fill with low opacity */}
        {cellPolygon && (
          <>
            <Source id="cell-polygon" type="geojson" data={cellPolygon}>
              <Layer
                id="cell-fill"
                type="fill"
                paint={{
                  "fill-color": "#ef4444",
                  "fill-opacity": 0.18,
                }}
              />
              <Layer
                id="cell-outline"
                type="line"
                paint={{
                  "line-color": "#ef4444",
                  "line-width": 3,
                  "line-opacity": 1,
                }}
              />
            </Source>
          </>
        )}

        {/* Popup */}
        {popupOpen && lat && lng && (
          <Popup
            longitude={lng}
            latitude={lat}
            anchor="bottom"
            onClose={() => setPopupOpen(false)}
            closeOnClick={false}
            closeButton={false}
            offset={12}
          >
            <div
              style={{
                background: "rgba(7, 11, 22, 0.92)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: 12,
                padding: "12px 14px",
                minWidth: 200,
                backdropFilter: "blur(12px)",
                color: "white",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#f87171", textTransform: "uppercase" }}>
                    New Construction
                  </span>
                </div>
                <button
                  onClick={() => setPopupOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, lineHeight: 1 }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>
                Grid R{cellChange.row} · C{cellChange.col}
              </div>

              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                {classLabels[beforeClass] ?? beforeClass} → {classLabels[afterClass] ?? afterClass}
              </div>

              <div style={{ fontSize: 11, color: "#64748b" }}>
                Detected {afterYear} · Before {beforeYear}
              </div>

              <div style={{ fontSize: 10, fontFamily: "monospace", color: "#475569", marginTop: 6 }}>
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Top bar with Back and Re-open popup */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-slate-200 text-xs font-medium hover:bg-black/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to details
        </button>

        {!popupOpen && (
          <button
            onClick={() => setPopupOpen(true)}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors"
          >
            R{cellChange.row} · C{cellChange.col}
          </button>
        )}
      </div>

      {/* Pulsing ring overlay at the cell centre while map loads */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(7,11,22,0.80)" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full border-2 border-red-500" />
            </div>
            <span className="text-xs text-slate-400">Loading map…</span>
          </div>
        </div>
      )}

      {/* Injected Mapbox popup style overrides */}
      <style>{`
        .mapboxgl-popup-content {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .mapboxgl-popup-tip { display: none !important; }
      `}</style>
    </motion.div>
  );
}
