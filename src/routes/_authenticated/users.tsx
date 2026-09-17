import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDepartments, useProfiles, useRoles } from "@/lib/queries";
import { formatDate, type AppRole } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Users — SmartCity" },
      { name: "description", content: "Manage citizens, department staff and administrators." },
      { property: "og:title", content: "Users — SmartCity" },
      { property: "og:description", content: "Manage SmartCity user roles and departments." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const qc = useQueryClient();
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: roles = [] } = useRoles();
  const { data: departments = [] } = useDepartments();

  const setRole = useMutation({
    mutationFn: async ({ userId, next }: { userId: string; next: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: next });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update role"),
  });

  const setDept = useMutation({
    mutationFn: async ({ userId, deptId }: { userId: string; deptId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ department_id: deptId })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Department updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update department"),
  });

  const roleOf = (id: string): AppRole =>
    (roles.find((r) => r.user_id === id)?.role as AppRole) ?? "citizen";

  if (!isLoading && profiles.length === 0) {
    return (
      <AppShell title="Users">
        <EmptyState icon={Users} title="No users" description="No registered accounts yet." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Users" description={`${profiles.length} registered accounts`}>
      <div className="grid gap-3">
        {profiles.map((p) => (
          <div key={p.id} className="surface-card flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-[200px] flex-1">
              <p className="font-medium">{p.full_name || "Unnamed user"}</p>
              <p className="text-xs text-muted-foreground">
                {p.email ?? "—"} · joined {formatDate(p.created_at)}
              </p>
            </div>

            <Select
              value={roleOf(p.id)}
              disabled={!isAdmin}
              onValueChange={(v) => setRole.mutate({ userId: p.id, next: v as AppRole })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="staff">Department Staff</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={p.department_id ?? "none"}
              disabled={!isAdmin}
              onValueChange={(v) => setDept.mutate({ userId: p.id, deptId: v === "none" ? null : v })}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
