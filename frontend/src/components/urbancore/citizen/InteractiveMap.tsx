import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { Maximize2, Navigation, Crosshair, MapPin } from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types are provided by the Mapbox adapter
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LocationInfo } from "@/data/citizenMockData";
import { DEFAULT_LOCATION, PINNED_LOCATION } from "@/data/citizenMockData";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const ease = [0.16, 1, 0.3, 1] as const;

interface InteractiveMapProps {
  onLocationSelected: (loc: LocationInfo) => void;
  externalSearchLocation?: { label: string; lat: number; lng: number } | null;
}

export function InteractiveMap({
  onLocationSelected,
  externalSearchLocation,
}: InteractiveMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 73.7912,
    latitude: 20.0059,
    zoom: 12,
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
        selectedTime: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      };
      setPinnedLoc(loc);
      setViewState({
        longitude: externalSearchLocation.lng,
        latitude: externalSearchLocation.lat,
        zoom: 14,
      });
      setShowPopup(true);
    }
  }, [externalSearchLocation]);

  const getProtectionStatus = (lat: number, lng: number, placeName: string) => {
    const name = placeName.toLowerCase();

    // Check keywords first
    if (
      name.includes("river") ||
      name.includes("godavari") ||
      name.includes("lake") ||
      name.includes("dam") ||
      name.includes("water") ||
      name.includes("nadi") ||
      name.includes("valley")
    ) {
      return { protection: "⚠️ River buffer zone", protectionLevel: "danger" as const };
    }

    if (
      name.includes("hill") ||
      name.includes("forest") ||
      name.includes("mountain") ||
      name.includes("cave") ||
      name.includes("pandavleni") ||
      name.includes("pandav lene") ||
      name.includes("leni") ||
      name.includes("wadi") ||
      name.includes("ghat")
    ) {
      return { protection: "🌿 Forest/Hilly boundary nearby", protectionLevel: "caution" as const };
    }

    // Fallback: Distance checks to major geographic landmarks
    // Godavari River center approx
    const distToRiver = Math.sqrt(Math.pow(lat - 20.015, 2) + Math.pow(lng - 73.79, 2));
    if (distToRiver < 0.012) {
      return { protection: "⚠️ River buffer zone", protectionLevel: "danger" as const };
    }

    // Pandavleni Hills / Pathardi area approx
    const distToHills = Math.sqrt(Math.pow(lat - 19.945, 2) + Math.pow(lng - 73.77, 2));
    if (distToHills < 0.035) {
      return { protection: "🌿 Protected Hilly Zone", protectionLevel: "caution" as const };
    }

    return { protection: "✅ No protected zone constraints.", protectionLevel: "safe" as const };
  };

  const handleMapClick = useCallback(async (latValue: number, lngValue: number) => {
    const lat = +latValue.toFixed(4);
    const lng = +lngValue.toFixed(4);

    // Center the map on the new pin so the popup doesn't clip at the edges
    setViewState((prev) => ({
      ...prev,
      longitude: lng,
      latitude: lat,
    }));

    // Optimistic initial pin
    const loc = {
      ...PINNED_LOCATION,
      lat,
      lng,
      village: "Locating...",
      selectedTime: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    };
    setPinnedLoc(loc);
    setShowPopup(false);

    try {
      const res = await fetch(`${API_BASE_URL}/locations/search?q=${lat},${lng}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const placeName = data[0].label;
        const district = "Mapbox GL";
        const state = "Location search";
        const pincode = "";

        const { protection, protectionLevel } = getProtectionStatus(lat, lng, placeName);

        setPinnedLoc((prev) => {
          if (!prev) return prev;
          if (prev.lat !== lat || prev.lng !== lng) return prev; // If user clicked elsewhere, ignore
          return {
            ...prev,
            village: placeName,
            taluka: "Nashik",
            district,
            state,
            pincode,
            protection,
            protectionLevel,
          };
        });
      } else {
        setPinnedLoc((prev) =>
          prev && prev.lat === lat ? { ...prev, village: "Unknown Location" } : prev,
        );
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      setPinnedLoc((prev) =>
        prev && prev.lat === lat ? { ...prev, village: "Unknown Location" } : prev,
      );
    }
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
              <p className="cs-map-subtitle">
                Click anywhere to drop a pin, then click the pin to view details and confirm.
              </p>
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
              onMove={(event: { viewState: typeof viewState }) => setViewState(event.viewState)}
              onClick={(event: { lngLat: { lat: number; lng: number } }) =>
                handleMapClick(event.lngLat.lat, event.lngLat.lng)
              }
              mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
            >
              <NavigationControl position="bottom-right" />

              {/* Single Pinned Marker */}
              {pinnedLoc && (
                <Marker longitude={pinnedLoc.lng} latitude={pinnedLoc.lat} anchor="bottom">
                  <div className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
                    <button
                      type="button"
                      aria-label="Show selected location"
                      onClick={(event) => {
                        event.stopPropagation();
                        setShowPopup(true);
                      }}
                    >
                      <MapPin
                        className="h-8 w-8 drop-shadow-lg text-red-500"
                        style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}
                      />
                    </button>
                  </div>
                </Marker>
              )}

              {/* Popup Dialogue Box */}
              {showPopup && pinnedLoc && (
                <Popup
                  longitude={pinnedLoc.lng}
                  latitude={pinnedLoc.lat}
                  anchor="top"
                  onClose={() => setShowPopup(false)}
                  closeOnClick={false}
                >
                  <div className="cs-popup-content">
                    <div
                      className={`cs-protection-badge cs-protection-badge--${pinnedLoc.protectionLevel}`}
                    >
                      <span className="cs-protection-dot" />
                      {pinnedLoc.protection}
                    </div>

                    <h3 className="cs-loc-name">{pinnedLoc.village}</h3>

                    <div className="cs-loc-fields">
                      {pinnedLoc.pincode && (
                        <LocationField label="PIN Code" value={pinnedLoc.pincode} />
                      )}
                      <LocationField
                        label="Coordinates"
                        value={`${pinnedLoc.lat}°, ${pinnedLoc.lng}°`}
                        mono
                      />
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
          background: rgba(13, 20, 40, 0.6) !important;
          border: 1px solid rgba(34, 211, 238, 0.2) !important;
          border-radius: 16px !important;
          padding: 16px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          color: white !important;
          width: 320px;
        }
        .mapboxgl-popup-tip {
          border-top-color: rgba(13, 20, 40, 0.6) !important;
          border-bottom-color: rgba(13, 20, 40, 0.6) !important;
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{label}</span>
      <span
        style={{
          fontSize: "0.75rem",
          color: "#cbd5e1",
          fontWeight: 500,
          fontFamily: mono ? "var(--font-mono,monospace)" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
