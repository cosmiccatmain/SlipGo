import { describe, expect, it } from "vitest";
import {
  computeNeighborhoodStats,
  marinaEyesOnDockIndex,
  rankDocks,
  scoreDockFit,
} from "@/lib/neighbors";
import type { BoaterPreferences, DockNeighborhood } from "@/lib/types";
import { makeDock, makeNeighbor } from "./factories";

const basePrefs: BoaterPreferences = {
  boatType: "sailboat",
  boatLengthFt: 36,
  liveaboard: false,
  sociability: 50,
  hasPets: false,
  hasKids: false,
};

function neighborhood(
  neighbors: ReturnType<typeof makeNeighbor>[],
  dockOverrides = {},
): DockNeighborhood {
  const dock = makeDock(dockOverrides);
  return { dock, neighbors, stats: computeNeighborhoodStats(dock, neighbors) };
}

describe("computeNeighborhoodStats", () => {
  it("reports shares against the profile count and coverage against the slip count", () => {
    const dock = makeDock({ slipCount: 10 });
    const stats = computeNeighborhoodStats(dock, [
      makeNeighbor({ id: "a", liveaboard: true }),
      makeNeighbor({ id: "b" }),
      makeNeighbor({ id: "c", traits: ["pet-aboard"] }),
      makeNeighbor({ id: "d", verified: false }),
    ]);

    expect(stats.profileCount).toBe(4);
    expect(stats.profileCoverage).toBeCloseTo(0.4, 3);
    expect(stats.liveaboardShare).toBeCloseTo(0.25, 3);
    expect(stats.petAboardShare).toBeCloseTo(0.25, 3);
    expect(stats.verifiedShare).toBeCloseTo(0.75, 3);
  });

  it("takes the median tenure, not the mean, so one 20-year holder cannot skew a dock", () => {
    const dock = makeDock();
    const stats = computeNeighborhoodStats(dock, [
      makeNeighbor({ id: "a", tenureMonths: 6 }),
      makeNeighbor({ id: "b", tenureMonths: 12 }),
      makeNeighbor({ id: "c", tenureMonths: 240 }),
    ]);

    expect(stats.medianTenureMonths).toBe(12);
  });

  it("scores a social dock above a quiet one", () => {
    const dock = makeDock();
    const social = computeNeighborhoodStats(dock, [
      makeNeighbor({ id: "a", traits: ["social"] }),
      makeNeighbor({ id: "b", traits: ["social"], onboardFrequency: "daily" }),
    ]);
    const quiet = computeNeighborhoodStats(dock, [
      makeNeighbor({ id: "a", traits: ["quiet"], onboardFrequency: "seasonal" }),
      makeNeighbor({ id: "b", traits: ["quiet"] }),
    ]);

    expect(social.socialIndex).toBeGreaterThan(quiet.socialIndex);
    expect(quiet.socialIndex).toBeLessThan(50);
  });

  it("treats liveaboards as always present when computing watch coverage", () => {
    const dock = makeDock({ slipCount: 20 });
    const liveaboards = computeNeighborhoodStats(
      dock,
      Array.from({ length: 5 }, (_, i) =>
        makeNeighbor({ id: `l${i}`, liveaboard: true, onboardFrequency: "seasonal" }),
      ),
    );
    const seasonal = computeNeighborhoodStats(
      dock,
      Array.from({ length: 5 }, (_, i) =>
        makeNeighbor({ id: `s${i}`, onboardFrequency: "seasonal" }),
      ),
    );

    expect(liveaboards.eyesOnDockIndex).toBeGreaterThan(
      seasonal.eyesOnDockIndex,
    );
    // 5 liveaboards over 20 slips is 25% coverage, half of the 50% ceiling.
    expect(liveaboards.eyesOnDockIndex).toBe(50);
  });

  it("caps watch coverage at 100 rather than running past it", () => {
    const dock = makeDock({ slipCount: 4 });
    const stats = computeNeighborhoodStats(
      dock,
      Array.from({ length: 4 }, (_, i) =>
        makeNeighbor({
          id: `l${i}`,
          liveaboard: true,
          traits: ["watches-boats"],
        }),
      ),
    );

    expect(stats.eyesOnDockIndex).toBe(100);
  });

  it("returns a neutral profile for a dock nobody has shared", () => {
    const stats = computeNeighborhoodStats(makeDock(), []);
    expect(stats.profileCount).toBe(0);
    expect(stats.socialIndex).toBe(50);
    expect(stats.eyesOnDockIndex).toBe(0);
  });
});

describe("scoreDockFit", () => {
  const dockmates = [
    makeNeighbor({ id: "a", traits: ["social"], tenureMonths: 60 }),
    makeNeighbor({ id: "b", traits: ["social"], tenureMonths: 48 }),
    makeNeighbor({ id: "c", boatType: "powerboat", tenureMonths: 50 }),
  ];

  it("always totals out of 100, dropping factors that do not apply", () => {
    const fit = scoreDockFit(basePrefs, neighborhood(dockmates));
    const weight = fit.factors.reduce((sum, factor) => sum + factor.weight, 0);

    expect(weight).toBeCloseTo(100, 1);
    expect(fit.factors.some((factor) => factor.key === "family")).toBe(false);
    expect(fit.score).toBeGreaterThan(0);
    expect(fit.score).toBeLessThanOrEqual(100);
  });

  it("includes the pets factor once the boater has a dog aboard", () => {
    const fit = scoreDockFit(
      { ...basePrefs, hasPets: true },
      neighborhood(dockmates),
    );
    const weight = fit.factors.reduce((sum, factor) => sum + factor.weight, 0);

    expect(fit.factors.some((factor) => factor.key === "family")).toBe(true);
    expect(weight).toBeCloseTo(100, 1);
  });

  it("rewards a dock whose personality matches what the boater asked for", () => {
    const social = neighborhood(dockmates);
    const wantsSocial = scoreDockFit(
      { ...basePrefs, sociability: social.stats.socialIndex },
      social,
    );
    const wantsQuiet = scoreDockFit({ ...basePrefs, sociability: 5 }, social);

    const factorOf = (fit: typeof wantsSocial) =>
      fit.factors.find((factor) => factor.key === "sociability")!;

    expect(factorOf(wantsSocial).score).toBeGreaterThan(
      factorOf(wantsQuiet).score,
    );
    expect(wantsSocial.score).toBeGreaterThan(wantsQuiet.score);
  });

  it("blocks a dock whose longest slip is shorter than the boat", () => {
    const fit = scoreDockFit(
      { ...basePrefs, boatLengthFt: 52 },
      neighborhood(dockmates, { slipLengthRangeFt: [30, 45] }),
    );

    expect(fit.blocker).toMatch(/does not fit/);
    expect(fit.factors.find((factor) => factor.key === "size-fit")!.score).toBe(0);
    expect(fit.headline).toBe(fit.blocker);
  });

  it("blocks a liveaboard from a dock that does not permit them", () => {
    const fit = scoreDockFit(
      { ...basePrefs, liveaboard: true },
      neighborhood(dockmates, { liveaboardPermitted: false }),
    );

    expect(fit.blocker).toMatch(/not permitted/);
    expect(fit.factors.find((factor) => factor.key === "liveaboard")!.score).toBe(
      0,
    );
  });
});

describe("rankDocks", () => {
  it("sorts blocked docks last even when they score well otherwise", () => {
    const goodButTooShort = neighborhood(
      [makeNeighbor({ id: "a", tenureMonths: 96, liveaboard: true })],
      { id: "short", slipLengthRangeFt: [20, 30] },
    );
    const workable = neighborhood([makeNeighbor({ id: "b" })], {
      id: "workable",
      slipLengthRangeFt: [30, 45],
    });

    const ranked = rankDocks(basePrefs, [goodButTooShort, workable]);

    expect(ranked[0].dockId).toBe("workable");
    expect(ranked[1].dockId).toBe("short");
    expect(ranked[1].blocker).not.toBeNull();
  });
});

describe("marinaEyesOnDockIndex", () => {
  it("weights docks by slip count", () => {
    const big = neighborhood(
      Array.from({ length: 30 }, (_, i) =>
        makeNeighbor({ id: `b${i}`, liveaboard: true }),
      ),
      { id: "big", slipCount: 60 },
    );
    const small = neighborhood([], { id: "small", slipCount: 10 });

    // The empty dock has no profiles, so it is excluded entirely.
    expect(marinaEyesOnDockIndex([big, small])).toBe(big.stats.eyesOnDockIndex);
  });

  it("returns null when nobody has shared a profile", () => {
    expect(marinaEyesOnDockIndex([neighborhood([])])).toBeNull();
    expect(marinaEyesOnDockIndex([])).toBeNull();
  });
});
