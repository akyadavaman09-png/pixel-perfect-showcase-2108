import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Clock, Timer } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useComplaints, useDepartments } from "@/lib/queries";
import { CATEGORIES, STATUSES, statusLabel } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SmartCity" },
      { name: "description", content: "Complaint statistics by status, category and department." },
      { property: "og:title", content: "Reports — SmartCity" },
      { property: "og:description", content: "Complaint statistics across the city." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: complaints = [] } = useComplaints();
  const { data: departments = [] } = useDepartments();

  const total = complaints.length;
  const completed = complaints.filter((c) => c.status === "completed");
  const avgDays =
    completed.length > 0
      ? completed.reduce((sum, c) => {
          const end = c.resolved_at ? new Date(c.resolved_at) : new Date(c.updated_at);
          return sum + (end.getTime() - new Date(c.created_at).getTime()) / 86400000;
        }, 0) / completed.length
      : 0;

  const bar = (n: number) => `${total ? Math.round((n / total) * 100) : 0}%`;

  return (
    <AppShell title="Reports" description="Performance across the city">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total complaints" value={total} icon={ClipboardList} />
        <StatCard label="Resolved" value={completed.length} icon={CheckCircle2} tone="success" />
        <StatCard
          label="Resolution rate"
          value={`${total ? Math.round((completed.length / total) * 100) : 0}%`}
          icon={Timer}
          tone="info"
        />
        <StatCard
          label="Avg. resolution"
          value={completed.length ? `${avgDays.toFixed(1)} d` : "—"}
          icon={Clock}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="By status">
          {STATUSES.map((s) => {
            const n = complaints.filter((c) => c.status === s.value).length;
            return <Row key={s.value} label={statusLabel(s.value)} n={n} width={bar(n)} />;
          })}
        </Panel>

        <Panel title="By category">
          {CATEGORIES.map((c) => {
            const n = complaints.filter((x) => x.category === c.value).length;
            return <Row key={c.value} label={c.label} n={n} width={bar(n)} />;
          })}
        </Panel>

        <Panel title="By department">
          {departments.map((d) => {
            const n = complaints.filter((c) => c.department_id === d.id).length;
            return <Row key={d.id} label={d.name} n={n} width={bar(n)} />;
          })}
        </Panel>
      </div>
    </AppShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-5">
      <h2 className="mb-4 font-display text-lg font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, n, width }: { label: string; n: number; width: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{n}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width }} />
      </div>
    </div>
  );
}
