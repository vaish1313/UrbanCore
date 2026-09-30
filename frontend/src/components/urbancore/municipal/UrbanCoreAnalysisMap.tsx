import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Satellite, Eye, Layers, MapPin, AlertCircle } from "lucide-react";
// @ts-expect-error react-map-gl/mapbox types
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { GrowthTimeline } from "../GrowthTimeline";
import { useAnalysisYearResult, useAnalysisGeoJSON } from "@/hooks/use-analysis";
import type { AnalysisData } from "@/hooks/use-analysis";

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  "pk.eyJ1IjoidmFpc2gxMzEzIiwiYSI6ImNtdTZuZTA5ZzBjZnMyeHNsY29xenc2N2wifQ.zVsfaUatB1-4H5ieoAfmsA";

interface UrbanCoreAnalysisMapProps {
  analysis: AnalysisData;
  className?: string;
}

export function UrbanCoreAnalysisMap({ analysis, className = "" }: UrbanCoreAnalysisMapProps) {
  const [selectedYear, setSelectedYear] = useState<number>(
    analysis.years[analysis.years.length - 1] || 2025
  );
  const [viewState, setViewState] = useState({
    latitude: analysis.latitude,
    longitude: analysis.longitude,
    zoom: 15,
    pitch: 0,
    bearing: 0,
  });

  const { data: yearResult, isLoading: isLoadingYear } = useAnalysisYearResult(
    analysis.id,
    selectedYear
  );

  const { data: constructionGeoJSON, isLoading: isLoadingGeoJSON } = useAnalysisGeoJSON(
    analysis.id,
    selectedYear,
    "inference"
  );

  // Update selected year when analysis changes
  useEffect(() => {
    const latestYear = analysis.years[analysis.years.length - 1];
    if (latestYear && latestYear !== selectedYear) {
      setSelectedYear(latestYear);
    }
  }, [analysis.years]);

  // Update viewport when analysis location changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: analysis.latitude,
      longitude: analysis.longitude,
    }));
  }, [analysis.latitude, analysis.longitude]);

  const yearInferenceData = analysis.inference_results?.[selectedYear.toString()];
  const currentVisualizationData = analysis.visualization_results?.[selectedYear.toString()];

  const isLoading = isLoadingYear || isLoadingGeoJSON;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Map Container */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {/* Map Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
              SATELLITE ANALYSIS ({analysis.start_year}–{analysis.end_year})
            </span>
            <h3 className="font-display text-lg font-medium text-foreground">
              Construction Heatmap · {selectedYear}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
              <Satellite className="h-3.5 w-3.5" />
              U-Net Analysis
            </span>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative h-[600px] bg-slate-950">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            cursor="default"
          >
            <NavigationControl position="top-right" />

            {/* Analysis boundary circle */}
            <Source
              id="analysis-boundary"
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [analysis.longitude, analysis.latitude],
                    },
                    properties: {},
                  },
                ],
              }}
            >
              <Layer
                id="analysis-boundary-circle"
                type="circle"
                paint={{
                  "circle-radius": {
                    stops: [
                      [0, 0],
                      [20, Math.sqrt(analysis.radius_m / Math.PI) / 10], // Approximate visual radius
                    ],
                  },
                  "circle-color": "rgba(114, 180, 255, 0.1)",
                  "circle-stroke-color": "rgba(114, 180, 255, 0.6)",
                  "circle-stroke-width": 2,
                }}
              />
            </Source>

            {/* Construction data visualization */}
            {constructionGeoJSON && (
              <Source id="construction-data" type="geojson" data={constructionGeoJSON}>
                {/* Fill layer for construction polygons */}
                <Layer
                  id="construction-fill"
                  type="fill"
                  paint={{
                    "fill-color": [
                      "case",
                      ["==", ["get", "class"], "construction"],
                      "#FF6B6B", // Red for construction areas
                      "#22C55E" // Green fallback
                    ],
                    "fill-opacity": [
                      "case",
                      ["==", ["get", "class"], "construction"],
                      0.6,
                      0.4
                    ]
                  }}
                />
                {/* Stroke layer for construction polygon borders */}
                <Layer
                  id="construction-stroke"
                  type="line"
                  paint={{
                    "line-color": [
                      "case",
                      ["==", ["get", "class"], "construction"],
                      "#DC2626", // Darker red for borders
                      "#16A34A"
                    ],
                    "line-width": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10, 0.5,
                      16, 2
                    ],
                    "line-opacity": 0.8
                  }}
                />
              </Source>
            )}
          </Map>

          {/* Loading overlay */}
          {isLoading && (
            <motion.div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="glass-panel rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-foreground">Loading {selectedYear} data...</span>
              </div>
            </motion.div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 glass-panel rounded-2xl p-4 max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">
                Legend
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500/60 border border-red-600 rounded-sm"></div>
                <span className="text-muted-foreground">Construction areas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full border-2 border-primary/60 bg-transparent"></div>
                <span className="text-muted-foreground">Analysis boundary</span>
              </div>
              <div className="mt-2 pt-2 border-t border-border/20">
                <span className="text-[10px] text-muted-foreground/80">
                  Polygons show actual detected construction footprints from U-Net analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Year Information Panel */}
      {yearInferenceData && (
        <motion.div
          key={selectedYear}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Construction Percentage */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Built-up Area
              </span>
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {yearInferenceData.construction_percentage.toFixed(1)}
              </span>
              <span className="text-lg text-primary">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              of {analysis.radius_m}m radius area
            </p>
          </div>

          {/* Construction Pixels */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Detected Pixels
              </span>
              <MapPin className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {yearInferenceData.construction_pixels.toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              of {yearInferenceData.total_pixels.toLocaleString()} total
            </p>
          </div>

          {/* Year Indicator */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                Analysis Year
              </span>
              <Satellite className="h-4 w-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {selectedYear}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Sentinel-2 imagery
            </p>
          </div>
        </motion.div>
      )}

      {/* Timeline Controller */}
      <GrowthTimeline
        years={analysis.years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        visible={true}
        showPlayPause={true}
      />

      {/* Error State */}
      {!yearInferenceData && !isLoading && analysis.status === "completed" && (
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>No visualization data available for {selectedYear}</span>
          </div>
        </div>
      )}
    </div>
  );
}