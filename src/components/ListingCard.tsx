import { useState } from "react";
import type { Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";

interface Props {
  listing: Listing;
  index: number;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const TYPE_BADGE: Record<Listing["type"], string | null> = {
  marina: null,
  "guest-dock": "Guest dock",
  "yacht-club": "Yacht club",
};

export function ListingCard({ listing, index, selected, onHover, onSelect }: Props) {
  const [liked, setLiked] = useState(false);
  const badge = listing.mode === "sale" ? "For sale" : TYPE_BADGE[listing.type];
  const badgeClass = listing.mode === "sale" ? "sale" : listing.type;
  const est = getEstimate(listing);

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
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(listing.id)}
    >
      <div className="card-photo">
        <img src={marinaPhoto(listing.photoSeed)} alt={listing.name} loading="lazy" />
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
