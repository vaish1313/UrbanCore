/**
 * MapPage — Primary application view
 *
 * Full-screen map with:
 * - Deck.gl layers for footprints, zones, change records
 * - MapLibre GL JS base map (OSM tiles)
 * - Left panel: Layer controls, job list
 * - Right panel: Analysis submission, results
 * - Bottom bar: AOI drawing toolbar
 */

import { useState, useCallback } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@shared/api/client';
import { useAuthStore } from '@features/auth/store/authStore';
import { JobProgressPanel } from '@features/analysis/components/JobProgressPanel';
import { LayerControlPanel } from '@features/map/components/LayerControlPanel';
import { AnalysisSubmitPanel } from '@features/analysis/components/AnalysisSubmitPanel';
import styles from './MapPage.module.css';

const TILE_SERVER_URL = import.meta.env.VITE_TILE_SERVER_URL || 'http://localhost:3001';

const INITIAL_VIEW_STATE = {
  longitude: 77.5946,  // Bangalore default
  latitude: 12.9716,
  zoom: 12,
  pitch: 30,           // Slight 3D tilt for modern look
  bearing: 0,
};

export function MapPage() {
  const user = useAuthStore((s) => s.user);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [footprintsData, setFootprintsData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [zonesData, setZonesData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);

  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list({ status: 'completed', pageSize: 10 }),
    enabled: !!user,
  });

  // ─── Deck.gl Layers ─────────────────────────────────────────
  const layers = [
    // Zoning overlay (semi-transparent fill)
    zonesData &&
      new GeoJsonLayer({
        id: 'zones-layer',
        data: zonesData,
        filled: true,
        stroked: true,
        getFillColor: (f: any) => {
          const type = f.properties?.zone_type;
          if (type === 'protected') return [239, 68, 68, 60];
          if (type === 'agricultural') return [245, 158, 11, 50];
          if (type === 'forest') return [16, 185, 129, 60];
          return [100, 116, 139, 40];
        },
        getLineColor: (f: any) => {
          const type = f.properties?.zone_type;
          if (type === 'protected') return [239, 68, 68, 200];
          if (type === 'agricultural') return [245, 158, 11, 200];
          return [100, 116, 139, 150];
        },
        lineWidthMinPixels: 1,
        pickable: true,
      }),

    // Building footprints
    footprintsData &&
      new GeoJsonLayer({
        id: 'footprints-layer',
        data: footprintsData,
        filled: true,
        stroked: true,
        extruded: false,
        getFillColor: (f: any) => {
          const confidence = f.properties?.confidence ?? 0.5;
          return [59, 130, 246, Math.round(confidence * 180)];
        },
        getLineColor: [59, 130, 246, 255],
        lineWidthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        highlightColor: [6, 182, 212, 200],
      }),
  ].filter(Boolean) as any[];

  return (
    <div className={styles.mapContainer}>
      {/* ─── Map Base ──────────────────────────────────────── */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }: any) => setViewState(vs)}
        controller={true}
        layers={layers}
        getCursor={() => 'crosshair'}
      >
        <Map
          mapStyle={{
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [
              {
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm-tiles',
                paint: { 'raster-opacity': 0.5 },  // Darkened for UI contrast
              },
            ],
          }}
        >
          <NavigationControl position="bottom-right" />
        </Map>
      </DeckGL>

      {/* ─── Layer Controls Panel (Left) ────────────────────── */}
      <LayerControlPanel
        onToggleFootprints={() => {}}
        onToggleZones={() => {}}
        onToggleTerrain={() => {}}
      />

      {/* ─── Analysis Submit Panel (Top Right) ─────────────── */}
      <button
        id="btn-new-analysis"
        className={styles.newAnalysisBtn}
        onClick={() => setShowAnalysisPanel(true)}
      >
        + New Analysis
      </button>

      {showAnalysisPanel && (
        <AnalysisSubmitPanel
          onClose={() => setShowAnalysisPanel(false)}
          onJobCreated={(jobId) => {
            setActiveJobId(jobId);
            setShowAnalysisPanel(false);
          }}
        />
      )}

      {/* ─── Job Progress Panel (Bottom) ────────────────────── */}
      {activeJobId && (
        <JobProgressPanel
          jobId={activeJobId}
          onClose={() => setActiveJobId(null)}
        />
      )}
    </div>
  );
}
