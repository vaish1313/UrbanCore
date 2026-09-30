/**
 * /municipal/legal — Removed page.
 * Redirects to Encroachment Watch.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/municipal/legal")({
  beforeLoad: () => {
    throw redirect({ to: "/municipal/encroachment", replace: true });
  },
  component: () => null,
});
