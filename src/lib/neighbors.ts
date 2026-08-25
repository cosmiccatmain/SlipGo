import {
  BOAT_TYPES,
  type BoatType,
  type BoaterPreferences,
  type Dock,
  type DockFit,
  type DockNeighborhood,
  type FitFactor,
  type NeighborProfile,
  type NeighborhoodStats,
  type OnboardFrequency,
} from "./types";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, places = 0) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/**
 * How much of the time someone is around to notice a stranger on the dock.
 * Liveaboards are treated as continuously present regardless of what they
 * put down for onboard frequency.
 */
const PRESENCE_WEIGHT: Record<OnboardFrequency, number> = {
  daily: 1,
  weekly: 0.6,
  monthly: 0.25,
  seasonal: 0.1,
};

/**
 * Coverage at which a dock earns a perfect eyes-on-dock index. Half the slips
 * effectively occupied is about the point where marina managers stop seeing
 * opportunistic theft, so that is the ceiling rather than 100% occupancy.
 */
const FULL_WATCH_COVERAGE = 0.5;

function presenceWeight(neighbor: NeighborProfile): number {
  const base = neighbor.liveaboard
    ? 1
    : PRESENCE_WEIGHT[neighbor.onboardFrequency];
  return neighbor.traits.includes("watches-boats") ? base * 1.25 : base;
}

/** 0..100 sociability for a single slip holder, averaged into `socialIndex`. */
function sociability(neighbor: NeighborProfile): number {
  let value = 50;
  if (neighbor.traits.includes("social")) value += 25;
  if (neighbor.traits.includes("quiet")) value -= 25;
  if (neighbor.liveaboard) value += 8;
  if (neighbor.onboardFrequency === "daily") value += 6;
  else if (neighbor.onboardFrequency === "weekly") value += 3;
  else if (neighbor.onboardFrequency === "seasonal") value -= 5;
  return clamp(value, 0, 100);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function emptyBoatMix(): Record<BoatType, number> {
  return BOAT_TYPES.reduce(
    (acc, type) => ({ ...acc, [type]: 0 }),
    {} as Record<BoatType, number>,
  );
}

export function computeNeighborhoodStats(
  dock: Dock,
  neighbors: NeighborProfile[],
): NeighborhoodStats {
  const count = neighbors.length;
  if (count === 0) {
    return {
      profileCount: 0,
      profileCoverage: 0,
      liveaboardShare: 0,
      medianTenureMonths: 0,
      boatMix: emptyBoatMix(),
      socialIndex: 50,
      petAboardShare: 0,
      kidsAboardShare: 0,
      eyesOnDockIndex: 0,
      verifiedShare: 0,
    };
  }

  const share = (predicate: (n: NeighborProfile) => boolean) =>
    neighbors.filter(predicate).length / count;

  const boatMix = emptyBoatMix();
  for (const neighbor of neighbors) {
    boatMix[neighbor.boatType] += 1 / count;
  }
  for (const type of BOAT_TYPES) {
    boatMix[type] = round(boatMix[type], 3);
  }

  const watchCoverage =
    neighbors.reduce((sum, n) => sum + presenceWeight(n), 0) /
    Math.max(dock.slipCount, 1);

  return {
    profileCount: count,
    profileCoverage: round(count / Math.max(dock.slipCount, 1), 3),
    liveaboardShare: round(share((n) => n.liveaboard), 3),
    medianTenureMonths: median(neighbors.map((n) => n.tenureMonths)),
    boatMix,
    socialIndex: Math.round(
      neighbors.reduce((sum, n) => sum + sociability(n), 0) / count,
    ),
    petAboardShare: round(share((n) => n.traits.includes("pet-aboard")), 3),
    kidsAboardShare: round(share((n) => n.traits.includes("kids-aboard")), 3),
    eyesOnDockIndex: Math.round(
      clamp(watchCoverage / FULL_WATCH_COVERAGE) * 100,
    ),
    verifiedShare: round(share((n) => n.verified), 3),
  };
}

/* ------------------------------------------------------------------ */
/* Dock fit                                                            */
/* ------------------------------------------------------------------ */

interface FactorSpec {
  key: string;
  label: string;
  weight: number;
  /** Returns null when the factor does not apply to this boater. */
  evaluate: (
    prefs: BoaterPreferences,
    neighborhood: DockNeighborhood,
  ) => { score: number; note: string } | null;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

const FACTORS: FactorSpec[] = [
  {
    key: "sociability",
    label: "Dock personality",
    weight: 22,
    evaluate: (prefs, { stats }) => {
      const distance = Math.abs(prefs.sociability - stats.socialIndex) / 100;
      const score = clamp(1 - distance ** 1.2);
      const character =
        stats.socialIndex >= 65
          ? "social"
          : stats.socialIndex <= 40
            ? "keeps to itself"
            : "an even mix";
      return {
        score,
        note: `Dock reads ${character} (${stats.socialIndex}/100) against your ${prefs.sociability}/100.`,
      };
    },
  },
  {
    key: "liveaboard",
    label: "Liveaboard alignment",
    weight: 14,
    evaluate: (prefs, { dock, stats }) => {
      if (prefs.liveaboard) {
        if (!dock.liveaboardPermitted) {
          return { score: 0, note: "This dock does not permit liveaboards." };
        }
        return {
          score: 0.5 + 0.5 * clamp(stats.liveaboardShare / 0.4),
          note: `${percent(stats.liveaboardShare)} of profiles here live aboard.`,
        };
      }
      const crowding = clamp((stats.liveaboardShare - 0.5) / 0.5);
      const share = percent(stats.liveaboardShare);
      return {
        score: 1 - 0.6 * crowding,
        note:
          crowding > 0
            ? `Mostly liveaboards (${share}) — busier than a weekender dock.`
            : stats.liveaboardShare < 0.2
              ? `${share} liveaboards; quiet during the week.`
              : `${share} liveaboards, so there is usually someone around midweek.`,
      };
    },
  },
  {
    key: "boat-mix",
    label: "Boats like yours",
    weight: 12,
    evaluate: (prefs, { stats }) => {
      const sameType = stats.boatMix[prefs.boatType] ?? 0;
      return {
        score: clamp(sameType / 0.4),
        note: `${percent(sameType)} of the dock runs ${prefs.boatType}s — the people who know your systems.`,
      };
    },
  },
  {
    key: "stability",
    label: "Dock stability",
    weight: 14,
    evaluate: (_prefs, { stats }) => {
      const years = stats.medianTenureMonths / 12;
      return {
        score: clamp(stats.medianTenureMonths / 48),
        note: `Median tenure ${round(years, 1)} years — ${
          years >= 3 ? "settled neighbors" : "a fair amount of turnover"
        }.`,
      };
    },
  },
  {
    key: "eyes-on-dock",
    label: "Eyes on the dock",
    weight: 16,
    evaluate: (_prefs, { stats }) => ({
      score: stats.eyesOnDockIndex / 100,
      note: `Watch coverage ${stats.eyesOnDockIndex}/100 from neighbors who are aboard regularly.`,
    }),
  },
  {
    key: "family",
    label: "Pets and kids",
    weight: 10,
    evaluate: (prefs, { stats }) => {
      if (!prefs.hasPets && !prefs.hasKids) return null;
      const parts: string[] = [];
      let score = 0;
      let terms = 0;
      if (prefs.hasPets) {
        score += clamp(stats.petAboardShare / 0.35);
        terms += 1;
        parts.push(`${percent(stats.petAboardShare)} have a dog aboard`);
      }
      if (prefs.hasKids) {
        score += clamp(stats.kidsAboardShare / 0.25);
        terms += 1;
        parts.push(`${percent(stats.kidsAboardShare)} have kids aboard`);
      }
      return { score: score / terms, note: `${parts.join(", ")}.` };
    },
  },
  {
    key: "size-fit",
    label: "Slip size fit",
    weight: 12,
    evaluate: (prefs, { dock }) => {
      const [min, max] = dock.slipLengthRangeFt;
      if (prefs.boatLengthFt > max) {
        return {
          score: 0,
          note: `Longest slip here is ${max}′; your boat is ${prefs.boatLengthFt}′.`,
        };
      }
      const margin = max - prefs.boatLengthFt;
      const tight = prefs.boatLengthFt < min;
      if (tight) {
        return {
          score: 0.6,
          note: `Slips start at ${min}′, so you would pay for length you do not use.`,
        };
      }
      return {
        score: margin >= 2 ? 1 : 0.75,
        note: `Slips run ${min}–${max}′; ${
          margin >= 2 ? "comfortable fit" : "workable but tight"
        } at ${prefs.boatLengthFt}′.`,
      };
    },
  },
];

/**
 * Scores how well one dock suits a boater, 0..100.
 *
 * Factors that do not apply (pets/kids for a boater with neither) are dropped
 * and the remaining weights renormalized, so a score is always out of 100.
 */
export function scoreDockFit(
  prefs: BoaterPreferences,
  neighborhood: DockNeighborhood,
): DockFit {
  const evaluated = FACTORS.map((spec) => ({
    spec,
    result: spec.evaluate(prefs, neighborhood),
  })).filter(
    (entry): entry is { spec: FactorSpec; result: { score: number; note: string } } =>
      entry.result !== null,
  );

  const totalWeight = evaluated.reduce((sum, e) => sum + e.spec.weight, 0);

  const factors: FitFactor[] = evaluated.map(({ spec, result }) => {
    const weight = (spec.weight / totalWeight) * 100;
    return {
      key: spec.key,
      label: spec.label,
      weight: round(weight, 1),
      score: round(result.score, 3),
      contribution: round(weight * result.score, 1),
      note: result.note,
    };
  });

  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.contribution, 0),
  );

  const blocker =
    prefs.boatLengthFt > neighborhood.dock.slipLengthRangeFt[1]
      ? `Your ${prefs.boatLengthFt}′ boat does not fit — slips top out at ${neighborhood.dock.slipLengthRangeFt[1]}′.`
      : prefs.liveaboard && !neighborhood.dock.liveaboardPermitted
        ? "Liveaboards are not permitted on this dock."
        : null;

  const best = [...factors].sort((a, b) => {
    const spread = b.score - a.score;
    return spread !== 0 ? spread : b.weight - a.weight;
  })[0];

  return {
    dockId: neighborhood.dock.id,
    score,
    factors,
    headline: blocker ?? best?.note ?? "No neighbor profiles shared yet.",
    blocker,
  };
}

/** Ranks docks best-fit first. Docks with a hard blocker always sort last. */
export function rankDocks(
  prefs: BoaterPreferences,
  neighborhoods: DockNeighborhood[],
): DockFit[] {
  return neighborhoods
    .map((neighborhood) => scoreDockFit(prefs, neighborhood))
    .sort((a, b) => {
      if (Boolean(a.blocker) !== Boolean(b.blocker)) return a.blocker ? 1 : -1;
      return b.score - a.score;
    });
}

/**
 * Marina-wide watch coverage, weighted by dock size. Returns null when nobody
 * has shared a profile, which the security score treats as "unknown" rather
 * than "nobody is watching".
 */
export function marinaEyesOnDockIndex(
  neighborhoods: DockNeighborhood[],
): number | null {
  const withProfiles = neighborhoods.filter(
    (neighborhood) => neighborhood.stats.profileCount > 0,
  );
  if (withProfiles.length === 0) return null;

  const slips = withProfiles.reduce((sum, n) => sum + n.dock.slipCount, 0);
  if (slips === 0) return null;

  return Math.round(
    withProfiles.reduce(
      (sum, n) => sum + n.stats.eyesOnDockIndex * n.dock.slipCount,
      0,
    ) / slips,
  );
}

export const NEIGHBOR_INTERNALS = {
  presenceWeight,
  sociability,
  FULL_WATCH_COVERAGE,
};
