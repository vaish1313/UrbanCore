import { MapPin, X } from "lucide-react";
import type { AOI } from "@/types/urbancore";

export function SiteSelectionConfirmation({
  aoi,
  onCancel,
  onConfirm,
}: {
  aoi: AOI;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-site-selection-title"
        className="glass-panel relative w-full max-w-md rounded-3xl border border-primary/30 bg-slate-950/95 p-6 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Cancel site selection"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-primary">
          <MapPin className="h-5 w-5" />
          <span id="confirm-site-selection-title" className="font-mono text-xs font-semibold uppercase tracking-[0.18em]">
            Confirm Site Selection
          </span>
        </div>

        <div className="mt-6 space-y-3">
          <h2 className="font-display text-2xl font-bold text-foreground">{aoi.name}</h2>
          <p className="text-sm text-muted-foreground">{aoi.location || "Location selected on map"}</p>
          <p className="font-mono text-sm text-foreground">
            {aoi.coords.lat.toFixed(7)}° N, {aoi.coords.lng.toFixed(7)}° E
          </p>
          {aoi.estimatedConstructionAreaSqM !== undefined && (
            <p className="text-xs text-muted-foreground">
              Area: {aoi.estimatedConstructionAreaSqM.toLocaleString()} m²
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {aoi.selectionSource === "canonical-aoi"
              ? "Canonical Builder AOI"
              : "Map-selected site — coordinate-based terrain analysis is not available yet."}
          </p>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
