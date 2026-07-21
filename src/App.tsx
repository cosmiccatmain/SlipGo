import { useCallback, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { FilterBar, type Filters } from "./components/FilterBar";
import { ListingsPanel, type SortMode } from "./components/ListingsPanel";
import { MapView } from "./components/MapView";
import { listings } from "./data/listings";

export default function App() {
  const [filters, setFilters] = useState<Filters>({
    types: new Set(["marina", "guest-dock", "yacht-club"]),
    minPrice: null,
    maxPrice: null,
    minLength: null,
  });
  const [sort, setSort] = useState<SortMode>("featured");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const filtered = listings.filter((l) => {
      if (!filters.types.has(l.type)) return false;
      if (filters.minPrice !== null && l.sortPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && l.sortPrice > filters.maxPrice) return false;
      if (filters.minLength !== null && l.maxLengthFt < filters.minLength) return false;
      return true;
    });
    if (sort === "price-asc") filtered.sort((a, b) => a.sortPrice - b.sortPrice);
    if (sort === "price-desc") filtered.sort((a, b) => b.sortPrice - a.sortPrice);
    return filtered;
  }, [filters, sort]);

  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <div className="app">
      <Header />
      <FilterBar filters={filters} onChange={setFilters} />
      <main className="split">
        <MapView
          listings={visible}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
        <ListingsPanel
          listings={visible}
          sort={sort}
          onSortChange={setSort}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={handleSelect}
        />
      </main>
    </div>
  );
}
