import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Meter, ScoreDial, SectionTitle, Stat } from "@/components/ui";
import { INCIDENT_LABEL, formatDate, titleCase } from "@/lib/format";
import { marinaEyesOnDockIndex } from "@/lib/neighbors";
import { getDataSource } from "@/lib/repository";
import { incidentsByType, recentIncidents, scoreSecurity } from "@/lib/security";
import type { IncidentSeverity, SecurityIncident } from "@/lib/types";

/** Reports shown before the rest are folded away. */
const INCIDENTS_BEFORE_FOLD = 10;

const SEVERITY_TONE: Record<IncidentSeverity, "bad" | "warn" | "neutral"> = {
  high: "bad",
  moderate: "warn",
  low: "neutral",
};

function IncidentRow({
  incident,
  dockNames,
}: {
  incident: SecurityIncident;
  dockNames: Map<string, string>;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {INCIDENT_LABEL[incident.type]}
          <Badge tone={SEVERITY_TONE[incident.severity]}>
            {incident.severity}
          </Badge>
          {incident.resolved ? (
            <Badge tone="good">Resolved</Badge>
          ) : (
            <Badge tone="warn">Open</Badge>
          )}
        </p>
        <p className="mt-1 text-sm text-foam-400">{incident.summary}</p>
      </div>
      <div className="text-right text-xs text-foam-400">
        <p>{formatDate(incident.occurredOn)}</p>
        <p>
          {incident.dockId
            ? (dockNames.get(incident.dockId) ?? incident.dockId)
            : "Marina-wide"}{" "}
          · {titleCase(incident.source)}
        </p>
      </div>
    </li>
  );
}

const TREND_COPY = {
  improving: { tone: "good" as const, label: "Improving" },
  steady: { tone: "neutral" as const, label: "Holding steady" },
  worsening: { tone: "bad" as const, label: "Worsening" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const marina = await getDataSource().getMarina(slug);
  return { title: marina ? `Security · ${marina.name}` : "Security" };
}

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const source = getDataSource();
  const marina = await source.getMarina(slug);
  if (!marina) notFound();

  const [profile, neighborhoods] = await Promise.all([
    source.getSecurityProfile(slug),
    source.getNeighborhoods(slug),
  ]);

  if (!profile) {
    return (
      <div className="space-y-4">
        <Link
          href={`/marinas/${slug}`}
          className="text-sm text-foam-400 transition hover:text-aqua-300"
        >
          ← {marina.name}
        </Link>
        <Card>
          <p className="text-sm text-foam-300">
            {marina.name} has not published security data yet.
          </p>
        </Card>
      </div>
    );
  }

  const asOf = new Date();
  const eyes = marinaEyesOnDockIndex(neighborhoods);
  const score = scoreSecurity(profile, { asOf, eyesOnDockIndex: eyes });
  const incidents = recentIncidents(profile.incidents, asOf);
  const byType = incidentsByType(incidents);
  const worstType = byType[0];
  const trend = TREND_COPY[score.trend.direction];
  const dockNames = new Map(
    neighborhoods.map(({ dock }) => [dock.id, dock.name]),
  );

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/marinas/${slug}`}
          className="text-sm text-foam-400 transition hover:text-aqua-300"
        >
          ← {marina.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Security data
        </h1>
        <p className="mt-2 max-w-2xl text-foam-300">
          What the marina has in place, what has actually happened here, and how
          the two compare. Updated {formatDate(profile.updatedOn)}.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card className="flex flex-col justify-between gap-4">
          <ScoreDial
            score={score.total}
            grade={score.grade}
            label="Security score"
          />
          <div className="space-y-2 text-sm text-foam-300">
            <p className="flex items-center gap-2">
              <Badge tone={trend.tone}>{trend.label}</Badge>
              <span className="text-foam-400">
                {score.trend.recentPer100Slips} vs{" "}
                {score.trend.priorPer100Slips} per 100 slips year over year
              </span>
            </p>
            {worstType ? (
              <p className="text-foam-400">
                Most common report: {INCIDENT_LABEL[worstType.type]} (
                {worstType.count} in 3 years).
              </p>
            ) : (
              <p className="text-foam-400">No reports in the last 3 years.</p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="How the score breaks down"
            hint="Each area is scored on what the marina has, then normalized to 100."
          />
          <ul className="space-y-4">
            {score.components.map((component) => {
              const share = component.earned / component.possible;
              return (
                <li key={component.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium">{component.label}</span>
                    <span className="text-xs text-foam-400">
                      {component.earned} / {component.possible}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Meter
                      value={component.earned}
                      max={component.possible}
                      tone={share >= 0.75 ? "good" : share >= 0.5 ? "accent" : "warn"}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-foam-400">
                    {component.detail}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat
          label="Weighted incident rate"
          value={String(score.incidentRatePer100Slips)}
          hint="per 100 slips / year"
        />
        <Stat
          label="Patrol response"
          value={
            profile.harborPatrolResponseMin === null
              ? "Unknown"
              : `${profile.harborPatrolResponseMin} min`
          }
          hint="harbor patrol to the docks"
        />
        <Stat
          label="Eyes on the dock"
          value={eyes === null ? "No data" : `${eyes}/100`}
          hint="from Slip Neighbors"
        />
        <Stat
          label="Last audit"
          value={profile.lastAuditOn ? formatDate(profile.lastAuditOn) : "Never"}
        />
      </div>

      <Card>
        <SectionTitle
          title="Incident log"
          hint="Last 36 months. Older reports fade out of the score on a 12-month half-life."
        />
        {incidents.length === 0 ? (
          <p className="text-sm text-foam-300">Nothing reported in three years.</p>
        ) : (
          <>
            <ul className="divide-y divide-hull-800">
              {incidents.slice(0, INCIDENTS_BEFORE_FOLD).map((incident) => (
                <IncidentRow
                  key={incident.id}
                  incident={incident}
                  dockNames={dockNames}
                />
              ))}
            </ul>
            {incidents.length > INCIDENTS_BEFORE_FOLD ? (
              <details className="mt-3">
                <summary className="cursor-pointer rounded-lg border border-hull-700/70 px-4 py-2 text-sm text-foam-300 transition hover:border-hull-600">
                  Show {incidents.length - INCIDENTS_BEFORE_FOLD} older reports
                </summary>
                <ul className="divide-y divide-hull-800">
                  {incidents.slice(INCIDENTS_BEFORE_FOLD).map((incident) => (
                    <IncidentRow
                      key={incident.id}
                      incident={incident}
                      dockNames={dockNames}
                    />
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </Card>

      <Card>
        <SectionTitle title="Reports by type" />
        <ul className="space-y-3">
          {byType.map(({ type, count }) => (
            <li key={type}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{INCIDENT_LABEL[type]}</span>
                <span className="text-foam-400">{count}</span>
              </div>
              <div className="mt-1">
                <Meter value={count} max={byType[0].count} tone="warn" />
              </div>
            </li>
          ))}
          {byType.length === 0 ? (
            <li className="text-sm text-foam-300">No reports on file.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
