/**
 * Core domain types for SlipGo.
 *
 * Two feature areas live here:
 *  - Slip Neighbors: who you would actually be tied up next to.
 *  - Security data:  how well a marina protects the boats in it.
 */

export type BoatType =
  | "sailboat"
  | "powerboat"
  | "trawler"
  | "catamaran"
  | "sportfisher";

export const BOAT_TYPES: BoatType[] = [
  "sailboat",
  "powerboat",
  "trawler",
  "catamaran",
  "sportfisher",
];

/** How often a slip holder is physically aboard. Drives the eyes-on-dock index. */
export type OnboardFrequency = "daily" | "weekly" | "monthly" | "seasonal";

export type NeighborTrait =
  | "quiet"
  | "social"
  | "pet-aboard"
  | "kids-aboard"
  | "handy"
  | "racer"
  | "angler"
  | "cruiser"
  | "watches-boats"
  | "shares-tools";

/**
 * A slip holder as their neighbors see them. Everything here is opt-in: a
 * profile only exists once the slip holder chooses to share it, and
 * `visibility` decides how far it travels.
 */
export interface NeighborProfile {
  id: string;
  dockId: string;
  slipNumber: string;
  /** First name + last initial. We never surface full legal names. */
  displayName: string;
  boatName: string | null;
  boatType: BoatType;
  boatLengthFt: number;
  liveaboard: boolean;
  onboardFrequency: OnboardFrequency;
  tenureMonths: number;
  traits: NeighborTrait[];
  /** Identity confirmed against the marina's tenant roster. */
  verified: boolean;
  /** "dock" = dockmates only, "marina" = any verified tenant, "private" = hidden. */
  visibility: "dock" | "marina" | "private";
}

export interface Dock {
  id: string;
  marinaSlug: string;
  name: string;
  slipCount: number;
  slipLengthRangeFt: [number, number];
  gated: boolean;
  liveaboardPermitted: boolean;
  monthlyRatePerFt: number;
}

export interface NeighborhoodStats {
  profileCount: number;
  /** Share of slips on the dock with a shared profile (0..1). */
  profileCoverage: number;
  liveaboardShare: number;
  medianTenureMonths: number;
  /** Share of profiles per boat type (0..1), keyed by type. */
  boatMix: Record<BoatType, number>;
  /** 0 = everyone keeps to themselves, 100 = dock potlucks every weekend. */
  socialIndex: number;
  petAboardShare: number;
  kidsAboardShare: number;
  /** 0..100 informal watch coverage — how often someone is around to notice trouble. */
  eyesOnDockIndex: number;
  verifiedShare: number;
}

export interface DockNeighborhood {
  dock: Dock;
  neighbors: NeighborProfile[];
  stats: NeighborhoodStats;
}

/** What the boater doing the searching wants out of a dock. */
export interface BoaterPreferences {
  boatType: BoatType;
  boatLengthFt: number;
  liveaboard: boolean;
  /** Desired dock sociability on the same 0..100 scale as `socialIndex`. */
  sociability: number;
  hasPets: boolean;
  hasKids: boolean;
}

export interface FitFactor {
  key: string;
  label: string;
  /** Share of the final score this factor accounts for, after renormalization. */
  weight: number;
  /** How well the dock satisfies this factor, 0..1. */
  score: number;
  /** Points this factor contributed to the total. */
  contribution: number;
  note: string;
}

export interface DockFit {
  dockId: string;
  score: number;
  factors: FitFactor[];
  headline: string;
  /** Set when the dock cannot work at all, e.g. the boat does not fit. */
  blocker: string | null;
}

/* ------------------------------------------------------------------ */
/* Security                                                            */
/* ------------------------------------------------------------------ */

export type CameraCoverage = "none" | "entry-only" | "partial" | "full";
export type PatrolCadence = "none" | "weekends" | "nightly" | "24/7";
export type Lighting = "poor" | "adequate" | "bright";
export type KeyAccess = "none" | "key" | "code" | "fob" | "fob+camera";

export type IncidentType =
  | "outboard-theft"
  | "dinghy-theft"
  | "electronics-theft"
  | "fuel-theft"
  | "vandalism"
  | "trespass"
  | "vessel-break-in"
  | "dock-fire";

export type IncidentSeverity = "low" | "moderate" | "high";

export interface SecurityIncident {
  id: string;
  marinaSlug: string;
  /** Null when the report was not tied to a specific dock. */
  dockId: string | null;
  /** ISO date, e.g. "2026-03-14". */
  occurredOn: string;
  type: IncidentType;
  severity: IncidentSeverity;
  resolved: boolean;
  source: "marina-report" | "harbor-patrol" | "member-report";
  summary: string;
}

export interface SecurityProfile {
  marinaSlug: string;
  slipCount: number;
  gatedDocks: boolean;
  keyAccess: KeyAccess;
  cameraCount: number;
  cameraCoverage: CameraCoverage;
  lighting: Lighting;
  patrol: PatrolCadence;
  staffedHoursPerDay: number;
  /** Minutes for harbor patrol / sheriff marine unit to reach the docks. */
  harborPatrolResponseMin: number | null;
  fireStandpipes: boolean;
  extinguishersOnDock: boolean;
  /** NFPA 303 is the fire-protection standard marinas are built to. */
  meetsNfpa303: boolean;
  liveaboardWatchProgram: boolean;
  incidents: SecurityIncident[];
  lastAuditOn: string | null;
  updatedOn: string;
}

export interface ScoreComponent {
  key: string;
  label: string;
  earned: number;
  possible: number;
  detail: string;
}

export type SecurityGrade = "A" | "B" | "C" | "D" | "F";

export interface SecurityScore {
  total: number;
  grade: SecurityGrade;
  components: ScoreComponent[];
  /** Recency-weighted incidents per 100 slips per year. */
  incidentRatePer100Slips: number;
  trend: {
    recentPer100Slips: number;
    priorPer100Slips: number;
    direction: "improving" | "steady" | "worsening";
  };
}

export interface Marina {
  slug: string;
  name: string;
  city: string;
  state: string;
  waterBody: string;
  lat: number;
  lng: number;
  slipCount: number;
  guestSlips: number;
  vhfChannel: number;
  phone: string;
  website: string;
}
