import type {
  IncidentSeverity,
  IncidentType,
  SecurityIncident,
  SecurityProfile,
} from "@/lib/types";
import { MARINA_SEEDS } from "./marinas";

/**
 * SAMPLE DATA. Incident dates are generated relative to today so the recency
 * weighting in `scoreSecurity` stays meaningful as time passes; the generator
 * is seeded per marina, so a given marina's history is stable within a run.
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

function isoDateMonthsAgo(months: number, from: Date): string {
  const date = new Date(from.getTime() - months * 30.4375 * 86_400_000);
  return date.toISOString().slice(0, 10);
}

const INCIDENT_COPY: Record<IncidentType, { summary: string; severity: IncidentSeverity }> = {
  "outboard-theft": {
    summary: "Outboard cut from a dinghy transom overnight.",
    severity: "moderate",
  },
  "dinghy-theft": {
    summary: "Inflatable taken from the dock end tie.",
    severity: "moderate",
  },
  "electronics-theft": {
    summary: "Chartplotter and VHF pulled from an unlocked helm.",
    severity: "moderate",
  },
  "fuel-theft": {
    summary: "Diesel siphoned from two boats on the same finger.",
    severity: "low",
  },
  vandalism: {
    summary: "Dock box forced open, contents scattered.",
    severity: "low",
  },
  trespass: {
    summary: "Non-tenant found sleeping aboard an unoccupied boat.",
    severity: "low",
  },
  "vessel-break-in": {
    summary: "Companionway hatch forced; cabin searched.",
    severity: "high",
  },
  "dock-fire": {
    summary: "Shore-power pedestal fire; one vessel damaged.",
    severity: "high",
  },
};

const COMMON_TYPES: IncidentType[] = [
  "outboard-theft",
  "dinghy-theft",
  "electronics-theft",
  "fuel-theft",
  "vandalism",
  "trespass",
];

const SERIOUS_TYPES: IncidentType[] = ["vessel-break-in", "dock-fire"];

interface SecuritySpec
  extends Omit<
    SecurityProfile,
    "marinaSlug" | "slipCount" | "incidents" | "lastAuditOn" | "updatedOn"
  > {
  slug: string;
  /** Reports per year across the whole marina. */
  incidentsPerYear: number;
  /** Share of reports that are break-ins or fires rather than opportunistic theft. */
  seriousShare: number;
  /** > 1 means the marina used to be worse than it is now. */
  historyMultiplier: number;
  auditMonthsAgo: number | null;
}

const SECURITY_SPECS: SecuritySpec[] = [
  {
    slug: "channel-islands-harbor",
    gatedDocks: true,
    keyAccess: "fob",
    cameraCount: 14,
    cameraCoverage: "partial",
    lighting: "adequate",
    patrol: "nightly",
    staffedHoursPerDay: 12,
    harborPatrolResponseMin: 8,
    fireStandpipes: true,
    extinguishersOnDock: true,
    meetsNfpa303: true,
    liveaboardWatchProgram: true,
    incidentsPerYear: 3,
    seriousShare: 0.1,
    historyMultiplier: 1.8,
    auditMonthsAgo: 7,
  },
  {
    slug: "shoreline-marina-long-beach",
    gatedDocks: true,
    keyAccess: "code",
    cameraCount: 9,
    cameraCoverage: "entry-only",
    lighting: "poor",
    patrol: "weekends",
    staffedHoursPerDay: 9,
    harborPatrolResponseMin: 14,
    fireStandpipes: false,
    extinguishersOnDock: true,
    meetsNfpa303: false,
    liveaboardWatchProgram: false,
    incidentsPerYear: 9,
    seriousShare: 0.22,
    historyMultiplier: 0.8,
    auditMonthsAgo: 26,
  },
  {
    slug: "newport-bay-anchorage",
    gatedDocks: true,
    keyAccess: "fob+camera",
    cameraCount: 31,
    cameraCoverage: "full",
    lighting: "bright",
    patrol: "24/7",
    staffedHoursPerDay: 16,
    harborPatrolResponseMin: 5,
    fireStandpipes: true,
    extinguishersOnDock: true,
    meetsNfpa303: true,
    liveaboardWatchProgram: true,
    incidentsPerYear: 1.5,
    seriousShare: 0.08,
    historyMultiplier: 1.2,
    auditMonthsAgo: 4,
  },
  {
    slug: "shelter-island-basin",
    gatedDocks: true,
    keyAccess: "fob",
    cameraCount: 18,
    cameraCoverage: "partial",
    lighting: "adequate",
    patrol: "nightly",
    staffedHoursPerDay: 10,
    harborPatrolResponseMin: 11,
    fireStandpipes: true,
    extinguishersOnDock: false,
    meetsNfpa303: true,
    liveaboardWatchProgram: true,
    incidentsPerYear: 5,
    seriousShare: 0.15,
    historyMultiplier: 1.1,
    auditMonthsAgo: 13,
  },
];

function generateIncidents(spec: SecuritySpec, from: Date): SecurityIncident[] {
  const rng = mulberry32(hashString(`incidents:${spec.slug}`));
  const dockIds =
    MARINA_SEEDS.find((entry) => entry.marina.slug === spec.slug)?.docks.map(
      (dock) => dock.id,
    ) ?? [];

  const incidents: SecurityIncident[] = [];
  // Three years of history, with the oldest year scaled by historyMultiplier.
  for (let year = 0; year < 3; year += 1) {
    const scale = year === 0 ? 1 : spec.historyMultiplier ** year;
    const expected = spec.incidentsPerYear * scale;
    const count = Math.floor(expected) + (rng() < expected % 1 ? 1 : 0);

    for (let i = 0; i < count; i += 1) {
      const monthsBack = year * 12 + rng() * 12;
      const serious = rng() < spec.seriousShare;
      const type = serious
        ? SERIOUS_TYPES[Math.floor(rng() * SERIOUS_TYPES.length)]
        : COMMON_TYPES[Math.floor(rng() * COMMON_TYPES.length)];
      const copy = INCIDENT_COPY[type];
      incidents.push({
        id: `${spec.slug}-inc-${year}-${i}`,
        marinaSlug: spec.slug,
        dockId:
          dockIds.length > 0 && rng() < 0.8
            ? dockIds[Math.floor(rng() * dockIds.length)]
            : null,
        occurredOn: isoDateMonthsAgo(monthsBack, from),
        type,
        severity: copy.severity,
        resolved: rng() < (copy.severity === "high" ? 0.55 : 0.35),
        source:
          rng() < 0.5
            ? "marina-report"
            : rng() < 0.6
              ? "member-report"
              : "harbor-patrol",
        summary: copy.summary,
      });
    }
  }

  return incidents.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
}

export function securityProfileFor(
  slug: string,
  asOf: Date = new Date(),
): SecurityProfile | null {
  const spec = SECURITY_SPECS.find((entry) => entry.slug === slug);
  const seed = MARINA_SEEDS.find((entry) => entry.marina.slug === slug);
  if (!spec || !seed) return null;

  const { slug: _slug, incidentsPerYear, seriousShare, historyMultiplier, auditMonthsAgo, ...rest } =
    spec;

  return {
    ...rest,
    marinaSlug: slug,
    slipCount: seed.marina.slipCount,
    incidents: generateIncidents(spec, asOf),
    lastAuditOn:
      auditMonthsAgo === null ? null : isoDateMonthsAgo(auditMonthsAgo, asOf),
    updatedOn: isoDateMonthsAgo(0.3, asOf),
  };
}
