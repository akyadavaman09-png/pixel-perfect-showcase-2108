import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  ClipboardCheck,
  FileBarChart,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Settings,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const NAV: Record<string, NavItem[]> = {
  citizen: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/report", label: "Report an Issue", icon: FilePlus2 },
    { to: "/complaints", label: "My Complaints", icon: ListChecks },
    { to: "/map", label: "City Map", icon: MapIcon },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ],
  staff: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/complaints", label: "Assigned Complaints", icon: ListChecks },
    { to: "/map", label: "City Map", icon: MapIcon },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/verify", label: "Verify Complaints", icon: ClipboardCheck },
    { to: "/complaints", label: "All Complaints", icon: ListChecks },
    { to: "/departments", label: "Departments", icon: Building2 },
    { to: "/users", label: "Users", icon: Users },
    { to: "/map", label: "City Map", icon: MapIcon },
    { to: "/reports", label: "Reports", icon: FileBarChart },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
};

const roleLabel: Record<string, string> = {
  citizen: "Citizen",
  staff: "Department Staff",
  admin: "Administrator",
};

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { role, profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items: NavItem[] = NAV[role ?? "citizen"] ?? NAV["citizen"] ?? [];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
      <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="font-display text-base font-bold text-sidebar-accent-foreground">SmartCity</p>
        <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/70">
          Urban Services
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="border-t border-sidebar-border p-3">
      <div className="mb-2 px-1">
        <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
          {profile?.full_name || user?.email}
        </p>
        <p className="text-xs text-sidebar-foreground/70">{roleLabel[role ?? "citizen"]}</p>
      </div>
      <button
        onClick={() => void signOut()}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <LogOut className="size-4" aria-hidden /> Sign out
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar">
            <div className="flex items-center justify-between">
              <div className="flex-1">{brand}</div>
              <button
                className="mr-3 rounded-md p-2 text-sidebar-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdroprop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold sm:text-xl">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
