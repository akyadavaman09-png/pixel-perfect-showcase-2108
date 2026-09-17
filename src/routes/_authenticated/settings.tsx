import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints, useDepartments, useProfiles } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SmartCity" },
      { name: "description", content: "Administration settings and system overview for SmartCity." },
      { property: "og:title", content: "Settings — SmartCity" },
      { property: "og:description", content: "Administration settings for SmartCity." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, user, role } = useAuth();
  const { data: departments = [] } = useDepartments();
  const { data: profiles = [] } = useProfiles(role === "admin");
  const { data: complaints = [] } = useComplaints();

  return (
    <AppShell title="Settings" description="System overview and administration">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="surface-card space-y-2 p-5 text-sm">
          <h2 className="font-display text-lg font-semibold">Signed in as</h2>
          <p className="font-medium">{profile?.full_name || user?.email}</p>
          <p className="text-muted-foreground">{user?.email}</p>
          <p className="text-muted-foreground capitalize">Role: {role ?? "citizen"}</p>
        </div>

        <div className="surface-card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">System</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <Tile icon={Building2} label="Departments" value={departments.length} />
            <Tile icon={Users} label="Users" value={profiles.length} />
            <Tile icon={ShieldCheck} label="Complaints" value={complaints.length} />
          </div>
        </div>

        <div className="surface-card space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Administration</h2>
          <p className="text-sm text-muted-foreground">
            Assign roles and departments to staff, and review complaint performance.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/users">Manage users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/departments">View departments</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/reports">Open reports</Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <Icon className="mx-auto size-5 text-primary" aria-hidden />
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
