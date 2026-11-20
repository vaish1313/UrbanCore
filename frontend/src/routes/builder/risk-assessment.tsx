import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { AreaComparison } from "@/components/urbancore/builder/AreaComparison";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderPageHeader } from "@/components/urbancore/builder/BuilderPageHeader";

export const Route = createFileRoute("/builder/risk-assessment")({
  component: RiskAssessmentRoutePage,
});

function RiskAssessmentRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <BuilderPageHeader
        title="Neighbourhood Comparison"
        subtitle="Cross-district locational benchmarking, infrastructure access, and spatial readiness comparison"
        icon={TrendingUp}
      />
      <AreaComparison aoi={selectedAoi} />
    </div>
  );
}
