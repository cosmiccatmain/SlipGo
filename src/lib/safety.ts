import type { Listing, Region } from "../data/listings";

// ── Safety / crime rating (scaffold) ─────────────────────────────────────────
// Prepared now, honest until a real data source is wired: `ready` stays false
// and no score is invented. When a per-harbor crime feed is connected, populate
// `score`/`grade` here and the UI + the official goaty rating light up
// automatically (ListingDetail blends it into the overall score when ready).

export interface SafetyInfo {
  /** True once a real crime data source is connected for this region. */
  ready: boolean;
  /** 0–100, higher = safer. Null until data is wired. */
  score: number | null;
  /** Letter grade derived from the score, or null. */
  grade: string | null;
  /** The authority the data will come from (shown to the user). */
  source: string;
  note: string;
}

// The real reporting authority for each harbor — where the crime data will come
// from once ingested.
const REGION_SAFETY_SOURCE: Record<Region, string> = {
  mdr: "L.A. County Sheriff — Marina del Rey Station",
  "long-beach": "Long Beach Police Department",
  "santa-barbara": "Santa Barbara Police Department",
  newport: "Newport Beach Police Department",
  ventura: "Ventura Police Department",
  "channel-islands": "Oxnard PD · Channel Islands Harbor Patrol",
  redondo: "Redondo Beach Police Department",
  "san-pedro": "LAPD — Harbor Division",
  huntington: "Huntington Beach Police Department",
  "dana-point": "O.C. Sheriff — Dana Point Harbor Patrol",
  oceanside: "Oceanside PD — Harbor Unit",
  "san-diego": "San Diego Harbor Police",
  catalina: "L.A. County Sheriff — Avalon Station",
};

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function getSafety(listing: Listing): SafetyInfo {
  const source = REGION_SAFETY_SOURCE[listing.region];
  // No crime source wired yet — never fabricate a rating.
  return {
    ready: false,
    score: null,
    grade: null,
    source,
    note: "Crime & safety data source in progress.",
  };
}
