import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useComplaints, useDepartments } from "@/lib/queries";
import { categoryLabel } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { title: "Departments — SmartCity" },
      { name: "description", content: "City departments and the complaint load handled by each." },
      { property: "og:title", content: "Departments — SmartCity" },
      { property: "og:description", content: "City departments and their complaint load." },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: complaints = [] } = useComplaints();

  return (
    <AppShell title="Departments" description="Responsible teams across the city">
      {!isLoading && departments.length === 0 ? (
        <EmptyState icon={Building2} title="No departments" description="No departments configured yet." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => {
            const mine = complaints.filter((c) => c.department_id === d.id);
            const open = mine.filter((c) => c.status !== "completed" && c.status !== "rejected").length;
            return (
              <div key={d.id} className="surface-card p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold">{d.name}</h2>
                    <p className="text-xs text-muted-foreground">{categoryLabel(d.category)}</p>
                  </div>
                </div>
                {d.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">{d.description}</p>
                ) : null}
                <div className="mt-4 flex gap-6 text-sm">
                  <span>
                    <span className="font-display text-xl font-bold">{mine.length}</span>{" "}
                    <span className="text-muted-foreground">total</span>
                  </span>
                  <span>
                    <span className="font-display text-xl font-bold">{open}</span>{" "}
                    <span className="text-muted-foreground">open</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
