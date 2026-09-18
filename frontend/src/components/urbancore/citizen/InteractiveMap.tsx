import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Maximize2, Navigation, Crosshair, MapPin } from "lucide-react";
// @ts-ignore
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LocationInfo } from "@/data/citizenMockData";
import { DEFAULT_LOCATION, PINNED_LOCATION } from "@/data/citizenMockData";

const MAPBOX_TOKEN = "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";
const ease = [0.16, 1, 0.3, 1] as const;

interface InteractiveMapProps {
  onLocationSelected: (loc: LocationInfo) => void;
  externalSearchLocation?: { label: string; lat: number; lng: number } | null;
}

export function InteractiveMap({ onLocationSelected, externalSearchLocation }: InteractiveMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 73.7912,
    latitude: 20.0059,
    zoom: 12
  });

  const [pinnedLoc, setPinnedLoc] = useState<LocationInfo | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (externalSearchLocation) {
      const loc: LocationInfo = {
        ...DEFAULT_LOCATION,
        village: externalSearchLocation.label,
        lat: externalSearchLocation.lat,
        lng: externalSearchLocation.lng,
        selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      };
      setPinnedLoc(loc);
      setViewState({ longitude: externalSearchLocation.lng, latitude: externalSearchLocation.lat, zoom: 14 });
      setShowPopup(true);
    }
  }, [externalSearchLocation]);

  const handleMapClick = useCallback((e: any) => {
    // If they click the map while a popup is open, don't re-pin immediately, just close popup? 
    // Wait, the default behavior of clicking a map is dropping a pin.
    const lat = +(e.lngLat.lat).toFixed(4);
    const lng = +(e.lngLat.lng).toFixed(4);
    const loc = { ...PINNED_LOCATION, lat, lng, selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) };
    setPinnedLoc(loc);
    setShowPopup(false); // They can click the marker to open popup
  }, []);

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
        <div className="cs-map-panel">
          <div className="cs-map-header">
            <div>
              <h2 className="cs-map-title">
                <Navigation className="h-4 w-4 text-cyan-400 inline -mt-0.5" /> Interactive Map
              </h2>
              <p className="cs-map-subtitle">Click anywhere to drop a pin, then click the pin to view details and confirm.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="cs-coords-badge">
                {viewState.latitude.toFixed(4)}°N · {viewState.longitude.toFixed(4)}°E
              </span>
              <button
                type="button"
                className="cs-map-icon-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="cs-map-container"
            style={{ height: isFullscreen ? "calc(100vh - 120px)" : undefined }}
          >
            <Map
              {...viewState}
              onMove={(evt: any) => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/satellite-v9"
              mapboxAccessToken={MAPBOX_TOKEN}
              onClick={handleMapClick}
              cursor="crosshair"
            >
              <NavigationControl position="bottom-right" />
              
              {/* Single Pinned Marker */}
              {pinnedLoc && (
                <Marker longitude={pinnedLoc.lng} latitude={pinnedLoc.lat} anchor="bottom" onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setShowPopup(true);
                }}>
                  <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
                    <MapPin className="h-8 w-8 drop-shadow-lg text-red-500" style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }} />
                  </div>
                </Marker>
              )}

              {/* Popup Dialogue Box */}
              {showPopup && pinnedLoc && (
                <Popup
                  longitude={pinnedLoc.lng}
                  latitude={pinnedLoc.lat}
                  anchor="bottom"
                  offset={30}
                  onClose={() => setShowPopup(false)}
                  closeButton={true}
                  closeOnClick={false}
                  className="cs-map-popup"
                >
                  <div className="cs-popup-content">
                    <div className={`cs-protection-badge cs-protection-badge--${pinnedLoc.protectionLevel}`}>
                      <span className="cs-protection-dot" />
                      {pinnedLoc.protection}
                    </div>

                    <h3 className="cs-loc-name">{pinnedLoc.village}</h3>

                    <div className="cs-loc-fields">
                      <LocationField label="Taluka" value={pinnedLoc.taluka} />
                      <LocationField label="District" value={pinnedLoc.district} />
                      <LocationField label="Latitude" value={`${pinnedLoc.lat}° N`} mono />
                      <LocationField label="Longitude" value={`${pinnedLoc.lng}° E`} mono />
                      <LocationField label="Elevation" value={`${pinnedLoc.elevation} m ASL`} mono />
                      <LocationField label="Captured" value={pinnedLoc.selectedTime} />
                    </div>

                    <div className="cs-loc-thumbnail">
                      <img src="/src/assets/city-nashik.jpg" alt="Location thumbnail" className="cs-loc-thumb-img" />
                      <div className="cs-loc-thumb-label">Nashik, Maharashtra</div>
                      <div className="cs-loc-thumb-pin">
                        <MapPin className="h-4 w-4 text-red-400" />
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      className="cs-analyse-btn"
                      onClick={() => {
                        setShowPopup(false);
                        onLocationSelected(pinnedLoc);
                      }}
                    >
                      Confirm Location
                    </motion.button>
                  </div>
                </Popup>
              )}
            </Map>

            {/* Crosshair hint */}
            <div className="cs-map-hint">
              <Crosshair className="h-3 w-3" />
              Click to pin
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cs-map-section { width: 100%; padding: 0 24px 48px; }
        .cs-map-layout { display: grid; grid-template-columns: 1fr; align-items: start; max-width: 1280px; margin: 0 auto; }
        .cs-map-panel { background: rgba(13,20,40,0.72); border: 1px solid rgba(34,211,238,0.12); border-radius: 20px; overflow: hidden; backdrop-filter: blur(24px); box-shadow: 0 4px 32px rgba(0,0,0,0.35); }
        .cs-map-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; gap: 8px; }
        .cs-map-title { font-family: var(--font-display,"Sora",sans-serif); font-size: 1rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 8px; margin: 0; }
        .cs-map-subtitle { font-size: 0.75rem; color: #64748b; margin: 2px 0 0; }
        .cs-coords-badge { font-family: var(--font-mono,monospace); font-size: 0.7rem; color: #38bdf8; background: rgba(56,189,248,0.08); border: 1px solid rgba(56,189,248,0.2); border-radius: 999px; padding: 4px 12px; }
        .cs-map-icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .cs-map-icon-btn:hover { border-color: rgba(34,211,238,0.3); color: #e2e8f0; }
        .cs-map-container { position: relative; height: 500px; background: #0d1428; }
        @media (max-width: 640px) { .cs-map-container { height: 350px; } }
        .cs-map-hint { position: absolute; top: 10px; right: 12px; display: flex; align-items: center; gap: 5px; font-size: 0.625rem; font-family: var(--font-mono,monospace); text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.9); pointer-events: none; background: rgba(0,0,0,0.5); padding: 4px 10px; border-radius: 6px; backdrop-filter: blur(4px); }
        
        /* Mapbox Popup Overrides */
        .mapboxgl-popup-content {
          background: rgba(10, 15, 30, 0.95) !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          color: white !important;
          width: 320px;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgba(10, 15, 30, 0.95) !important;
          border-bottom-color: rgba(10, 15, 30, 0.95) !important;
        }
        .mapboxgl-popup-close-button {
          color: #94a3b8;
          font-size: 20px;
          padding: 4px 8px;
          border-radius: 0 16px 0 0;
        }
        .mapboxgl-popup-close-button:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        /* Popup Inner Content */
        .cs-popup-content { display: flex; flex-direction: column; gap: 12px; }
        .cs-protection-badge { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 4px 10px; font-size: 0.7rem; font-weight: 500; border: 1px solid; width: fit-content; }
        .cs-protection-badge--safe { background: rgba(52,211,153,0.1); color: #34d399; border-color: rgba(52,211,153,0.3); }
        .cs-protection-badge--caution { background: rgba(251,191,36,0.1); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
        .cs-protection-badge--danger { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.3); }
        .cs-protection-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .cs-loc-name { font-family: var(--font-display,"Sora",sans-serif); font-size: 1rem; font-weight: 700; color: #f1f5f9; margin: 0; }
        .cs-loc-fields { display: flex; flex-direction: column; gap: 0; margin-bottom: 4px; }
        .cs-loc-thumbnail { position: relative; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
        .cs-loc-thumb-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; }
        .cs-loc-thumb-label { position: absolute; bottom: 4px; left: 6px; background: rgba(0,0,0,0.8); border-radius: 4px; padding: 2px 6px; font-size: 0.65rem; color: #cbd5e1; }
        .cs-loc-thumb-pin { position: absolute; top: 40%; left: 50%; transform: translate(-50%,-50%); }
        .cs-analyse-btn { width: 100%; background: linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%); color: #fff; border: none; border-radius: 10px; padding: 10px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; margin-top: 4px; }
      `}</style>
    </motion.section>
  );
}

function LocationField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 500, fontFamily: mono ? "var(--font-mono,monospace)" : undefined }}>{value}</span>
    </div>
  );
}
