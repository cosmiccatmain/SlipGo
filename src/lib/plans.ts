import { allListings } from "../data/listings";
import { BOAT_LIMIT } from "./boats";
import { FEATURE_TIER, type Tier } from "./membership";

// ── Plan catalogue ───────────────────────────────────────────────────────────
// One source of truth for the pricing page and the post-signup modal. Prices
// and perks are exactly the ones the project already carried — nothing here is
// invented, and only monthly billing exists today, so no annual toggle is
// offered until real billing periods are configured.

/** Kept in one place so plan copy can never drift from the catalogue. */
const LISTING_COUNT = allListings.length;

export interface Plan {
  tier: Tier;
  name: string;
  price: string;
  cadence: string;
  /** One line on what the plan is for. */
  blurb: string;
  /** Who it suits — helps people self-select rather than guess. */
  audience: string;
  perks: string[];
  /** Tasteful highlight on the plan we recommend. */
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Search every slip we cover.",
    audience: "Browsing the coast and comparing what a slip should cost.",
    perks: [
      `All ${LISTING_COUNT} listings & the map`,
      "SlipGo Estimate",
      "Skipper AI summaries",
      "Live wind",
      "1 boat saved",
    ],
  },
  {
    tier: "plus",
    name: "Plus",
    price: "$14",
    cadence: "/mo",
    blurb: "The details that decide a slip.",
    audience: "Boaters picking a home slip, or planning a coastal cruise.",
    popular: true,
    perks: [
      "Crime & Safety ratings",
      "Slip neighbors",
      "Curated Trips + slip prices",
      "Wind-timed routes",
      "3 boats saved",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$39",
    cadence: "/mo",
    blurb: "For liveaboards and long cruises.",
    audience: "Liveaboards and long-distance cruisers running their own routes.",
    perks: [
      "Everything in Plus",
      "Build custom multi-stop trips",
      "Fuel & pump-out planning",
      "Full Grand Tour routes",
      "Unlimited boats",
    ],
  },
];

export function planFor(tier: Tier): Plan {
  return PLANS.find((p) => p.tier === tier) ?? PLANS[0];
}

/** Marketing name for a tier, e.g. "SlipGo Plus". */
export function planLabel(tier: Tier): string {
  return tier === "free" ? "SlipGo Free" : `SlipGo ${planFor(tier).name}`;
}

// ── Comparison matrix ────────────────────────────────────────────────────────
// Built from the real gating rules (FEATURE_TIER) and the real boat limits, so
// the table can never drift from what the app actually enforces.

export interface ComparisonRow {
  label: string;
  detail: string;
  /** Cell content per tier: true/false for a check, or a string. */
  values: Record<Tier, boolean | string>;
}

function byFeature(key: keyof typeof FEATURE_TIER): Record<Tier, boolean> {
  const min = FEATURE_TIER[key];
  const rank: Record<Tier, number> = { free: 0, plus: 1, pro: 2 };
  return {
    free: rank.free >= rank[min],
    plus: rank.plus >= rank[min],
    pro: rank.pro >= rank[min],
  };
}

function boatCell(t: Tier): string {
  const n = BOAT_LIMIT[t];
  return n === Infinity ? "Unlimited" : n === 1 ? "1 boat" : `${n} boats`;
}

export const COMPARISON: ComparisonRow[] = [
  {
    label: "Slip search & map",
    detail: "Every listing in the state, with photos, reviews and the SlipGo Estimate.",
    values: { free: true, plus: true, pro: true },
  },
  {
    label: "Live wind",
    detail: "Real conditions at each harbour, pulled fresh from Open-Meteo.",
    values: { free: true, plus: true, pro: true },
  },
  {
    label: "Crime & Safety rating",
    detail: "How safe the area around a marina is, sourced from the local agency.",
    values: byFeature("safety"),
  },
  {
    label: "Slip neighbors",
    detail: "Who is docked around a slip before you commit to it.",
    values: byFeature("slipNeighbors"),
  },
  {
    label: "Curated Trips",
    detail: "Ready-made coastal routes with per-stop slip prices and wind-timed legs.",
    values: byFeature("tripsCurated"),
  },
  {
    label: "Custom multi-stop trips",
    detail: "Chain any harbours we cover into your own route.",
    values: byFeature("tripsCustom"),
  },
  {
    label: "Fuel & pump-out planning",
    detail: "Which stops on your route can take on fuel or pump out.",
    values: byFeature("tripsCustom"),
  },
  {
    label: "Saved boats",
    detail: "Trip timing and slip pricing use your boat's length and cruise speed.",
    values: { free: boatCell("free"), plus: boatCell("plus"), pro: boatCell("pro") },
  },
];
