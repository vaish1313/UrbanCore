import { useState } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";
import { NASHIK_AOIS } from "@/data/nashikAois";
import type { AOI } from "@/types/urbancore";

export function SiteSearch({
  selectedAoi,
  onSelectAoi,
}: {
  selectedAoi: AOI;
  onSelectAoi: (aoi: AOI) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = NASHIK_AOIS.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative w-full">
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
          placeholder="Search location, AOI, coordinates or parcel (e.g. Gangapur Road, CBS, Anjaneri)..."
          className="w-full bg-transparent text-sm font-light text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
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
        {NASHIK_AOIS.slice(0, 6).map((aoi) => (
          <button
            key={aoi.id}
            type="button"
            onClick={() => onSelectAoi(aoi)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors duration-300 ${
              selectedAoi.id === aoi.id
                ? "border-primary bg-primary/20 text-primary font-medium shadow-[0_0_10px_rgba(114,180,255,0.2)]"
                : "border-border/60 bg-foreground/[0.02] text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {aoi.name}
          </button>
        ))}
      </div>

      {/* Search Dropdown Results */}
      {isOpen && query && (
        <div className="glass-panel absolute left-0 right-0 top-14 z-50 max-h-64 overflow-y-auto rounded-2xl p-2 shadow-2xl">
          {filtered.length > 0 ? (
            filtered.map((aoi) => (
              <button
                key={aoi.id}
                type="button"
                onClick={() => {
                  onSelectAoi(aoi);
                  setQuery("");
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/10"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <span className="block text-xs font-medium text-foreground">{aoi.name}</span>
                    <span className="block font-mono text-[10px] text-muted-foreground uppercase">{aoi.category} · {aoi.terrain.roughness}</span>
                  </div>
                </div>
                <span className="font-mono text-xs font-semibold text-accent">
                  {aoi.suitabilityScore}/100
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center font-mono text-xs text-muted-foreground">
              No matching Nashik AOIs found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
