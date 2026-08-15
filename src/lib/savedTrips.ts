import type { Region } from "../data/regions";
import type { TripStop } from "./trips";

// ── Saved trips ──────────────────────────────────────────────────────────────
// A planned trip the user actually saved, with the dates they chose. This is
// what fills Upcoming / Past / Cancelled — nothing is pre-populated, so a new
// account genuinely has none and sees the empty states.
//
// Stored per user in localStorage. Marina booking is not live yet, so a saved
// trip is a plan, not a reservation, and the UI says so.

export type TripStatus = "upcoming" | "past" | "cancelled";

export interface SavedTrip {
  id: string;
  itineraryId: string;
  name: string;
  /** ISO date (yyyy-mm-dd) the trip departs. */
  startDate: string;
  nights: number;
  route: string;
  /** Kept so any saved trip — curated or custom — can be re-opened in full. */
  stops: TripStop[];
  /** Main destination — the stop with the most nights. */
  destinationRegion: Region;
  destinationName: string;
  destinationLocation: string;
  destinationListingId: string | null;
  destinationLat: number | null;
  destinationLon: number | null;
  destinationWebsite: string | null;
  photoSeed: number;
  boatName: string | null;
  boatLengthFt: number | null;
  totalPrice: number;
  cancelled: boolean;
  createdAt: number;
}

const KEY_PREFIX = "slipgo.trips.";

function keyFor(userId: string | null): string {
  return KEY_PREFIX + (userId ?? "guest");
}

export function listTrips(userId: string | null): SavedTrip[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedTrip[]) : [];
  } catch {
    return [];
  }
}

function write(userId: string | null, trips: SavedTrip[]) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(trips));
  } catch {
    /* storage unavailable — the trip just isn't persisted */
  }
}

export function saveTrip(userId: string | null, trip: Omit<SavedTrip, "id" | "createdAt" | "cancelled">): SavedTrip {
  const full: SavedTrip = {
    ...trip,
    id: `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    cancelled: false,
    createdAt: Date.now(),
  };
  write(userId, [...listTrips(userId), full]);
  return full;
}

export function setCancelled(userId: string | null, id: string, cancelled: boolean) {
  write(
    userId,
    listTrips(userId).map((t) => (t.id === id ? { ...t, cancelled } : t)),
  );
}

export function removeTrip(userId: string | null, id: string) {
  write(
    userId,
    listTrips(userId).filter((t) => t.id !== id),
  );
}

/** Local midnight for an ISO yyyy-mm-dd, so "today" compares correctly. */
function atLocalMidnight(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).getTime();
}

export function tripStatus(t: SavedTrip, now = Date.now()): TripStatus {
  if (t.cancelled) return "cancelled";
  const end = atLocalMidnight(t.startDate) + t.nights * 86400000;
  return end < now ? "past" : "upcoming";
}

export function endDate(t: SavedTrip): Date {
  return new Date(atLocalMidnight(t.startDate) + t.nights * 86400000);
}

/** "12–15 Aug 2026" / "12 Aug 2026" when it's a single day. */
export function formatDateRange(t: SavedTrip): string {
  const start = new Date(atLocalMidnight(t.startDate));
  const end = endDate(t);
  const month = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (t.nights === 0) {
    return `${start.getDate()} ${month(start)} ${start.getFullYear()}`;
  }
  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${month(start)} ${start.getFullYear()}`;
  }
  return `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
}

/** Google Maps driving directions to the destination marina. */
export function directionsUrl(t: SavedTrip): string {
  const q =
    t.destinationLat != null && t.destinationLon != null
      ? `${t.destinationLat},${t.destinationLon}`
      : `${t.destinationName} ${t.destinationLocation}`;
  return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
}
