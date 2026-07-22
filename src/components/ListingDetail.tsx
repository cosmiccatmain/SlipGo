import { useEffect, useState } from "react";
import { events, type Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";
import { useEnrichment } from "../lib/enrich";

interface Props {
  listing: Listing;
  onClose: () => void;
}

const TYPE_LABEL: Record<Listing["type"], string> = {
  marina: "Marina slip",
  "guest-dock": "Guest dock",
  "yacht-club": "Yacht club",
};

function mapsUrl(l: Listing) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${l.name} ${l.address}`)
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={"star" + (n <= full ? "" : " off")}>★</span>
      ))}
    </span>
  );
}

export function ListingDetail({ listing, onClose }: Props) {
  const est = getEstimate(listing);
  const { windLoading, wind, serverLoading, server } = useEnrichment(listing);

  const place = server?.place ?? null;
  const summary = server?.summary ?? null;
  const placesConfigured = !!server?.configured.places;
  const aiConfigured = !!server?.configured.ai;
  const offline = !serverLoading && server === null; // no serverless backend reachable

  const realPhoto = place?.photos?.[0] ?? null;
  const [heroLoaded, setHeroLoaded] = useState(false);
  useEffect(() => {
    setHeroLoaded(false);
  }, [realPhoto]);
  const displayRating = place?.rating ?? listing.rating;
  const displayCount = place?.reviewCount ?? listing.reviewCount;

  const notConfiguredNote = offline
    ? "Live on the deployed site once the key is set in Vercel."
    : "Add the key in Vercel to enable.";

  return (
    <div className="detail">
      <div className="detail-bar">
        <button className="detail-back" onClick={onClose}>
          <span aria-hidden="true">←</span> All results
        </button>
        <a
          className="detail-source"
          href={mapsUrl(listing)}
          target="_blank"
          rel="noreferrer noopener"
        >
          Find on Google Maps <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="detail-scroll">
        <div className="detail-hero-wrap">
          {realPhoto ? (
            <img
              className={"detail-hero" + (heroLoaded ? " loaded" : "")}
              src={realPhoto}
              alt={listing.name}
              onLoad={() => setHeroLoaded(true)}
            />
          ) : !serverLoading ? (
            // Loaded, but no real photo available — fall back to the illustration.
            <img className="detail-hero loaded" src={marinaPhoto(listing.photoSeed)} alt={listing.name} />
          ) : null}
          {(serverLoading && !realPhoto) || (realPhoto && !heroLoaded) ? (
            <div className="detail-hero skeleton" />
          ) : null}
        </div>

        {place && place.photos.length > 1 && (
          <div className="photo-strip">
            {place.photos.slice(1, 4).map((p, i) => (
              <img key={i} src={p} alt={`${listing.name} photo ${i + 2}`} />
            ))}
          </div>
        )}

        <div className="detail-head">
          <div className="detail-price">{listing.priceLabel}</div>
          <div className="detail-rating">
            <span className="star" aria-hidden="true">★</span>
            {displayRating.toFixed(1)}
            <span className="rating-count">
              ({displayCount}{place ? " Google" : ""})
            </span>
          </div>
        </div>
        <h2 className="detail-name">{listing.name}</h2>
        <div className="detail-neighborhood">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="currentColor" />
          </svg>
          {listing.neighborhood}
        </div>
        <div className="detail-address">{listing.address}</div>

        <div className="detail-estimate">
          <div>
            <span className="est-label">BoatGoat Estimate</span>
            <div className="est-big">{formatEstimate(listing, est.fairValue)}</div>
          </div>
          <span className={"value-chip " + est.verdict}>{est.label}</span>
        </div>

        {/* AI overall take — grounded in real data, only when configured */}
        <section className="ai-take">
          <div className="ai-take-head">
            <span className="ai-badge">goaty</span>
            {summary && <span className="ai-score">{summary.score}<small>/100</small></span>}
          </div>
          {serverLoading ? (
            <div className="skel-lines">
              <span className="skeleton" style={{ width: "100%" }} />
              <span className="skeleton" style={{ width: "80%" }} />
            </div>
          ) : summary ? (
            <p className="ai-text">{summary.text}</p>
          ) : (
            <p className="ai-muted">
              {aiConfigured
                ? "Not enough source data to summarize yet."
                : `AI summary — ${notConfiguredNote}`}
            </p>
          )}
        </section>

        <section className="detail-section">
          <h3>The basics</h3>
          <div className="fact-grid">
            <div className="fact">
              <span>Max length</span>
              <b>{listing.maxLengthFt} ft</b>
            </div>
            {listing.type !== "yacht-club" && (
              <div className="fact">
                <span>{listing.mode === "sale" ? "Available" : "Slips open"}</span>
                <b>{listing.slipsOpen}</b>
              </div>
            )}
            <div className="fact">
              <span>Rate</span>
              <b>{listing.rateNote}</b>
            </div>
            <div className="fact">
              <span>Type</span>
              <b>{TYPE_LABEL[listing.type]}</b>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>Perks &amp; amenities</h3>
          <div className="amenity-chips">
            {listing.amenities.map((a) => (
              <span key={a} className="amenity-chip">{a}</span>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h3>Conditions &amp; neighborhood</h3>
          <div className="cond-grid">
            <div className="cond-card">
              <div className="cond-top">
                <b>Average wind</b>
                <span className="live-tag">Live · Open-Meteo</span>
              </div>
              {windLoading ? (
                <span className="skeleton" style={{ width: "70%" }} />
              ) : wind ? (
                <div className="cond-value">
                  {wind.avgKnots} kn avg · peaks ~{wind.peakKnots} kn
                  <span className="cond-sub">Prevailing {wind.direction} · past 30 days</span>
                </div>
              ) : (
                <div className="cond-muted">Wind data unavailable right now.</div>
              )}
            </div>

            <div className="cond-card">
              <div className="cond-top"><b>Slip neighbors</b></div>
              <div className="cond-muted">Provided by the marina operator — not public data.</div>
            </div>

            <div className="cond-card">
              <div className="cond-top"><b>Area safety / crime</b></div>
              <div className="cond-muted">
                Marina del Rey is LA County (Sheriff) jurisdiction — needs a county
                crime source; wiring separately so it's accurate.
              </div>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>Reviews {place && <span className="review-src">from Google</span>}</h3>
          {serverLoading ? (
            <div className="review-skel">
              <span className="skeleton" style={{ width: "40%" }} />
              <span className="skeleton" style={{ width: "100%" }} />
              <span className="skeleton" style={{ width: "90%" }} />
            </div>
          ) : place && place.reviews.length > 0 ? (
            <div className="reviews">
              {place.reviews.slice(0, 3).map((r, i) => (
                <div className="review" key={i}>
                  <div className="review-head">
                    <b>{r.author}</b>
                    <Stars rating={r.rating} />
                  </div>
                  {r.relativeTime && <div className="review-time">{r.relativeTime}</div>}
                  <p className="review-text">{r.text.length > 120 ? r.text.slice(0, 120) + "…" : r.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="cond-muted">
              {placesConfigured
                ? "No Google reviews found for this marina."
                : `Real reviews & photos load from Google Places — ${notConfiguredNote}`}
            </div>
          )}
        </section>

        <section className="detail-section">
          <h3>On the water nearby</h3>
          {events.slice(0, 3).map((e) => (
            <div key={e.id} className="detail-event">
              <b>{e.title}</b>
              <span>{e.detail}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
