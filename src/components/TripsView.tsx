import { useEffect, useState } from "react";
import {
  CURATED_TRIPS,
  HARBORS,
  fetchLegWinds,
  formatDuration,
  legMidpoints,
  tripStats,
  tripUnlocked,
  type Itinerary,
  type LegWind,
  type TripStats,
} from "../lib/trips";
import { useTier } from "../lib/auth";

// BoatGoat Trips: curated multi-stop cruises with a slip at every overnight.
// Durations use live wind on each leg; the briefing is generated server-side
// from those same real figures.

interface Enriched {
  stats: TripStats;
  summary: string | null;
  summaryLoading: boolean;
}

async function fetchSummary(t: Itinerary, s: TripStats): Promise<string | null> {
  const params = new URLSearchParams({
    name: t.name,
    route: t.stops.map((x) => HARBORS[x.region].label).join(" → "),
    nm: String(Math.round(s.distanceNm)),
    hours: String(Math.round(s.cruiseHours)),
    nights: String(s.nights),
    wind: s.avgWindKts ? String(Math.round(s.avgWindKts)) : "",
  });
  try {
    const res = await fetch(`/api/trip-summary?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.summary ?? null;
  } catch {
    return null;
  }
}

export function TripsView() {
  const tier = useTier();
  const [data, setData] = useState<Record<string, Enriched>>(() =>
    Object.fromEntries(
      CURATED_TRIPS.map((t) => [
        t.id,
        { stats: tripStats(t), summary: null, summaryLoading: true },
      ]),
    ),
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const t of CURATED_TRIPS) {
        const winds: LegWind[] | null = await fetchLegWinds(legMidpoints(t));
        if (!alive) return;
        const stats = tripStats(t, 40, 7, winds);
        setData((d) => ({ ...d, [t.id]: { ...d[t.id], stats } }));
        const summary = await fetchSummary(t, stats);
        if (!alive) return;
        setData((d) => ({ ...d, [t.id]: { ...d[t.id], summary, summaryLoading: false } }));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="trips-view">
      <header className="trips-hero">
        <h1>
          BoatGoat <span className="trips-green">Trips</span>
        </h1>
        <p>
          Cruise Southern California with a slip waiting at every stop. Times are
          estimated from <b>live wind</b> on each leg. Curated trips are{" "}
          <span className="tier-chip plus">Plus</span>; custom multi-stop routes are{" "}
          <span className="tier-chip pro">Pro</span>.
        </p>
      </header>

      {CURATED_TRIPS.map((t) => {
        const unlocked = tripUnlocked(tier, t);
        const { stats, summary, summaryLoading } = data[t.id];
        return (
          <article className="trip-card" key={t.id}>
            <div className="trip-top">
              <div>
                <h2>{t.name}</h2>
                <p className="trip-tagline">{t.tagline}</p>
              </div>
              <span className={"tier-chip " + t.tier}>{t.tier}</span>
            </div>

            <ol className="trip-timeline">
              {t.stops.map((s, i) => (
                <li key={`${s.region}-${i}`} className="trip-stop">
                  <span className="trip-dot" aria-hidden="true" />
                  <span className="trip-stop-name">{HARBORS[s.region].label}</span>
                  <span className="trip-stop-nights">
                    {i === 0 ? "depart" : s.nights === 1 ? "1 night" : `${s.nights} nights`}
                  </span>
                </li>
              ))}
            </ol>

            {unlocked ? (
              <>
                <div className="trip-stat-grid">
                  <div className="trip-stat">
                    <span className="trip-stat-label">Est. length</span>
                    <b>{formatDuration(stats.totalHours)}</b>
                  </div>
                  <div className="trip-stat">
                    <span className="trip-stat-label">Underway</span>
                    <b>{formatDuration(stats.cruiseHours)}</b>
                  </div>
                  <div className="trip-stat">
                    <span className="trip-stat-label">Distance</span>
                    <b>{Math.round(stats.distanceNm)} nm</b>
                  </div>
                  <div className="trip-stat">
                    <span className="trip-stat-label">Est. slips</span>
                    <b>${stats.slipCost.toLocaleString("en-US")}</b>
                  </div>
                </div>

                <div className="trip-wind">
                  {stats.windAdjusted ? (
                    <>
                      <span className="live-tag">Live · Open-Meteo</span>
                      Adjusted for {Math.round(stats.avgWindKts ?? 0)} kn average wind on route
                      · 40 ft boat at 7 kn base
                    </>
                  ) : (
                    <>Flat 7 kn estimate · live wind unavailable right now</>
                  )}
                </div>

                <div className="trip-ai">
                  <span className="ai-badge">goaty</span>
                  {summaryLoading ? (
                    <div className="skel-lines">
                      <span className="skeleton" style={{ width: "100%" }} />
                      <span className="skeleton" style={{ width: "70%" }} />
                    </div>
                  ) : summary ? (
                    <p className="trip-ai-text">{summary}</p>
                  ) : (
                    <p className="ai-muted">
                      Trip briefing — live on the deployed site once the AI key is set.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className={"tier-note" + (t.tier === "pro" ? " pro" : "")}>
                {t.tier === "pro"
                  ? "Timings, costs and the goaty briefing for this route are a BoatGoat Pro feature."
                  : "Timings, costs and the goaty briefing are a BoatGoat Plus feature."}
              </div>
            )}
          </article>
        );
      })}

      <p className="trips-foot">
        Booking every slip on a trip in one checkout is coming next. Distances are
        great-circle estimates; slip costs use listed transient rates (sample data).
      </p>
    </div>
  );
}
