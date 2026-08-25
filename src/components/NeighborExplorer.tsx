"use client";

import { useMemo, useState } from "react";
import { Badge, Card, Meter, SectionTitle } from "@/components/ui";
import { FREQUENCY_LABEL, TRAIT_LABEL, formatTenure, percent } from "@/lib/format";
import { rankDocks } from "@/lib/neighbors";
import {
  BOAT_TYPES,
  type BoatType,
  type BoaterPreferences,
  type DockNeighborhood,
  type NeighborProfile,
  type OnboardFrequency,
} from "@/lib/types";

/** How many neighbor cards to show before folding the rest away. */
const CARDS_BEFORE_FOLD = 12;

const PRESENCE_RANK: Record<OnboardFrequency, number> = {
  daily: 0,
  weekly: 1,
  monthly: 2,
  seasonal: 3,
};

/** The people you would actually run into come first. */
function byPresence(a: NeighborProfile, b: NeighborProfile): number {
  if (a.liveaboard !== b.liveaboard) return a.liveaboard ? -1 : 1;
  const presence =
    PRESENCE_RANK[a.onboardFrequency] - PRESENCE_RANK[b.onboardFrequency];
  if (presence !== 0) return presence;
  return b.tenureMonths - a.tenureMonths;
}

const DEFAULT_PREFS: BoaterPreferences = {
  boatType: "sailboat",
  boatLengthFt: 36,
  liveaboard: false,
  sociability: 55,
  hasPets: false,
  hasKids: false,
};

function fitTone(score: number) {
  if (score >= 78) return "good" as const;
  if (score >= 60) return "accent" as const;
  if (score >= 45) return "warn" as const;
  return "bad" as const;
}

export function NeighborExplorer({
  neighborhoods,
}: {
  neighborhoods: DockNeighborhood[];
}) {
  const [prefs, setPrefs] = useState<BoaterPreferences>(DEFAULT_PREFS);
  const [openDockId, setOpenDockId] = useState<string | null>(null);

  const fits = useMemo(() => rankDocks(prefs, neighborhoods), [prefs, neighborhoods]);
  const byId = useMemo(
    () => new Map(neighborhoods.map((n) => [n.dock.id, n])),
    [neighborhoods],
  );

  const selectedId = openDockId ?? fits[0]?.dockId ?? null;
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const sortedNeighbors = useMemo(
    () => (selected ? [...selected.neighbors].sort(byPresence) : []),
    [selected],
  );

  const update = <K extends keyof BoaterPreferences>(
    key: K,
    value: BoaterPreferences[K],
  ) => setPrefs((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          title="Your boat"
          hint="Dock fit re-ranks as you change these. Nothing is saved."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wide text-foam-400">
              Boat type
            </span>
            <select
              value={prefs.boatType}
              onChange={(event) =>
                update("boatType", event.target.value as BoatType)
              }
              className="mt-1 w-full rounded-lg border border-hull-600 bg-hull-800 px-3 py-2 text-foam-100"
            >
              {BOAT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="text-xs uppercase tracking-wide text-foam-400">
              Length (ft)
            </span>
            <input
              type="number"
              min={16}
              max={120}
              value={prefs.boatLengthFt}
              onChange={(event) =>
                update("boatLengthFt", Number(event.target.value) || 0)
              }
              className="mt-1 w-full rounded-lg border border-hull-600 bg-hull-800 px-3 py-2 text-foam-100"
            />
          </label>

          <label className="text-sm sm:col-span-2">
            <span className="text-xs uppercase tracking-wide text-foam-400">
              Dock personality: {prefs.sociability}/100
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.sociability}
              onChange={(event) =>
                update("sociability", Number(event.target.value))
              }
              className="mt-3 w-full accent-aqua-400"
            />
            <span className="mt-1 flex justify-between text-xs text-foam-400">
              <span>Leave me alone</span>
              <span>Dock potluck</span>
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {(
            [
              ["liveaboard", "I live aboard"],
              ["hasPets", "Dog aboard"],
              ["hasKids", "Kids aboard"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(event) => update(key, event.target.checked)}
                className="size-4 accent-aqua-400"
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="space-y-3">
          <SectionTitle title="Docks by fit" />
          {fits.map((fit) => {
            const neighborhood = byId.get(fit.dockId);
            if (!neighborhood) return null;
            const isSelected = fit.dockId === selectedId;
            return (
              <button
                key={fit.dockId}
                type="button"
                onClick={() => setOpenDockId(fit.dockId)}
                aria-pressed={isSelected}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-aqua-500 bg-hull-800/80"
                    : "border-hull-700/70 bg-hull-900/50 hover:border-hull-600"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{neighborhood.dock.name}</span>
                  <Badge tone={fitTone(fit.score)}>{fit.score}/100 fit</Badge>
                </div>
                <div className="mt-2">
                  <Meter
                    value={fit.score}
                    tone={fit.blocker ? "bad" : "accent"}
                  />
                </div>
                <p className="mt-2 text-sm text-foam-300">{fit.headline}</p>
                <dl className="mt-3 space-y-1.5">
                  {fit.factors
                    .slice()
                    .sort((a, b) => b.contribution - a.contribution)
                    .slice(0, 3)
                    .map((factor) => (
                      <div
                        key={factor.key}
                        className="flex items-center justify-between gap-2 text-xs text-foam-400"
                      >
                        <dt>{factor.label}</dt>
                        <dd>
                          {factor.contribution.toFixed(1)} of{" "}
                          {factor.weight.toFixed(0)} pts
                        </dd>
                      </div>
                    ))}
                </dl>
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <Card>
                <SectionTitle
                  title={`${selected.dock.name} · who is here`}
                  hint={`${selected.stats.profileCount} of ${selected.dock.slipCount} slips share a profile (${percent(
                    selected.stats.profileCoverage,
                  )}).`}
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <DockStat
                    label="Dock personality"
                    value={`${selected.stats.socialIndex}/100`}
                  />
                  <DockStat
                    label="Liveaboards"
                    value={percent(selected.stats.liveaboardShare)}
                  />
                  <DockStat
                    label="Median tenure"
                    value={formatTenure(selected.stats.medianTenureMonths)}
                  />
                  <DockStat
                    label="Eyes on the dock"
                    value={`${selected.stats.eyesOnDockIndex}/100`}
                  />
                  <DockStat
                    label="Dogs aboard"
                    value={percent(selected.stats.petAboardShare)}
                  />
                  <DockStat
                    label="Verified"
                    value={percent(selected.stats.verifiedShare)}
                  />
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2">
                {sortedNeighbors.slice(0, CARDS_BEFORE_FOLD).map((neighbor) => (
                  <NeighborCard key={neighbor.id} neighbor={neighbor} />
                ))}
              </div>

              {sortedNeighbors.length > CARDS_BEFORE_FOLD ? (
                <details>
                  <summary className="cursor-pointer rounded-lg border border-hull-700/70 bg-hull-900/50 px-4 py-2 text-sm text-foam-300 transition hover:border-hull-600">
                    Show the other{" "}
                    {sortedNeighbors.length - CARDS_BEFORE_FOLD} profiles
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {sortedNeighbors.slice(CARDS_BEFORE_FOLD).map((neighbor) => (
                      <NeighborCard key={neighbor.id} neighbor={neighbor} />
                    ))}
                  </div>
                </details>
              ) : null}

              {sortedNeighbors.length === 0 ? (
                <Card>
                  <p className="text-sm text-foam-300">
                    Nobody on this dock has shared a profile yet.
                  </p>
                </Card>
              ) : null}
            </>
          ) : (
            <Card>
              <p className="text-sm text-foam-300">
                No docks published for this marina.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NeighborCard({ neighbor }: { neighbor: NeighborProfile }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            {neighbor.displayName}
            {neighbor.verified ? (
              <span
                className="ml-1.5 text-aqua-300"
                title="Verified against the marina roster"
              >
                ✓
              </span>
            ) : null}
          </p>
          <p className="text-sm text-foam-400">
            {neighbor.boatName ?? "Unnamed"} · {neighbor.boatLengthFt}′{" "}
            {neighbor.boatType}
          </p>
        </div>
        <span className="text-xs text-foam-400">{neighbor.slipNumber}</span>
      </div>
      <p className="mt-2 text-xs text-foam-400">
        {FREQUENCY_LABEL[neighbor.onboardFrequency]} ·{" "}
        {formatTenure(neighbor.tenureMonths)} here
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {neighbor.liveaboard ? <Badge tone="accent">Liveaboard</Badge> : null}
        {neighbor.traits.map((trait) => (
          <Badge key={trait}>{TRAIT_LABEL[trait]}</Badge>
        ))}
      </div>
    </Card>
  );
}

function DockStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hull-700/60 bg-hull-950/40 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-foam-400">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
