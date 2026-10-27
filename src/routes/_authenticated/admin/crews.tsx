import { createFileRoute } from "@tanstack/react-router";
import { HardHat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { useStaff } from "@/lib/adminActions";

export const Route = createFileRoute("/_authenticated/admin/crews")({
  head: () => ({
    meta: [
      { title: "Field Crews — SmartCity Admin" },
      { name: "description", content: "Field staff, their departments and current workload." },
      { property: "og:title", content: "Field Crews — SmartCity Admin" },
      { property: "og:description", content: "Field staff and current workload." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CrewsPage,
});

function CrewsPage() {
  const { data: staff = [], isLoading } = useStaff();
  const { data: complaints = [] } = useComplaints();
  const depts = useDepartmentMap();

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Crew member</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Active jobs</TableHead>
            <TableHead>Resolved</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => {
            const mine = complaints.filter((c) => c.assigned_staff_id === s.id);
            const active = mine.filter((c) => c.status === "pending" || c.status === "in_progress").length;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    <HardHat className="size-4 text-primary" /> {s.full_name || "Unnamed"}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.email}</div>
                </TableCell>
                <TableCell>{s.department_id ? depts[s.department_id] : "—"}</TableCell>
                <TableCell>{s.phone || "—"}</TableCell>
                <TableCell>
                  <Badge variant={active ? "default" : "secondary"}>{active}</Badge>
                </TableCell>
                <TableCell>{mine.filter((c) => c.status === "completed").length}</TableCell>
              </TableRow>
            );
          })}
          {!staff.length ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                {isLoading ? "Loading crews…" : "No field staff yet. Assign the Staff role on the Users page."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  );
}
