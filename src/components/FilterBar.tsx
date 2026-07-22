import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AMENITY_OPTIONS, type ListingMode, type ListingType } from "../data/listings";

export interface Filters {
  types: Set<ListingType>;
  minPrice: number | null;
  maxPrice: number | null;
  minLength: number | null;
  amenities: Set<string>;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  query: string;
  onQueryChange: (q: string) => void;
  mode: ListingMode;
  onToast: (msg: string) => void;
}

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "marina", label: "Marinas" },
  { value: "guest-dock", label: "Guest docks" },
  { value: "yacht-club", label: "Yacht clubs" },
];

const RENT_PRICE_STOPS = [0, 250, 500, 750, 1000, 1500, 2000, 3000];
const SALE_PRICE_STOPS = [0, 200000, 300000, 400000, 500000, 750000, 1000000];
const LENGTH_STOPS = [25, 30, 35, 40, 50, 60, 80, 100];

function money(n: number) {
  if (n >= 1000) return "$" + (n / 1000).toLocaleString("en-US") + "K";
  return "$" + n.toLocaleString("en-US");
}

export function FilterBar({ filters, onChange, query, onQueryChange, mode, onToast }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));

  const priceStops = mode === "sale" ? SALE_PRICE_STOPS : RENT_PRICE_STOPS;

  // Dual-range price slider bounds/geometry.
  const priceLo = priceStops[0];
  const priceHi = priceStops[priceStops.length - 1];
  const priceStep = mode === "sale" ? 5000 : 25;
  const minVal = filters.minPrice ?? priceLo;
  const maxVal = filters.maxPrice ?? priceHi;
  const minPct = ((minVal - priceLo) / (priceHi - priceLo)) * 100;
  const maxPct = ((maxVal - priceLo) / (priceHi - priceLo)) * 100;

  const toggleType = (t: ListingType) => {
    const next = new Set(filters.types);
    if (next.has(t)) {
      if (next.size > 1) next.delete(t);
    } else {
      next.add(t);
    }
    onChange({ ...filters, types: next });
  };

  const toggleAmenity = (a: string) => {
    const next = new Set(filters.amenities);
    if (next.has(a)) next.delete(a);
    else next.add(a);
    onChange({ ...filters, amenities: next });
  };

  const typeLabel =
    filters.types.size === TYPE_OPTIONS.length
      ? "All listings"
      : TYPE_OPTIONS.filter((o) => filters.types.has(o.value))
          .map((o) => o.label)
          .join(", ");

  const priceActive = filters.minPrice !== null || filters.maxPrice !== null;
  const priceLabel = priceActive
    ? `${filters.minPrice !== null ? money(filters.minPrice) : "$0"}–${filters.maxPrice !== null ? money(filters.maxPrice) : "Any"}`
    : "Price";

  const lengthLabel = filters.minLength !== null ? `${filters.minLength}+ ft` : "Slip length";
  const moreCount = filters.amenities.size;

  const saveSearch = () => {
    try {
      localStorage.setItem(
        "boatgoat.savedSearch",
        JSON.stringify({
          mode,
          query,
          types: [...filters.types],
          amenities: [...filters.amenities],
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minLength: filters.minLength,
          savedAt: Date.now(),
        }),
      );
      onToast("Search saved — we'll watch for new slips.");
    } catch {
      onToast("Couldn't save your search in this browser.");
    }
  };

  return (
    <div className="filter-bar" ref={barRef}>
      <div className="search-box">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Marina del Rey, Long Beach, Newport…"
          aria-label="Search marinas"
        />
        {query ? (
          <button className="search-btn" aria-label="Clear search" onClick={() => onQueryChange("")}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
          </button>
        ) : (
          <button className="search-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <line x1="15.5" y1="15.5" x2="21" y2="21" />
            </svg>
          </button>
        )}
      </div>

      <div className="pill-wrap">
        <button className={"pill primary" + (open === "type" ? " open" : "")} onClick={() => toggle("type")}>
          {typeLabel} <span className="chev">▾</span>
        </button>
        {open === "type" && (
          <div className="dropdown pop-enter">
            <div className="dropdown-heading">Listing type</div>
            {TYPE_OPTIONS.map((o) => (
              <label className="check-row" key={o.value}>
                <input
                  type="checkbox"
                  checked={filters.types.has(o.value)}
                  onChange={() => toggleType(o.value)}
                />
                {o.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pill-wrap">
        <button className={"pill" + (open === "price" ? " open" : "") + (priceActive ? " active" : "")} onClick={() => toggle("price")}>
          {priceLabel} <span className="chev">▾</span>
        </button>
        {open === "price" && (
          <div className="dropdown pop-enter">
            <div className="dropdown-heading">{mode === "sale" ? "Sale price" : "Monthly price"}</div>
            <div className="range-section">
              <div className="range-values">
                <span>{minVal <= priceLo ? "$0" : money(minVal)}</span>
                <span>{maxVal >= priceHi ? "Any" : money(maxVal)}</span>
              </div>
              <div
                className="range"
                style={{ "--a": `${minPct}%`, "--b": `${maxPct}%` } as CSSProperties}
              >
                <div className="range-rail" />
                <div className="range-fill" />
                <input
                  type="range"
                  className="range-input"
                  min={priceLo}
                  max={priceHi}
                  step={priceStep}
                  value={minVal}
                  style={{ zIndex: minPct > 55 ? 6 : 4 }}
                  aria-label="Minimum price"
                  onChange={(e) => {
                    const v = Math.min(Number(e.target.value), maxVal);
                    onChange({ ...filters, minPrice: v <= priceLo ? null : v });
                  }}
                />
                <input
                  type="range"
                  className="range-input"
                  min={priceLo}
                  max={priceHi}
                  step={priceStep}
                  value={maxVal}
                  style={{ zIndex: 5 }}
                  aria-label="Maximum price"
                  onChange={(e) => {
                    const v = Math.max(Number(e.target.value), minVal);
                    onChange({ ...filters, maxPrice: v >= priceHi ? null : v });
                  }}
                />
              </div>
              {priceActive && (
                <button
                  className="clear-link"
                  onClick={() => onChange({ ...filters, minPrice: null, maxPrice: null })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pill-wrap">
        <button className={"pill" + (open === "length" ? " open" : "") + (filters.minLength !== null ? " active" : "")} onClick={() => toggle("length")}>
          {lengthLabel} <span className="chev">▾</span>
        </button>
        {open === "length" && (
          <div className="dropdown pop-enter">
            <div className="dropdown-heading">Minimum slip length</div>
            <div className="slider-section">
              <div className="slider-label">{filters.minLength !== null ? `${filters.minLength}+ ft` : "Any"}</div>
              <input
                type="range"
                className="length-slider"
                min={LENGTH_STOPS[0]}
                max={LENGTH_STOPS[LENGTH_STOPS.length - 1]}
                step="1"
                value={filters.minLength ?? LENGTH_STOPS[0]}
                style={
                  {
                    // Drives the value-following fill in CSS.
                    "--pct": `${
                      (((filters.minLength ?? LENGTH_STOPS[0]) - LENGTH_STOPS[0]) /
                        (LENGTH_STOPS[LENGTH_STOPS.length - 1] - LENGTH_STOPS[0])) *
                      100
                    }%`,
                  } as CSSProperties
                }
                onChange={(e) => onChange({ ...filters, minLength: Number(e.target.value) || null })}
              />
              <button className="clear-link" onClick={() => onChange({ ...filters, minLength: null })}>Clear</button>
            </div>
          </div>
        )}
      </div>

      <div className="pill-wrap">
        <button className={"pill" + (open === "more" ? " open" : "") + (moreCount ? " active" : "")} onClick={() => toggle("more")}>
          More{moreCount ? ` (${moreCount})` : ""} <span className="chev">▾</span>
        </button>
        {open === "more" && (
          <div className="dropdown more-dropdown pop-enter">
            <div className="dropdown-heading">Amenities</div>
            <div className="amenity-grid">
              {AMENITY_OPTIONS.map((a) => (
                <label className="check-row" key={a}>
                  <input
                    type="checkbox"
                    checked={filters.amenities.has(a)}
                    onChange={() => toggleAmenity(a)}
                  />
                  {a}
                </label>
              ))}
            </div>
            {moreCount > 0 && (
              <button
                className="clear-link"
                onClick={() => onChange({ ...filters, amenities: new Set() })}
              >
                Clear amenities
              </button>
            )}
          </div>
        )}
      </div>

      <div className="filter-spacer" />
      <button className="save-search" onClick={saveSearch}>Save search</button>
    </div>
  );
}
