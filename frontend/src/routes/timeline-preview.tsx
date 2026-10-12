import { createFileRoute } from "@tanstack/react-router";
import { ConstructionTimelineStatic } from "@/components/urbancore/citizen/ConstructionTimelineStatic";

export const Route = createFileRoute("/timeline-preview")({
  component: TimelinePreview,
});

function TimelinePreview() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <ConstructionTimelineStatic />
    </div>
  );
}
