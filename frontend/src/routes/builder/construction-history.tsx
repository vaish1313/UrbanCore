import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { ConstructionHistory } from "@/components/urbancore/builder/ConstructionHistory";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderPageHeader } from "@/components/urbancore/builder/BuilderPageHeader";

export const Route = createFileRoute("/builder/construction-history")({
  component: ConstructionHistoryRoutePage,
});

function ConstructionHistoryRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <BuilderPageHeader
        title="Construction History"
        subtitle="Multi-epoch satellite change detection and historical built-up progression analysis"
        icon={History}
      />
      <ConstructionHistory aoi={selectedAoi} />
    </div>
  );
}
