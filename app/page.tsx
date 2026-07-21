"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

type Marina = {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
  price: number;
  priceLabel: string;
  slipRange: string;
  maxLength: number;
  availability: string;
  yachtClub: boolean;
  events: boolean;
  eventLabel: string;
  amenities: string[];
  accent: string;
};

const marinas: Marina[] = [
  {
    id: "mdr-marina",
    name: "Marina del Rey Marina",
    basin: "Basin D",
    lat: 33.9761,
    lon: -118.4524,
    price: 1150,
    priceLabel: "$1,150/mo",
    slipRange: "25–70 ft slips",
    maxLength: 70,
    availability: "3 slips listed",
    yachtClub: false,
    events: true,
    eventLabel: "Dockside social · Aug 2",
    amenities: ["Shore power", "Showers", "Parking"],
    accent: "D",
  },
  {
    id: "dolphin",
    name: "Dolphin Marina",
    basin: "Basin E",
    lat: 33.978561,
    lon: -118.449995,
    price: 1480,
    priceLabel: "$1,480/mo",
    slipRange: "30–65 ft slips",
    maxLength: 65,
    availability: "Limited availability",
    yachtClub: false,
    events: false,
    eventLabel: "No events posted",
    amenities: ["Fuel nearby", "Laundry", "Security"],
    accent: "E",
  },
  {
    id: "cyc",
    name: "California Yacht Club",
    basin: "Basin F",
    lat: 33.983142,
    lon: -118.445946,
    price: 2200,
    priceLabel: "$2,200/mo",
    slipRange: "30–100+ ft slips",
    maxLength: 110,
    availability: "Membership inquiry",
    yachtClub: true,
    events: true,
    eventLabel: "Sunset racing · Wed",
    amenities: ["Dining", "Pool", "Racing"],
    accent: "F",
  },
  {
    id: "pacific-mariners",
    name: "Pacific Mariners Yacht Club",
    basin: "Basin D",
    lat: 33.979403,
    lon: -118.452275,
    price: 1325,
    priceLabel: "$1,325/mo",
    slipRange: "25–55 ft slips",
    maxLength: 55,
    availability: "Join waitlist",
    yachtClub: true,
    events: true,
    eventLabel: "Member sail · Jul 27",
    amenities: ["Clubhouse", "Racing", "Guest dock"],
    accent: "D",
  },
  {
    id: "windjammers",
    name: "Windjammers Yacht Club",
    basin: "Basin E",
    lat: 33.977757,
    lon: -118.445115,
    price: 980,
    priceLabel: "$980/mo",
    slipRange: "24–45 ft slips",
    maxLength: 45,
    availability: "Contact club",
    yachtClub: true,
    events: true,
    eventLabel: "Cruise-out · Aug 9",
    amenities: ["Clubhouse", "Sailing", "Social"],
    accent: "E",
  },
  {
    id: "bluewater",
    name: "Bluewater Sailing",
    basin: "Basin F",
    lat: 33.981844,
    lon: -118.443177,
    price: 760,
    priceLabel: "$760/mo",
    slipRange: "22–42 ft slips",
    maxLength: 42,
    availability: "2 spaces listed",
    yachtClub: false,
    events: true,
    eventLabel: "Sailing clinic · Sat",
    amenities: ["Lessons", "Charters", "Parking"],
    accent: "F",
  },
  {
    id: "wayfarer",
    name: "Wayfarer Marina",
    basin: "Basin B",
    lat: 33.9772,
    lon: -118.4562,
    price: 1650,
    priceLabel: "$1,650/mo",
    slipRange: "30–85 ft slips",
    maxLength: 85,
    availability: "4 slips listed",
    yachtClub: false,
    events: false,
    eventLabel: "No events posted",
    amenities: ["Pool", "Gym", "Shore power"],
    accent: "B",
  },
  {
    id: "marina-city",
    name: "Marina City Club",
    basin: "Basin A",
    lat: 33.9841,
    lon: -118.4533,
    price: 2400,
    priceLabel: "$2,400/mo",
    slipRange: "35–120 ft slips",
    maxLength: 120,
    availability: "Contact for availability",
    yachtClub: true,
    events: true,
    eventLabel: "Harbor mixer · Aug 1",
    amenities: ["Fitness", "Dining", "Valet"],
    accent: "A",
  },
  {
    id: "burton-chace",
    name: "Burton Chace Visitor Dock",
    basin: "Basin H",
    lat: 33.9779,
    lon: -118.4477,
    price: 420,
    priceLabel: "$420/wk",
    slipRange: "Guest slips to 70 ft",
    maxLength: 70,
    availability: "Reservations requested",
    yachtClub: false,
    events: true,
    eventLabel: "Summer concert · Thu",
    amenities: ["Visitor dock", "Park", "WaterBus"],
    accent: "H",
  },
  {
    id: "del-rey-landing",
    name: "Del Rey Landing",
    basin: "Entrance Channel",
    lat: 33.9698,
    lon: -118.4515,
    price: 1890,
    priceLabel: "$1,890/mo",
    slipRange: "35–90 ft slips",
    maxLength: 90,
    availability: "1 slip listed",
    yachtClub: false,
    events: false,
    eventLabel: "No events posted",
    amenities: ["Fuel", "Pump-out", "Market"],
    accent: "C",
  },
  {
    id: "tahiti",
    name: "Tahiti Marina",
    basin: "Basin B",
    lat: 33.9739,
    lon: -118.4575,
    price: 1025,
    priceLabel: "$1,025/mo",
    slipRange: "25–50 ft slips",
    maxLength: 50,
    availability: "Call for openings",
    yachtClub: false,
    events: false,
    eventLabel: "No events posted",
    amenities: ["Laundry", "Showers", "Parking"],
    accent: "B",
  },
  {
    id: "esprit",
    name: "Esprit Marina",
    basin: "Basin F",
    lat: 33.981,
    lon: -118.4481,
    price: 1550,
    priceLabel: "$1,550/mo",
    slipRange: "30–75 ft slips",
    maxLength: 75,
    availability: "2 slips listed",
    yachtClub: false,
    events: true,
    eventLabel: "Open house · Jul 30",
    amenities: ["Security", "Shore power", "Wi-Fi"],
    accent: "F",
  },
];

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return replacements[character];
  });
}

export default function Home() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("any");
  const [length, setLength] = useState("any");
  const [amenity, setAmenity] = useState("any");
  const [clubOnly, setClubOnly] = useState(false);
  const [eventsOnly, setEventsOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState("recommended");
  const [selectedId, setSelectedId] = useState(marinas[0].id);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = window.localStorage.getItem("boatgoat-saved");
    if (stored) {
      try {
        setSaved(new Set(JSON.parse(stored) as string[]));
      } catch {
        window.localStorage.removeItem("boatgoat-saved");
      }
    }
  }, []);

  const filteredMarinas = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = marinas.filter((marina) => {
      const matchesQuery =
        !normalizedQuery ||
        [marina.name, marina.basin, ...marina.amenities]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesPrice = price === "any" || marina.price <= Number(price);
      const matchesLength =
        length === "any" || marina.maxLength >= Number(length);
      const matchesAmenity =
        amenity === "any" ||
        marina.amenities.some((item) =>
          item.toLowerCase().includes(amenity.toLowerCase()),
        );
      return (
        matchesQuery &&
        matchesPrice &&
        matchesLength &&
        matchesAmenity &&
        (!clubOnly || marina.yachtClub) &&
        (!eventsOnly || marina.events) &&
        (!savedOnly || saved.has(marina.id))
      );
    });

    if (sort === "price-low") return [...results].sort((a, b) => a.price - b.price);
    if (sort === "length-high")
      return [...results].sort((a, b) => b.maxLength - a.maxLength);
    return results;
  }, [query, price, length, amenity, clubOnly, eventsOnly, savedOnly, saved, sort]);

  const selected =
    marinas.find((marina) => marina.id === selectedId) ?? filteredMarinas[0];

  useEffect(() => {
    let disposed = false;

    import("leaflet").then((L) => {
      if (disposed || !mapElementRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: [33.9777, -118.4512],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!mapReady || !L || !layer) return;

    layer.clearLayers();
    filteredMarinas.forEach((marina) => {
      const isSelected = marina.id === selectedId;
      const marker = L.marker([marina.lat, marina.lon], {
        icon: L.divIcon({
          className: "boatgoat-marker-wrap",
          html: `<span class="boatgoat-marker${isSelected ? " is-selected" : ""}">${escapeHtml(marina.priceLabel)}</span>`,
          iconSize: [92, 38],
          iconAnchor: [46, 19],
        }),
        title: `${marina.name}, sample price ${marina.priceLabel}`,
      });
      marker.on("click", () => {
        setSelectedId(marina.id);
        setMobileView("map");
      });
      marker.addTo(layer);
    });
  }, [filteredMarinas, selectedId, mapReady]);

  useEffect(() => {
    if (!mapReady || !selected || !mapRef.current) return;
    mapRef.current.panTo([selected.lat, selected.lon], { animate: true });
  }, [selected, mapReady]);

  useEffect(() => {
    if (mobileView !== "map" || !mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      if (selected) map.setView([selected.lat, selected.lon], map.getZoom(), { animate: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileView, mapReady, selected]);

  const toggleSaved = (id: string) => {
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      window.localStorage.setItem("boatgoat-saved", JSON.stringify([...next]));
      return next;
    });
  };

  const resetFilters = () => {
    setQuery("");
    setPrice("any");
    setLength("any");
    setAmenity("any");
    setClubOnly(false);
    setEventsOnly(false);
    setSavedOnly(false);
  };

  const selectMarina = (marina: Marina, openDetails = false) => {
    setSelectedId(marina.id);
    if (openDetails) setDetailsOpen(true);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={resetFilters} aria-label="BoatGoat home">
          <span className="brand-mark" aria-hidden="true">BG</span>
          <span>boatgoat</span>
        </button>

        <form className="search" onSubmit={(event) => event.preventDefault()}>
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="marina-search">Search marinas</label>
          <input
            id="marina-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Marina, basin, or amenity"
          />
          <button type="submit">Search</button>
        </form>

        <nav className="primary-nav" aria-label="Main navigation">
          <button type="button" onClick={resetFilters}>Marinas</button>
          <button type="button" aria-pressed={clubOnly} onClick={() => setClubOnly((value) => !value)}>Yacht clubs</button>
          <button type="button" aria-pressed={eventsOnly} onClick={() => setEventsOnly((value) => !value)}>Events</button>
          <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly((value) => !value)}>Saved <span>{saved.size}</span></button>
        </nav>
      </header>

      <section className="filterbar" aria-label="Marina filters">
        <select aria-label="Maximum sample price" value={price} onChange={(event) => setPrice(event.target.value)}>
          <option value="any">Any price</option>
          <option value="1000">Up to $1,000</option>
          <option value="1500">Up to $1,500</option>
          <option value="2000">Up to $2,000</option>
          <option value="2500">Up to $2,500</option>
        </select>
        <select aria-label="Boat length" value={length} onChange={(event) => setLength(event.target.value)}>
          <option value="any">Any boat length</option>
          <option value="40">40+ ft</option>
          <option value="60">60+ ft</option>
          <option value="80">80+ ft</option>
          <option value="100">100+ ft</option>
        </select>
        <select aria-label="Amenity" value={amenity} onChange={(event) => setAmenity(event.target.value)}>
          <option value="any">All amenities</option>
          <option value="power">Shore power</option>
          <option value="fuel">Fuel</option>
          <option value="dining">Dining</option>
          <option value="parking">Parking</option>
          <option value="racing">Racing</option>
        </select>
        <button className={clubOnly ? "filter-chip active" : "filter-chip"} type="button" aria-pressed={clubOnly} onClick={() => setClubOnly((value) => !value)}>Yacht club</button>
        <button className={eventsOnly ? "filter-chip active" : "filter-chip"} type="button" aria-pressed={eventsOnly} onClick={() => setEventsOnly((value) => !value)}>Upcoming events</button>
        <button className="reset-button" type="button" onClick={resetFilters}>Reset</button>
        <div className="mobile-switch" role="group" aria-label="Choose view">
          <button className={mobileView === "list" ? "active" : ""} type="button" onClick={() => setMobileView("list")}>List</button>
          <button className={mobileView === "map" ? "active" : ""} type="button" onClick={() => setMobileView("map")}>Map</button>
        </div>
      </section>

      <div className="disclaimer">
        <strong>MVP sample data</strong>
        <span>Prices, availability, and events are examples—contact each marina to verify.</span>
      </div>

      <section className="marketplace">
        <section className={`results-panel ${mobileView === "map" ? "mobile-hidden" : ""}`} aria-label="Marina listings">
          <div className="results-heading">
            <div>
              <p className="eyebrow">MARINA DEL REY, CALIFORNIA</p>
              <h1>Marinas & yacht clubs</h1>
              <p>{filteredMarinas.length} places match your search</p>
            </div>
            <label>
              <span className="sr-only">Sort results</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="length-high">Largest slips</option>
              </select>
            </label>
          </div>

          {filteredMarinas.length ? (
            <div className="listing-grid">
              {filteredMarinas.map((marina) => {
                const isSelected = marina.id === selectedId;
                const isSaved = saved.has(marina.id);
                return (
                  <article
                    className={`listing-card${isSelected ? " selected" : ""}`}
                    key={marina.id}
                    onMouseEnter={() => setSelectedId(marina.id)}
                  >
                    <button className="card-main" type="button" onClick={() => selectMarina(marina, true)}>
                      <span className="basin-tile" aria-hidden="true">
                        <strong>{marina.accent}</strong>
                        <small>{marina.basin}</small>
                      </span>
                      <span className="card-copy">
                        <span className="card-topline">
                          <span className="availability-dot" aria-hidden="true" />
                          {marina.availability}
                        </span>
                        <strong className="price">{marina.priceLabel}</strong>
                        <span className="estimate-label">Sample estimate</span>
                        <span className="marina-name">{marina.name}</span>
                        <span className="marina-meta">{marina.slipRange} · {marina.basin}</span>
                        <span className="amenity-list">{marina.amenities.slice(0, 3).join(" · ")}</span>
                        {marina.events && <span className="event-row">◷ {marina.eventLabel}</span>}
                      </span>
                    </button>
                    <button className={`save-button${isSaved ? " saved" : ""}`} type="button" onClick={() => toggleSaved(marina.id)} aria-label={`${isSaved ? "Remove" : "Save"} ${marina.name}`} aria-pressed={isSaved}>{isSaved ? "♥" : "♡"}</button>
                    {marina.yachtClub && <span className="club-badge">Yacht club</span>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">⚓</span>
              <h2>No matches yet</h2>
              <p>Try a higher price or remove a filter.</p>
              <button type="button" onClick={resetFilters}>Clear all filters</button>
            </div>
          )}
        </section>

        <section className={`map-panel ${mobileView === "list" ? "mobile-hidden" : ""}`} aria-label="Interactive OpenStreetMap of Marina del Rey">
          <div ref={mapElementRef} className="map-canvas" />
          <div className="map-label">OpenStreetMap · Marina del Rey</div>
          {selected && filteredMarinas.some((marina) => marina.id === selected.id) && (
            <article className="map-card">
              <div>
                <span>{selected.basin}</span>
                <strong>{selected.name}</strong>
                <small>{selected.priceLabel} sample · {selected.slipRange}</small>
              </div>
              <button type="button" onClick={() => setDetailsOpen(true)}>View</button>
            </article>
          )}
        </section>
      </section>

      {detailsOpen && selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDetailsOpen(false)}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setDetailsOpen(false)} aria-label="Close details">×</button>
            <p className="eyebrow">{selected.basin} · MARINA DEL REY</p>
            <h2 id="detail-title">{selected.name}</h2>
            <div className="detail-price">
              <strong>{selected.priceLabel}</strong>
              <span>Sample estimate—not a live quote</span>
            </div>
            <div className="detail-facts">
              <div><span>Slip sizes</span><strong>{selected.slipRange}</strong></div>
              <div><span>Availability</span><strong>{selected.availability}</strong></div>
              <div><span>Type</span><strong>{selected.yachtClub ? "Yacht club" : "Marina"}</strong></div>
            </div>
            <h3>Amenities</h3>
            <div className="detail-amenities">{selected.amenities.map((item) => <span key={item}>{item}</span>)}</div>
            <h3>What’s happening</h3>
            <p>{selected.eventLabel}</p>
            <div className="modal-actions">
              <button className="secondary-action" type="button" onClick={() => toggleSaved(selected.id)}>{saved.has(selected.id) ? "Saved ♥" : "Save marina ♡"}</button>
              <a className="primary-action" href={`mailto:?subject=${encodeURIComponent(`BoatGoat inquiry: ${selected.name}`)}`}>Request information</a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
