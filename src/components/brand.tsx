import { cn } from "@/lib/utils";

/** UrbanCore mark: a stylised city block inside a survey reticle. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 text-primary", className)}
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.25" opacity="0.35" />
      <path d="M16 1v5M16 26v5M1 16h5M26 16h5" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M9 22V14l4-2.5V22M13 22v-6l5-3v9M18 22v-4.5l5-3V22"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M7 22h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight", className)}>
      Urban<span className="text-primary">Core</span>
    </span>
  );
}