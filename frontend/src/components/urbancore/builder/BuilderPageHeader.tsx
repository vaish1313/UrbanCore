import type { LucideIcon } from "lucide-react";

interface BuilderPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
}

export function BuilderPageHeader({
  title,
  subtitle,
  icon: Icon,
  badge = "BUILDER WORKSPACE",
}: BuilderPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          {badge}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-3xl">
          {subtitle}
        </p>
      )}
      <div className="h-px w-full bg-gradient-to-r from-primary/30 via-white/10 to-transparent mt-2" />
    </div>
  );
}
