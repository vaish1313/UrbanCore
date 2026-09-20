import { createFileRoute } from "@tanstack/react-router";
import { AreaComparison } from "@/components/urbancore/builder/AreaComparison";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/risk-assessment")({
  component: RiskAssessmentRoutePage,
});

function RiskAssessmentRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Risk Assessment" />
      <AreaComparison aoi={selectedAoi} />
    </div>
  );
}
