import { useEffect, useRef, useState } from "react";
import type { Listing } from "../data/listings";
import { ListingCard } from "./ListingCard";

export type SortMode = "featured" | "price-asc" | "price-desc";

interface Props {
  listings: Listing[];
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const SORT_LABELS: Record<SortMode, string> = {
  featured: "Slips for You",
  "price-asc": "Price (Low to High)",
  "price-desc": "Price (High to Low)",
};

export function ListingsPanel({ listings, sort, onSortChange, selectedId, onHover, onSelect }: Props) {
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

  return (
    <section className="listings-panel" ref={panelRef}>
      <div className="results-head">
        <h1>Marina del Rey CA Boat Slips &amp; Yacht Clubs</h1>
        <div className="results-meta">
          <span className="results-count">{listings.length} results</span>
          <div className="sort-wrap" ref={sortRef}>
            <button className="sort-btn" onClick={() => setSortOpen((o) => !o)}>
              Sort: <b>{SORT_LABELS[sort]}</b> <span className="chev">▾</span>
            </button>
            {sortOpen && (
              <div className="dropdown sort-dropdown">
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

      <div className="card-grid">
        {listings.map((l) => (
          <div data-card-id={l.id} key={l.id}>
            <ListingCard
              listing={l}
              selected={l.id === selectedId}
              onHover={onHover}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>

      {listings.length === 0 && (
        <div className="empty-state">
          <div className="empty-goat">🐐</div>
          <p>No listings match your filters.</p>
          <p className="empty-sub">Try widening your price range or slip length.</p>
        </div>
      )}

      <footer className="panel-footer">
        BoatGoat is the G.O.A.T. of boat slips. Listing data is illustrative MVP
        sample data for Marina del Rey, CA. Map ©
        OpenStreetMap contributors.
      </footer>
    </section>
  );
}
