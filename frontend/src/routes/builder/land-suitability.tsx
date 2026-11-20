import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { SuitabilityScore } from "@/components/urbancore/builder/SuitabilityScore";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderPageHeader } from "@/components/urbancore/builder/BuilderPageHeader";

export const Route = createFileRoute("/builder/land-suitability")({
  component: LandSuitabilityRoutePage,
});

function LandSuitabilityRoutePage() {
  const { selectedAoi, setIsReportOpen } = useBuilderContext();
  return (
    <div className="w-full">
      <BuilderPageHeader
        title="AI Land Suitability Score"
        subtitle="Multi-criteria GIS screening, slope and terrain suitability, and regulatory restriction assessment"
        icon={SlidersHorizontal}
      />
      <SuitabilityScore aoi={selectedAoi} onGenerateReport={() => setIsReportOpen(true)} />
    </div>
  );
}
