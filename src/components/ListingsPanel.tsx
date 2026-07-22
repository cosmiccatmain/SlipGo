import { useEffect, useRef, useState } from "react";
import type { Listing, ListingMode } from "../data/listings";
import { ListingCard } from "./ListingCard";

export type SortMode = "featured" | "price-asc" | "price-desc";

interface Props {
  listings: Listing[];
  mode: ListingMode;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
}

const SORT_LABELS: Record<SortMode, string> = {
  featured: "Slips for You",
  "price-asc": "Price (Low to High)",
  "price-desc": "Price (High to Low)",
};

export function ListingsPanel({ listings, mode, sort, onSortChange, selectedId, onHover, onOpen }: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const close = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [sortOpen]);

  useEffect(() => {
    if (!selectedId || !panelRef.current) return;
    const el = panelRef.current.querySelector(`[data-card-id="${selectedId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const heading = mode === "sale"
    ? "Marina del Rey CA Boat Slips for Sale"
    : "Marina del Rey CA Boat Slips & Yacht Clubs";

  return (
    <section className="listings-panel" ref={panelRef}>
      <div className="results-head">
        <h1>{heading}</h1>
        <div className="results-meta">
          <span className="results-count">{listings.length} results</span>
          <div className="sort-wrap" ref={sortRef}>
            <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
              Sort: <b>{SORT_LABELS[sort]}</b> <span className="chev">▾</span>
            </button>
            {sortOpen && (
              <div className="dropdown sort-dropdown pop-enter">
                {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
                  <button
                    key={m}
                    className={"sort-opt" + (m === sort ? " sel" : "")}
                    onClick={() => {
                      onSortChange(m);
                      setSortOpen(false);
                    }}
                  >
                    {SORT_LABELS[m]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-grid" key={`${mode}-${sort}`}>
        {listings.map((l, i) => (
          <div data-card-id={l.id} key={l.id}>
            <ListingCard
              listing={l}
              index={i}
              selected={l.id === selectedId}
              onHover={onHover}
              onOpen={onOpen}
            />
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="empty-state">
          <div className="empty-goat">🐐</div>
          <p>No listings match your filters.</p>
          <p className="empty-sub">Try widening your price range, slip length, or amenities.</p>
        </div>
      )}

      <footer className="panel-footer">
        BoatGoat is the G.O.A.T. of boat slips. Listings, pricing, ratings, and the
        BoatGoat Estimate are illustrative MVP sample data for Marina del Rey, CA —
        not a real appraisal. Map © OpenStreetMap contributors.
      </footer>
    </section>
  );
}
