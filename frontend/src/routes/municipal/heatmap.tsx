/**
 * /municipal/heatmap — Removed page.
 * Redirects to Command Overview so old links don't break.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/municipal/heatmap")({
  beforeLoad: () => {
    throw redirect({ to: "/municipal", replace: true });
  },
  component: () => null,
});
