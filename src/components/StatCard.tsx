import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "warning" | "success" | "info" | "muted";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-destructive/12 text-destructive",
  warning: "bg-warning/20 text-warning-foreground",
  success: "bg-success/14 text-success",
  info: "bg-info/12 text-info",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  loading,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-4">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", toneStyles[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">
          {loading ? <span className="inline-block h-6 w-10 animate-pulse rounded bg-muted" /> : value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
