import { useEffect, useRef, useState } from "react";
import type { ListingType } from "../data/listings";

export interface Filters {
  types: Set<ListingType>;
  minPrice: number | null;
  maxPrice: number | null;
  minLength: number | null;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "marina", label: "Marinas" },
  { value: "guest-dock", label: "Guest docks" },
  { value: "yacht-club", label: "Yacht clubs" },
];

const PRICE_STOPS = [0, 250, 500, 750, 1000, 1500, 2000, 3000];
const LENGTH_STOPS = [25, 30, 35, 40, 50, 60, 80, 100];

function usd(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export function FilterBar({ filters, onChange }: Props) {
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

  const toggleType = (t: ListingType) => {
    const next = new Set(filters.types);
    if (next.has(t)) {
      if (next.size > 1) next.delete(t);
    } else {
      next.add(t);
    }
    onChange({ ...filters, types: next });
  };

  const typeLabel =
    filters.types.size === TYPE_OPTIONS.length
      ? "All listings"
      : TYPE_OPTIONS.filter((o) => filters.types.has(o.value))
          .map((o) => o.label)
          .join(", ");

  const priceActive = filters.minPrice !== null || filters.maxPrice !== null;
  const priceLabel = priceActive
    ? `${filters.minPrice !== null ? usd(filters.minPrice) : "$0"}–${filters.maxPrice !== null ? usd(filters.maxPrice) : "Any"}`
    : "Price";

  const lengthLabel = filters.minLength !== null ? `${filters.minLength}+ ft` : "Slip length";

  return (
    <div className="filter-bar" ref={barRef}>
      <div className="search-box">
        <input defaultValue="Marina del Rey, CA" aria-label="Search location" />
        <button className="search-btn" aria-label="Search">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <line x1="15.5" y1="15.5" x2="21" y2="21" />
          </svg>
        </button>
      </div>

      <div className="pill-wrap">
        <button className={"pill primary" + (open === "type" ? " open" : "")} onClick={() => toggle("type")}>
          {typeLabel} <span className="chev">▾</span>
        </button>
        {open === "type" && (
          <div className="dropdown">
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
          <div className="dropdown">
            <div className="dropdown-heading">Monthly price</div>
            <div className="range-row">
              <select
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, minPrice: e.target.value === "" ? null : Number(e.target.value) })
                }
              >
                <option value="">No min</option>
                {PRICE_STOPS.map((p) => (
                  <option key={p} value={p}>{usd(p)}</option>
                ))}
              </select>
              <span className="range-dash">–</span>
              <select
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, maxPrice: e.target.value === "" ? null : Number(e.target.value) })
                }
              >
                <option value="">No max</option>
                {PRICE_STOPS.slice(1).map((p) => (
                  <option key={p} value={p}>{usd(p)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="pill-wrap">
        <button className={"pill" + (open === "length" ? " open" : "") + (filters.minLength !== null ? " active" : "")} onClick={() => toggle("length")}>
          {lengthLabel} <span className="chev">▾</span>
        </button>
        {open === "length" && (
          <div className="dropdown">
            <div className="dropdown-heading">Minimum slip length</div>
            <div className="length-grid">
              <button
                className={"length-opt" + (filters.minLength === null ? " sel" : "")}
                onClick={() => onChange({ ...filters, minLength: null })}
              >
                Any
              </button>
              {LENGTH_STOPS.map((ft) => (
                <button
                  key={ft}
                  className={"length-opt" + (filters.minLength === ft ? " sel" : "")}
                  onClick={() => onChange({ ...filters, minLength: ft })}
                >
                  {ft} ft
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="pill">More <span className="chev">▾</span></button>

      <div className="filter-spacer" />
      <button className="save-search">Save search</button>
    </div>
  );
}
