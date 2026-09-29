/**
 * /municipal/district-map — District Map page.
 * Renders only the DistrictMap section from MunicipalGISDashboard,
 * isolated as its own page so nothing else is mounted.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Satellite, Layers, Flame, RefreshCw } from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/district-map")({
  head: () => ({
    meta: [{ title: "District Map — Municipal Authority" }],
  }),
  component: DistrictMapPage,
});

const MAPBOX_TOKEN =
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

const PANEL: React.CSSProperties = {
  background: "rgba(13,20,40,0.72)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: 20,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 4px 32px rgba(0,0,0,0.35)",
};

function DistrictMapPage() {
  const navigate = useNavigate();
  const [activeLayer, setActiveLayer] = useState<"heatmap" | "satellite" | "zoning">("satellite");
  const [viewState, setViewState] = useState({
    longitude: 73.78,
    latitude: 20.005,
    zoom: 11,
  });

  return (
    <MunicipalPageShell
      eyebrow="District Overview Map"
      eyebrowIcon={<Satellite size={13} />}
      title="Nashik District – 30 Monitored AOIs"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <motion.div
        whileHover={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
        style={{ ...PANEL, overflow: "hidden", position: "relative", height: 560 }}
      >
        {/* Layer toggles */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 10,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              { id: "heatmap", icon: <Flame size={13} />, label: "Heatmap" },
              { id: "satellite", icon: <Satellite size={13} />, label: "Satellite" },
              { id: "zoning", icon: <Layers size={13} />, label: "Zoning Layer" },
            ] as const
          ).map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActiveLayer(l.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 999,
                cursor: "pointer",
                backdropFilter: "blur(12px)",
                fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                border:
                  activeLayer === l.id
                    ? "1px solid rgba(34,211,238,0.5)"
                    : "1px solid rgba(255,255,255,0.1)",
                background: activeLayer === l.id ? "rgba(34,211,238,0.15)" : "rgba(13,20,40,0.72)",
                color: activeLayer === l.id ? "#22d3ee" : "#94a3b8",
                fontWeight: activeLayer === l.id ? 700 : 500,
                boxShadow: activeLayer === l.id ? "0 0 14px rgba(34,211,238,0.18)" : "none",
              }}
            >
              {l.icon}
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setViewState((v) => ({ ...v, zoom: 11 }))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              cursor: "pointer",
              backdropFilter: "blur(12px)",
              fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
              fontSize: "0.78rem",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(13,20,40,0.72)",
              color: "#64748b",
            }}
          >
            <RefreshCw size={13} /> Reset View
          </button>
        </div>

        <Map
          {...viewState}
          onMove={(evt: { viewState: typeof viewState }) => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="bottom-right" />
        </Map>

        {/* Status bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(13,20,40,0.82)",
            backdropFilter: "blur(12px)",
            padding: "10px 20px",
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            fontFamily: "var(--font-mono,'JetBrains Mono',monospace)",
            fontSize: 11,
            color: "#64748b",
          }}
        >
          <span>
            CENTER: {viewState.latitude.toFixed(4)}° N, {viewState.longitude.toFixed(4)}° E
          </span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span>ZOOM: {viewState.zoom.toFixed(1)}</span>
          <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
          <span style={{ color: "#22d3ee", fontWeight: 700 }}>30 AOIs MONITORED</span>
        </div>
      </motion.div>
    </MunicipalPageShell>
  );
}
