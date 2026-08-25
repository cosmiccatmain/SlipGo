import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, SectionTitle, Stat } from "@/components/ui";
import { marinaEyesOnDockIndex } from "@/lib/neighbors";
import { getDataSource } from "@/lib/repository";
import { scoreSecurity } from "@/lib/security";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const marina = await getDataSource().getMarina(slug);
  return { title: marina?.name ?? "Marina" };
}

export default async function MarinaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const source = getDataSource();
  const marina = await source.getMarina(slug);
  if (!marina) notFound();

  const [neighborhoods, securityProfile] = await Promise.all([
    source.getNeighborhoods(slug),
    source.getSecurityProfile(slug),
  ]);

  const eyes = marinaEyesOnDockIndex(neighborhoods);
  const security = securityProfile
    ? scoreSecurity(securityProfile, { eyesOnDockIndex: eyes })
    : null;
  const profileCount = neighborhoods.reduce(
    (sum, n) => sum + n.stats.profileCount,
    0,
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{marina.name}</h1>
        <p className="mt-1 text-foam-300">
          {marina.city}, {marina.state} · {marina.waterBody} · VHF{" "}
          {marina.vhfChannel}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Slips" value={String(marina.slipCount)} />
        <Stat label="Guest slips" value={String(marina.guestSlips)} />
        <Stat
          label="Neighbor profiles"
          value={String(profileCount)}
          hint="opt-in"
        />
        <Stat
          label="Security"
          value={security ? `${security.grade} · ${security.total}` : "No data"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <SectionTitle
            title="Slip Neighbors"
            hint="Dock-by-dock composition, and which dock fits the way you use your boat."
          />
          <p className="text-sm text-foam-300">
            {profileCount} slip holders here share a profile.{" "}
            {eyes === null
              ? "No watch coverage data yet."
              : `Watch coverage across the marina is ${eyes}/100.`}
          </p>
          <Link
            href={`/marinas/${slug}/neighbors`}
            className="mt-4 inline-block rounded-lg border border-hull-600 px-3 py-1.5 text-sm transition hover:border-aqua-500 hover:text-aqua-300"
          >
            Explore the docks
          </Link>
        </Card>

        <Card>
          <SectionTitle
            title="Security data"
            hint="Access control, surveillance, presence, and the incident record."
          />
          <p className="text-sm text-foam-300">
            {security
              ? `Scores ${security.total}/100 (grade ${security.grade}), ${security.incidentRatePer100Slips} weighted reports per 100 slips per year.`
              : "This marina has not published security data."}
          </p>
          <Link
            href={`/marinas/${slug}/security`}
            className="mt-4 inline-block rounded-lg border border-hull-600 px-3 py-1.5 text-sm transition hover:border-aqua-500 hover:text-aqua-300"
          >
            See the breakdown
          </Link>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Docks" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-foam-400">
              <tr>
                <th className="pb-2 pr-4 font-medium">Dock</th>
                <th className="pb-2 pr-4 font-medium">Slips</th>
                <th className="pb-2 pr-4 font-medium">Lengths</th>
                <th className="pb-2 pr-4 font-medium">Rate</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hull-800">
              {neighborhoods.map(({ dock, stats }) => (
                <tr key={dock.id}>
                  <td className="py-2 pr-4 font-medium">{dock.name}</td>
                  <td className="py-2 pr-4 text-foam-300">{dock.slipCount}</td>
                  <td className="py-2 pr-4 text-foam-300">
                    {dock.slipLengthRangeFt[0]}–{dock.slipLengthRangeFt[1]}′
                  </td>
                  <td className="py-2 pr-4 text-foam-300">
                    ${dock.monthlyRatePerFt.toFixed(2)}/ft
                  </td>
                  <td className="py-2">
                    <span className="flex flex-wrap gap-1.5">
                      {dock.gated ? (
                        <Badge tone="good">Gated</Badge>
                      ) : (
                        <Badge tone="warn">Open access</Badge>
                      )}
                      {dock.liveaboardPermitted ? (
                        <Badge tone="accent">Liveaboards</Badge>
                      ) : null}
                      <Badge>{stats.profileCount} profiles</Badge>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
