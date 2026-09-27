/**
 * /municipal/encroachment — Encroachment Watch + Evidence Viewer page.
 * Only this component tree is mounted at this route.
 */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Flag } from "lucide-react";
import { MUNICIPAL_ALERTS } from "@/data/municipalData";
import type { MunicipalAlert } from "@/types/urbancore";
import { EncroachmentWatch } from "@/components/urbancore/municipal/EncroachmentWatch";
import { EvidenceViewer } from "@/components/urbancore/municipal/EvidenceViewer";
import { ComplianceReportModal } from "@/components/urbancore/municipal/ComplianceReportModal";
import { MunicipalPageShell } from "@/components/urbancore/municipal/MunicipalPageShell";

export const Route = createFileRoute("/municipal/encroachment")({
  head: () => ({
    meta: [{ title: "Encroachment Watch — Municipal Authority" }],
  }),
  component: EncroachmentPage,
});

function EncroachmentPage() {
  const navigate = useNavigate();
  const [selectedAlert, setSelectedAlert] = useState<MunicipalAlert>(MUNICIPAL_ALERTS[0]!);
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  return (
    <MunicipalPageShell
      eyebrow="Encroachment Watch"
      eyebrowIcon={<Flag size={13} />}
      title="Detected Encroachment Flags"
      onBack={() => navigate({ to: "/municipal" })}
    >
      <EncroachmentWatch
        selectedAlert={selectedAlert}
        onSelectAlert={setSelectedAlert}
      />
      <EvidenceViewer
        alert={selectedAlert}
        onGenerateDraft={() => setIsDraftOpen(true)}
      />
      <ComplianceReportModal
        alert={selectedAlert}
        isOpen={isDraftOpen}
        onClose={() => setIsDraftOpen(false)}
      />
    </MunicipalPageShell>
  );
}
