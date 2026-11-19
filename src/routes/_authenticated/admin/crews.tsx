import { createFileRoute } from "@tanstack/react-router";
import { HardHat } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { useStaff } from "@/lib/adminActions";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const qc = useQueryClient();
  const toggle = async (id: string, next: boolean) => {
    if (!confirm(next ? "Reactivate this worker?" : "Deactivate this worker? They won't receive new tasks.")) return;
    const { error } = await supabase.from("profiles").update({ is_active: next }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success(next ? "Worker reactivated" : "Worker deactivated");
    void qc.invalidateQueries({ queryKey: ["staff_members"] });
  };

  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Crew member</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Active jobs</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((s) => {
            const mine = complaints.filter((c) => c.assigned_staff_id === s.id);
            const active = mine.filter((c) => !["completed", "rejected"].includes(c.status)).length;
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
                <TableCell>{mine.filter((c) => c.status === "pending_verification").length}</TableCell>
                <TableCell>{mine.filter((c) => c.status === "completed").length}</TableCell>
                <TableCell>
                  <Button size="sm" variant={s.is_active ? "outline" : "default"} onClick={() => void toggle(s.id, !s.is_active)}>
                    {s.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {!staff.length ? (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                {isLoading ? "Loading crews…" : "No field staff yet. Give someone the Field Worker role on the Users page."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Card>
  );
}
