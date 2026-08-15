import { useCallback, useEffect, useMemo, useState } from "react";
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
import { rentListings, type Listing } from "../data/listings";
import { useAuth } from "../lib/auth";
import { hasFeature, type Tier } from "../lib/membership";
import { marinaPhoto } from "../lib/photos";
import { getCachedPhoto, onEnrichmentReady, prefetchEnrichment } from "../lib/enrich";
import {
  directionsUrl,
  formatDateRange,
  listTrips,
  removeTrip,
  saveTrip,
  setCancelled,
  tripStatus,
  type SavedTrip,
  type TripStatus,
} from "../lib/savedTrips";
import { LockedFeature } from "./LockedFeature";

interface Props {
  onToast: (msg: string) => void;
  onPricing: () => void;
}

const TABS: { key: TripStatus; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

/** The stop a trip is really *about* — where you spend the most nights. */
function destinationFor(stops: TripStop[]): { region: Region; listing: Listing | null } {
  const stop = [...stops].sort((a, b) => b.nights - a.nights)[0] ?? stops[0];
  const region = stop.region;
  const listing =
    rentListings.filter((l) => l.region === region).sort((a, b) => b.rating - a.rating)[0] ?? null;
  return { region, listing };
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TripsView({ onToast, onPricing }: Props) {
  const { tier, boats, user } = useAuth();
  const canTrips = hasFeature(tier, "tripsCurated");
  const canCustom = hasFeature(tier, "tripsCustom");

  const [tab, setTab] = useState<TripStatus>("upcoming");
  const [trips, setTrips] = useState<SavedTrip[]>([]);

  const refresh = useCallback(() => setTrips(listTrips(user?.id ?? null)), [user]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const grouped = useMemo(() => {
    const g: Record<TripStatus, SavedTrip[]> = { upcoming: [], past: [], cancelled: [] };
    for (const t of trips) g[tripStatus(t)].push(t);
    g.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
    g.past.sort((a, b) => b.startDate.localeCompare(a.startDate));
    g.cancelled.sort((a, b) => b.createdAt - a.createdAt);
    return g;
  }, [trips]);

  // Locked: show what Trips actually is, lightly faded, with the upgrade card.
  if (!canTrips) {
    return (
      <div className="trips-view">
        <TripsHeader tier={tier} />
        <LockedFeature
          tier="plus"
          title="Keep every boating trip in one place"
          body="SlipGo Plus gives you upcoming trips, route and slip-price detail, marina contacts, directions, and your complete trip history."
          points={[
            "Upcoming, past and cancelled trips in one place",
            "Every leg timed against live wind",
            "A slip priced for your boat at each overnight",
            "Marina contacts and directions on every trip",
          ]}
          ctaLabel="Unlock Trips"
          onUnlock={onPricing}
          onComparePlans={onPricing}
          preview={<TripsPreview />}
        />
      </div>
    );
  }

  const shown = grouped[tab];

  return (
    <div className="trips-view">
      <TripsHeader tier={tier} />

      <div className="trip-tabs" role="tablist" aria-label="Your trips">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={"trip-tab" + (tab === t.key ? " active" : "")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {grouped[t.key].length > 0 && (
              <span className="trip-tab-count">{grouped[t.key].length}</span>
            )}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <TripsEmpty tab={tab} />
      ) : (
        <div className="trip-list">
          {shown.map((t) => (
            <SavedTripCard
              key={t.id}
              trip={t}
              status={tab}
              canCustom={canCustom}
              onChanged={refresh}
              onToast={onToast}
              userId={user?.id ?? null}
            />
          ))}
        </div>
      )}

      <Planner
        tier={tier}
        canCustom={canCustom}
        boats={boats}
        userId={user?.id ?? null}
        onSaved={(name) => {
          refresh();
          setTab("upcoming");
          onToast(`${name} saved to your trips.`);
        }}
        onPricing={onPricing}
      />
    </div>
  );
}

function TripsHeader({ tier }: { tier: Tier }) {
  return (
    <header className="trips-hero">
      <span className="trips-eyebrow">Trips</span>
      <h1>
        SlipGo <span className="trips-green">Trips</span>
      </h1>
      <p>
        Cruise California with a slip waiting at every stop. Legs are timed against{" "}
        <b>live wind</b> and your boat's cruise speed.
      </p>
      {tier !== "free" && (
        <p className="trips-note">
          Marina booking isn't live yet — a saved trip is your plan, with real
          distances, timings and slip prices.
        </p>
      )}
    </header>
  );
}

/* ── Saved trip card ─────────────────────────────────────────────────────── */

function SavedTripCard({
  trip,
  status,
  canCustom,
  onChanged,
  onToast,
  userId,
}: {
  trip: SavedTrip;
  status: TripStatus;
  canCustom: boolean;
  onChanged: () => void;
  onToast: (m: string) => void;
  userId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [winds, setWinds] = useState<LegWind[] | null>(null);
  const [photo, setPhoto] = useState<string | null>(
    trip.destinationListingId ? getCachedPhoto(trip.destinationListingId) : null,
  );

  // Real marina photo when we have one; the illustration holds the frame first.
  useEffect(() => {
    const id = trip.destinationListingId;
    if (!id) return;
    const listing = rentListings.find((l) => l.id === id);
    if (listing) prefetchEnrichment(listing);
    setPhoto(getCachedPhoto(id));
    return onEnrichmentReady((ready) => {
      if (ready === id) setPhoto(getCachedPhoto(id));
    });
  }, [trip.destinationListingId]);

  const itinerary: Itinerary = useMemo(
    () => ({
      id: trip.itineraryId,
      name: trip.name,
      tagline: "",
      tier: "plus",
      stops: trip.stops,
    }),
    [trip],
  );

  const openDetail = async () => {
    const next = !open;
    setOpen(next);
    if (next && !winds) setWinds(await fetchLegWinds(legMidpoints(itinerary)));
  };

  const hero = photo ?? marinaPhoto(trip.photoSeed);

  return (
    <article className={"trip-card2 " + status}>
      <div className="tc-media">
        <img src={hero} alt={trip.destinationName} loading="lazy" />
        <span className={"tc-status " + status}>
          {status === "upcoming" ? "Planned" : status === "past" ? "Completed" : "Cancelled"}
        </span>
      </div>

      <div className="tc-body">
        <div className="tc-top">
          <div className="tc-titles">
            <h2>{trip.name}</h2>
            <p className="tc-marina">{trip.destinationName}</p>
            <p className="tc-location">{trip.destinationLocation}</p>
          </div>
          <div className="tc-price">
            <span>Est. slips</span>
            <b>${trip.totalPrice.toLocaleString("en-US")}</b>
          </div>
        </div>

        <dl className="tc-facts">
          <div>
            <dt>Dates</dt>
            <dd>{formatDateRange(trip)}</dd>
          </div>
          <div>
            <dt>Nights</dt>
            <dd>{trip.nights}</dd>
          </div>
          <div>
            <dt>Boat</dt>
            <dd>
              {trip.boatName
                ? `${trip.boatName}${trip.boatLengthFt ? ` · ${trip.boatLengthFt} ft` : ""}`
                : "Not set"}
            </dd>
          </div>
        </dl>

        <p className="tc-route">{trip.route}</p>

        <div className="tc-actions">
          <button className="tc-btn primary" onClick={openDetail}>
            {open ? "Hide trip" : "View trip"}
          </button>
          {trip.destinationWebsite ? (
            <a
              className="tc-btn"
              href={trip.destinationWebsite}
              target="_blank"
              rel="noreferrer noopener"
            >
              Message marina
            </a>
          ) : (
            <button className="tc-btn" disabled title="No contact page listed for this marina">
              Message marina
            </button>
          )}
          <a
            className="tc-btn"
            href={directionsUrl(trip)}
            target="_blank"
            rel="noreferrer noopener"
          >
            Get directions
          </a>
          {status === "cancelled" ? (
            <>
              <button
                className="tc-btn ghost"
                onClick={() => {
                  setCancelled(userId, trip.id, false);
                  onChanged();
                  onToast("Trip restored.");
                }}
              >
                Restore
              </button>
              <button
                className="tc-btn ghost danger"
                onClick={() => {
                  removeTrip(userId, trip.id);
                  onChanged();
                  onToast("Trip deleted.");
                }}
              >
                Delete
              </button>
            </>
          ) : status === "upcoming" ? (
            <button
              className="tc-btn ghost"
              onClick={() => {
                setCancelled(userId, trip.id, true);
                onChanged();
                onToast("Trip cancelled.");
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>

        {open && (
          <TripDetail
            trip={itinerary}
            winds={winds}
            loaFt={trip.boatLengthFt ?? 40}
            cruiseKts={7}
            isPro={canCustom}
          />
        )}
      </div>
    </article>
  );
}

/* ── Empty states ────────────────────────────────────────────────────────── */

const EMPTY: Record<TripStatus, { icon: string; title: string; body: string }> = {
  upcoming: {
    icon: "⛵",
    title: "No trips planned yet",
    body: "Pick a route below and set your dates — SlipGo works out the timing from live wind and prices a slip at every overnight.",
  },
  past: {
    icon: "🧭",
    title: "No completed trips yet",
    body: "Once a planned trip's dates have passed it moves here, so you keep a record of every cruise you've made.",
  },
  cancelled: {
    icon: "🗂️",
    title: "Nothing cancelled",
    body: "Trips you call off land here. You can restore one at any time, or delete it for good.",
  },
};

function TripsEmpty({ tab }: { tab: TripStatus }) {
  const e = EMPTY[tab];
  return (
    <div className="trips-empty">
      <div className="trips-empty-icon" aria-hidden="true">
        {e.icon}
      </div>
      <h2>{e.title}</h2>
      <p>{e.body}</p>
      {tab === "upcoming" && (
        <a className="trips-empty-cta" href="#plan-a-trip">
          Plan a trip
        </a>
      )}
    </div>
  );
}

/** A real curated route, faded, so the lock shows what you'd actually get. */
function TripsPreview() {
  return (
    <div className="trips-preview-inner">
      <div className="trip-tabs">
        {TABS.map((x, i) => (
          <span key={x.key} className={"trip-tab" + (i === 0 ? " active" : "")}>
            {x.label}
          </span>
        ))}
      </div>
      <div className="trip-list">
        {CURATED_TRIPS.slice(0, 2).map((t) => (
          <PreviewCard key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}

function PreviewCard({ t }: { t: Itinerary }) {
  const stats = tripStats(t);
  const { listing } = destinationFor(t.stops);
  return (
      <article className="trip-card2 upcoming">
        <div className="tc-media">
          <img src={marinaPhoto(listing?.photoSeed ?? 0)} alt="" />
          <span className="tc-status upcoming">Planned</span>
        </div>
        <div className="tc-body">
          <div className="tc-top">
            <div className="tc-titles">
              <h2>{t.name}</h2>
              <p className="tc-marina">{listing?.name ?? "Marina"}</p>
              <p className="tc-location">{listing?.neighborhood ?? ""}</p>
            </div>
            <div className="tc-price">
              <span>Est. slips</span>
              <b>${stats.slipCost.toLocaleString("en-US")}</b>
            </div>
          </div>
          <dl className="tc-facts">
            <div>
              <dt>Dates</dt>
              <dd>Your dates</dd>
            </div>
            <div>
              <dt>Nights</dt>
              <dd>{stats.nights}</dd>
            </div>
            <div>
              <dt>Boat</dt>
              <dd>Your boat</dd>
            </div>
          </dl>
          <p className="tc-route">{t.stops.map((s) => HARBORS[s.region].label).join(" → ")}</p>
        </div>
      </article>
  );
}

/* ── Planner: curated routes + custom builder ────────────────────────────── */

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

function Planner({
  tier,
  canCustom,
  boats,
  userId,
  onSaved,
  onPricing,
}: {
  tier: Tier;
  canCustom: boolean;
  boats: { id: string; name: string; lengthFt: number; cruiseKts: number }[];
  userId: string | null;
  onSaved: (name: string) => void;
  onPricing: () => void;
}) {
  const [boatId, setBoatId] = useState<string | null>(null);
  const boat = boats.find((b) => b.id === boatId) ?? boats[0] ?? null;
  const loaFt = boat?.lengthFt ?? 40;
  const cruiseKts = boat?.cruiseKts ?? 7;

  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [custom, setCustom] = useState<TripStop[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [data, setData] = useState<Record<string, Enriched>>({});

  const allTrips = useMemo(() => {
    const list = [...CURATED_TRIPS];
    if (custom.length >= 2) list.push(buildCustomTrip(custom));
    return list;
  }, [custom]);

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

  const save = (t: Itinerary, stats: TripStats) => {
    const startDate = dates[t.id] || todayISO();
    const { region, listing } = destinationFor(t.stops);
    saveTrip(userId, {
      itineraryId: t.id,
      name: t.name,
      startDate,
      nights: stats.nights,
      stops: t.stops,
      route: t.stops.map((s) => HARBORS[s.region].label).join(" → "),
      destinationRegion: region,
      destinationName: listing?.name ?? REGIONS[region].label,
      destinationLocation: listing?.neighborhood ?? REGIONS[region].label,
      destinationListingId: listing?.id ?? null,
      destinationLat: listing?.lat ?? null,
      destinationLon: listing?.lon ?? null,
      destinationWebsite: listing?.website ?? null,
      photoSeed: listing?.photoSeed ?? 0,
      boatName: boat?.name ?? null,
      boatLengthFt: boat?.lengthFt ?? null,
      totalPrice: stats.slipCost,
    });
    onSaved(t.name);
  };

  return (
    <section className="planner" id="plan-a-trip">
      <div className="planner-head">
        <h2>Plan a new trip</h2>
        <div className="trip-boatbar">
          {boats.length > 0 ? (
            <>
              <label htmlFor="trip-boat">Planning for</label>
              <select id="trip-boat" value={boat?.id ?? ""} onChange={(e) => setBoatId(e.target.value)}>
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
      </div>

      {allTrips.map((t) => {
        const unlocked = tripUnlocked(tier, t);
        const e = data[t.id];
        const stats = e?.stats ?? tripStats(t, loaFt, cruiseKts);
        const isOpen = openTrip === t.id;

        return (
          <article className="trip-card" key={t.id}>
            <div className="trip-top">
              <div>
                <h3>{t.name}</h3>
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
                      {boat ? `${boat.name}, ${loaFt} ft at ${cruiseKts} kn` : "40 ft at 7 kn"}
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

                <div className="plan-actions">
                  <label className="plan-date">
                    <span>Departing</span>
                    <input
                      type="date"
                      min={todayISO()}
                      value={dates[t.id] ?? todayISO()}
                      onChange={(ev) => setDates((d) => ({ ...d, [t.id]: ev.target.value }))}
                    />
                  </label>
                  <button className="tc-btn primary" onClick={() => save(t, stats)}>
                    Save to my trips
                  </button>
                  <button className="tc-btn" onClick={() => setOpenTrip(isOpen ? null : t.id)}>
                    {isOpen ? "Hide route" : "View route & slip prices"}
                  </button>
                </div>

                {isOpen && (
                  <TripDetail
                    trip={t}
                    winds={e?.winds ?? null}
                    loaFt={loaFt}
                    cruiseKts={cruiseKts}
                    isPro={canCustom}
                  />
                )}
              </>
            ) : (
              <LockedFeature
                variant="inline"
                tier="pro"
                title="Full route access"
                body="SlipGo Pro opens this route end to end — every leg timed, every overnight priced, plus fuel and pump-out stops."
                ctaLabel="Unlock with Pro"
                onUnlock={onPricing}
                onComparePlans={onPricing}
              />
            )}
          </article>
        );
      })}

      <CustomTripBuilder
        canCustom={canCustom}
        stops={custom}
        onChange={setCustom}
        onPricing={onPricing}
      />

      <p className="trips-foot">
        Distances are great-circle estimates; slip prices use listed transient rates
        (sample data).
      </p>
    </section>
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
          <h3>Fuel &amp; pump-out</h3>
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
      ) : null}
    </div>
  );
}

function CustomTripBuilder({
  canCustom,
  stops,
  onChange,
  onPricing,
}: {
  canCustom: boolean;
  stops: TripStop[];
  onChange: (s: TripStop[]) => void;
  onPricing: () => void;
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
          <h3>Build your own trip</h3>
          <p className="trip-tagline">
            Chain any harbours in California — we'll time it against live wind and
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
            <p className="builder-hint">Add one more harbour and your trip appears above.</p>
          )}
        </>
      ) : (
        <LockedFeature
          variant="inline"
          tier="pro"
          title="Build your own route"
          body="SlipGo Pro lets you chain any harbours in California into one route, timed against live wind and priced night by night."
          ctaLabel="Unlock with Pro"
          onUnlock={onPricing}
          onComparePlans={onPricing}
        />
      )}
    </section>
  );
}
