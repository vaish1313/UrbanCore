import { Loader2, MapPin, Radar } from "lucide-react";

interface Props {
  locationLabel: string;
  scanning: boolean;
  disabled?: boolean;
  onScan: () => void;
}

export function ExplorerHeader({
  locationLabel,
  scanning,
  disabled,
  onScan,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1
            className="text-2xl font-bold leading-tight tracking-tight sm:text-[1.6rem]"
            style={{
              fontFamily: "var(--font-sans,'Manrope',sans-serif)",
              color: "#f1f5f9",
            }}
          >
            Land Change Explorer
          </h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Built-up vs non-built-up · AI detection
          </p>
        </div>
        <div
          className="mt-2 inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 text-xs"
          style={{
            borderRadius: "9999px",
            border: "1px solid rgba(56,189,248,0.30)",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            color: "#cbd5e1",
          }}
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "#38bdf8" }} />
          <span className="truncate">{locationLabel}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onScan}
        disabled={disabled || scanning}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-2 px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderRadius: "9999px",
          border: "1px solid rgba(56,189,248,0.45)",
          background: "rgba(56,189,248,0.10)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          color: "#7dd3fc",
          boxShadow: scanning ? "none" : "0 0 16px rgba(56,189,248,0.25)",
        }}
        aria-busy={scanning}
      >
        {scanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Radar className="h-4 w-4" />
        )}
        {scanning ? "Scanning…" : "Scan"}
      </button>
    </header>
  );
}
