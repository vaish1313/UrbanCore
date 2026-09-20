/**
 * /municipal/heatmap — Construction Heatmap & Growth Analytics page.
 * Renders GrowthAnalytics + ConstructionMonitor in isolation.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { GrowthAnalytics } from "@/components/urbancore/municipal/GrowthAnalytics";
import { ConstructionMonitor } from "@/components/urbancore/municipal/ConstructionMonitor";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/heatmap")({
  head: () => ({
    meta: [{ title: "Construction Heatmap — Municipal Authority" }],
  }),
  component: HeatmapPage,
});

function HeatmapPage() {
  const navigate = useNavigate();
  return (
    <MunicipalPageShell
      eyebrow="Construction Heatmap"
      eyebrowIcon={<Flame size={13} />}
      title="Growth Analytics & Construction Monitor"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <GrowthAnalytics />
      <ConstructionMonitor />
    </MunicipalPageShell>
  );
}
