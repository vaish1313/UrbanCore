import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Move,
  Crosshair,
  MapPin,
  Navigation,
  ChevronDown,
} from "lucide-react";
import type { LocationInfo } from "@/data/citizenMockData";
import { DEFAULT_LOCATION, DEFAULT_MARKERS, PINNED_LOCATION } from "@/data/citizenMockData";

const ease = [0.16, 1, 0.3, 1] as const;

interface MapMarker {
  id: string;
  label: string;
  x: number;
  y: number;
  color: "orange" | "teal" | "cyan" | "red" | "white";
}

interface InteractiveMapProps {
  onLocationSelected: (loc: LocationInfo) => void;
  externalSearchLocation?: { label: string; lat: number; lng: number } | null;
}

export function InteractiveMap({ onLocationSelected, externalSearchLocation }: InteractiveMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>(
    DEFAULT_MARKERS.map((m) => ({ ...m, color: m.color as MapMarker["color"] }))
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo>(DEFAULT_LOCATION);
  const [zoom, setZoom] = useState(1);
  const [coords, setCoords] = useState({ lat: 20.0059, lng: 73.7912 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle external search
  useEffect(() => {
    if (externalSearchLocation) {
      const loc: LocationInfo = {
        ...DEFAULT_LOCATION,
        village: externalSearchLocation.label,
        lat: externalSearchLocation.lat,
        lng: externalSearchLocation.lng,
        selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      };
      setSelectedLocation(loc);
      setCoords({ lat: externalSearchLocation.lat, lng: externalSearchLocation.lng });
      setMarkers((prev) => [
        { id: "search", label: externalSearchLocation.label, x: 50, y: 50, color: "cyan" },
        ...prev.filter((m) => m.id !== "search"),
      ]);
      onLocationSelected(loc);
    }
  }, [externalSearchLocation]);

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // Mock lat/lng from relative position
    const lat = +(20.02 - (y / 100) * 0.05).toFixed(4);
    const lng = +(73.77 + (x / 100) * 0.05).toFixed(4);
    const loc = { ...PINNED_LOCATION, lat, lng, selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) };
    setCoords({ lat, lng });
    setSelectedLocation(loc);
    setMarkers((prev) => [
      { id: "pinned", label: "Pinned Location", x, y, color: "white" },
      ...prev.filter((m) => m.id !== "pinned"),
    ]);
    onLocationSelected(loc);
  }, [onLocationSelected]);

  const markerColors: Record<string, string> = {
    orange: "#fb923c",
    teal: "#2dd4bf",
    cyan: "#22d3ee",
    red: "#f87171",
    white: "#ffffff",
  };

  return (
    <motion.section
      id="interactive-map-section"
      className="cs-map-section"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="cs-map-layout">
        {/* ── Left: Map ── */}
        <div className="cs-map-panel">
          {/* Map header */}
          <div className="cs-map-header">
            <div>
              <h2 className="cs-map-title">
                <Navigation className="h-4 w-4 text-cyan-400 inline -mt-0.5" /> Interactive Map
              </h2>
              <p className="cs-map-subtitle">Click anywhere to drop a pin and analyse the location</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="cs-coords-badge">
                {coords.lat.toFixed(4)}°N · {coords.lng.toFixed(4)}°E
              </span>
              <button
                id="map-fullscreen-btn"
                type="button"
                className="cs-map-icon-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Map container */}
          <div
            ref={mapRef}
            className="cs-map-container"
            style={{ height: isFullscreen ? "calc(100vh - 200px)" : undefined }}
            onClick={handleMapClick}
          >
            {/* Satellite image */}
            <img
              src="/src/assets/region-maharashtra.jpg"
              alt="Satellite map of Nashik"
              className="cs-map-img"
              draggable={false}
            />

            {/* Gradient overlays */}
            <div className="cs-map-vignette" />

            {/* Grid overlay (GIS feel) */}
            <div className="cs-map-grid" />

            {/* Markers */}
            {markers.map((m) => (
              <motion.div
                key={m.id}
                className="cs-marker"
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
              >
                {/* Ripple */}
                <motion.div
                  className="cs-marker-ripple"
                  style={{ background: `${markerColors[m.color]}22` }}
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <MapPin
                  className="h-7 w-7 drop-shadow-lg relative z-10"
                  style={{ color: markerColors[m.color] }}
                />
                {/* Tooltip */}
                <div className="cs-marker-label">{m.label}</div>
              </motion.div>
            ))}

            {/* Zoom controls */}
            <div className="cs-map-controls">
              <button
                id="map-zoom-in"
                type="button"
                className="cs-ctrl-btn"
                onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(z + 0.2, 2)); }}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </button>
              <div className="cs-ctrl-sep" />
              <button
                id="map-zoom-out"
                type="button"
                className="cs-ctrl-btn"
                onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(z - 0.2, 0.6)); }}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                id="map-reset-btn"
                type="button"
                className="cs-ctrl-btn cs-ctrl-btn--gap"
                onClick={(e) => { e.stopPropagation(); setZoom(1); }}
                aria-label="Reset zoom"
              >
                <Move className="h-4 w-4" />
              </button>
              <button
                id="map-locate-btn"
                type="button"
                className="cs-ctrl-btn"
                onClick={(e) => { e.stopPropagation(); }}
                aria-label="My location"
              >
                <LocateFixed className="h-4 w-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="cs-map-legend">
              {markers.map((m) => (
                <div key={m.id} className="cs-legend-row">
                  <span className="cs-legend-dot" style={{ background: markerColors[m.color] }} />
                  <span>{m.label}</span>
                </div>
              ))}
            </div>

            {/* Crosshair hint */}
            <div className="cs-map-hint">
              <Crosshair className="h-3 w-3" />
              Click to pin
            </div>
          </div>
        </div>

        {/* ── Right: Location Info Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLocation.village}
            className="cs-location-card"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.5, ease }}
          >
            {/* Protection status */}
            <div className={`cs-protection-badge cs-protection-badge--${selectedLocation.protectionLevel}`}>
              <span className="cs-protection-dot" />
              {selectedLocation.protection}
            </div>

            <h3 className="cs-loc-name">{selectedLocation.village}</h3>

            <div className="cs-loc-fields">
              <LocationField label="Taluka" value={selectedLocation.taluka} />
              <LocationField label="District" value={selectedLocation.district} />
              <LocationField label="Latitude" value={`${selectedLocation.lat}° N`} mono />
              <LocationField label="Longitude" value={`${selectedLocation.lng}° E`} mono />
              <LocationField label="Elevation" value={`${selectedLocation.elevation} m ASL`} mono />
              <LocationField label="Captured" value={selectedLocation.selectedTime} />
            </div>

            {/* Minimap thumbnail */}
            <div className="cs-loc-thumbnail">
              <img src="/src/assets/city-nashik.jpg" alt="Location thumbnail" className="cs-loc-thumb-img" />
              <div className="cs-loc-thumb-label">Nashik, Maharashtra</div>
              <div className="cs-loc-thumb-pin">
                <MapPin className="h-4 w-4 text-red-400" />
              </div>
            </div>

            {/* Analyse button */}
            <motion.button
              type="button"
              id="analyse-location-btn"
              whileHover={{ scale: 1.02, boxShadow: "0 0 28px rgba(34,211,238,0.25)" }}
              whileTap={{ scale: 0.97 }}
              className="cs-analyse-btn"
              onClick={() => onLocationSelected(selectedLocation)}
            >
              Analyse This Location
            </motion.button>

            {/* Side note */}
            <p className="cs-loc-note">AI analysis will appear below ↓</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Scoped styles */}
      <style>{`
        .cs-map-section { width: 100%; padding: 0 24px 48px; }
        .cs-map-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: start;
          max-width: 1280px;
          margin: 0 auto;
        }
        @media (max-width: 1100px) { .cs-map-layout { grid-template-columns: 1fr; } }

        /* Map panel */
        .cs-map-panel {
          background: rgba(13,20,40,0.72);
          border: 1px solid rgba(34,211,238,0.12);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(24px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.35);
        }
        .cs-map-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-wrap: wrap; gap: 8px;
        }
        .cs-map-title {
          font-family: var(--font-display,"Sora",sans-serif);
          font-size: 1rem; font-weight: 600; color: #f1f5f9;
          display: flex; align-items: center; gap: 8px;
          margin: 0;
        }
        .cs-map-subtitle { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }
        .cs-coords-badge {
          font-family: var(--font-mono,monospace);
          font-size: 0.7rem; color: #38bdf8;
          background: rgba(56,189,248,0.08);
          border: 1px solid rgba(56,189,248,0.2);
          border-radius: 999px;
          padding: 4px 12px;
        }
        .cs-map-icon-btn {
          display: flex; align-items: center; justify-content: center;
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cs-map-icon-btn:hover { border-color: rgba(34,211,238,0.3); color: #e2e8f0; }

        /* Map container */
        .cs-map-container {
          position: relative;
          height: 420px;
          cursor: crosshair;
          overflow: hidden;
          background: #0d1428;
        }
        @media (max-width: 640px) { .cs-map-container { height: 280px; } }
        .cs-map-img {
          width: 100%; height: 100%;
          object-fit: cover;
          opacity: 0.78;
          transition: opacity 0.4s;
          pointer-events: none; user-select: none;
        }
        .cs-map-container:hover .cs-map-img { opacity: 0.88; }
        .cs-map-vignette {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(6,9,20,0.4) 0%, rgba(6,9,20,0) 35%, rgba(6,9,20,0) 65%, rgba(6,9,20,0.5) 100%);
          pointer-events: none;
        }
        .cs-map-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* Markers */
        .cs-marker {
          position: absolute;
          transform: translate(-50%,-100%);
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .cs-marker-ripple {
          position: absolute;
          width: 28px; height: 28px;
          border-radius: 50%;
          top: -4px; left: 50%; transform: translateX(-50%);
        }
        .cs-marker-label {
          position: absolute;
          top: calc(100% + 4px);
          left: 50%; transform: translateX(-50%);
          background: rgba(6,9,20,0.88);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 3px 8px;
          font-size: 0.625rem;
          color: #cbd5e1;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          pointer-events: none;
        }

        /* Controls */
        .cs-map-controls {
          position: absolute; right: 12px; bottom: 40px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .cs-ctrl-btn {
          display: flex; align-items: center; justify-content: center;
          width: 34px; height: 34px;
          background: rgba(6,9,20,0.85);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.15s;
        }
        .cs-ctrl-btn:hover { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.3); color: #e2e8f0; }
        .cs-ctrl-btn--gap { margin-top: 6px; }
        .cs-ctrl-sep { height: 1px; background: rgba(255,255,255,0.08); margin: 1px 4px; }

        /* Legend */
        .cs-map-legend {
          position: absolute; bottom: 10px; left: 12px;
          background: rgba(6,9,20,0.85);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 7px 11px;
          display: flex; flex-direction: column; gap: 5px;
          backdrop-filter: blur(10px);
        }
        .cs-legend-row { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; color: #94a3b8; }
        .cs-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* Hint */
        .cs-map-hint {
          position: absolute; top: 10px; right: 12px;
          display: flex; align-items: center; gap: 5px;
          font-size: 0.625rem; font-family: var(--font-mono,monospace);
          text-transform: uppercase; letter-spacing: 0.1em;
          color: rgba(255,255,255,0.3);
          pointer-events: none;
        }

        /* Location card */
        .cs-location-card {
          background: rgba(13,20,40,0.78);
          border: 1px solid rgba(34,211,238,0.13);
          border-radius: 20px;
          padding: 20px;
          display: flex; flex-direction: column; gap: 14px;
          backdrop-filter: blur(24px);
          box-shadow: 0 4px 32px rgba(0,0,0,0.35);
        }
        .cs-protection-badge {
          display: inline-flex; align-items: center; gap: 7px;
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 0.75rem; font-weight: 500;
          border: 1px solid;
        }
        .cs-protection-badge--safe { background: rgba(52,211,153,0.1); color: #34d399; border-color: rgba(52,211,153,0.3); }
        .cs-protection-badge--caution { background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
        .cs-protection-badge--danger { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.3); }
        .cs-protection-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .cs-loc-name {
          font-family: var(--font-display,"Sora",sans-serif);
          font-size: 1.125rem; font-weight: 700; color: #f1f5f9;
          margin: 0;
        }
        .cs-loc-fields { display: flex; flex-direction: column; gap: 0; }
        .cs-loc-thumbnail {
          position: relative; height: 100px; border-radius: 12px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .cs-loc-thumb-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
        .cs-loc-thumb-label {
          position: absolute; bottom: 6px; left: 8px;
          background: rgba(6,9,20,0.8); border-radius: 6px; padding: 2px 8px;
          font-size: 0.7rem; color: #cbd5e1;
          backdrop-filter: blur(6px);
        }
        .cs-loc-thumb-pin { position: absolute; top: 35%; left: 48%; transform: translate(-50%,-50%); }
        .cs-analyse-btn {
          width: 100%;
          background: linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }
        .cs-loc-note { font-size: 0.7rem; color: #334155; text-align: center; margin-top: -4px; }
        @media (max-width: 640px) { .cs-map-section { padding: 0 16px 32px; } }
      `}</style>
    </motion.section>
  );
}

function LocationField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "0.75rem", color: "#475569" }}>{label}</span>
      <span style={{ fontSize: "0.8125rem", color: "#cbd5e1", fontWeight: 500, fontFamily: mono ? "var(--font-mono,monospace)" : undefined }}>{value}</span>
    </div>
  );
}
