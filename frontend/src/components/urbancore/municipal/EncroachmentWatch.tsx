import { AlertTriangle, MapPin, Eye, ShieldAlert } from "lucide-react";
import { MUNICIPAL_ALERTS } from "@/data/municipalData";
import type { MunicipalAlert } from "@/types/urbancore";

export function EncroachmentWatch({
  selectedAlert,
  onSelectAlert,
}: {
  selectedAlert: MunicipalAlert;
  onSelectAlert: (alert: MunicipalAlert) => void;
}) {
  return (
    <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/90">
            ZONING AUDIT & PROTECTION
          </span>
          <h3 className="font-display text-lg font-medium text-foreground">
            Encroachment Watch
          </h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-destructive font-semibold">
          <ShieldAlert className="h-3.5 w-3.5" /> 12 Active Flags
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MUNICIPAL_ALERTS.map((alert) => {
          const isSelected = selectedAlert.id === alert.id;
          const isHigh = alert.severity === "HIGH";

          return (
            <div
              key={alert.id}
              onClick={() => onSelectAlert(alert)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(114,180,255,0.2)]"
                  : "border-border/50 bg-foreground/[0.02] hover:border-primary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider font-semibold ${
                  isHigh ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                }`}>
                  {alert.severity} SEVERITY
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{alert.status}</span>
              </div>

              <h4 className="mt-3 text-sm font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${isHigh ? 'text-destructive' : 'text-amber-400'}`} />
                {alert.title}
              </h4>

              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{alert.location}</span>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {alert.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                <span className="font-mono text-[10px] text-muted-foreground">
                  Detected {alert.detectedYear} · {alert.affectedAreaSqM} m²
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-primary hover:underline"
                >
                  <Eye className="h-3 w-3" /> View Evidence
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
