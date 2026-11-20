import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-xl bg-white/5" />
      <div className="aspect-square max-h-[420px] w-full rounded-2xl bg-white/5" />
      <div className="h-10 rounded-full bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
        <div className="h-20 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export function ScanningOverlay() {
  return (
    <div className="flex aspect-square max-h-[420px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-sky-400/20 bg-[#05070f]">
      <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      <p className="text-sm text-slate-300">Running satellite scan…</p>
      <p className="max-w-xs text-center text-xs text-slate-500">
        Exporting imagery and running UNet detection. This can take a few minutes.
      </p>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex aspect-square max-h-[420px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#05070f] px-6 text-center">
      <Inbox className="h-10 w-10 text-slate-500" />
      <h3 className="text-lg font-semibold text-white">No land-change data</h3>
      <p className="text-sm text-slate-400">
        Scan a location to detect built-up growth across years.
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex aspect-square max-h-[420px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-[#05070f] px-6 text-center">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
      <p className="text-sm text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-300"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}
