import { useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { AOI } from "@/types/urbancore";
import { HeroSearch } from "@/components/urbancore/citizen/HeroSearch";
import { SelectedSiteCard } from "@/components/urbancore/builder/SelectedSiteCard";
import { BuilderMap } from "@/components/urbancore/builder/BuilderMap";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";

export const Route = createFileRoute("/builder/overview")({
  component: OverviewRoutePage,
});

function OverviewRoutePage() {
  const { selectedAoi, setSelectedAoi } = useBuilderContext();
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const [aois, setAois] = useState<AOI[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/builder/aois")
      .then((r) => r.json())
      .then((data) => setAois(data.aois))
      .catch((err) => console.error("Failed to load AOIs", err));
  }, []);

  const scrollToMap = useCallback(() => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleChangeLocation = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const input = document.getElementById("hero-search-input") as HTMLInputElement | null;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleSearch = useCallback(
    (suggestion: { id?: string; label: string; lat: number; lng: number; selectionSource?: "canonical-aoi" | "map-selected" }) => {
      const qLower = suggestion.label.toLowerCase().trim();
      const matched =
        (suggestion.id ? aois.find((a) => a.id.toLowerCase() === suggestion.id?.toLowerCase()) : undefined) ||
        aois.find((a) => a.id.toLowerCase() === qLower || a.name.toLowerCase() === qLower) ||
        aois.find(
          (a) =>
            a.name.toLowerCase().includes(qLower) ||
            (a.location && a.location.toLowerCase().includes(qLower)) ||
            a.id.toLowerCase().includes(qLower) ||
            qLower.includes(a.name.toLowerCase()),
        );

      if (matched) {
        setSelectedAoi({
          ...matched,
          selectionSource: "canonical-aoi",
        });
      } else {
        const customAoi: AOI = {
          id: `aoi-${Date.now()}`,
          name: suggestion.label,
          location: suggestion.label,
          category: "residential",
          coords: {
            lat: suggestion.lat,
            lng: suggestion.lng,
            x: 50,
            y: 50,
          },
          selectionSource: "map-selected",
          suitabilityScore: 0,
          terrain: {
            elevation: Number.NaN,
            slope: Number.NaN,
            roughness: "Pending Screening",
            flatLandPercent: Number.NaN,
            readiness: "LOW",
          },
          accessibilityScore: 0,
          waterAvailabilityScore: 0,
          environmentalRiskScore: 0,
          developmentPotentialScore: 0,
          constructionHistory: [],
          constraints: {
            floodZoneOverlapPercent: 0,
            forestBoundaryOverlapPercent: 0,
            greenBeltOverlapPercent: 0,
            protectedAreaOverlapPercent: 0,
            environmentalRestriction: "Low",
          },
          summary: `Preliminary coordinate screening for selected location (${suggestion.lat.toFixed(4)}°N, ${suggestion.lng.toFixed(4)}°E). Parcel boundary polygon not registered.`,
        };
        setSelectedAoi(customAoi);
      }
      scrollToMap();
    },
    [aois, setSelectedAoi, scrollToMap],
  );

  const handleMapClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      handleSearch({
        label: `Pinned Location (${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E)`,
        lat: coords.lat,
        lng: coords.lng,
        selectionSource: "map-selected",
      });
    },
    [handleSearch],
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Hero Search */}
      <HeroSearch
        mode="builder"
        badgeText="AI URBAN INTELLIGENCE · NASHIK 2026"
        titlePrefix="Builder"
        titleSuffix="Intelligence"
        subtitle="Explore your site using satellite intelligence, analyze land suitability, monitor development, and generate AI-powered location insights."
        onSearch={handleSearch}
        onDropPin={scrollToMap}
      />

      {/* Selected Site Information Card & Interactive Location Map */}
      <div ref={mapSectionRef} className="w-full flex flex-col gap-6">
        <SelectedSiteCard aoi={selectedAoi} onChangeLocation={handleChangeLocation} />
        <BuilderMap aoi={selectedAoi} onSelectLocation={handleMapClick} />
      </div>
    </div>
  );
}
