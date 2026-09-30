/**
 * /municipal/export — Removed page.
 * Redirects to Case Detail.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/municipal/export")({
  beforeLoad: () => {
    throw redirect({ to: "/municipal/case-detail", replace: true });
  },
  component: () => null,
});
