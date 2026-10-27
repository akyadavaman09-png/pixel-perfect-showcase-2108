import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { categoryLabel, statusLabel } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SmartCity Admin" },
      { name: "description", content: "Complaint volumes by status, category, department and ward." },
      { property: "og:title", content: "Analytics — SmartCity Admin" },
      { property: "og:description", content: "Complaint volumes and resolution performance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

function Bars({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  if (!data.length) return <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-3">
      {data.map(([label, n]) => (
        <div key={label} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{label}</span>
            <span className="font-semibold">{n}</span>
          </div>
          <Progress value={(n / max) * 100} />
        </div>
      ))}
    </div>
  );
}

function AnalyticsPage() {
  const { data = [] } = useComplaints();
  const depts = useDepartmentMap();
  const group = (fn: (c: (typeof data)[number]) => string) => {
    const m: Record<string, number> = {};
    data.forEach((c) => (m[fn(c)] = (m[fn(c)] ?? 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const resolved = data.filter((c) => c.status === "completed" && c.resolved_at);
  const avgHours = resolved.length
    ? resolved.reduce((s, c) => s + (+new Date(c.resolved_at!) - +new Date(c.created_at)), 0) / resolved.length / 36e5
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Resolution rate</p><p className="font-display text-3xl font-bold">{data.length ? Math.round((resolved.length / data.length) * 100) : 0}%</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Avg. time to resolve</p><p className="font-display text-3xl font-bold">{avgHours ? `${avgHours.toFixed(1)}h` : "—"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Open complaints</p><p className="font-display text-3xl font-bold">{data.filter((c) => c.status === "pending" || c.status === "in_progress").length}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="department">Department</TabsTrigger>
              <TabsTrigger value="ward">Ward</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="pt-4"><Bars data={group((c) => (c.status === "completed" ? "Resolved" : statusLabel(c.status)))} /></TabsContent>
            <TabsContent value="category" className="pt-4"><Bars data={group((c) => categoryLabel(c.category))} /></TabsContent>
            <TabsContent value="department" className="pt-4"><Bars data={group((c) => (c.department_id ? depts[c.department_id] ?? "Unknown" : "Unassigned"))} /></TabsContent>
            <TabsContent value="ward" className="pt-4"><Bars data={group((c) => c.ward || "No ward")} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
