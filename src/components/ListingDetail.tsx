import { useEffect, useState } from "react";
import { events, type Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";
import { useEnrichment } from "../lib/enrich";
import { getSafety } from "../lib/safety";
import { hasFeature } from "../lib/membership";
import { useTier } from "../lib/auth";
import { SlipList } from "./SlipList";

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

function prettyDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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
  const websiteUrl = place?.website ?? listing.website ?? null;
  const safety = getSafety(listing);
  const tier = useTier();
  const canSafety = hasFeature(tier, "safety");
  const canNeighbors = hasFeature(tier, "slipNeighbors");
  // Official Skipper rating blends the AI score with safety once crime data is
  // wired (currently safety.ready is false, so it's just the AI score).
  const officialScore = summary
    ? safety.ready && safety.score !== null
      ? Math.round(summary.score * 0.8 + safety.score * 0.2)
      : summary.score
    : null;
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
        <div className="detail-links">
          {websiteUrl && (
            <a
              className="detail-source detail-source--web"
              href={websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Visit website <span aria-hidden="true">↗</span>
            </a>
          )}
          <a
            className="detail-source"
            href={mapsUrl(listing)}
            target="_blank"
            rel="noreferrer noopener"
          >
            Find on Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
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
        {websiteUrl && (
          <a
            className="detail-website"
            href={websiteUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-2.6a15.7 15.7 0 00-1.3-3.4A8 8 0 0118.9 8zM12 4c.8 1 1.5 2.4 1.9 4h-3.8C10.5 6.4 11.2 5 12 4zM4.3 14a8 8 0 010-4h3a17.6 17.6 0 000 4zm.8 2h2.6a15.7 15.7 0 001.3 3.4A8 8 0 015.1 16zm2.6-8H5.1a8 8 0 013.9-3.4A15.7 15.7 0 007.7 8zM12 20c-.8-1-1.5-2.4-1.9-4h3.8c-.4 1.6-1.1 3-1.9 4zm2.3-6H9.7a15.4 15.4 0 010-4h4.6a15.4 15.4 0 010 4zm.4 5.4a15.7 15.7 0 001.3-3.4h2.6a8 8 0 01-3.9 3.4zM17 14a17.6 17.6 0 000-4h3a8 8 0 010 4z"
              />
            </svg>
            {prettyDomain(websiteUrl)}
            <span aria-hidden="true">↗</span>
          </a>
        )}

        <div className="detail-estimate">
          <div>
            <span className="est-label">SlipGo Estimate</span>
            <div className="est-big">{formatEstimate(listing, est.fairValue)}</div>
          </div>
          <span className={"value-chip " + est.verdict}>{est.label}</span>
        </div>

        {/* What you actually came for: the open slips, sizes and rates. */}
        <SlipList listing={listing} />

        {/* AI overall take — grounded in real data, only when configured */}
        <section className="ai-take">
          <div className="ai-take-head">
            <span className="ai-badge">Skipper</span>
            {officialScore !== null && <span className="ai-score">{officialScore}<small>/100</small></span>}
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
              <div className="cond-top">
                <b>Slip neighbors</b>
                <span className="tier-chip plus">Plus</span>
              </div>
              {canNeighbors ? (
                <div className="cond-muted">Provided by the marina operator — not public data.</div>
              ) : (
                <div className="tier-note">
                  A SlipGo Plus feature — see who's docked around you.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h3>
            Safety rating <span className="tier-chip plus">Plus</span>
          </h3>
          {!canSafety ? (
            <div className="tier-note">
              Crime &amp; safety ratings are a SlipGo Plus feature. Source when
              live: {safety.source}.
            </div>
          ) : (
          <div className="safety-card">
            <div className="safety-head">
              <div className={"safety-grade" + (safety.ready ? "" : " pending")}>
                {safety.ready ? safety.grade : "—"}
              </div>
              <div className="safety-meta">
                <div className="safety-score-line">
                  {safety.ready && safety.score !== null ? (
                    <>
                      <b>{safety.score}</b>
                      <small>/100 safe</small>
                    </>
                  ) : (
                    <span className="safety-pending-label">Preparing</span>
                  )}
                </div>
                <div className="safety-source">Source: {safety.source}</div>
              </div>
            </div>
            <div className="safety-bar">
              <div
                className="safety-bar-fill"
                style={{ width: safety.ready && safety.score !== null ? `${safety.score}%` : "0%" }}
              />
            </div>
            {!safety.ready && (
              <p className="safety-note">
                Crime &amp; safety data is being wired in from {safety.source}. Once
                live, this Safety score becomes part of the official Skipper rating.
              </p>
            )}
          </div>
          )}
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
