import type { Listing, Region } from "../data/listings";
import { allListings } from "../data/listings";

// ── BoatGoat Estimate ────────────────────────────────────────────────────────
// A transparent, DETERMINISTIC fair-value estimate. No AI, no network.
//
// The estimate answers: "given this listing's location, ease of use, size and
// reviews, how does its price compare to similar listings of the same kind?"
// It is anchored to the going rate for each {mode|type} group, then scaled by an
// attribute score, so an over- or under-priced listing (e.g. a yacht club whose
// dues outrun what it offers) shows up as a positive/negative delta.
//
// getEstimate() returns a fixed shape so an AI provider can later supply the
// same shape behind a flag (source: "ai") without any UI changes.

export type ValueVerdict = "great" | "fair" | "above";

export interface Estimate {
  /** Predicted fair value, in the same units as the listing's price. */
  fairValue: number;
  /** (price − fairValue) / fairValue. Positive = priced above estimate. */
  deltaPct: number;
  verdict: ValueVerdict;
  /** Short human label, e.g. "12% below est." */
  label: string;
  rating: number;
  reviewCount: number;
  source: "heuristic" | "ai";
}

// Per-region anchor points: the harbor's central hub and its mouth to open
// ocean. The estimate rewards proximity to both, RELATIVE TO THE SAME HARBOR —
// so a Newport slip is judged against Newport, not against Marina del Rey.
interface RegionAnchor {
  hub: { lat: number; lon: number };
  mouth: { lat: number; lon: number };
}
const REGION_ANCHORS: Record<Region, RegionAnchor> = {
  mdr: { hub: { lat: 33.9759, lon: -118.4464 }, mouth: { lat: 33.9705, lon: -118.4497 } },
  "long-beach": { hub: { lat: 33.757, lon: -118.15 }, mouth: { lat: 33.744, lon: -118.117 } },
  "santa-barbara": { hub: { lat: 34.4038, lon: -119.6908 }, mouth: { lat: 34.401, lon: -119.6885 } },
  newport: { hub: { lat: 33.612, lon: -117.9 }, mouth: { lat: 33.5936, lon: -117.8807 } },
  ventura: { hub: { lat: 34.2455, lon: -119.2645 }, mouth: { lat: 34.2402, lon: -119.2633 } },
  "channel-islands": { hub: { lat: 34.167, lon: -119.226 }, mouth: { lat: 34.155, lon: -119.222 } },
  redondo: { hub: { lat: 33.8465, lon: -118.3945 }, mouth: { lat: 33.843, lon: -118.397 } },
  "san-pedro": { hub: { lat: 33.723, lon: -118.279 }, mouth: { lat: 33.708, lon: -118.247 } },
  huntington: { hub: { lat: 33.718, lon: -118.067 }, mouth: { lat: 33.731, lon: -118.096 } },
  "dana-point": { hub: { lat: 33.461, lon: -117.698 }, mouth: { lat: 33.457, lon: -117.692 } },
  oceanside: { hub: { lat: 33.205, lon: -117.396 }, mouth: { lat: 33.207, lon: -117.401 } },
  "san-diego": { hub: { lat: 32.72, lon: -117.21 }, mouth: { lat: 32.687, lon: -117.227 } },
  catalina: { hub: { lat: 33.348, lon: -118.323 }, mouth: { lat: 33.3495, lon: -118.32 } },
};

// Amenities that measurably raise desirability / ease of use.
const VALUED_AMENITIES = new Set([
  "Liveaboard OK",
  "Fuel dock",
  "Guest dock",
  "Dry storage",
  "Concrete docks",
  "WaterBus stop",
  "Gated docks",
  "Pump-out",
  "Club amenities",
  "Parking",
]);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Rough planar distance in km — fine over a single harbor. */
function distKm(lat: number, lon: number, b: { lat: number; lon: number }) {
  const dLat = (lat - b.lat) * 111;
  const dLon = (lon - b.lon) * 111 * Math.cos((lat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

/** 0.90–1.15: closer to its harbor's central hub + easy ocean access = more desirable. */
function locationMultiplier(l: Listing): number {
  const anchor = REGION_ANCHORS[l.region] ?? REGION_ANCHORS.mdr;
  const hub = clamp(distKm(l.lat, l.lon, anchor.hub) / 1.2, 0, 1);
  const mouth = clamp(distKm(l.lat, l.lon, anchor.mouth) / 1.6, 0, 1);
  return 1.15 - 0.18 * hub - 0.07 * mouth;
}

/** 1.00–1.20: each valued amenity adds ~3%. */
function amenityMultiplier(l: Listing): number {
  const n = l.amenities.filter((a) => VALUED_AMENITIES.has(a)).length;
  return clamp(1 + 0.03 * n, 1, 1.2);
}

/** 0.94–1.10 across a 3.5–5.0 star range. */
function reviewMultiplier(l: Listing): number {
  return clamp(0.94 + ((l.rating - 3.5) / 1.5) * 0.16, 0.9, 1.12);
}

/** Bigger max LOA commands more (dampened). */
function sizeFactor(l: Listing): number {
  return Math.pow(l.maxLengthFt, 0.9);
}

/** Attribute score — higher means "should cost more". */
function rawScore(l: Listing): number {
  return sizeFactor(l) * locationMultiplier(l) * amenityMultiplier(l) * reviewMultiplier(l);
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Precompute per-group anchors once: the median price and median attribute
// score for each {mode|type}. Grouping keeps unlike things apart (a club's
// monthly dues are never compared against a slip's sale price).
interface GroupStat {
  medianPrice: number;
  medianRaw: number;
}
const groupStats: Record<string, GroupStat> = (() => {
  const buckets: Record<string, Listing[]> = {};
  for (const l of allListings) {
    const key = `${l.mode}|${l.type}`;
    (buckets[key] ??= []).push(l);
  }
  const out: Record<string, GroupStat> = {};
  for (const [key, group] of Object.entries(buckets)) {
    out[key] = {
      medianPrice: median(group.map((g) => g.sortPrice)),
      medianRaw: median(group.map(rawScore)),
    };
  }
  return out;
})();

function roundNice(n: number): number {
  if (n >= 100000) return Math.round(n / 1000) * 1000;
  if (n >= 1000) return Math.round(n / 5) * 5;
  return Math.round(n);
}

function pctLabel(deltaPct: number, verdict: ValueVerdict): string {
  const pct = Math.round(Math.abs(deltaPct) * 100);
  if (verdict === "fair") return "Fair price";
  if (verdict === "great") return `${pct}% below est.`;
  return `${pct}% above est.`;
}

export function getEstimate(listing: Listing): Estimate {
  const stat = groupStats[`${listing.mode}|${listing.type}`];
  const fairRaw = stat && stat.medianRaw > 0 ? stat.medianRaw : rawScore(listing);
  const anchor = stat ? stat.medianPrice : listing.sortPrice;
  const fairValue = roundNice(anchor * (rawScore(listing) / fairRaw));

  const deltaPct = fairValue > 0 ? (listing.sortPrice - fairValue) / fairValue : 0;
  const verdict: ValueVerdict = deltaPct <= -0.08 ? "great" : deltaPct > 0.08 ? "above" : "fair";

  return {
    fairValue,
    deltaPct,
    verdict,
    label: pctLabel(deltaPct, verdict),
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    source: "heuristic",
  };
}

/** Formats a fair value the same way as the price line ("$1,150/mo", "$189K"). */
export function formatEstimate(listing: Listing, fairValue: number): string {
  if (listing.mode === "sale") {
    if (fairValue >= 1000) return `$${Math.round(fairValue / 1000)}K`;
    return `$${fairValue.toLocaleString("en-US")}`;
  }
  const suffix =
    listing.type === "yacht-club" ? "/mo dues" : listing.type === "guest-dock" ? "" : "/mo";
  return `$${fairValue.toLocaleString("en-US")}${suffix}`;
}
