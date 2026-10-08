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
    (suggestion: { label: string; lat: number; lng: number }) => {
      const qLower = suggestion.label.toLowerCase();
      const matched = aois.find(
        (a) =>
          a.name.toLowerCase().includes(qLower) ||
          (a.location && a.location.toLowerCase().includes(qLower)) ||
          a.id.toLowerCase().includes(qLower),
      );

      if (matched) {
        setSelectedAoi(matched);
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
          suitabilityScore: 82,
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
          summary: `Site intelligence analysis for ${suggestion.label}.`,
        };
        setSelectedAoi(customAoi);
      }
      scrollToMap();
    },
    [setSelectedAoi, scrollToMap],
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
        <BuilderMap aoi={selectedAoi} />
      </div>
    </div>
  );
}
