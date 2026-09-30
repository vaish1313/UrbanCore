/**
 * /builder/land-reports — removed.
 * The "Generate Land Intelligence PDF" button now lives on the
 * Land Suitability page. Redirect old links there.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/builder/land-reports")({
  beforeLoad: () => {
    throw redirect({ to: "/builder/land-suitability", replace: true });
  },
  component: () => null,
});
