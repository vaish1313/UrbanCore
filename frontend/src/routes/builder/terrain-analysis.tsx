import { createFileRoute } from "@tanstack/react-router";
import { SiteReadiness } from "@/components/urbancore/builder/SiteReadiness";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/terrain-analysis")({
  component: TerrainAnalysisRoutePage,
});

function TerrainAnalysisRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Terrain Analysis" />
      <SiteReadiness aoi={selectedAoi} />
    </div>
  );
}
