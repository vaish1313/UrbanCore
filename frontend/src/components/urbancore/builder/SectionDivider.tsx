export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="cs-section-divider my-6">
      <div className="cs-section-divider-line" />
      <span className="cs-section-divider-label">{label}</span>
      <div className="cs-section-divider-line" />
    </div>
  );
}
