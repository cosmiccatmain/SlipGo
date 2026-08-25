import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { marinaEyesOnDockIndex } from "@/lib/neighbors";
import { getDataSource, isUsingSampleData } from "@/lib/repository";
import { scoreSecurity } from "@/lib/security";
import type { SecurityGrade } from "@/lib/types";

const gradeTone = (grade: SecurityGrade) =>
  grade === "A" || grade === "B" ? "good" : grade === "C" ? "warn" : "bad";

export default async function HomePage() {
  const source = getDataSource();
  const marinas = await source.listMarinas();

  const rows = await Promise.all(
    marinas.map(async (marina) => {
      const [neighborhoods, securityProfile] = await Promise.all([
        source.getNeighborhoods(marina.slug),
        source.getSecurityProfile(marina.slug),
      ]);
      const eyes = marinaEyesOnDockIndex(neighborhoods);
      return {
        marina,
        profileCount: neighborhoods.reduce(
          (sum, n) => sum + n.stats.profileCount,
          0,
        ),
        eyes,
        security: securityProfile
          ? scoreSecurity(securityProfile, { eyesOnDockIndex: eyes })
          : null,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Two things a listing never tells you
        </h1>
        <p className="mt-2 max-w-2xl text-foam-300">
          Who you will be tied up next to, and whether your boat is safe when
          you are not there. Every marina below carries both.
        </p>
        {isUsingSampleData() ? (
          <p className="mt-3 text-xs text-foam-400">
            Showing sample data — set <code>SUPABASE_URL</code> and{" "}
            <code>SUPABASE_ANON_KEY</code> to read the live tables.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {rows.map(({ marina, profileCount, eyes, security }) => (
          <Card key={marina.slug} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  <Link
                    href={`/marinas/${marina.slug}`}
                    className="transition hover:text-aqua-300"
                  >
                    {marina.name}
                  </Link>
                </h2>
                <p className="text-sm text-foam-400">
                  {marina.city}, {marina.state} · {marina.slipCount} slips
                </p>
              </div>
              {security ? (
                <Badge tone={gradeTone(security.grade)}>
                  Security {security.grade} · {security.total}
                </Badge>
              ) : null}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-foam-400">
                  Neighbor profiles
                </dt>
                <dd className="mt-0.5 font-medium">{profileCount} shared</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-foam-400">
                  Eyes on the dock
                </dt>
                <dd className="mt-0.5 font-medium">
                  {eyes === null ? "No data" : `${eyes}/100`}
                </dd>
              </div>
            </dl>

            <div className="flex gap-2 text-sm">
              <Link
                href={`/marinas/${marina.slug}/neighbors`}
                className="rounded-lg border border-hull-600 px-3 py-1.5 transition hover:border-aqua-500 hover:text-aqua-300"
              >
                Slip Neighbors
              </Link>
              <Link
                href={`/marinas/${marina.slug}/security`}
                className="rounded-lg border border-hull-600 px-3 py-1.5 transition hover:border-aqua-500 hover:text-aqua-300"
              >
                Security data
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
