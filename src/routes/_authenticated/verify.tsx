import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { PhotoImage } from "@/components/PhotoImage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDepartmentMap } from "@/lib/queries";
import {
  categoryLabel,
  formatDateTime,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({
    meta: [
      { title: "Verify complaints — SmartCity" },
      { name: "description", content: "Admin queue to verify, resolve or reject citizen complaints." },
      { property: "og:title", content: "Verify complaints — SmartCity" },
      { property: "og:description", content: "Admin queue to verify, resolve or reject citizen complaints." },
    ],
  }),
  component: VerifyQueue,
});

type QueueFilter = "pending" | "in_progress" | "all_open";

function VerifyQueue() {
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const departments = useDepartmentMap();
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["verify_queue", filter],
    queryFn: async () => {
      let q = supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: true });
      if (filter === "pending") q = q.eq("status", "pending");
      else if (filter === "in_progress") q = q.eq("status", "in_progress");
      else q = q.in("status", ["pending", "in_progress"]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Complaint[];
    },
    enabled: role === "admin",
  });

  const act = useMutation({
    mutationFn: async ({
      complaint,
      to,
    }: {
      complaint: Complaint;
      to: ComplaintStatus;
    }) => {
      if (!user) throw new Error("Not signed in");
      const note = notes[complaint.id]?.trim() || null;
      const patch: {
        status: ComplaintStatus;
        admin_notes?: string;
        resolution_notes?: string;
        resolved_at?: string;
      } = { status: to };
      if (note) {
        if (to === "completed") patch.resolution_notes = note;
        else patch.admin_notes = note;
      }
      if (to === "completed") patch.resolved_at = new Date().toISOString();

      const { error } = await supabase.from("complaints").update(patch).eq("id", complaint.id);
      if (error) throw error;

      const { error: histErr } = await supabase.from("complaint_updates").insert({
        complaint_id: complaint.id,
        actor_id: user.id,
        from_status: complaint.status,
        to_status: to,
        note,
      });
      if (histErr) throw histErr;
    },
    onSuccess: async (_d, vars) => {
      setNotes((n) => {
        const next = { ...n };
        delete next[vars.complaint.id];
        return next;
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["verify_queue"] }),
        qc.invalidateQueries({ queryKey: ["complaints"] }),
        qc.invalidateQueries({ queryKey: ["complaint", vars.complaint.id] }),
        qc.invalidateQueries({ queryKey: ["complaint_updates", vars.complaint.id] }),
      ]);
      toast.success(
        vars.to === "completed"
          ? "Complaint resolved"
          : vars.to === "rejected"
            ? "Complaint rejected"
            : "Complaint verified",
      );
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  if (role && role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return (
    <AppShell
      title="Verify Complaints"
      description="Review incoming reports, verify genuine issues, and mark work as resolved"
      actions={
        <Select value={filter} onValueChange={(v) => setFilter(v as QueueFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Awaiting verification</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="all_open">All open</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-8" aria-hidden />}
          title="Queue is clear"
          description="There are no complaints waiting in this view right now."
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <article key={c.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/complaints/$id"
                      params={{ id: c.id }}
                      className="font-display text-base font-semibold hover:underline"
                    >
                      {c.title}
                    </Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {c.code} · {categoryLabel(c.category)} ·{" "}
                    {c.department_id ? departments[c.department_id] ?? "—" : "Unassigned"} ·
                    reported {formatDateTime(c.created_at)}
                  </p>
                </div>
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{c.description}</p>
              {c.location_text ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden /> {c.location_text}
                </p>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr]">
                <PhotoImage path={c.image_url} alt="Reported issue" className="h-28 w-full" />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`note-${c.id}`}>Note to citizen (optional)</Label>
                    <Textarea
                      id={`note-${c.id}`}
                      rows={2}
                      value={notes[c.id] ?? ""}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [c.id]: e.target.value }))
                      }
                      placeholder="e.g. Verified on site, crew assigned"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.status === "pending" ? (
                      <Button
                        size="sm"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ complaint: c, to: "in_progress" })}
                      >
                        <ClipboardCheck className="size-4" aria-hidden /> Verify &amp; start work
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={act.isPending}
                      onClick={() => act.mutate({ complaint: c, to: "completed" })}
                    >
                      <CheckCircle2 className="size-4" aria-hidden /> Mark resolved
                    </Button>
                    {c.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ complaint: c, to: "rejected" })}
                      >
                        <XCircle className="size-4" aria-hidden /> Reject
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
