import { useEffect, useRef, useState } from "react";
import type { Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";
import { prefetchEnrichment, getCachedPhoto, onEnrichmentReady } from "../lib/enrich";

interface Props {
  listing: Listing;
  index: number;
  selected: boolean;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}

const TYPE_BADGE: Record<Listing["type"], string | null> = {
  marina: null,
  "guest-dock": "Guest dock",
  "yacht-club": "Yacht club",
};

export function ListingCard({ listing, index, selected, onHover, onOpen }: Props) {
  const [liked, setLiked] = useState(false);
  const badge = listing.mode === "sale" ? "For sale" : TYPE_BADGE[listing.type];
  const badgeClass = listing.mode === "sale" ? "sale" : listing.type;
  const est = getEstimate(listing);

  // Real Google photo, lazy-loaded when the card scrolls into view. Falls back
  // to the illustration until (and unless) a real photo is available.
  const photoRef = useRef<HTMLDivElement>(null);
  const [photo, setPhoto] = useState<string | null>(() => getCachedPhoto(listing.id));
  const [photoLoaded, setPhotoLoaded] = useState(false);

  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          prefetchEnrichment(listing); // only fetch what the user actually sees
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [listing.id]);

  useEffect(() => {
    setPhoto(getCachedPhoto(listing.id));
    setPhotoLoaded(false);
    return onEnrichmentReady((id) => {
      if (id === listing.id) setPhoto(getCachedPhoto(listing.id));
    });
  }, [listing.id]);

  let specs: React.ReactNode;
  if (listing.mode === "sale") {
    specs = (
      <>
        <span><b>{listing.maxLengthFt} ft</b> deeded slip</span>
        <span className="spec-sep">|</span>
        <span>{listing.perk}</span>
      </>
    );
  } else if (listing.type === "yacht-club") {
    specs = (
      <>
        <span><b>{listing.maxLengthFt} ft</b> max LOA</span>
        <span className="spec-sep">|</span>
        <span>{listing.rateNote}</span>
        <span className="spec-sep">|</span>
        <span>{listing.perk}</span>
      </>
    );
  } else {
    specs = (
      <>
        <span><b>{listing.slipsOpen}</b> slips open</span>
        <span className="spec-sep">|</span>
        <span>up to <b>{listing.maxLengthFt} ft</b></span>
        <span className="spec-sep">|</span>
        <span>{listing.rateNote}</span>
      </>
    );
  }

  return (
    <article
      className={"card card-enter" + (selected ? " selected" : "")}
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      onMouseEnter={() => {
        onHover(listing.id);
        prefetchEnrichment(listing); // warm photos/reviews before the click
      }}
      onMouseLeave={() => onHover(null)}
      onPointerDown={() => prefetchEnrichment(listing)} // covers tap on mobile
      onClick={() => onOpen(listing.id)}
    >
      <div className="card-photo" ref={photoRef}>
        <img
          className="card-illustration"
          src={marinaPhoto(listing.photoSeed)}
          alt={listing.name}
          loading="lazy"
        />
        {photo && (
          <img
            className={"card-real" + (photoLoaded ? " loaded" : "")}
            src={photo}
            alt={listing.name}
            loading="lazy"
            onLoad={() => setPhotoLoaded(true)}
          />
        )}
        {badge && <span className={"card-badge " + badgeClass}>{badge}</span>}
        <button
          className={"heart" + (liked ? " liked" : "")}
          aria-label="Save listing"
          onClick={(e) => {
            e.stopPropagation();
            setLiked((l) => !l);
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M12 21s-7.5-4.9-10-9.5C.5 8 2 4.5 5.5 4 7.7 3.7 9.6 5 12 7.4 14.4 5 16.3 3.7 18.5 4 22 4.5 23.5 8 22 11.5 19.5 16.1 12 21 12 21z" />
          </svg>
        </button>
        <div className="carousel-dots" aria-hidden="true">
          <span className="dot on" /><span className="dot" /><span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
      <div className="card-body">
        <div className="card-price-row">
          <span className="card-price">{listing.priceLabel}</span>
          <span className="card-rating" title={`${listing.reviewCount} reviews`}>
            <span className="star" aria-hidden="true">★</span>
            {listing.rating.toFixed(1)}
            <span className="rating-count">({listing.reviewCount})</span>
          </span>
        </div>
        <div className="card-specs">{specs}</div>
        <div className="card-neighborhood">
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" fill="currentColor" />
          </svg>
          {listing.neighborhood}
        </div>
        <div className="card-address">{listing.address}</div>
        <div className="card-estimate">
          <span className="est-label">Est.</span>
          <span className="est-value">{formatEstimate(listing, est.fairValue)}</span>
          <span className={"value-chip " + est.verdict}>{est.label}</span>
        </div>
      </div>
    </article>
  );
}
