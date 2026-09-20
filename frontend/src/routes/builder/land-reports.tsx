import { createFileRoute } from "@tanstack/react-router";
import { LandReportsPanel } from "@/components/urbancore/builder/LandReportsPanel";
import { useBuilderContext } from "@/components/urbancore/builder/BuilderContext";
import { SectionDivider } from "@/components/urbancore/builder/SectionDivider";

export const Route = createFileRoute("/builder/land-reports")({
  component: LandReportsRoutePage,
});

function LandReportsRoutePage() {
  const { selectedAoi, setIsReportOpen } = useBuilderContext();
  return (
    <div className="w-full">
      <SectionDivider label="MODULE FEATURE: Land Reports" />
      <LandReportsPanel aoi={selectedAoi} onGenerateReport={() => setIsReportOpen(true)} />
    </div>
  );
}
