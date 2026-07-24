import type { Listing } from "../data/listings";
import { REGIONS } from "../data/regions";

// ── Safety / crime rating (scaffold) ─────────────────────────────────────────
// Prepared now, honest until a real data source is wired: `ready` stays false
// and no score is invented. When a per-harbor crime feed is connected, populate
// `score`/`grade` here and the UI + the official Skipper rating light up
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
// The reporting agency for each harbor lives in the region table.

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function getSafety(listing: Listing): SafetyInfo {
  const source = REGIONS[listing.region].safetySource;
  // No crime source wired yet — never fabricate a rating.
  return {
    ready: false,
    score: null,
    grade: null,
    source,
    note: "Crime & safety data source in progress.",
  };
}
