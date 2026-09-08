import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { Complaint } from "@/lib/smartcity";

const PickerImpl = lazy(() => import("./LocationPickerMap"));
const ComplaintsImpl = lazy(() => import("./ComplaintsMap"));

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-md bg-muted" />;
}

export function LocationPicker(props: {
  value: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
}) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <PickerImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function CityMap(props: { complaints: Complaint[]; departments: Record<string, string> }) {
  return (
    <ClientOnly fallback={<MapSkeleton />}>
      <Suspense fallback={<MapSkeleton />}>
        <ComplaintsImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
