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
import { useAssignStaff, useStaff, useUpdateStatus } from "@/lib/adminActions";
import { categoryLabel, type Complaint, type ComplaintStatus } from "@/lib/smartcity";

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
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Resolved" },
];

function QueuePage() {
  const { data = [], isLoading } = useComplaints();
  const depts = useDepartmentMap();
  const { data: staff = [] } = useStaff();
  const updateStatus = useUpdateStatus();
  const assign = useAssignStaff();
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
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Resolved</TabsTrigger>
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
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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
                {candidates.map((s) => (
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
