interface Props {
  builtUpPct: number;
  newCells: number;
  totalChangeSinceStart: number;
  startYear: number;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="lce-inner-panel"
      style={{
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "12px 16px",
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "#64748b" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-xl font-bold tabular-nums sm:text-2xl"
        style={{ color: "#f1f5f9" }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[11px]" style={{ color: "#64748b" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function StatsStrip({
  builtUpPct,
  newCells,
  totalChangeSinceStart,
  startYear,
}: Props) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Stat label="Built-up" value={`${builtUpPct.toFixed(1)}%`} hint="of analyzed region" />
      <Stat
        label="New construction cells"
        value={String(newCells)}
        hint="vs previous year"
      />
      <Stat
        label="Total change"
        value={`${totalChangeSinceStart >= 0 ? "+" : ""}${totalChangeSinceStart.toFixed(1)} pp`}
        hint={`since ${startYear}`}
      />
    </div>
  );
}
