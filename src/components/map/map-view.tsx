/**
 * Leaflet map surface.
 *
 * Browser-only: it is loaded lazily behind <ClientOnly> so Leaflet never runs
 * during SSR. The component is deliberately "dumb" — all AOI state lives in
 * the workspace route; this file only renders and reports interactions.
 */
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polygon,
  Polyline,
  CircleMarker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";

import "leaflet/dist/leaflet.css";

import { NASHIK, formatArea, toLeafletRings } from "@/lib/geo";
import type { MultiPolygonGeometry } from "@/lib/geo";
import type { AoiRecord } from "@/lib/aoi.types";

export interface MapFocus {
  /** Increments to re-trigger the same focus target. */
  nonce: number;
  center?: { lat: number; lng: number };
  bbox?: [number, number, number, number];
  zoom?: number;
}

export interface MapViewProps {
  aois: AoiRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  drawing: boolean;
  drawPoints: { lat: number; lng: number }[];
  draft: MultiPolygonGeometry | null;
  pin: { lat: number; lng: number } | null;
  focus: MapFocus | null;
  onMapClick: (lat: number, lng: number) => void;
  onPointerMove?: ((lat: number, lng: number) => void) | undefined;
}

function MapEvents({
  onMapClick,
  onPointerMove,
}: Pick<MapViewProps, "onMapClick" | "onPointerMove">) {
  useMapEvents({
    click: (event) => onMapClick(event.latlng.lat, event.latlng.lng),
    mousemove: (event) => onPointerMove?.(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

function FocusController({ focus }: { focus: MapFocus | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    if (focus.bbox) {
      const [west, south, east, north] = focus.bbox;
      const bounds: LatLngBoundsExpression = [
        [south, west],
        [north, east],
      ];
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
      return;
    }
    if (focus.center) {
      map.flyTo([focus.center.lat, focus.center.lng], focus.zoom ?? 16, { duration: 0.8 });
    }
  }, [focus, map]);
  return null;
}

function CursorMode({ drawing }: { drawing: boolean }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.classList.toggle("uc-draw-cursor", drawing);
    return () => container.classList.remove("uc-draw-cursor");
  }, [drawing, map]);
  return null;
}

export default function MapView({
  aois,
  selectedId,
  onSelect,
  drawing,
  drawPoints,
  draft,
  pin,
  focus,
  onMapClick,
  onPointerMove,
}: MapViewProps) {
  const draftRings = useMemo(() => (draft ? toLeafletRings(draft) : []), [draft]);
  const drawLine = useMemo(
    () => drawPoints.map((p) => [p.lat, p.lng] as [number, number]),
    [drawPoints],
  );

  return (
    <MapContainer
      center={[NASHIK.center.lat, NASHIK.center.lng]}
      zoom={NASHIK.defaultZoom}
      minZoom={5}
      maxZoom={19}
      zoomControl
      className="h-full w-full"
      preferCanvas
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Street map">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxNativeZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Labels">
          <TileLayer
            url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
            attribution=""
            opacity={0.5}
          />
        </LayersControl.Overlay>
      </LayersControl>

      <MapEvents onMapClick={onMapClick} onPointerMove={onPointerMove} />
      <FocusController focus={focus} />
      <CursorMode drawing={drawing} />

      {aois.map((aoi) => {
        const selected = aoi.id === selectedId;
        return (
          <Polygon
            key={aoi.id}
            positions={toLeafletRings(aoi.geojson)}
            pathOptions={{
              color: selected ? "#5fe3e0" : "#7fb2c9",
              weight: selected ? 3 : 1.6,
              fillOpacity: selected ? 0.22 : 0.1,
              fillColor: selected ? "#5fe3e0" : "#7fb2c9",
            }}
            eventHandlers={{ click: () => onSelect(aoi.id) }}
          >
            <Tooltip direction="top" sticky>
              <span className="font-medium">{aoi.name}</span> · {formatArea(aoi.area_sqm)}
            </Tooltip>
          </Polygon>
        );
      })}

      {draftRings.map((rings, index) => (
        <Polygon
          key={`draft-${index}`}
          positions={rings}
          pathOptions={{
            color: "#ffc766",
            weight: 2,
            dashArray: "6 4",
            fillColor: "#ffc766",
            fillOpacity: 0.15,
          }}
        />
      ))}

      {drawing && drawLine.length > 1 ? (
        <Polyline positions={drawLine} pathOptions={{ color: "#ffc766", weight: 2 }} />
      ) : null}

      {drawing
        ? drawPoints.map((point, index) => (
            <CircleMarker
              key={`vertex-${index}`}
              center={[point.lat, point.lng]}
              radius={4}
              pathOptions={{ color: "#ffc766", fillColor: "#1b232e", fillOpacity: 1, weight: 2 }}
            />
          ))
        : null}

      {pin ? (
        <CircleMarker
          center={[pin.lat, pin.lng]}
          radius={7}
          pathOptions={{ color: "#5fe3e0", fillColor: "#5fe3e0", fillOpacity: 0.4, weight: 2 }}
        >
          <Tooltip permanent direction="top" offset={[0, -8]}>
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </Tooltip>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}