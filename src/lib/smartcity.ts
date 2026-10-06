export type AppRole = "citizen" | "staff" | "admin";
export type ComplaintStatus = "pending" | "in_progress" | "completed" | "rejected";
export type ComplaintCategory =
  | "pothole"
  | "garbage"
  | "water"
  | "streetlight"
  | "drainage"
  | "traffic"
  | "safety"
  | "other";

export const CATEGORIES: { value: ComplaintCategory; label: string; department: string }[] = [
  { value: "pothole", label: "Pothole / Road Damage", department: "Roads Department" },
  { value: "garbage", label: "Garbage / Waste", department: "Sanitation Department" },
  { value: "water", label: "Water Supply", department: "Water Department" },
  { value: "streetlight", label: "Streetlight", department: "Electricity Department" },
  { value: "drainage", label: "Drainage", department: "Drainage Department" },
  { value: "traffic", label: "Traffic", department: "Traffic Department" },
  { value: "safety", label: "Public Safety", department: "Public Safety Department" },
  { value: "other", label: "Other", department: "General Services Department" },
];

export const categoryLabel = (value?: string | null) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? "Unknown";

export const STATUSES: { value: ComplaintStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

export const statusLabel = (value?: string | null) =>
  STATUSES.find((s) => s.value === value)?.label ?? "Unknown";

/* Marker colors are read from the design tokens at runtime. */
export const STATUS_TOKEN: Record<ComplaintStatus, string> = {
  pending: "--destructive",
  in_progress: "--warning",
  completed: "--success",
  rejected: "--muted-foreground",
};

export const STATUS_STEPS: ComplaintStatus[] = ["pending", "in_progress", "completed"];

export interface Complaint {
  id: string;
  code: string;
  citizen_id: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  department_id: string | null;
  ward: string | null;
  assigned_staff_id: string | null;
  status: ComplaintStatus;
  admin_notes: string | null;
  resolution_notes: string | null;
  resolution_image_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  category: ComplaintCategory | null;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  department_id: string | null;
  created_at: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  actor_id: string | null;
  from_status: ComplaintStatus | null;
  to_status: ComplaintStatus | null;
  note: string | null;
  image_url: string | null;
  created_at: string;
}

/** Fallback map centre (city centre) when no complaints exist yet. */
export const DEFAULT_CENTER: [number, number] = [28.6139, 77.209];

export const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
