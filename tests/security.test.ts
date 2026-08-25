import { describe, expect, it } from "vitest";
import {
  gradeFor,
  incidentRatePer100Slips,
  incidentsByType,
  recentIncidents,
  scoreSecurity,
  weightedIncidentLoad,
} from "@/lib/security";
import { dateMonthsAgo, makeIncident, makeSecurityProfile } from "./factories";

const ASOF = new Date("2026-08-25T12:00:00Z");

describe("weightedIncidentLoad", () => {
  it("weights an incident by severity", () => {
    const low = weightedIncidentLoad(
      [makeIncident({ severity: "low", occurredOn: dateMonthsAgo(0, ASOF) })],
      ASOF,
    );
    const high = weightedIncidentLoad(
      [makeIncident({ severity: "high", occurredOn: dateMonthsAgo(0, ASOF) })],
      ASOF,
    );

    expect(low).toBeCloseTo(1, 2);
    expect(high).toBeCloseTo(5, 2);
  });

  it("halves an incident's weight every twelve months", () => {
    const fresh = weightedIncidentLoad(
      [makeIncident({ severity: "low", occurredOn: dateMonthsAgo(0, ASOF) })],
      ASOF,
    );
    const yearOld = weightedIncidentLoad(
      [makeIncident({ severity: "low", occurredOn: dateMonthsAgo(12, ASOF) })],
      ASOF,
    );

    expect(yearOld).toBeCloseTo(fresh / 2, 2);
  });

  it("ignores incidents older than the lookback window", () => {
    expect(
      weightedIncidentLoad(
        [makeIncident({ occurredOn: dateMonthsAgo(48, ASOF) })],
        ASOF,
      ),
    ).toBe(0);
  });

  it("ignores incidents dated in the future", () => {
    expect(
      weightedIncidentLoad(
        [makeIncident({ occurredOn: dateMonthsAgo(-3, ASOF) })],
        ASOF,
      ),
    ).toBe(0);
  });
});

describe("incidentRatePer100Slips", () => {
  it("scales inversely with marina size, so a big marina is not penalized for being big", () => {
    const incidents = [
      makeIncident({ id: "1", occurredOn: dateMonthsAgo(2, ASOF) }),
      makeIncident({ id: "2", occurredOn: dateMonthsAgo(5, ASOF) }),
    ];
    const small = incidentRatePer100Slips(
      makeSecurityProfile({ slipCount: 50, incidents }),
      ASOF,
    );
    const large = incidentRatePer100Slips(
      makeSecurityProfile({ slipCount: 200, incidents }),
      ASOF,
    );

    expect(small).toBeCloseTo(large * 4, 1);
  });

  it("is zero for a marina with a clean record", () => {
    expect(incidentRatePer100Slips(makeSecurityProfile(), ASOF)).toBe(0);
  });
});

describe("scoreSecurity", () => {
  it("grades a well-run marina with a clean record near the top", () => {
    const score = scoreSecurity(
      makeSecurityProfile({
        keyAccess: "fob+camera",
        cameraCount: 30,
        cameraCoverage: "full",
        lighting: "bright",
        patrol: "24/7",
        staffedHoursPerDay: 16,
        liveaboardWatchProgram: true,
      }),
      { asOf: ASOF, eyesOnDockIndex: 80 },
    );

    expect(score.total).toBeGreaterThanOrEqual(85);
    expect(score.grade).toBe("A");
  });

  it("marks down an open marina with a bad record", () => {
    const score = scoreSecurity(
      makeSecurityProfile({
        gatedDocks: false,
        keyAccess: "none",
        cameraCount: 0,
        cameraCoverage: "none",
        lighting: "poor",
        patrol: "none",
        staffedHoursPerDay: 4,
        fireStandpipes: false,
        extinguishersOnDock: false,
        meetsNfpa303: false,
        slipCount: 60,
        incidents: Array.from({ length: 10 }, (_, i) =>
          makeIncident({
            id: `i${i}`,
            severity: "high",
            occurredOn: dateMonthsAgo(i, ASOF),
          }),
        ),
      }),
      { asOf: ASOF },
    );

    expect(score.total).toBeLessThan(45);
    expect(score.grade).toBe("F");
    expect(score.components.find((c) => c.key === "record")!.earned).toBe(0);
  });

  it("drops community-watch points from the denominator when no profiles exist", () => {
    const profile = makeSecurityProfile();
    const withoutProfiles = scoreSecurity(profile, { asOf: ASOF });
    const presence = withoutProfiles.components.find((c) => c.key === "presence")!;

    expect(presence.possible).toBe(19);
    expect(presence.detail).not.toMatch(/watch coverage/);

    const withProfiles = scoreSecurity(profile, {
      asOf: ASOF,
      eyesOnDockIndex: 0,
    });
    // Zero coverage is scored; unknown coverage is not counted either way.
    expect(
      withProfiles.components.find((c) => c.key === "presence")!.possible,
    ).toBe(22);
    expect(withProfiles.total).toBeLessThan(withoutProfiles.total);
  });

  it("credits neighbor watch coverage toward on-site presence", () => {
    const profile = makeSecurityProfile();
    const quiet = scoreSecurity(profile, { asOf: ASOF, eyesOnDockIndex: 10 });
    const watched = scoreSecurity(profile, { asOf: ASOF, eyesOnDockIndex: 90 });

    expect(watched.total).toBeGreaterThan(quiet.total);
  });

  it("calls out a marina that is getting worse year over year", () => {
    const score = scoreSecurity(
      makeSecurityProfile({
        incidents: [
          makeIncident({ id: "a", occurredOn: dateMonthsAgo(2, ASOF) }),
          makeIncident({ id: "b", occurredOn: dateMonthsAgo(4, ASOF) }),
          makeIncident({ id: "c", occurredOn: dateMonthsAgo(9, ASOF) }),
          makeIncident({ id: "d", occurredOn: dateMonthsAgo(20, ASOF) }),
        ],
      }),
      { asOf: ASOF },
    );

    expect(score.trend.direction).toBe("worsening");
    expect(score.trend.recentPer100Slips).toBeGreaterThan(
      score.trend.priorPer100Slips,
    );
  });

  it("calls out a marina that has cleaned itself up", () => {
    const score = scoreSecurity(
      makeSecurityProfile({
        incidents: [
          makeIncident({ id: "a", occurredOn: dateMonthsAgo(3, ASOF) }),
          makeIncident({ id: "b", occurredOn: dateMonthsAgo(14, ASOF) }),
          makeIncident({ id: "c", occurredOn: dateMonthsAgo(18, ASOF) }),
          makeIncident({ id: "d", occurredOn: dateMonthsAgo(22, ASOF) }),
        ],
      }),
      { asOf: ASOF },
    );

    expect(score.trend.direction).toBe("improving");
  });

  it("reports steady when nothing has happened in either year", () => {
    const score = scoreSecurity(makeSecurityProfile(), { asOf: ASOF });
    expect(score.trend.direction).toBe("steady");
  });
});

describe("gradeFor", () => {
  it("maps each band to a letter", () => {
    expect(gradeFor(92)).toBe("A");
    expect(gradeFor(85)).toBe("A");
    expect(gradeFor(84)).toBe("B");
    expect(gradeFor(72)).toBe("B");
    expect(gradeFor(58)).toBe("C");
    expect(gradeFor(45)).toBe("D");
    expect(gradeFor(44)).toBe("F");
  });
});

describe("incident helpers", () => {
  it("counts reports by type, most common first", () => {
    const counts = incidentsByType([
      makeIncident({ id: "1", type: "fuel-theft" }),
      makeIncident({ id: "2", type: "dinghy-theft" }),
      makeIncident({ id: "3", type: "dinghy-theft" }),
    ]);

    expect(counts[0]).toEqual({ type: "dinghy-theft", count: 2 });
    expect(counts[1]).toEqual({ type: "fuel-theft", count: 1 });
  });

  it("returns recent incidents newest first and hides stale ones", () => {
    const recent = recentIncidents(
      [
        makeIncident({ id: "old", occurredOn: dateMonthsAgo(40, ASOF) }),
        makeIncident({ id: "mid", occurredOn: dateMonthsAgo(10, ASOF) }),
        makeIncident({ id: "new", occurredOn: dateMonthsAgo(1, ASOF) }),
      ],
      ASOF,
    );

    expect(recent.map((incident) => incident.id)).toEqual(["new", "mid"]);
  });
});
