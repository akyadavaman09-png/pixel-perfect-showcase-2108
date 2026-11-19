import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HardHat, MapPin, Navigation } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { PhotoImage } from "@/components/PhotoImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/lib/queries";
import { uploadComplaintPhoto } from "@/lib/storage";
import { categoryLabel, formatDate, isOverdue, type Complaint } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({
    meta: [
      { title: "My Tasks — SmartCity Worker" },
      { name: "description", content: "Field worker task list: accept, update and complete assigned city complaints." },
      { property: "og:title", content: "My Tasks — SmartCity Worker" },
      { property: "og:description", content: "Assigned field tasks for city workers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerPage,
});

type Action = "accept" | "start" | "progress" | "complete";

function WorkerPage() {
  const { role, user } = useAuth();
  const { data = [], isLoading } = useComplaints();
  if (role && role !== "staff") return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} />;
  const tasks = data.filter((c) => c.assigned_staff_id === user?.id);
  return (
    <AppShell title="My Tasks" description={`${tasks.length} assigned to you`}>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : !tasks.length ? (
        <EmptyState icon={HardHat} title="No tasks" description="Tasks assigned to you by an administrator will appear here." />
      ) : (
        <div className="grid gap-4">{tasks.map((c) => <TaskCard key={c.id} c={c} />)}</div>
      )}
    </AppShell>
  );
}

function TaskCard({ c }: { c: Complaint }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const run = useMutation({
    mutationFn: async (action: Action) => {
      if (action === "complete" && !confirm("Submit this work for admin verification?")) return false;
      let img: string | null = null;
      if (file && user) img = await uploadComplaintPhoto(file, user.id, action === "complete" ? "resolution" : "progress");
      const { error } = await supabase.rpc("worker_task_action", {
        _complaint_id: c.id, _action: action, ...(note ? { _note: note } : {}), ...(img ? { _image_url: img } : {}),
      });
      if (error) throw error;
      if (img && user)
        await supabase.from("complaint_attachments").insert({
          complaint_id: c.id, storage_path: img, uploaded_by: user.id, kind: action === "complete" ? "resolution" : "progress",
        });
      return true;
    },
    onSuccess: (ok) => {
      if (!ok) return;
      setNote(""); setFile(null);
      toast.success("Task updated");
      void qc.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dir = c.latitude && c.longitude
    ? `https://www.openstreetmap.org/directions?to=${c.latitude},${c.longitude}` : null;
  return (
    <article className="surface-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 font-display text-base font-semibold">{c.title}</h2>
        <StatusBadge status={c.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        {c.code} · {categoryLabel(c.category)} · Priority {c.priority} · Due {formatDate(c.due_date)}
        {isOverdue(c) ? <span className="ml-1 font-semibold text-destructive">Overdue</span> : null}
      </p>
      <p className="text-sm">{c.description}</p>
      {c.admin_notes ? <p className="rounded-md bg-muted p-2 text-sm"><b>Instructions:</b> {c.admin_notes}</p> : null}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="size-4" />{c.location_text || "No address"}</span>
        {dir ? <a href={dir} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary underline"><Navigation className="size-4" />Directions</a> : null}
      </div>
      <PhotoImage path={c.image_url} alt="Reported issue" className="h-40 w-full sm:w-64" />
      {c.status === "pending_verification" ? (
        <p className="text-sm text-muted-foreground">Submitted — waiting for admin verification.</p>
      ) : c.status === "assigned" || c.status === "in_progress" ? (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="space-y-1.5">
            <Label htmlFor={`n-${c.id}`}>Note</Label>
            <Textarea id={`n-${c.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {c.status === "in_progress" ? (
            <div className="space-y-1.5">
              <Label htmlFor={`f-${c.id}`}>Photo</Label>
              <Input id={`f-${c.id}`} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {c.status === "assigned" ? (
              <>
                <Button size="sm" variant="outline" disabled={run.isPending} onClick={() => run.mutate("accept")}>Accept</Button>
                <Button size="sm" disabled={run.isPending} onClick={() => run.mutate("start")}>Mark In Progress</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" disabled={run.isPending} onClick={() => run.mutate("progress")}>Add progress</Button>
                <Button size="sm" disabled={run.isPending || !file} onClick={() => run.mutate("complete")}>Submit completion</Button>
              </>
            )}
          </div>
          {c.status === "in_progress" && !file ? <p className="text-xs text-muted-foreground">An after-work photo is required to submit completion.</p> : null}
        </div>
      ) : null}
    </article>
  );
}
