import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
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
import { useComplaint, useDepartmentMap } from "@/lib/queries";
import {
  STATUSES,
  categoryLabel,
  formatDateTime,
  statusLabel,
  type ComplaintStatus,
  type ComplaintUpdate,
} from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/complaints/$id")({
  head: () => ({
    meta: [
      { title: "Complaint details — SmartCity" },
      { name: "description", content: "Full history, photos and status of a city complaint." },
      { property: "og:title", content: "Complaint details — SmartCity" },
      { property: "og:description", content: "Full history and status of a city complaint." },
    ],
  }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { id } = Route.useParams();
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const { data: complaint, isLoading } = useComplaint(id);
  const departments = useDepartmentMap();

  const [nextStatus, setNextStatus] = useState<ComplaintStatus | "">("");
  const [note, setNote] = useState("");

  const { data: updates = [] } = useQuery({
    queryKey: ["complaint_updates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_updates")
        .select("*")
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ComplaintUpdate[];
    },
  });

  const mutate = useMutation({
    mutationFn: async () => {
      if (!complaint || !nextStatus || !user) return;
      const patch: Record<string, unknown> = { status: nextStatus };
      if (note) patch[nextStatus === "completed" ? "resolution_notes" : "admin_notes"] = note;
      if (nextStatus === "completed") patch["resolved_at"] = new Date().toISOString();

      const { error } = await supabase.from("complaints").update(patch).eq("id", complaint.id);
      if (error) throw error;

      const { error: histErr } = await supabase.from("complaint_updates").insert({
        complaint_id: complaint.id,
        actor_id: user.id,
        from_status: complaint.status,
        to_status: nextStatus,
        note: note || null,
      });
      if (histErr) throw histErr;
    },
    onSuccess: async () => {
      setNote("");
      setNextStatus("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["complaint", id] }),
        qc.invalidateQueries({ queryKey: ["complaint_updates", id] }),
        qc.invalidateQueries({ queryKey: ["complaints"] }),
      ]);
      toast.success("Complaint updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  if (isLoading) {
    return (
      <AppShell title="Complaint">
        <div className="h-56 animate-pulse rounded-lg bg-muted" />
      </AppShell>
    );
  }

  if (!complaint) {
    return (
      <AppShell title="Complaint not found" description="It may have been removed">
        <p className="text-sm text-muted-foreground">We couldn't find this complaint.</p>
      </AppShell>
    );
  }

  const canManage = role === "admin" || role === "staff";

  return (
    <AppShell title={complaint.title} description={`${complaint.code} · ${categoryLabel(complaint.category)}`}>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="surface-card space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={complaint.status} />
              <span className="text-xs text-muted-foreground">
                Reported {formatDateTime(complaint.created_at)}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{complaint.description}</p>
            {complaint.location_text || complaint.latitude ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                {complaint.location_text ||
                  `${complaint.latitude?.toFixed(5)}, ${complaint.longitude?.toFixed(5)}`}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <PhotoImage path={complaint.image_url} alt="Reported issue" className="h-48 w-full" />
              {complaint.resolution_image_url ? (
                <PhotoImage
                  path={complaint.resolution_image_url}
                  alt="Resolution"
                  className="h-48 w-full"
                />
              ) : null}
            </div>
          </div>

          <div className="surface-card p-5">
            <h2 className="mb-4 font-display text-lg font-semibold">History</h2>
            <ol className="space-y-4 border-l border-border pl-4">
              <li className="relative">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">Complaint submitted</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(complaint.created_at)}</p>
              </li>
              {updates.map((u) => (
                <li key={u.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">
                    {statusLabel(u.from_status)} → {statusLabel(u.to_status)}
                  </p>
                  {u.note ? <p className="text-sm text-muted-foreground">{u.note}</p> : null}
                  <p className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-5">
          <div className="surface-card space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-semibold">Details</h2>
            <Row label="Tracking code" value={complaint.code} />
            <Row label="Category" value={categoryLabel(complaint.category)} />
            <Row
              label="Department"
              value={complaint.department_id ? departments[complaint.department_id] ?? "—" : "Unassigned"}
            />
            <Row label="Last updated" value={formatDateTime(complaint.updated_at)} />
            <Row label="Resolved" value={formatDateTime(complaint.resolved_at)} />
            {complaint.admin_notes ? <Row label="Notes" value={complaint.admin_notes} /> : null}
            {complaint.resolution_notes ? (
              <Row label="Resolution" value={complaint.resolution_notes} />
            ) : null}
          </div>

          {canManage ? (
            <div className="surface-card space-y-3 p-5">
              <h2 className="font-display text-lg font-semibold">Update status</h2>
              <div className="space-y-1.5">
                <Label>New status</Label>
                <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ComplaintStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add context for the citizen"
                />
              </div>
              <Button
                className="w-full"
                disabled={!nextStatus || mutate.isPending}
                onClick={() => mutate.mutate()}
              >
                {mutate.isPending ? "Saving…" : "Save update"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
