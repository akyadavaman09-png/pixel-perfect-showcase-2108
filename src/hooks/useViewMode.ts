import { useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Presentation-only view switch. It never grants access: the admin view is
 * only offered to accounts whose real role (from the database) is admin or
 * staff, and all data access is still enforced by row-level security.
 */
export type ViewMode = "citizen" | "admin";
const KEY = "smartcity:view-mode";
const listeners = new Set<() => void>();

function read(): ViewMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "citizen" || v === "admin" ? v : null;
}

export function setViewMode(mode: ViewMode) {
  window.localStorage.setItem(KEY, mode);
  listeners.forEach((l) => l());
}

export function useViewMode() {
  const { role } = useAuth();
  const stored = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
  const canUseAdmin = role === "admin" || role === "staff";
  const mode: ViewMode = canUseAdmin ? (stored ?? "admin") : "citizen";
  return { mode, canUseAdmin, setViewMode };
}
