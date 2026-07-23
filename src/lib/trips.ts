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
}

export function tripStats(t: Itinerary, loaFt = 40, knots = 7): TripStats {
  let nm = 0;
  for (let i = 1; i < t.stops.length; i++) {
    nm += distanceNm(HARBORS[t.stops[i - 1].region], HARBORS[t.stops[i].region]);
  }
  const nights = t.stops.reduce((a, s) => a + s.nights, 0);
  const slipCost = Math.round(
    t.stops.reduce((a, s) => a + s.nights * nightlyRate(s.region) * loaFt, 0),
  );
  return { distanceNm: nm, cruiseHours: cruiseHours(nm, knots), nights, slipCost };
}

export function tripUnlocked(tier: Tier, t: Itinerary): boolean {
  return TIER_RANK[tier] >= TIER_RANK[t.tier];
}
