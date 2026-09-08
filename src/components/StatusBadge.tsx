import { cn } from "@/lib/utils";
import { statusLabel, type ComplaintStatus } from "@/lib/smartcity";

const styles: Record<ComplaintStatus, string> = {
  pending: "bg-destructive/12 text-destructive border-destructive/25",
  in_progress: "bg-warning/18 text-warning-foreground border-warning/40",
  completed: "bg-success/14 text-success border-success/30",
  rejected: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: { status: ComplaintStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
