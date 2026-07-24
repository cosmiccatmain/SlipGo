import { useEffect, useMemo, useState } from "react";
import {
  CURATED_TRIPS,
  HARBORS,
  buildCustomTrip,
  compassLabel,
  fetchLegWinds,
  formatDuration,
  legDetails,
  legMidpoints,
  serviceStops,
  stopCosts,
  tripStats,
  tripUnlocked,
  type Itinerary,
  type LegWind,
  type TripStats,
  type TripStop,
} from "../lib/trips";
import { REGIONS, type Region } from "../data/regions";
import { useAuth } from "../lib/auth";
import { hasFeature } from "../lib/membership";

interface Enriched {
  stats: TripStats;
  winds: LegWind[] | null;
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
    return (await res.json())?.summary ?? null;
  } catch {
    return null;
  }
}

export function TripsView() {
  const { tier, boats } = useAuth();
  const canCustom = hasFeature(tier, "tripsCustom");

  // Which boat the numbers are for.
  const [boatId, setBoatId] = useState<string | null>(null);
  const boat = boats.find((b) => b.id === boatId) ?? boats[0] ?? null;
  const loaFt = boat?.lengthFt ?? 40;
  const cruiseKts = boat?.cruiseKts ?? 7;

  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [custom, setCustom] = useState<TripStop[]>([]);

  const allTrips = useMemo(() => {
    const list = [...CURATED_TRIPS];
    if (custom.length >= 2) list.push(buildCustomTrip(custom));
    return list;
  }, [custom]);

  const [data, setData] = useState<Record<string, Enriched>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      for (const t of allTrips) {
        const winds = await fetchLegWinds(legMidpoints(t));
        if (!alive) return;
        const stats = tripStats(t, loaFt, cruiseKts, winds);
        setData((d) => ({
          ...d,
          [t.id]: { stats, winds, summary: d[t.id]?.summary ?? null, summaryLoading: true },
        }));
        const summary = await fetchSummary(t, stats);
        if (!alive) return;
        setData((d) => ({ ...d, [t.id]: { ...d[t.id], summary, summaryLoading: false } }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [allTrips, loaFt, cruiseKts]);

  return (
    <div className="trips-view">
      <header className="trips-hero">
        <h1>
          SlipGo <span className="trips-green">Trips</span>
        </h1>
        <p>
          Cruise California with a slip waiting at every stop. Times come from{" "}
          <b>live wind</b> on each leg and your boat's cruise speed.
        </p>

        <div className="trip-boatbar">
          {boats.length > 0 ? (
            <>
              <label htmlFor="trip-boat">Planning for</label>
              <select
                id="trip-boat"
                value={boat?.id ?? ""}
                onChange={(e) => setBoatId(e.target.value)}
              >
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} · {b.lengthFt} ft · {b.cruiseKts} kn
                  </option>
                ))}
              </select>
            </>
          ) : (
            <span className="trip-boatbar-empty">
              Using a 40 ft boat at 7 kn — add your boat for exact times and costs.
            </span>
          )}
        </div>
      </header>

      {allTrips.map((t) => {
        const unlocked = tripUnlocked(tier, t);
        const e = data[t.id];
        const stats = e?.stats ?? tripStats(t, loaFt, cruiseKts);
        const isOpen = openTrip === t.id;

        return (
          <article className="trip-card" key={t.id}>
            <div className="trip-top">
              <div>
                <h2>{t.name}</h2>
                <p className="trip-tagline">{t.tagline}</p>
              </div>
              <span className={"tier-chip " + t.tier}>{t.tier}</span>
            </div>

            <div className="trip-route-chain">
              {t.stops.map((s, i) => (
                <span className="trip-hop" key={`${s.region}-${i}`}>
                  <span className="trip-hop-name">{HARBORS[s.region].label}</span>
                  {s.nights > 0 && <span className="trip-hop-nights">{s.nights}n</span>}
                  {i < t.stops.length - 1 && <span className="trip-arrow" aria-hidden="true">→</span>}
                </span>
              ))}
            </div>

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
                      {Math.round(stats.avgWindKts ?? 0)} kn average on route ·{" "}
                      {boat ? `${boat.name}, ${loaFt} ft at ${cruiseKts} kn` : `40 ft at 7 kn`}
                    </>
                  ) : (
                    <>Flat {cruiseKts} kn estimate · live wind unavailable right now</>
                  )}
                </div>

                <div className="trip-ai">
                  <span className="ai-badge">Skipper</span>
                  {e?.summaryLoading !== false ? (
                    <div className="skel-lines">
                      <span className="skeleton" style={{ width: "100%" }} />
                      <span className="skeleton" style={{ width: "70%" }} />
                    </div>
                  ) : e?.summary ? (
                    <p className="trip-ai-text">{e.summary}</p>
                  ) : (
                    <p className="ai-muted">Trip briefing unavailable right now.</p>
                  )}
                </div>

                <button className="trip-view-btn" onClick={() => setOpenTrip(isOpen ? null : t.id)}>
                  {isOpen ? "Hide route" : "View route & slip prices"}
                </button>

                {isOpen && (
                  <TripDetail trip={t} winds={e?.winds ?? null} loaFt={loaFt} cruiseKts={cruiseKts} isPro={canCustom} />
                )}
              </>
            ) : (
              <div className={"tier-note" + (t.tier === "pro" ? " pro" : "")}>
                {t.tier === "pro"
                  ? "Route, timings and slip prices for this cruise are a SlipGo Pro feature."
                  : "Route, timings and slip prices are a SlipGo Plus feature."}
              </div>
            )}
          </article>
        );
      })}

      <CustomTripBuilder canCustom={canCustom} stops={custom} onChange={setCustom} />

      <p className="trips-foot">
        Booking every slip in one checkout is coming next. Distances are great-circle
        estimates; slip prices use listed transient rates (sample data).
      </p>
    </div>
  );
}

function TripDetail({
  trip,
  winds,
  loaFt,
  cruiseKts,
  isPro,
}: {
  trip: Itinerary;
  winds: LegWind[] | null;
  loaFt: number;
  cruiseKts: number;
  isPro: boolean;
}) {
  const legs = legDetails(trip, cruiseKts, winds);
  const costs = stopCosts(trip, loaFt);
  const services = serviceStops(trip);
  const total = costs.reduce((a, c) => a + c.total, 0);

  return (
    <div className="trip-detail">
      <h3>The route</h3>
      <div className="leg-table">
        {legs.map((l, i) => (
          <div className="leg-row" key={i}>
            <div className="leg-name">
              {HARBORS[l.from].label} <span aria-hidden="true">→</span> {HARBORS[l.to].label}
            </div>
            <div className="leg-figs">
              <span>{Math.round(l.nm)} nm</span>
              <span>{formatDuration(l.hours)}</span>
              <span>{compassLabel(l.bearing)}</span>
              {l.wind && (
                <span className="leg-wind">
                  {Math.round(l.wind.speedKts)} kn from {compassLabel(l.wind.fromDeg)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <h3>Slip prices · {loaFt} ft boat</h3>
      <div className="leg-table">
        {costs.map((c, i) => (
          <div className="leg-row" key={i}>
            <div className="leg-name">
              {HARBORS[c.region].label}
              {c.listingName && <span className="leg-sub">{c.listingName}</span>}
            </div>
            <div className="leg-figs">
              <span>
                {c.nights} {c.nights === 1 ? "night" : "nights"}
              </span>
              <span>${c.perFt.toFixed(2)}/ft</span>
              <span className="leg-total">${c.total.toLocaleString("en-US")}</span>
            </div>
          </div>
        ))}
        <div className="leg-row leg-total-row">
          <div className="leg-name">Total slips</div>
          <div className="leg-figs">
            <span className="leg-total">${total.toLocaleString("en-US")}</span>
          </div>
        </div>
      </div>

      {isPro ? (
        <>
          <h3>
            Fuel &amp; pump-out <span className="tier-chip pro">pro</span>
          </h3>
          <div className="service-chips">
            {services.map((s, i) => (
              <span className="service-chip" key={i}>
                {HARBORS[s.region].label}
                {s.fuel && <b> fuel</b>}
                {s.pumpOut && <b> pump-out</b>}
                {!s.fuel && !s.pumpOut && <i> none listed</i>}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="tier-note pro">
          Fuel &amp; pump-out planning along the route is a SlipGo Pro feature.
        </div>
      )}
    </div>
  );
}

function CustomTripBuilder({
  canCustom,
  stops,
  onChange,
}: {
  canCustom: boolean;
  stops: TripStop[];
  onChange: (s: TripStop[]) => void;
}) {
  const [region, setRegion] = useState<Region>("mdr");
  const [nights, setNights] = useState(1);
  const options = (Object.keys(REGIONS) as Region[]).sort((a, b) =>
    REGIONS[a].label.localeCompare(REGIONS[b].label),
  );

  return (
    <section className="trip-builder">
      <div className="trip-top">
        <div>
          <h2>Build your own trip</h2>
          <p className="trip-tagline">
            Chain any harbors in California — we'll time it against live wind and
            price every night.
          </p>
        </div>
        <span className="tier-chip pro">pro</span>
      </div>

      {canCustom ? (
        <>
          <div className="builder-row">
            <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
              {options.map((r) => (
                <option key={r} value={r}>
                  {REGIONS[r].label}
                </option>
              ))}
            </select>
            <select value={nights} onChange={(e) => setNights(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? "depart / pass through" : `${n} night${n > 1 ? "s" : ""}`}
                </option>
              ))}
            </select>
            <button
              className="builder-add"
              onClick={() => onChange([...stops, { region, nights: stops.length === 0 ? 0 : nights }])}
            >
              Add stop
            </button>
            {stops.length > 0 && (
              <button className="clear-link" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
          {stops.length > 0 && (
            <div className="trip-route-chain">
              {stops.map((s, i) => (
                <span className="trip-hop" key={i}>
                  <span className="trip-hop-name">{REGIONS[s.region].label}</span>
                  {s.nights > 0 && <span className="trip-hop-nights">{s.nights}n</span>}
                  {i < stops.length - 1 && <span className="trip-arrow" aria-hidden="true">→</span>}
                </span>
              ))}
            </div>
          )}
          {stops.length === 1 && (
            <p className="builder-hint">Add one more harbor and your trip appears above.</p>
          )}
        </>
      ) : (
        <div className="tier-note pro">
          Custom multi-stop trip building is a SlipGo Pro feature.
        </div>
      )}
    </section>
  );
}
