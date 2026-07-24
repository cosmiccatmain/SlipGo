import { useCallback, useEffect, useMemo, useState } from "react";
import { Header, type NavKey, type View } from "./components/Header";
import { FilterBar, type Filters } from "./components/FilterBar";
import { ListingsPanel, type SortMode } from "./components/ListingsPanel";
import { MapView } from "./components/MapView";
import { SignInModal } from "./components/SignInModal";
import { Toast } from "./components/Toast";
import { ListingDetail } from "./components/ListingDetail";
import { TripsView } from "./components/TripsView";
import { EventsView } from "./components/EventsView";
import { PlansModal } from "./components/PlansModal";
import { BoatsModal } from "./components/BoatsModal";
import { useAuth } from "./lib/auth";
import { allListings, rentListings, saleListings, type ListingType, type ListingMode } from "./data/listings";

const ALL_TYPES: ListingType[] = ["marina", "guest-dock", "yacht-club"];

function allTypes() {
  return new Set<ListingType>(ALL_TYPES);
}

export default function App() {
  const [mode, setMode] = useState<ListingMode>("rent");
  const [filters, setFilters] = useState<Filters>({
    types: allTypes(),
    minPrice: null,
    maxPrice: null,
    minLength: null,
    amenities: new Set<string>(),
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectNonce, setSelectNonce] = useState(0);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [signInOpen, setSignInOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [view, setView] = useState<View>("search");
  const [plansOpen, setPlansOpen] = useState(false);
  const [boatsOpen, setBoatsOpen] = useState(false);
  const [askBoatsNext, setAskBoatsNext] = useState(false);
  const { justSignedUp, clearJustSignedUp } = useAuth();

  // First authenticated visit: pick a plan, then add your boats.
  useEffect(() => {
    if (justSignedUp) {
      setPlansOpen(true);
      setAskBoatsNext(true);
      clearJustSignedUp();
    }
  }, [justSignedUp, clearJustSignedUp]);

  const closePlans = useCallback(() => {
    setPlansOpen(false);
    if (askBoatsNext) {
      setAskBoatsNext(false);
      setBoatsOpen(true);
    }
  }, [askBoatsNext]);

  // Which top-nav item is highlighted, derived from mode + type filter.
  const activeNav: NavKey = useMemo(() => {
    if (mode === "sale") return "buy";
    if (filters.types.size === 1 && filters.types.has("guest-dock")) return "guest";
    if (filters.types.size === 1 && filters.types.has("yacht-club")) return "yacht";
    return "rent";
  }, [mode, filters.types]);

  const handleNav = useCallback((key: NavKey) => {
    setView("search");
    setSelectedId(null);
    setMobileView("list");
    setFilters((f) => ({ ...f, minPrice: null, maxPrice: null }));
    switch (key) {
      case "rent":
        setMode("rent");
        setFilters((f) => ({ ...f, types: allTypes() }));
        break;
      case "buy":
        setMode("sale");
        setFilters((f) => ({ ...f, types: new Set<ListingType>(["marina"]) }));
        break;
      case "guest":
        setMode("rent");
        setFilters((f) => ({ ...f, types: new Set<ListingType>(["guest-dock"]) }));
        break;
      case "yacht":
        setMode("rent");
        setFilters((f) => ({ ...f, types: new Set<ListingType>(["yacht-club"]) }));
        break;
    }
  }, []);

  const source = mode === "sale" ? saleListings : rentListings;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = source.filter((l) => {
      if (!filters.types.has(l.type)) return false;
      if (filters.minPrice !== null && l.sortPrice < filters.minPrice) return false;
      if (filters.maxPrice !== null && l.sortPrice > filters.maxPrice) return false;
      if (filters.minLength !== null && l.maxLengthFt < filters.minLength) return false;
      if (filters.amenities.size > 0) {
        for (const a of filters.amenities) if (!l.amenities.includes(a)) return false;
      }
      if (q && !(`${l.name} ${l.address} ${l.neighborhood}`.toLowerCase().includes(q))) return false;
      return true;
    });
    if (sort === "price-asc") filtered.sort((a, b) => a.sortPrice - b.sortPrice);
    if (sort === "price-desc") filtered.sort((a, b) => b.sortPrice - a.sortPrice);
    return filtered;
  }, [source, filters, sort, query]);

  // Clicking a card opens the deeper detail view (and selects it on the map).
  const openDetail = useCallback((id: string) => {
    setSelectedId(id);
    setSelectNonce((n) => n + 1);
    setDetailId(id);
  }, []);

  const detailListing = detailId ? allListings.find((l) => l.id === detailId) ?? null : null;

  return (
    <div className={"app" + (mobileView === "map" ? " app--mobile-map" : "")}>
      <Header
        activeNav={activeNav}
        onNav={handleNav}
        view={view}
        onView={setView}
        onPricing={() => setPlansOpen(true)}
        onBoats={() => setBoatsOpen(true)}
        onSignIn={() => setSignInOpen(true)}
        onToast={setToast}
      />
      {view === "trips" ? (
        <main className="trips-main">
          <TripsView />
        </main>
      ) : view === "events" ? (
        <main className="trips-main">
          <EventsView />
        </main>
      ) : (
        <>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            query={query}
            onQueryChange={setQuery}
            mode={mode}
            onToast={setToast}
          />
          <main className="split">
            <MapView
              listings={visible}
              hoveredId={hoveredId}
              selectedId={selectedId}
              selectNonce={selectNonce}
              onOpen={openDetail}
            />
            <ListingsPanel
              listings={visible}
              mode={mode}
              sort={sort}
              onSortChange={setSort}
              selectedId={selectedId}
              onHover={setHoveredId}
              onOpen={openDetail}
            />
            {detailListing && (
              <ListingDetail listing={detailListing} onClose={() => setDetailId(null)} />
            )}
          </main>

          <button
            className="mobile-toggle"
            onClick={() => setMobileView((v) => (v === "map" ? "list" : "map"))}
          >
            {mobileView === "map" ? (
              <>
                <span aria-hidden="true">☰</span> List
              </>
            ) : (
              <>
                <span aria-hidden="true">▦</span> Map
              </>
            )}
          </button>
        </>
      )}

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      <PlansModal open={plansOpen} onClose={closePlans} onToast={setToast} />
      <BoatsModal open={boatsOpen} onClose={() => setBoatsOpen(false)} onToast={setToast} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
