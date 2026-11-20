import { useLandChangeStore } from "@/store/landChangeStore";

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lce-chip min-h-[40px] px-4 py-2 text-xs font-medium transition sm:text-sm"
      style={{
        borderRadius: "9999px",
        border: active
          ? "1px solid #38bdf8"
          : "1px solid rgba(255,255,255,0.12)",
        background: active
          ? "rgba(56,189,248,0.16)"
          : "rgba(255,255,255,0.05)",
        color: active ? "#bae6fd" : "#cbd5e1",
        boxShadow: active ? "0 0 16px rgba(56,189,248,0.35)" : "none",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "background 200ms, border-color 200ms, box-shadow 200ms",
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function ControlChips({ reduceMotion }: { reduceMotion: boolean }) {
  const autoRotate = useLandChangeStore((s) => s.autoRotate);
  const changesOnly = useLandChangeStore((s) => s.changesOnly);
  const viewMode = useLandChangeStore((s) => s.viewMode);
  const toggleAutoRotate = useLandChangeStore((s) => s.toggleAutoRotate);
  const toggleChangesOnly = useLandChangeStore((s) => s.toggleChangesOnly);
  const setViewMode = useLandChangeStore((s) => s.setViewMode);

  return (
    <div className="flex flex-wrap gap-2 px-1">
      <Chip
        label="Auto-rotate"
        active={autoRotate && !reduceMotion}
        onClick={toggleAutoRotate}
      />
      <Chip
        label="Changes only"
        active={changesOnly}
        onClick={toggleChangesOnly}
      />
      <Chip
        label="3D view"
        active={viewMode === "3d"}
        onClick={() => setViewMode("3d")}
      />
      <Chip
        label="Top view"
        active={viewMode === "top"}
        onClick={() => setViewMode("top")}
      />
    </div>
  );
}
