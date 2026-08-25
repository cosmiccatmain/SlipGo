import Link from "next/link";
import { notFound } from "next/navigation";
import { NeighborExplorer } from "@/components/NeighborExplorer";
import { getDataSource } from "@/lib/repository";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const marina = await getDataSource().getMarina(slug);
  return { title: marina ? `Slip Neighbors · ${marina.name}` : "Slip Neighbors" };
}

export default async function NeighborsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const source = getDataSource();
  const marina = await source.getMarina(slug);
  if (!marina) notFound();

  const neighborhoods = await source.getNeighborhoods(slug);

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
          Slip Neighbors
        </h1>
        <p className="mt-2 max-w-2xl text-foam-300">
          A slip is a two-year commitment to the people on either side of you.
          These are the slip holders who chose to share a profile, and how each
          dock lines up with the way you use your boat.
        </p>
      </header>

      <NeighborExplorer neighborhoods={neighborhoods} />
    </div>
  );
}
