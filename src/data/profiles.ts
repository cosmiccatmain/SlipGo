import type {
  BoatType,
  NeighborProfile,
  NeighborTrait,
  OnboardFrequency,
} from "@/lib/types";
import type { DockSpec } from "./marinas";

/**
 * SAMPLE DATA. Neighbor profiles are generated deterministically from the dock
 * id, so the same dock always produces the same neighbors across renders and
 * test runs without checking in hundreds of hand-written records.
 */

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST_NAMES = [
  "Marisol", "Dave", "Priya", "Tom", "Elena", "Wes", "Junko", "Rafael",
  "Cathy", "Owen", "Beatriz", "Hank", "Nadia", "Curtis", "Ingrid", "Sam",
  "Lupe", "Bennett", "Aisha", "Roy", "Colleen", "Miguel", "Sunny", "Arthur",
  "Delphine", "Kai", "Marta", "Gus", "Yvonne", "Pete",
];

const LAST_INITIALS = "ABCDEFGHKLMNPRSTVW".split("");

const BOAT_NAMES = [
  "Second Wind", "Salt Habit", "Bellwether", "Marlinspike", "Papa's Folly",
  "Low Tide", "Ceilidh", "Ondine", "Knot Working", "Fair Isle", "Sea Legs",
  "Persistence", "Halyard", "Blue Sky Money", "Windward Ho", "Cormorant",
  "Slack Water", "Nauti Buoy", "Aground Again", "Dawn Treader",
];

const FLAVOR_TRAITS: NeighborTrait[] = [
  "handy",
  "racer",
  "angler",
  "cruiser",
  "shares-tools",
];

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function weightedType(
  rng: () => number,
  weights: Partial<Record<BoatType, number>>,
): BoatType {
  const entries = Object.entries(weights) as Array<[BoatType, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;
  for (const [type, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return entries[entries.length - 1][0];
}

function onboardFrequency(
  rng: () => number,
  liveaboard: boolean,
  socialLean: number,
): OnboardFrequency {
  if (liveaboard) return "daily";
  const roll = rng() * 100;
  const active = socialLean / 2; // social docks skew toward people being around
  if (roll < 12 + active) return "daily";
  if (roll < 55 + active) return "weekly";
  if (roll < 85) return "monthly";
  return "seasonal";
}

export function generateNeighbors(
  spec: DockSpec,
  marinaSlug: string,
): NeighborProfile[] {
  const rng = mulberry32(hashString(`${marinaSlug}:${spec.id}`));
  const count = Math.round(spec.slipCount * spec.profileShare);
  const [minLen, maxLen] = spec.slipLengthRangeFt;
  const usedSlips = new Set<number>();

  return Array.from({ length: count }, (_, index) => {
    let slipNumber = 1 + Math.floor(rng() * spec.slipCount);
    while (usedSlips.has(slipNumber)) {
      slipNumber = (slipNumber % spec.slipCount) + 1;
    }
    usedSlips.add(slipNumber);

    const liveaboard = spec.liveaboardPermitted && rng() < spec.liveaboardShare;
    const boatType = weightedType(rng, spec.typeWeights);
    const boatLengthFt = Math.round(minLen + rng() * (maxLen - minLen));

    const traits: NeighborTrait[] = [];
    const socialRoll = rng() * 100;
    if (socialRoll < spec.socialLean - 15) traits.push("social");
    else if (socialRoll > spec.socialLean + 25) traits.push("quiet");

    if (rng() < (liveaboard ? 0.7 : 0.33)) traits.push("watches-boats");
    if (rng() < 0.28) traits.push("pet-aboard");
    if (rng() < 0.14) traits.push("kids-aboard");
    traits.push(pick(rng, FLAVOR_TRAITS));

    // Liveaboards and long-tenure holders are the ones who bother to verify.
    const tenureMonths = liveaboard
      ? 12 + Math.floor(rng() * 108)
      : 2 + Math.floor(rng() * 84);

    const visibilityRoll = rng();
    const visibility =
      visibilityRoll < 0.08 ? "private" : visibilityRoll < 0.45 ? "marina" : "dock";

    return {
      id: `${spec.id}-p${index + 1}`,
      dockId: spec.id,
      slipNumber: `${spec.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase()}-${slipNumber}`,
      displayName: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_INITIALS)}.`,
      boatName: rng() < 0.9 ? pick(rng, BOAT_NAMES) : null,
      boatType,
      boatLengthFt,
      liveaboard,
      onboardFrequency: onboardFrequency(rng, liveaboard, spec.socialLean),
      tenureMonths,
      traits: [...new Set(traits)],
      verified: rng() < (liveaboard ? 0.92 : 0.74),
      visibility,
    } satisfies NeighborProfile;
  });
}
