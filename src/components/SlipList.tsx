import { useState } from "react";
import type { Listing } from "../data/listings";
import { formatSlipPrice, slipInventory } from "../lib/slips";
import { FIT_LABEL, slipFit } from "../lib/boats";
import { useAuth } from "../lib/auth";

// The headline of a marina's sidebar: every open slip, cheapest first, the way
// Zillow lists the available units in a building.

const PREVIEW_COUNT = 6;

export function SlipList({ listing }: { listing: Listing }) {
  const { boats } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const slips = slipInventory(listing);

  if (slips.length === 0) {
    return (
      <section className="slips">
        <div className="slips-head">
          <h3>Available slips</h3>
        </div>
        <p className="slips-empty">
          {listing.type === "yacht-club"
            ? "Members only — this club doesn't post open slips."
            : "No open slips listed right now. Contact the marina for the waitlist."}
        </p>
      </section>
    );
  }

  const boat = boats[0] ?? null;
  const shown = expanded ? slips : slips.slice(0, PREVIEW_COUNT);
  const lengths = slips.map((s) => s.lengthFt);
  const range =
    lengths[0] === lengths[lengths.length - 1]
      ? `${lengths[0]} ft`
      : `${lengths[0]}–${lengths[lengths.length - 1]} ft`;

  return (
    <section className="slips">
      <div className="slips-head">
        <h3>Available slips</h3>
        <span className="slips-count">
          {slips.length} open · {range}
        </span>
      </div>

      <div className="slip-table" role="table" aria-label="Available slips">
        <div className="slip-row slip-row--head" role="row">
          <span role="columnheader">Slip</span>
          <span role="columnheader">Size</span>
          <span role="columnheader">Rate</span>
        </div>
        {shown.map((s) => {
          const fit = boat ? slipFit(s.lengthFt, boat.lengthFt) : null;
          return (
            <div className="slip-row" role="row" key={s.id}>
              <span className="slip-berth" role="cell">
                {s.label}
                {s.endTie && <span className="slip-tag">End tie</span>}
                {fit && <span className={"fit-badge " + fit}>{FIT_LABEL[fit]}</span>}
              </span>
              <span className="slip-size" role="cell">
                {s.lengthFt} × {s.beamFt} ft
              </span>
              <span className="slip-rate" role="cell">
                {formatSlipPrice(s)}
              </span>
            </div>
          );
        })}
      </div>

      {slips.length > PREVIEW_COUNT && (
        <button className="slips-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show fewer" : `Show all ${slips.length} slips`}
        </button>
      )}

      <p className="slips-note">
        Sample availability derived from this listing's open-slip count, size and
        rate — confirm the exact berth with the marina.
      </p>
    </section>
  );
}
