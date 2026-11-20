import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { ConstraintPanel } from "@/components/urbancore/builder/ConstraintPanel";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { BuilderPageHeader } from "@/components/urbancore/builder/BuilderPageHeader";

export const Route = createFileRoute("/builder/zoning-constraints")({
  component: ZoningConstraintsRoutePage,
});

function ZoningConstraintsRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <BuilderPageHeader
        title="Zoning Check"
        subtitle="Statutory zoning constraints, environmental reservations, green belt, and waterbody buffer audits"
        icon={AlertTriangle}
      />
      <ConstraintPanel aoi={selectedAoi} />
    </div>
  );
}
