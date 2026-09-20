import { createFileRoute } from "@tanstack/react-router";
import { ConstraintPanel } from "@/components/urbancore/builder/ConstraintPanel";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/zoning-constraints")({
  component: ZoningConstraintsRoutePage,
});

function ZoningConstraintsRoutePage() {
  const { selectedAoi } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Zoning & Constraints" />
      <ConstraintPanel aoi={selectedAoi} />
    </div>
  );
}
