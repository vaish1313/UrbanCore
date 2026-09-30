/**
 * /municipal/forensics — Merged into Case Detail.
 * Redirects to /municipal/case-detail so old links don't 404.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/municipal/forensics")({
  beforeLoad: () => {
    throw redirect({ to: "/municipal/case-detail", replace: true });
  },
  component: () => null,
});
