import { rentListings, type Region } from "../data/listings";
import { TIER_RANK, type Tier } from "./membership";

// ── BoatGoat Trips ───────────────────────────────────────────────────────────
// Book a slip at every stop of a coastal cruise. v1 ships the planning engine
// and curated itineraries; the multi-slip booking flow arrives in a later pass.
// Curated trips are a Plus feature; custom trip building / full access is Pro.

export interface Harbor {
  label: string;
  lat: number;
  lon: number;
}

/** Waypoint per harbor (harbor entrance / anchorage, for leg distances). */
export const HARBORS: Record<Region, Harbor> = {
  "santa-barbara": { label: "Santa Barbara", lat: 34.4038, lon: -119.6908 },
  ventura: { label: "Ventura", lat: 34.2455, lon: -119.2645 },
  "channel-islands": { label: "Channel Islands (Oxnard)", lat: 34.167, lon: -119.226 },
  mdr: { label: "Marina del Rey", lat: 33.9762, lon: -118.4505 },
  redondo: { label: "Redondo Beach", lat: 33.8465, lon: -118.3945 },
  "san-pedro": { label: "San Pedro", lat: 33.723, lon: -118.279 },
  "long-beach": { label: "Long Beach", lat: 33.757, lon: -118.15 },
  catalina: { label: "Catalina · Avalon", lat: 33.348, lon: -118.323 },
  huntington: { label: "Huntington Harbour", lat: 33.718, lon: -118.067 },
  newport: { label: "Newport Beach", lat: 33.612, lon: -117.9 },
  "dana-point": { label: "Dana Point", lat: 33.461, lon: -117.698 },
  oceanside: { label: "Oceanside", lat: 33.205, lon: -117.396 },
  "san-diego": { label: "San Diego", lat: 32.72, lon: -117.21 },
};

const EARTH_RADIUS_NM = 3440.065;

export function distanceNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(h));
}

/** Hours underway at a typical displacement cruise speed. */
export function cruiseHours(nm: number, knots = 7): number {
  return nm / knots;
}

/** Initial great-circle bearing from a → b, in degrees (0 = north). */
export function bearingDeg(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lon - a.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

export interface LegWind {
  /** Wind speed in knots. */
  speedKts: number;
  /** Direction the wind blows FROM, in degrees. */
  fromDeg: number;
}

/**
 * Current wind at each leg midpoint, in one Open-Meteo call (keyless).
 * Returns null if unavailable — callers fall back to flat-speed estimates.
 */
export async function fetchLegWinds(
  points: { lat: number; lon: number }[],
): Promise<LegWind[] | null> {
  if (points.length === 0) return [];
  const lats = points.map((p) => p.lat.toFixed(4)).join(",");
  const lons = points.map((p) => p.lon.toFixed(4)).join(",");
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lats}&longitude=${lons}` +
    "&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn";
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const rows = Array.isArray(json) ? json : [json];
    return rows.map((r: any) => ({
      speedKts: Number(r?.current?.wind_speed_10m ?? 0),
      fromDeg: Number(r?.current?.wind_direction_10m ?? 0),
    }));
  } catch {
    return null;
  }
}

/**
 * Speed over ground for one leg given the wind on it. Tailwind helps, headwind
 * hurts; the effect is deliberately modest and clamped so the estimate stays
 * sane for both sail and power.
 */
export function effectiveSpeed(baseKts: number, courseDeg: number, wind: LegWind): number {
  const towardDeg = (wind.fromDeg + 180) % 360; // direction the wind blows toward
  const delta = (((towardDeg - courseDeg + 540) % 360) - 180) * (Math.PI / 180);
  const component = Math.cos(delta) * wind.speedKts; // + tailwind, − headwind
  const adjusted = baseKts + component * 0.15;
  return Math.min(Math.max(adjusted, baseKts * 0.6), baseKts * 1.35);
}

/** Midpoint of every leg — where we sample the wind. */
export function legMidpoints(t: Itinerary): { lat: number; lon: number }[] {
  const mids: { lat: number; lon: number }[] = [];
  for (let i = 1; i < t.stops.length; i++) {
    const a = HARBORS[t.stops[i - 1].region];
    const b = HARBORS[t.stops[i].region];
    mids.push({ lat: (a.lat + b.lat) / 2, lon: (a.lon + b.lon) / 2 });
  }
  return mids;
}

/** "2d 6h" / "14h" */
export function formatDuration(hours: number): string {
  const total = Math.max(0, Math.round(hours));
  const d = Math.floor(total / 24);
  const h = total % 24;
  if (d === 0) return `${h}h`;
  return `${d}d ${h}h`;
}

export interface TripStop {
  region: Region;
  /** Nights moored at this stop (0 = departure port). */
  nights: number;
}

export interface Itinerary {
  id: string;
  name: string;
  tagline: string;
  tier: "plus" | "pro";
  stops: TripStop[];
}

export const CURATED_TRIPS: Itinerary[] = [
  {
    id: "catalina-classic",
    name: "Catalina Classic",
    tagline: "The weekend everyone should do once a season — over to Avalon, back along the coast.",
    tier: "plus",
    stops: [
      { region: "long-beach", nights: 0 },
      { region: "catalina", nights: 2 },
      { region: "newport", nights: 1 },
    ],
  },
  {
    id: "channel-islands-escape",
    name: "Channel Islands Escape",
    tagline: "North up the coast with an island-park doorstep at every overnight.",
    tier: "plus",
    stops: [
      { region: "mdr", nights: 0 },
      { region: "channel-islands", nights: 1 },
      { region: "ventura", nights: 1 },
      { region: "santa-barbara", nights: 2 },
    ],
  },
  {
    id: "socal-grand-tour",
    name: "SoCal Grand Tour",
    tagline: "Santa Barbara to San Diego — every great harbor on the coast in one cruise.",
    tier: "pro",
    stops: [
      { region: "santa-barbara", nights: 0 },
      { region: "ventura", nights: 1 },
      { region: "channel-islands", nights: 1 },
      { region: "mdr", nights: 1 },
      { region: "redondo", nights: 1 },
      { region: "long-beach", nights: 1 },
      { region: "catalina", nights: 2 },
      { region: "newport", nights: 1 },
      { region: "dana-point", nights: 1 },
      { region: "oceanside", nights: 1 },
      { region: "san-diego", nights: 2 },
    ],
  },
];

// Fallback when a harbor has no transient dock in our data yet.
const DEFAULT_NIGHTLY_PER_FT = 2;

/** Cheapest listed transient ($/ft/night) in a harbor. */
function nightlyRate(region: Region): number {
  const rates = rentListings
    .filter((l) => l.region === region && typeof l.nightlyPerFt === "number")
    .map((l) => l.nightlyPerFt as number);
  return rates.length ? Math.min(...rates) : DEFAULT_NIGHTLY_PER_FT;
}

export interface TripStats {
  distanceNm: number;
  cruiseHours: number;
  nights: number;
  /** Estimated total transient slip/mooring cost for the whole trip. */
  slipCost: number;
  /** Total trip length: nights ashore + time underway. */
  totalHours: number;
  /** True when cruiseHours was adjusted using live wind. */
  windAdjusted: boolean;
  /** Mean wind across the legs, when available. */
  avgWindKts?: number;
}

/**
 * Trip stats. Pass `winds` (one per leg, from fetchLegWinds) to get a
 * wind-adjusted time underway; without it we fall back to flat cruise speed.
 */
export function tripStats(
  t: Itinerary,
  loaFt = 40,
  knots = 7,
  winds?: LegWind[] | null,
): TripStats {
  let nm = 0;
  let hours = 0;
  const usable = !!winds && winds.length === t.stops.length - 1;

  for (let i = 1; i < t.stops.length; i++) {
    const a = HARBORS[t.stops[i - 1].region];
    const b = HARBORS[t.stops[i].region];
    const legNm = distanceNm(a, b);
    nm += legNm;
    if (usable) {
      const speed = effectiveSpeed(knots, bearingDeg(a, b), winds![i - 1]);
      hours += legNm / speed;
    } else {
      hours += legNm / knots;
    }
  }

  const nights = t.stops.reduce((a, s) => a + s.nights, 0);
  const slipCost = Math.round(
    t.stops.reduce((a, s) => a + s.nights * nightlyRate(s.region) * loaFt, 0),
  );
  const avgWindKts = usable
    ? winds!.reduce((a, w) => a + w.speedKts, 0) / winds!.length
    : undefined;

  return {
    distanceNm: nm,
    cruiseHours: hours,
    nights,
    slipCost,
    totalHours: nights * 24 + hours,
    windAdjusted: usable,
    avgWindKts,
  };
}

export function tripUnlocked(tier: Tier, t: Itinerary): boolean {
  return TIER_RANK[tier] >= TIER_RANK[t.tier];
}
