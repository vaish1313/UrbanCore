import { createFileRoute } from "@tanstack/react-router";
import { SuitabilityScore } from "@/components/urbancore/builder/SuitabilityScore";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/land-suitability")({
  component: LandSuitabilityRoutePage,
});

function LandSuitabilityRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Land Suitability" />
      <SuitabilityScore aoi={selectedAoi} />
    </div>
  );
}
