import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Maximize2, Plus, Minus } from "lucide-react";
import { TIMELINE_SAMPLE_DATA, SAMPLE_CENTER } from "@/data/timelineSampleData";

export function ConstructionTimelineStatic() {
  const [selectedYear, setSelectedYear] = useState(TIMELINE_SAMPLE_DATA[2].year); // Start at 2023
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedData = TIMELINE_SAMPLE_DATA.find((d) => d.year === selectedYear) || TIMELINE_SAMPLE_DATA[2];
  const yearIndex = TIMELINE_SAMPLE_DATA.findIndex((d) => d.year === selectedYear);
  const minYear = TIMELINE_SAMPLE_DATA[0].year;
  const maxYear = TIMELINE_SAMPLE_DATA[TIMELINE_SAMPLE_DATA.length - 1].year;

  // Play animation
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSelectedYear((current) => {
          const currentIndex = TIMELINE_SAMPLE_DATA.findIndex((d) => d.year === current);
          if (currentIndex < TIMELINE_SAMPLE_DATA.length - 1) {
            return TIMELINE_SAMPLE_DATA[currentIndex + 1].year;
          } else {
            setIsPlaying(false);
            return current;
          }
        });
      }, 1500);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Fullscreen handler
  const handleFullscreen = async () => {
    if (fullscreenRef.current) {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          await fullscreenRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    }
  };

  // Mapbox Static Image URL
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const mapboxUrl = mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${SAMPLE_CENTER.lng},${SAMPLE_CENTER.lat},14,0/800x600@2x?access_token=${mapboxToken}`
    : null;

  return (
    <div
      ref={fullscreenRef}
      className={`${isFullscreen ? "fixed inset-0 z-50" : ""} bg-gradient-to-b from-slate-950 to-slate-900 ${isFullscreen ? "p-0" : "p-6"}`}
    >
      <div className="max-w-full mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .25m0 0H5m12 0a2 2 0 002-2v-4a2 2 0 00-2-2h-.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Construction Timeline ({minYear} - {maxYear})</h1>
              <p className="text-sm text-slate-400">Year-by-year construction growth with AI detection (U-Net)</p>
            </div>
          </div>
        </div>

        {/* YEAR CARDS ROW */}
        <div className="mb-8 flex items-center gap-4 overflow-x-auto pb-4">
          <button
            onClick={() => {
              if (yearIndex > 0) setSelectedYear(TIMELINE_SAMPLE_DATA[yearIndex - 1].year);
            }}
            disabled={yearIndex === 0}
            className="p-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300" />
          </button>

          <div className="flex gap-3 flex-shrink-0">
            {TIMELINE_SAMPLE_DATA.map((data) => (
              <button
                key={data.year}
                onClick={() => setSelectedYear(data.year)}
                className={`flex flex-col gap-2 p-3 rounded-lg transition border-2 ${
                  selectedYear === data.year
                    ? "border-cyan-400 bg-cyan-500/10"
                    : "border-slate-600 bg-slate-800/50 hover:bg-slate-700/50"
                }`}
              >
                {/* Year Badge */}
                <div className="text-xs font-bold text-slate-300">{data.year}</div>

                {/* Thumbnail SVG */}
                <div className="w-24 h-16 bg-gradient-to-b from-slate-700 to-slate-800 rounded flex items-center justify-center overflow-hidden border border-slate-600">
                  <svg
                    viewBox="0 0 400 300"
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <defs>
                      <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#475569" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="400" height="300" fill="url(#gridPattern)" opacity="0.3" />
                    <path d={data.svgPath} fill="#ef4444" opacity="0.7" />
                  </svg>
                </div>

                {/* Progress Bar */}
                <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${data.construction_percentage}%` }}
                  />
                </div>

                {/* Built-up Label */}
                <div className="text-xs text-slate-300">Built-up: {data.construction_percentage.toFixed(1)}%</div>

                {/* Expand Icon */}
                <div className="flex justify-center pt-1">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6m4 0l6-6m0 0h-6v6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (yearIndex < TIMELINE_SAMPLE_DATA.length - 1) setSelectedYear(TIMELINE_SAMPLE_DATA[yearIndex + 1].year);
            }}
            disabled={yearIndex === TIMELINE_SAMPLE_DATA.length - 1}
            className="p-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex-shrink-0"
          >
            <ChevronRight className="w-6 h-6 text-slate-300" />
          </button>
        </div>

        {/* MAP PANEL */}
        <div
          ref={mapContainerRef}
          className={`relative mb-8 rounded-lg overflow-hidden border border-slate-600 ${isFullscreen ? "h-screen" : "h-96"}`}
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {/* Map Image or Fallback */}
          {mapboxUrl ? (
            <img
              src={mapboxUrl}
              alt="Satellite map"
              className="w-full h-full object-cover"
              onError={() => {
                // Fallback to gradient
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
          )}

          {/* SVG Overlay */}
          <svg
            viewBox="0 0 400 300"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid slice"
            pointerEvents="none"
          >
            <path d={selectedData.svgPath} fill="#ef4444" opacity="0.6" />
          </svg>

          {/* Top-left Label */}
          <div className="absolute top-4 left-4 bg-black/60 px-3 py-2 rounded text-sm text-white">
            <div className="font-semibold">{selectedYear}</div>
            <div className="text-xs text-slate-300">Built-up: {selectedData.construction_percentage.toFixed(1)}%</div>
          </div>

          {/* Top-right Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition text-slate-300"
              title="Zoom out"
            >
              <Minus size={20} />
            </button>
            <button
              onClick={() => setScale(Math.min(2, scale + 0.2))}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition text-slate-300"
              title="Zoom in"
            >
              <Plus size={20} />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 rounded-lg transition text-slate-300"
              title="Fullscreen"
            >
              <Maximize2 size={20} />
            </button>
          </div>

          {/* Bottom-right Legend */}
          <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-2 rounded text-xs text-slate-300 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span>Red color denotes built-up overlay (U-Net)</span>
          </div>
        </div>

        {/* PLAY/PAUSE & SLIDER */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition text-cyan-400"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={TIMELINE_SAMPLE_DATA.length - 1}
              value={yearIndex}
              onChange={(e) => {
                setSelectedYear(TIMELINE_SAMPLE_DATA[parseInt(e.target.value)].year);
                setIsPlaying(false);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <span className="text-sm text-slate-400">{selectedYear}</span>
        </div>

        {/* SAMPLE BADGE */}
        <div className="inline-block bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs px-3 py-1 rounded-full">
          Sample preview data
        </div>
      </div>
    </div>
  );
}
