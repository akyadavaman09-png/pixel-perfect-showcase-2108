import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, formatDate, formatDateTime, statusLabel, type ComplaintStatus } from "@/lib/smartcity";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track a complaint — SmartCity" },
      { name: "description", content: "Enter your tracking code to see the status and progress of a city complaint." },
      { property: "og:title", content: "Track a complaint — SmartCity" },
      { property: "og:description", content: "Check complaint status with your tracking code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

type Result = {
  code: string; title: string; category: string; status: ComplaintStatus; department_name: string | null;
  created_at: string; resolved_at: string | null; resolution_notes: string | null;
};
type Step = { to_status: ComplaintStatus | null; note: string | null; created_at: string };

function TrackPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!/^CMP-[A-Z0-9]{6}$/i.test(c)) {
      setError("Tracking codes look like CMP-AB12CD.");
      return;
    }
    setBusy(true); setError(null);
    const [{ data, error: e1 }, { data: tl }] = await Promise.all([
      supabase.rpc("track_lookup", { _code: c }),
      supabase.rpc("track_timeline", { _code: c }),
    ]);
    setBusy(false);
    if (e1) { setError("Something went wrong. Please try again."); return; }
    const row = (data as Result[] | null)?.[0] ?? null;
    setResult(row);
    setSteps((tl as Step[] | null) ?? []);
    if (!row) setError("No complaint found with that tracking code.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span>
          <span className="font-display text-lg font-bold">SmartCity</span>
        </Link>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-16">
        <h1 className="font-display text-3xl font-bold">Track a complaint</h1>
        <form onSubmit={search} className="surface-card flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <Label htmlFor="code">Tracking code</Label>
            <Input id="code" placeholder="CMP-AB12CD" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={!!error} />
          </div>
          <Button type="submit" disabled={busy}><Search className="size-4" /> {busy ? "Searching…" : "Track"}</Button>
          {error ? <p className="w-full text-sm text-destructive" role="alert">{error}</p> : null}
        </form>
        {result ? (
          <div className="surface-card space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="flex-1 font-display text-xl font-semibold">{result.title}</h2>
              <StatusBadge status={result.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {result.code} · {categoryLabel(result.category)} · {result.department_name ?? "Unassigned"} · submitted {formatDate(result.created_at)}
            </p>
            {result.status === "completed" ? (
              <p className="text-sm">Resolved {formatDate(result.resolved_at)}{result.resolution_notes ? ` — ${result.resolution_notes}` : ""}</p>
            ) : null}
            <ol className="space-y-3 border-l border-border pl-4">
              <li className="relative"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">Submitted</p><p className="text-xs text-muted-foreground">{formatDateTime(result.created_at)}</p></li>
              {steps.map((s, i) => (
                <li key={i} className="relative"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{statusLabel(s.to_status)}</p>
                  {s.note ? <p className="text-sm text-muted-foreground">{s.note}</p> : null}
                  <p className="text-xs text-muted-foreground">{formatDateTime(s.created_at)}</p></li>
              ))}
            </ol>
          </div>
        ) : null}
      </main>
    </div>
  );
}
