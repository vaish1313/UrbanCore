/**
 * /municipal/heatmap — Construction Heatmap & Growth Analytics page.
 * Renders GrowthAnalytics + ConstructionMonitor with real analysis data support.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { GrowthAnalytics } from "@/components/urbancore/municipal/GrowthAnalytics";
import { ConstructionMonitor } from "@/components/urbancore/municipal/ConstructionMonitor";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

interface HeatmapPageSearch {
  analysisId?: string;
}

export const Route = createFileRoute("/municipal/heatmap")({
  head: () => ({
    meta: [{ title: "Construction Heatmap — Municipal Authority" }],
  }),
  validateSearch: (search: Record<string, unknown>): HeatmapPageSearch => {
    return {
      analysisId: search.analysisId as string | undefined,
    };
  },
  component: HeatmapPage,
});

function HeatmapPage() {
  const navigate = useNavigate();
  const { analysisId } = Route.useSearch();

  return (
    <MunicipalPageShell
      eyebrow="Construction Heatmap"
      eyebrowIcon={<Flame size={13} />}
      title={
        analysisId
          ? "Live Analysis Results & Growth Monitor"
          : "Growth Analytics & Construction Monitor"
      }
      onBack={() => navigate({ to: "/municipal" })}
    >
      <GrowthAnalytics analysisId={analysisId} />
      <ConstructionMonitor analysisId={analysisId} />
    </MunicipalPageShell>
  );
}
