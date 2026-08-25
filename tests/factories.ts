import type {
  Dock,
  NeighborProfile,
  SecurityIncident,
  SecurityProfile,
} from "@/lib/types";

export function makeDock(overrides: Partial<Dock> = {}): Dock {
  return {
    id: "dock-a",
    marinaSlug: "test-marina",
    name: "Dock A",
    slipCount: 20,
    slipLengthRangeFt: [30, 45],
    gated: true,
    liveaboardPermitted: true,
    monthlyRatePerFt: 14,
    ...overrides,
  };
}

export function makeNeighbor(
  overrides: Partial<NeighborProfile> = {},
): NeighborProfile {
  return {
    id: "p1",
    dockId: "dock-a",
    slipNumber: "A-1",
    displayName: "Test N.",
    boatName: "Test Boat",
    boatType: "sailboat",
    boatLengthFt: 36,
    liveaboard: false,
    onboardFrequency: "weekly",
    tenureMonths: 24,
    traits: [],
    verified: true,
    visibility: "dock",
    ...overrides,
  };
}

/** ISO date `months` before `from`, for building incident fixtures. */
export function dateMonthsAgo(months: number, from: Date): string {
  return new Date(from.getTime() - months * 30.4375 * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function makeIncident(
  overrides: Partial<SecurityIncident> = {},
): SecurityIncident {
  return {
    id: "inc-1",
    marinaSlug: "test-marina",
    dockId: null,
    occurredOn: "2026-01-01",
    type: "dinghy-theft",
    severity: "moderate",
    resolved: true,
    source: "marina-report",
    summary: "Test incident",
    ...overrides,
  };
}

export function makeSecurityProfile(
  overrides: Partial<SecurityProfile> = {},
): SecurityProfile {
  return {
    marinaSlug: "test-marina",
    slipCount: 100,
    gatedDocks: true,
    keyAccess: "fob",
    cameraCount: 8,
    cameraCoverage: "partial",
    lighting: "adequate",
    patrol: "nightly",
    staffedHoursPerDay: 12,
    harborPatrolResponseMin: 10,
    fireStandpipes: true,
    extinguishersOnDock: true,
    meetsNfpa303: true,
    liveaboardWatchProgram: false,
    incidents: [],
    lastAuditOn: null,
    updatedOn: "2026-08-01",
    ...overrides,
  };
}
