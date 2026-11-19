import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MoreHorizontal, Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { useAdminPatch, useAssignStaff, useCompletionDecision, useStaff, useUpdateStatus } from "@/lib/adminActions";
import { PRIORITIES, categoryLabel, formatDate, isOverdue, type Complaint, type ComplaintStatus } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/admin/queue")({
  head: () => ({
    meta: [
      { title: "Complaints Queue — SmartCity Admin" },
      { name: "description", content: "Triage, update status and assign field staff to city complaints." },
      { property: "og:title", content: "Complaints Queue — SmartCity Admin" },
      { property: "og:description", content: "Triage and assign city complaints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QueuePage,
});

const STATUS_ACTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "under_review", label: "Mark Under Review" },
  { value: "approved", label: "Approve" },
];

function QueuePage() {
  const { data = [], isLoading } = useComplaints();
  const depts = useDepartmentMap();
  const { data: staff = [] } = useStaff();
  const updateStatus = useUpdateStatus();
  const assign = useAssignStaff();
  const patch = useAdminPatch();
  const decide = useCompletionDecision();
  const ask = (msg: string) => window.prompt(msg)?.trim();
  const [tab, setTab] = useState<"all" | ComplaintStatus>("all");
  const [q, setQ] = useState("");
  const [assignFor, setAssignFor] = useState<Complaint | null>(null);
  const [staffId, setStaffId] = useState<string>("");

  const staffName = (id: string | null) => {
    const s = staff.find((p) => p.id === id);
    return s ? s.full_name || s.email : null;
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.filter(
      (c) =>
        (tab === "all" || c.status === tab) &&
        (!term ||
          [c.code, c.title, c.location_text, c.ward].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [data, tab, q]);

  const candidates = assignFor
    ? [...staff].sort((a, b) =>
        Number(b.department_id === assignFor.department_id) - Number(a.department_id === assignFor.department_id),
      )
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">New</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="pending_verification">To Verify</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search ID, location, ward" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Ward</TableHead>
              <TableHead>Priority / Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Department</TableHead>
              <TableHead className="w-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell>{categoryLabel(c.category)}</TableCell>
                <TableCell className="max-w-56 truncate">{c.location_text || "—"}</TableCell>
                <TableCell>{c.ward || "—"}</TableCell>
                <TableCell className="text-xs">
                  <div className="capitalize">{c.priority}</div>
                  <div className={isOverdue(c) ? "font-semibold text-destructive" : "text-muted-foreground"}>
                    {c.due_date ? `${isOverdue(c) ? "Overdue · " : ""}${formatDate(c.due_date)}` : "No due date"}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} />
                </TableCell>
                <TableCell>
                  <div>{c.department_id ? depts[c.department_id] : "Unassigned"}</div>
                  {staffName(c.assigned_staff_id) ? (
                    <div className="text-xs text-muted-foreground">Crew: {staffName(c.assigned_staff_id)}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${c.code}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change status</DropdownMenuLabel>
                      {STATUS_ACTIONS.map((s) => (
                        <DropdownMenuItem
                          key={s.value}
                          disabled={c.status === s.value}
                          onSelect={() => updateStatus.mutate({ complaint: c, to: s.value })}
                        >
                          {s.label}
                        </DropdownMenuItem>
                      ))}
                      {["pending", "under_review"].includes(c.status) ? (
                        <DropdownMenuItem onSelect={() => {
                          const r = ask(`Reason for rejecting ${c.code}?`);
                          if (r) updateStatus.mutate({ complaint: c, to: "rejected", note: r });
                        }}>Reject…</DropdownMenuItem>
                      ) : null}
                      {c.status === "pending_verification" ? (
                        <>
                          <DropdownMenuItem onSelect={() => confirm(`Verify ${c.code} as Completed?`) && decide.mutate({ complaint: c, approve: true })}>
                            Verify completion
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            const r = ask("Why is the work being returned?");
                            if (r) decide.mutate({ complaint: c, approve: false, note: r });
                          }}>Return to worker…</DropdownMenuItem>
                        </>
                      ) : null}
                      {c.status === "completed" ? (
                        <DropdownMenuItem onSelect={() => {
                          const r = ask(`Reason for reopening ${c.code}?`);
                          if (r) decide.mutate({ complaint: c, approve: false, reopen: true, note: r });
                        }}>Reopen…</DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Priority</DropdownMenuLabel>
                      {PRIORITIES.map((p) => (
                        <DropdownMenuItem key={p.value} disabled={c.priority === p.value}
                          onSelect={() => patch.mutate({ complaint: c, patch: { priority: p.value }, note: `Priority set to ${p.label}` })}>
                          {p.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onSelect={() => {
                        const d = ask("Due date (YYYY-MM-DD), empty to clear");
                        if (d === undefined) return;
                        if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return void alert("Use YYYY-MM-DD");
                        patch.mutate({ complaint: c, patch: { due_date: d ? new Date(d).toISOString() : null }, note: d ? `Due date set to ${d}` : "Due date cleared" });
                      }}>Set due date…</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => {
                        const n = ask("Instructions / internal note for the worker");
                        if (n) patch.mutate({ complaint: c, patch: { admin_notes: n }, note: "Admin instructions updated" });
                      }}>Add instructions…</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setStaffId(c.assigned_staff_id ?? "");
                          setAssignFor(c);
                        }}
                      >
                        <UserPlus className="size-4" /> Assign staff
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/complaints/$id" params={{ id: c.id }}>
                          <Eye className="size-4" /> View details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  {isLoading ? "Loading complaints…" : "No complaints match these filters."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign staff — {assignFor?.code}</DialogTitle>
            <DialogDescription>
              Choose a field crew member. Their department becomes the assigned department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Staff member</Label>
            <Select value={staffId || "none"} onValueChange={(v) => setStaffId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {candidates.filter((s) => s.is_active).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name || s.email} {s.department_id ? `· ${depts[s.department_id] ?? ""}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!staff.length ? (
              <p className="text-xs text-muted-foreground">
                No staff accounts yet — give someone the Staff role on the Users page.
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={assign.isPending}
              onClick={() => {
                if (!assignFor) return;
                assign.mutate(
                  { complaint: assignFor, staff: staff.find((s) => s.id === staffId) ?? null },
                  { onSuccess: () => setAssignFor(null) },
                );
              }}
            >
              Save assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
