/**
 * /municipal  — Command Overview landing page.
 * Renders the full MunicipalGISDashboard (district map + all GIS sections).
 * Only mounted when the URL is exactly /municipal.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MunicipalGISDashboard } from "@/components/urbancore/municipal/MunicipalGISDashboard";

export const Route = createFileRoute("/municipal/")({
  head: () => ({
    meta: [{ title: "Command Overview — Municipal Authority" }],
  }),
  component: CommandOverviewPage,
});

function CommandOverviewPage() {
  const navigate = useNavigate();
  return (
    <MunicipalGISDashboard
      onBack={() => navigate({ to: "/" })}
    />
  );
}
