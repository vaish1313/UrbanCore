import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Sparkles, Check, Loader2 } from "lucide-react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";

const API_BASE_URL = "http://localhost:8000/api/v1";

export function SiteSearch({
  selectedAoi,
  onSelectAoi,
}: {
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<AOI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/aois/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (response.ok) {
          const data = await response.json();
          const apiResults = data.results || [];

          // Map backend items to frontend AOI objects or find matching NASHIK_AOIS
          const mappedResults: AOI[] = apiResults.map(
            (item: {
              id: string;
              name: string;
              location?: string;
              latitude?: number;
              longitude?: number;
              geometry?: { type: "Polygon"; coordinates: number[][][] };
              category?: string;
              suitability_score?: number;
            }) => {
              const existing = NASHIK_AOIS.find((a) => a.id === item.id);
              if (existing) {
                return {
                  ...existing,
                  location: item.location || existing.location || "Nashik, Maharashtra",
                  geometry: item.geometry || existing.geometry,
                };
              }
              return {
                id: item.id || `aoi-${Date.now()}`,
                name: item.name || "Unknown Plot",
                location: item.location || "Nashik, Maharashtra",
                category: (item.category as AOI["category"]) || "residential",
                coords: {
                  lat: item.latitude || 20.0094,
                  lng: item.longitude || 73.7635,
                  x: 50,
                  y: 50,
                },
                geometry: item.geometry,
                suitabilityScore: item.suitability_score || 80,
                terrain: {
                  elevation: 600,
                  slope: 5,
                  roughness: "Flat Plains",
                  flatLandPercent: 85,
                  readiness: "HIGH",
                },
                accessibilityScore: 85,
                waterAvailabilityScore: 80,
                environmentalRiskScore: 85,
                developmentPotentialScore: 85,
                constructionHistory: [],
                constraints: {
                  floodZoneOverlapPercent: 0,
                  forestBoundaryOverlapPercent: 0,
                  greenBeltOverlapPercent: 0,
                  protectedAreaOverlapPercent: 0,
                  environmentalRestriction: "Low",
                },
                summary: "Location retrieved from backend query.",
              };
            },
          );

          setResults(mappedResults);
        } else {
          throw new Error("API error");
        }
      } catch (err: unknown) {
        console.warn("Backend AOI search unavailable. Falling back to local dataset.", err);
        // Fallback local case-insensitive partial search
        const qLower = query.toLowerCase().trim();
        const filtered = NASHIK_AOIS.filter(
          (a) =>
            a.name.toLowerCase().includes(qLower) ||
            a.category.toLowerCase().includes(qLower) ||
            (a.location && a.location.toLowerCase().includes(qLower)) ||
            a.summary.toLowerCase().includes(qLower),
        );
        setResults(filtered);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={searchContainerRef} className="relative w-full">
      <div className="glass-panel group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(114,180,255,0.15)]">
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder="Search plot, AOI or location (e.g. Gangapur Road, Panchavati, Pathardi Phata, CIDCO)..."
          className="w-full bg-transparent text-sm font-light text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {isLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested Quick Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" /> Sample AOIs:
        </span>
        {NASHIK_AOIS.slice(0, 6).map((aoi) => {
          const isSelected = selectedAoi.id === aoi.id;
          return (
            <button
              key={aoi.id}
              type="button"
              onClick={() => {
                onSelectAoi(aoi);
                setIsOpen(false);
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition-colors duration-300 ${
                isSelected
                  ? "border-primary bg-primary/20 text-primary font-medium shadow-[0_0_10px_rgba(114,180,255,0.2)]"
                  : "border-border/60 bg-foreground/[0.02] text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-primary" />}
              {aoi.name}
            </button>
          );
        })}
      </div>

      {/* Search Dropdown Results */}
      {isOpen && query.trim().length > 0 && (
        <div className="glass-panel absolute left-0 right-0 top-14 z-50 max-h-64 overflow-y-auto rounded-2xl p-2 shadow-2xl backdrop-blur-xl border border-border/80">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-4 font-mono text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Searching...
            </div>
          ) : error ? (
            <div className="p-4 text-center font-mono text-xs text-red-400">
              Unable to search locations. Please try again.
            </div>
          ) : results.length > 0 ? (
            results.map((aoi) => {
              const isSelected = selectedAoi.id === aoi.id;
              return (
                <button
                  key={aoi.id}
                  type="button"
                  onClick={() => {
                    onSelectAoi(aoi);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-primary/20 border border-primary/30" : "hover:bg-primary/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="block text-xs font-medium text-foreground">
                          {aoi.name}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-primary/30 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-primary">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                      <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                        {aoi.location || "Nashik, Maharashtra"} · {aoi.category}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-accent shrink-0">
                    {aoi.suitabilityScore}/100
                  </span>
                </button>
              );
            })
          ) : (
            <div className="p-4 text-center font-mono text-xs text-muted-foreground">
              <p className="font-medium text-foreground/80">No matching locations found</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Try another AOI or location name.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
