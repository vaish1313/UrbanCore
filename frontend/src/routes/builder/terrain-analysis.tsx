import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { SiteReadiness } from "@/components/urbancore/builder/SiteReadiness";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderPageHeader } from "@/components/urbancore/builder/BuilderPageHeader";

export const Route = createFileRoute("/builder/terrain-analysis")({
  component: TerrainAnalysisRoutePage,
});

function TerrainAnalysisRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <BuilderPageHeader
        title="Site Readiness Analysis"
        subtitle="Topographical terrain evaluation, elevation profiling, slope gradients, and construction readiness"
        icon={Activity}
      />
      <SiteReadiness aoi={selectedAoi} />
    </div>
  );
}
