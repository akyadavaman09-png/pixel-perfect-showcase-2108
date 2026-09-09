import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListChecks, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { PhotoImage } from "@/components/PhotoImage";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComplaints, useDepartmentMap } from "@/lib/queries";
import { CATEGORIES, STATUSES, categoryLabel, formatDate } from "@/lib/smartcity";

export const Route = createFileRoute("/_authenticated/complaints/")({
  head: () => ({
    meta: [
      { title: "Complaints — SmartCity" },
      { name: "description", content: "Browse and filter city complaints by status and category." },
      { property: "og:title", content: "Complaints — SmartCity" },
      { property: "og:description", content: "Browse and filter city complaints." },
    ],
  }),
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { data: complaints = [], isLoading } = useComplaints();
  const departments = useDepartmentMap();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(
    () =>
      complaints.filter((c) => {
        if (status !== "all" && c.status !== status) return false;
        if (category !== "all" && c.category !== category) return false;
        if (q) {
          const t = `${c.title} ${c.code} ${c.location_text ?? ""}`.toLowerCase();
          if (!t.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [complaints, q, status, category],
  );

  return (
    <AppShell title="Complaints" description={`${filtered.length} of ${complaints.length} shown`}>
      <div className="surface-card mb-4 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, code or location"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No complaints found"
          description="Try changing the filters or search term."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to="/complaints/$id"
              params={{ id: c.id }}
              className="surface-card flex gap-4 p-4 transition-colors hover:border-primary/40"
            >
              <PhotoImage path={c.image_url} alt={c.title} className="size-16 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{c.title}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.code} · {categoryLabel(c.category)} ·{" "}
                  {c.department_id ? departments[c.department_id] : "Unassigned"} ·{" "}
                  {formatDate(c.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
