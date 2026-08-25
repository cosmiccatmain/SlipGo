import {
  type IncidentSeverity,
  type IncidentType,
  type ScoreComponent,
  type SecurityGrade,
  type SecurityIncident,
  type SecurityProfile,
  type SecurityScore,
} from "./types";

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, places = 0) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const SEVERITY_WEIGHT: Record<IncidentSeverity, number> = {
  low: 1,
  moderate: 2.5,
  high: 5,
};

/** An incident stops counting against a marina at this rate. */
const HALF_LIFE_MONTHS = 12;
/** Nothing older than this is scored at all. */
const LOOKBACK_MONTHS = 36;
/**
 * Area under the decay curve, in years. Dividing the decayed load by this
 * converts "sum of fading incidents" into a comparable per-year rate.
 */
const EFFECTIVE_YEARS = HALF_LIFE_MONTHS / Math.LN2 / 12;
/** Weighted incidents per 100 slips per year that zeroes out the record score. */
const RATE_CEILING = 6;

const DAYS_PER_MONTH = 30.4375;

export function monthsAgo(isoDate: string, asOf: Date): number {
  const then = new Date(`${isoDate}T00:00:00Z`).getTime();
  const days = (asOf.getTime() - then) / 86_400_000;
  return days / DAYS_PER_MONTH;
}

/**
 * Recency-weighted incident load. Recent and severe incidents dominate; a
 * three-year-old dinghy theft barely registers.
 */
export function weightedIncidentLoad(
  incidents: SecurityIncident[],
  asOf: Date,
): number {
  return incidents.reduce((load, incident) => {
    const age = monthsAgo(incident.occurredOn, asOf);
    if (age < 0 || age > LOOKBACK_MONTHS) return load;
    const decay = 0.5 ** (age / HALF_LIFE_MONTHS);
    return load + SEVERITY_WEIGHT[incident.severity] * decay;
  }, 0);
}

export function incidentRatePer100Slips(
  profile: SecurityProfile,
  asOf: Date,
): number {
  const slips = Math.max(profile.slipCount, 1);
  const load = weightedIncidentLoad(profile.incidents, asOf);
  return round((load / EFFECTIVE_YEARS / slips) * 100, 2);
}

/** Undecayed severity load inside a month window, per 100 slips. */
function windowLoadPer100(
  profile: SecurityProfile,
  asOf: Date,
  fromMonths: number,
  toMonths: number,
): number {
  const slips = Math.max(profile.slipCount, 1);
  const load = profile.incidents.reduce((sum, incident) => {
    const age = monthsAgo(incident.occurredOn, asOf);
    if (age < fromMonths || age >= toMonths) return sum;
    return sum + SEVERITY_WEIGHT[incident.severity];
  }, 0);
  return round((load / slips) * 100, 2);
}

function accessComponent(profile: SecurityProfile): ScoreComponent {
  const keyPoints: Record<SecurityProfile["keyAccess"], number> = {
    none: 0,
    key: 4,
    code: 6,
    fob: 10,
    "fob+camera": 14,
  };
  const earned = (profile.gatedDocks ? 8 : 0) + keyPoints[profile.keyAccess];
  const details = [
    profile.gatedDocks ? "gated docks" : "docks open to the public",
    profile.keyAccess === "none"
      ? "no access control"
      : `${profile.keyAccess} entry`,
  ];
  return {
    key: "access",
    label: "Access control",
    earned,
    possible: 22,
    detail: details.join(", "),
  };
}

function surveillanceComponent(profile: SecurityProfile): ScoreComponent {
  const coveragePoints = {
    none: 0,
    "entry-only": 5,
    partial: 10,
    full: 14,
  }[profile.cameraCoverage];
  const density = (profile.cameraCount / Math.max(profile.slipCount, 1)) * 100;
  const densityPoints = clamp(density / 8) * 4;
  return {
    key: "surveillance",
    label: "Surveillance",
    earned: round(coveragePoints + densityPoints, 1),
    possible: 18,
    detail: `${profile.cameraCount} cameras (${round(density, 1)} per 100 slips), ${profile.cameraCoverage} coverage`,
  };
}

function presenceComponent(
  profile: SecurityProfile,
  eyesOnDockIndex: number | null,
): ScoreComponent {
  const patrolPoints = {
    none: 0,
    weekends: 4,
    nightly: 8,
    "24/7": 11,
  }[profile.patrol];
  const staffPoints = clamp(profile.staffedHoursPerDay / 24) * 5;
  const watchProgramPoints = profile.liveaboardWatchProgram ? 3 : 0;

  const details = [
    profile.patrol === "none" ? "no patrol" : `${profile.patrol} patrol`,
    `${profile.staffedHoursPerDay}h/day staffed`,
  ];
  if (profile.liveaboardWatchProgram) details.push("liveaboard watch program");

  // Neighbors feed security: a dock where people are actually aboard is the
  // cheapest surveillance a marina has. Only counted when we have profiles.
  if (eyesOnDockIndex === null) {
    return {
      key: "presence",
      label: "On-site presence",
      earned: round(patrolPoints + staffPoints + watchProgramPoints, 1),
      possible: 19,
      detail: details.join(", "),
    };
  }

  details.push(`neighbor watch coverage ${eyesOnDockIndex}/100`);
  return {
    key: "presence",
    label: "On-site presence",
    earned: round(
      patrolPoints +
        staffPoints +
        watchProgramPoints +
        (eyesOnDockIndex / 100) * 3,
      1,
    ),
    possible: 22,
    detail: details.join(", "),
  };
}

function recordComponent(
  profile: SecurityProfile,
  asOf: Date,
  rate: number,
): ScoreComponent {
  const scored = profile.incidents.filter((incident) => {
    const age = monthsAgo(incident.occurredOn, asOf);
    return age >= 0 && age <= LOOKBACK_MONTHS;
  });
  const unresolved = scored.filter((incident) => !incident.resolved).length;
  return {
    key: "record",
    label: "Incident record",
    earned: round(28 * clamp(1 - rate / RATE_CEILING), 1),
    possible: 28,
    detail: `${scored.length} reports in ${LOOKBACK_MONTHS} months (${unresolved} unresolved), ${rate} per 100 slips/yr weighted`,
  };
}

function safetyComponent(profile: SecurityProfile): ScoreComponent {
  const lightingPoints = { poor: 0, adequate: 2, bright: 4 }[profile.lighting];
  const earned =
    lightingPoints +
    (profile.fireStandpipes ? 2 : 0) +
    (profile.extinguishersOnDock ? 1 : 0) +
    (profile.meetsNfpa303 ? 3 : 0);
  const details = [`${profile.lighting} lighting`];
  if (profile.fireStandpipes) details.push("standpipes");
  if (profile.extinguishersOnDock) details.push("dock extinguishers");
  details.push(profile.meetsNfpa303 ? "meets NFPA 303" : "NFPA 303 not certified");
  return {
    key: "safety",
    label: "Lighting and fire",
    earned,
    possible: 10,
    detail: details.join(", "),
  };
}

export function gradeFor(total: number): SecurityGrade {
  if (total >= 85) return "A";
  if (total >= 72) return "B";
  if (total >= 58) return "C";
  if (total >= 45) return "D";
  return "F";
}

/**
 * Scores a marina's security posture out of 100.
 *
 * `eyesOnDockIndex` comes from Slip Neighbors. Pass it when neighbor profiles
 * exist; when it is null the community-watch points are dropped from the
 * denominator rather than scored as a zero, so marinas without shared profiles
 * are not punished for it.
 */
export function scoreSecurity(
  profile: SecurityProfile,
  options: { asOf?: Date; eyesOnDockIndex?: number | null } = {},
): SecurityScore {
  const asOf = options.asOf ?? new Date();
  const eyesOnDockIndex = options.eyesOnDockIndex ?? null;
  const rate = incidentRatePer100Slips(profile, asOf);

  const components: ScoreComponent[] = [
    accessComponent(profile),
    surveillanceComponent(profile),
    presenceComponent(profile, eyesOnDockIndex),
    recordComponent(profile, asOf, rate),
    safetyComponent(profile),
  ];

  const earned = components.reduce((sum, c) => sum + c.earned, 0);
  const possible = components.reduce((sum, c) => sum + c.possible, 0);
  const total = Math.round((earned / possible) * 100);

  const recent = windowLoadPer100(profile, asOf, 0, 12);
  const prior = windowLoadPer100(profile, asOf, 12, 24);
  const direction =
    prior === 0
      ? recent > 0
        ? "worsening"
        : "steady"
      : recent < prior * 0.85
        ? "improving"
        : recent > prior * 1.15
          ? "worsening"
          : "steady";

  return {
    total,
    grade: gradeFor(total),
    components,
    incidentRatePer100Slips: rate,
    trend: { recentPer100Slips: recent, priorPer100Slips: prior, direction },
  };
}

export function incidentsByType(
  incidents: SecurityIncident[],
): Array<{ type: IncidentType; count: number }> {
  const counts = new Map<IncidentType, number>();
  for (const incident of incidents) {
    counts.set(incident.type, (counts.get(incident.type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function recentIncidents(
  incidents: SecurityIncident[],
  asOf: Date,
  months = LOOKBACK_MONTHS,
): SecurityIncident[] {
  return incidents
    .filter((incident) => {
      const age = monthsAgo(incident.occurredOn, asOf);
      return age >= 0 && age <= months;
    })
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
}

export const SECURITY_INTERNALS = {
  HALF_LIFE_MONTHS,
  LOOKBACK_MONTHS,
  RATE_CEILING,
  SEVERITY_WEIGHT,
};
