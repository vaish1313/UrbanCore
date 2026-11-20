import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navigation, MapPin, Maximize2, Compass } from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types might be missing
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { AOI } from "@/types/urbancore";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

interface BuilderMapProps {
  aoi: AOI;
  onSelectLocation?: (coords: { lat: number; lng: number }) => void;
}

export function BuilderMap({ aoi, onSelectLocation }: BuilderMapProps) {
  const [viewState, setViewState] = useState({
    longitude: aoi.coords.lng,
    latitude: aoi.coords.lat,
    zoom: 14,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update map center when selected AOI changes
  useEffect(() => {
    if (aoi && aoi.coords) {
      setViewState({
        longitude: aoi.coords.lng,
        latitude: aoi.coords.lat,
        zoom: 14,
      });
    }
  }, [aoi]);

  // Construct GeoJSON polygon feature for the selected AOI only if verified geometry exists
  const geoJsonData: GeoJSON.FeatureCollection | null = aoi.geometry?.coordinates ? {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: aoi.name,
          id: aoi.id,
        },
        geometry: {
          type: "Polygon",
          coordinates: aoi.geometry.coordinates,
        },
      },
    ],
  } : null;

  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl border border-border/80 shadow-2xl">
      {/* Map Header Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-background/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Navigation className="h-4 w-4 text-primary" />
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">
              Location Map & AOI Boundary
            </h3>
            <p className="font-mono text-[10px] text-muted-foreground uppercase">
              Selected Site: <span className="text-primary font-medium">{aoi.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
            {aoi.coords.lat.toFixed(4)}°N · {aoi.coords.lng.toFixed(4)}°E
          </span>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl border border-border/60 bg-foreground/5 p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mapbox Canvas Container */}
      <div
        className="relative w-full bg-slate-950 transition-all duration-300"
        style={{ height: isFullscreen ? "calc(100vh - 160px)" : "420px" }}
      >
        <Map
          {...viewState}
          onMove={(evt: { viewState: typeof viewState }) => setViewState(evt.viewState)}
          onClick={(evt: { lngLat: { lng: number; lat: number } }) => {
            if (onSelectLocation && evt.lngLat) {
              onSelectLocation({ lat: evt.lngLat.lat, lng: evt.lngLat.lng });
            }
          }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          cursor={onSelectLocation ? "crosshair" : "default"}
        >
          <NavigationControl position="bottom-right" />

          {/* Polygon Fill Layer - only rendered when verified polygon geometry exists */}
          {geoJsonData && (
            <Source id="selected-aoi-source" type="geojson" data={geoJsonData}>
              <Layer
                id="selected-aoi-fill"
                type="fill"
                paint={{
                  "fill-color": "#38bdf8",
                  "fill-opacity": 0.25,
                }}
              />
              <Layer
                id="selected-aoi-stroke"
                type="line"
                paint={{
                  "line-color": "#ef4444",
                  "line-width": 2.5,
                  "line-dasharray": [2, 2],
                }}
              />
              <Layer
                id="selected-aoi-stroke-inner"
                type="line"
                paint={{
                  "line-color": "#ffffff",
                  "line-width": 2,
                }}
              />
            </Source>
          )}

          {/* Marker Pin */}
          <Marker longitude={aoi.coords.lng} latitude={aoi.coords.lat} anchor="bottom">
            <div className="flex flex-col items-center group cursor-pointer">
              <span className="mb-1 rounded-md bg-background/90 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary shadow-lg border border-primary/40 backdrop-blur-md">
                {aoi.name}
              </span>
              <MapPin className="h-8 w-8 text-primary drop-shadow-[0_4px_10px_rgba(56,189,248,0.8)]" />
            </div>
          </Marker>
        </Map>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-background/80 px-3 py-1.5 backdrop-blur-md border border-border/50 text-[11px] font-mono text-muted-foreground">
          <Compass className="h-3.5 w-3.5 text-primary" />
          <span>{geoJsonData ? "Interactive AOI Vector Layer" : "Point Selected · Click map to drop pin"}</span>
        </div>
      </div>
    </div>
  );
}
