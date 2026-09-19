/**
 * /municipal — direct preview route for the Municipal GIS Dashboard.
 * No auth required. Used during development to preview the dashboard
 * without going through the landing page flow.
 */
import { createFileRoute } from "@tanstack/react-router";
import { MunicipalGISDashboard } from "@/components/urbancore/municipal/MunicipalGISDashboard";

export const Route = createFileRoute("/municipal")({
  head: () => ({
    meta: [{ title: "UrbanCore GIS — Municipal Corporation Dashboard" }],
  }),
  component: MunicipalPage,
});

function MunicipalPage() {
  return <MunicipalGISDashboard onBack={() => window.history.back()} />;
}
