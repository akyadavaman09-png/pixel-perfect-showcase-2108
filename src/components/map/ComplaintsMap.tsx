import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
  DEFAULT_CENTER,
  categoryLabel,
  formatDate,
  statusLabel,
  type Complaint,
  type ComplaintStatus,
} from "@/lib/smartcity";

const colors: Record<ComplaintStatus, string> = {
  pending: "oklch(0.58 0.208 27)",
  in_progress: "oklch(0.72 0.16 62)",
  completed: "oklch(0.6 0.135 152)",
  rejected: "oklch(0.62 0.02 256)",
};

const icons = Object.fromEntries(
  (Object.keys(colors) as ComplaintStatus[]).map((status) => [
    status,
    L.divIcon({
      className: "",
      html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${colors[status]};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    }),
  ]),
) as Record<ComplaintStatus, L.DivIcon>;

export default function ComplaintsMap({
  complaints,
  departments,
}: {
  complaints: Complaint[];
  departments: Record<string, string>;
}) {
  const first = complaints.find((c) => c.latitude != null && c.longitude != null);
  const center: [number, number] = first
    ? [first.latitude as number, first.longitude as number]
    : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={first ? 13 : 11} className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {complaints
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => (
          <Marker
            key={c.id}
            position={[c.latitude as number, c.longitude as number]}
            icon={icons[c.status]}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <p className="font-display text-sm font-bold">{c.code}</p>
                <p className="font-semibold">{c.title}</p>
                <p>{categoryLabel(c.category)}</p>
                <p className="max-w-[220px] text-muted-foreground">{c.description}</p>
                <p>{c.department_id ? departments[c.department_id] : "Unassigned"}</p>
                <p>
                  {statusLabel(c.status)} · {formatDate(c.created_at)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
