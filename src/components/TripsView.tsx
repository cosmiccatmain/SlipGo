import { CURATED_TRIPS, HARBORS, tripStats, tripUnlocked } from "../lib/trips";
import { getTier } from "../lib/membership";

// BoatGoat Trips v1: curated multi-stop cruises with a slip at every overnight.
// Read-only for now — the multi-slip booking flow is the next Trips pass.

export function TripsView() {
  const tier = getTier();

  return (
    <div className="trips-view">
      <div className="trips-head">
        <h1>
          BoatGoat <span className="trips-green">Trips</span>
        </h1>
        <p>
          Cruise Southern California with a slip waiting at every stop. Curated
          trips are <span className="tier-chip plus">Plus</span> — custom
          multi-stop trips and full access are{" "}
          <span className="tier-chip pro">Pro</span>.
        </p>
      </div>

      {CURATED_TRIPS.map((t) => {
        const unlocked = tripUnlocked(tier, t);
        const stats = tripStats(t);
        return (
          <article className="trip-card" key={t.id}>
            <div className="trip-top">
              <h2>{t.name}</h2>
              <span className={"tier-chip " + t.tier}>{t.tier}</span>
            </div>
            <p className="trip-tagline">{t.tagline}</p>
            <div className="trip-route">
              {t.stops.map((s) => HARBORS[s.region].label).join(" → ")}
            </div>
            {unlocked ? (
              <div className="trip-stats">
                <span>
                  <b>{Math.round(stats.distanceNm)}</b> nm
                </span>
                <span>
                  <b>{Math.round(stats.cruiseHours)}</b> h at 7 kn
                </span>
                <span>
                  <b>{stats.nights}</b> nights
                </span>
                <span>
                  est. slips <b>${stats.slipCost.toLocaleString("en-US")}</b>
                  <small> · 40 ft boat</small>
                </span>
              </div>
            ) : (
              <div className={"tier-note" + (t.tier === "pro" ? " pro" : "")}>
                {t.tier === "pro"
                  ? "Full route details and booking are a BoatGoat Pro feature."
                  : "Trip details are a BoatGoat Plus feature."}
              </div>
            )}
          </article>
        );
      })}

      <p className="trips-foot">
        Booking every slip on a trip in one checkout is coming to Trips.
        Distances are great-circle estimates; costs use listed transient rates
        (sample data).
      </p>
    </div>
  );
}
