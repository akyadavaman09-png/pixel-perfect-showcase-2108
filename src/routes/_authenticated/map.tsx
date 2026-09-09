import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CityMap } from "@/components/map/LazyMaps";
import { useComplaints, useDepartmentMap } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "City Map — SmartCity" },
      { name: "description", content: "See every reported city issue plotted on an interactive map." },
      { property: "og:title", content: "City Map — SmartCity" },
      { property: "og:description", content: "Reported city issues on an interactive map." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data: complaints = [] } = useComplaints();
  const departments = useDepartmentMap();
  const located = complaints.filter((c) => c.latitude != null && c.longitude != null);

  return (
    <AppShell title="City Map" description={`${located.length} located complaints`}>
      <div className="surface-card h-[70vh] overflow-hidden p-0">
        <CityMap complaints={located} departments={departments} />
      </div>
    </AppShell>
  );
}
