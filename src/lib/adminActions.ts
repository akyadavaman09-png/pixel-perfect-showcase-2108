import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { statusLabel, type Complaint, type ComplaintStatus, type Profile } from "@/lib/smartcity";

/** Staff members (field crew) with their profile. Only admins can list every role. */
export function useStaff() {
  return useQuery({
    queryKey: ["staff_members"],
    queryFn: async () => {
      const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", "staff");
      if (error) throw error;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as Profile[];
      const { data, error: pErr } = await supabase.from("profiles").select("*").in("id", ids);
      if (pErr) throw pErr;
      return (data ?? []) as Profile[];
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ complaint, to, note }: { complaint: Complaint; to: ComplaintStatus; note?: string }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ status: to, resolved_at: to === "completed" ? new Date().toISOString() : null })
        .eq("id", complaint.id);
      if (error) throw error;
      await supabase.from("complaint_updates").insert({
        complaint_id: complaint.id,
        actor_id: user?.id ?? null,
        from_status: complaint.status,
        to_status: to,
        note: note || null,
      });
    },
    onSuccess: (_d, v) => {
      toast.success(`${v.complaint.code} marked ${statusLabel(v.to)}`);
      void qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignStaff() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ complaint, staff }: { complaint: Complaint; staff: Profile | null }) => {
      const patch: { assigned_staff_id: string | null; department_id?: string } = {
        assigned_staff_id: staff?.id ?? null,
      };
      if (staff?.department_id) patch.department_id = staff.department_id;
      const { error } = await supabase.from("complaints").update(patch).eq("id", complaint.id);
      if (error) throw error;
      await supabase.from("complaint_updates").insert({
        complaint_id: complaint.id,
        actor_id: user?.id ?? null,
        from_status: complaint.status,
        to_status: complaint.status,
        note: staff ? `Assigned to ${staff.full_name || staff.email}` : "Unassigned",
      });
    },
    onSuccess: () => {
      toast.success("Assignment updated");
      void qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
