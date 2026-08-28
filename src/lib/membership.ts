// ── SlipGo membership tiers ────────────────────────────────────────────────
// Plus (green) and Pro (red) scaffolding. No accounts/billing yet: the current
// tier lives in localStorage so features can be built and tested now, and a
// real auth/subscription system can replace getTier() later without touching
// callers. Placeholder pricing (not shown in UI): Plus $14/mo, Pro $39/mo.

export type Tier = "free" | "plus" | "pro";

export const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, pro: 2 };

/** Every gated capability, mapped to the minimum tier that unlocks it. */
export type FeatureKey =
  | "safety" // crime/safety rating in the detail view
  | "slipNeighbors" // slip-neighbor info in the detail view
  | "tripsCurated" // browse + use curated Trips itineraries
  | "tripsCustom"; // build custom multi-stop trips (future booking flow)

export const FEATURE_TIER: Record<FeatureKey, Tier> = {
  safety: "plus",
  slipNeighbors: "plus",
  tripsCurated: "plus",
  tripsCustom: "pro",
};

/** Human label + theme color class for the tier that unlocks a feature. */
export function featureTier(key: FeatureKey): Exclude<Tier, "free"> {
  return FEATURE_TIER[key] as Exclude<Tier, "free">;
}

export function hasFeature(tier: Tier, key: FeatureKey): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_TIER[key]];
}

const TIER_STORAGE_KEY = "slipgo.tier";

export function getTier(): Tier {
  try {
    const t = localStorage.getItem(TIER_STORAGE_KEY);
    if (t === "plus" || t === "pro") return t;
  } catch {
    /* storage unavailable → free */
  }
  return "free";
}

export function setTier(tier: Tier) {
  try {
    localStorage.setItem(TIER_STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
}
