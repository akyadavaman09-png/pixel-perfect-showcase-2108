import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, MapPin, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartCity — Report and Track City Issues" },
      {
        name: "description",
        content:
          "Report potholes, garbage, water and streetlight issues in your city and follow every step until they are resolved.",
      },
      { property: "og:title", content: "SmartCity — Report and Track City Issues" },
      {
        property: "og:description",
        content: "Report city issues with photos and location, and track resolution in real time.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ClipboardList,
    title: "Report in seconds",
    text: "Describe the issue, add a photo and pin the exact spot on the map.",
  },
  {
    icon: Timer,
    title: "Follow progress",
    text: "Every complaint gets a tracking code and a live status timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Right team, first time",
    text: "Issues are routed automatically to the responsible city department.",
  },
];

function Landing() {
  const { session, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold">SmartCity</span>
        </div>
        {loading ? null : session ? (
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden /> Municipal services portal
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">
            A cleaner, safer city starts with a single report
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Tell the city what needs fixing. Track it from submission to resolution, with photos,
            locations and updates from the department in charge.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to={session ? "/report" : "/auth"}>Report an issue</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={session ? "/complaints" : "/auth"}>Track a complaint</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="surface-card p-6 text-left">
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        SmartCity Urban Services
      </footer>
    </div>
  );
}
