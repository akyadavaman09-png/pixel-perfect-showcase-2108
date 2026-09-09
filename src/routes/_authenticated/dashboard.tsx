import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Clock, FilePlus2, ListChecks, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { categoryLabel, formatDate } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartCity" },
      { name: "description", content: "Overview of your city complaints and their current status." },
      { property: "og:title", content: "Dashboard — SmartCity" },
      { property: "og:description", content: "Overview of city complaints and their status." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { role, profile } = useAuth();
  const { data: complaints = [], isLoading } = useComplaints();
  const departments = useDepartmentMap();

  const count = (s: string) => complaints.filter((c) => c.status === s).length;
  const recent = complaints.slice(0, 6);

  const heading =
    role === "admin" ? "City overview" : role === "staff" ? "Department overview" : "Your overview";

  return (
    <AppShell
      title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
      description={heading}
      actions={
        role === "citizen" ? (
          <Button asChild>
            <Link to="/report">
              <FilePlus2 className="size-4" aria-hidden /> Report an Issue
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={complaints.length} icon={ClipboardList} loading={isLoading} />
        <StatCard label="Pending" value={count("pending")} icon={Clock} tone="danger" loading={isLoading} />
        <StatCard
          label="In progress"
          value={count("in_progress")}
          icon={ListChecks}
          tone="warning"
          loading={isLoading}
        />
        <StatCard
          label="Completed"
          value={count("completed")}
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent complaints</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/complaints">View all</Link>
          </Button>
        </div>

        {!isLoading && recent.length === 0 ? (
          <EmptyState
            icon={XCircle}
            title="No complaints yet"
            description={
              role === "citizen"
                ? "When you report an issue it will appear here with a tracking code."
                : "No complaints have been assigned to you yet."
            }
            action={
              role === "citizen" ? (
                <Button asChild>
                  <Link to="/report">Report an Issue</Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-3">
            {recent.map((c) => (
              <Link
                key={c.id}
                to="/complaints/$id"
                params={{ id: c.id }}
                className="surface-card flex flex-wrap items-center gap-3 p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.code} · {categoryLabel(c.category)} ·{" "}
                    {c.department_id ? departments[c.department_id] : "Unassigned"} ·{" "}
                    {formatDate(c.created_at)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
