import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Complaint, Department, Profile } from "@/lib/smartcity";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Department[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useDepartmentMap() {
  const { data } = useDepartments();
  const map: Record<string, string> = {};
  (data ?? []).forEach((d) => (map[d.id] = d.name));
  return map;
}

/** RLS scopes this automatically: citizens see their own, staff their department, admins all. */
export function useComplaints() {
  return useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Complaint[];
    },
  });
}

export function useComplaint(id: string) {
  return useQuery({
    queryKey: ["complaint", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data as Complaint) ?? null;
    },
  });
}

export function useProfiles(enabled = true) {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
    enabled,
  });
}

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: "citizen" | "staff" | "admin" }[];
    },
    enabled,
  });
}

export function countBy<T extends string>(items: { [k: string]: unknown }[], key: string) {
  const out: Record<string, number> = {};
  items.forEach((i) => {
    const v = String(i[key] ?? "unknown") as T;
    out[v] = (out[v] ?? 0) + 1;
  });
  return out;
}
