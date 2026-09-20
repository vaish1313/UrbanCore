import { createFileRoute } from "@tanstack/react-router";
import { ConstructionHistory } from "@/components/urbancore/builder/ConstructionHistory";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/construction-history")({
  component: ConstructionHistoryRoutePage,
});

function ConstructionHistoryRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Construction History" />
      <ConstructionHistory aoi={selectedAoi} />
    </div>
  );
}
