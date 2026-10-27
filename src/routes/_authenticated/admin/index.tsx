import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { categoryLabel } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — SmartCity" },
      { name: "description", content: "Operational overview of city complaints for administrators." },
      { property: "og:title", content: "Admin Overview — SmartCity" },
      { property: "og:description", content: "Operational overview of city complaints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { data = [] } = useComplaints();
  const depts = useDepartmentMap();
  const count = (s: string) => data.filter((c) => c.status === s).length;
  const stats = [
    { label: "Total complaints", value: data.length, icon: ListChecks },
    { label: "Pending", value: count("pending"), icon: AlertCircle },
    { label: "In progress", value: count("in_progress"), icon: Clock },
    { label: "Resolved", value: count("completed"), icon: CheckCircle2 },
  ];
  const unassigned = data.filter((c) => !c.assigned_staff_id && c.status !== "completed" && c.status !== "rejected");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
              </div>
              <s.icon className="size-8 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Awaiting crew assignment ({unassigned.length})</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/queue">Open queue</Link>
          </Button>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {unassigned.slice(0, 6).map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              <span className="flex-1 font-medium">{c.title}</span>
              <span className="text-muted-foreground">{categoryLabel(c.category)}</span>
              <span className="text-muted-foreground">{c.department_id ? depts[c.department_id] : "—"}</span>
              <StatusBadge status={c.status} />
            </div>
          ))}
          {!unassigned.length ? <p className="py-6 text-center text-sm text-muted-foreground">Everything is assigned.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
