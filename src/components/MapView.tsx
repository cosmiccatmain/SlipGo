import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import type { Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";
import { getCachedPhoto, onEnrichmentReady } from "../lib/enrich";

const HARBOR_CENTER: [number, number] = [33.9762, -118.4505];
const HARBOR_ZOOM = 15;

interface Props {
  listings: Listing[];
  hoveredId: string | null;
  selectedId: string | null;
  selectNonce: number;
  /** Open the detail sidebar for a listing (also selects + flies to it). */
  onOpen: (id: string) => void;
}

function popupHtml(l: Listing): string {
  const est = getEstimate(l);
  const meta =
    l.mode === "sale"
      ? `${l.maxLengthFt} ft · deeded slip`
      : l.type === "yacht-club"
        ? `${l.rateNote} · up to ${l.maxLengthFt} ft`
        : `${l.slipsOpen} slips open · up to ${l.maxLengthFt} ft`;
  const photo = getCachedPhoto(l.id) ?? marinaPhoto(l.photoSeed);
  return `
    <div class="map-popup">
      <img src="${photo}" alt="" />
      <div class="map-popup-body">
        <div class="map-popup-top">
          <span class="map-popup-price">${l.priceLabel}</span>
          <span class="map-popup-rating">★ ${l.rating.toFixed(1)}</span>
        </div>
        <div class="map-popup-name">${l.name}</div>
        <div class="map-popup-hood">${l.neighborhood}</div>
        <div class="map-popup-meta">${meta}</div>
        <div class="map-popup-est">
          <span>Est. ${formatEstimate(l, est.fairValue)}</span>
          <span class="value-chip ${est.verdict}">${est.label}</span>
        </div>
      </div>
    </div>`;
}

export function MapView({ listings, hoveredId, selectedId, selectNonce, onOpen }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const listingsRef = useRef<Listing[]>(listings);
  const onOpenRef = useRef(onOpen);
  const sizedRef = useRef(false);
  hoveredRef.current = hoveredId;
  selectedRef.current = selectedId;
  listingsRef.current = listings;
  onOpenRef.current = onOpen;

  // Frame the map around exactly the listings currently shown.
  const fitToListings = useCallback(() => {
    const map = mapRef.current;
    const ls = listingsRef.current;
    if (!map || ls.length === 0) return;
    // A hidden map (e.g. mobile list view) has zero size — Leaflet math on it
    // produces NaN coordinates and throws, so bail until it's visible.
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    if (ls.length === 1) {
      map.setView([ls[0].lat, ls[0].lon], 15);
      return;
    }
    const bounds = L.latLngBounds(ls.map((l) => [l.lat, l.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 15 });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    map.setView(HARBOR_CENTER, HARBOR_ZOOM);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    ).addTo(map);
    mapRef.current = map;

    // The container can be 0x0 on first paint / when hidden behind the mobile
    // toggle. Fit to the listings once real size arrives, invalidate afterwards.
    const ro = new ResizeObserver(() => {
      const el = containerRef.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      map.invalidateSize();
      if (!sizedRef.current) {
        sizedRef.current = true;
        requestAnimationFrame(() => fitToListings());
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [fitToListings]);

  // Rebuild markers whenever the filtered listing set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    listings.forEach((l) => {
      const hot = l.id === hoveredRef.current ? " hot" : "";
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="price-pin ${l.type}${l.mode === "sale" ? " sale" : ""}${hot}">${l.pinLabel}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([l.lat, l.lon], { icon, riseOnHover: true })
        .addTo(map)
        .bindPopup(popupHtml(l), {
          closeButton: false,
          offset: [0, -34],
          minWidth: 260,
          maxWidth: 260,
          autoPan: false,
          className: "bg-popup",
        });
      // Hover previews the mini-card; click opens the full detail sidebar.
      marker.on("mouseover", () => marker.openPopup());
      marker.on("mouseout", () => marker.closePopup());
      marker.on("click", () => onOpenRef.current(l.id));
      markersRef.current.set(l.id, marker);
    });

    // The visible set just changed (filter / search / region) — reframe unless a
    // selection is active.
    if (!selectedRef.current && sizedRef.current) fitToListings();
  }, [listings, fitToListings]);

  // When a listing's real photo loads, refresh its popup so the illustration is
  // replaced (even while the popup is open).
  useEffect(() => {
    return onEnrichmentReady((id) => {
      const marker = markersRef.current.get(id);
      const l = listingsRef.current.find((x) => x.id === id);
      if (marker && l) marker.setPopupContent(popupHtml(l));
    });
  }, []);

  // Card hover -> grow the matching pin.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector(".price-pin");
      if (!el) return;
      el.classList.toggle("hot", id === hoveredId);
      marker.setZIndexOffset(id === hoveredId ? 1000 : 0);
    });
  }, [hoveredId]);

  // Card/pin selection -> fly to it. Depends on the nonce so re-selecting the
  // same listing still re-centers.
  useEffect(() => {
    if (!selectedId) return;
    const map = mapRef.current;
    const l = listingsRef.current.find((x) => x.id === selectedId);
    if (!map || !l) return;
    // Skip when the map is hidden/zero-size (mobile list view) — flyTo would
    // compute NaN coordinates and throw.
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    map.flyTo([l.lat, l.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selectNonce, selectedId]);

  return (
    <div className="map-shell">
      <div ref={containerRef} className="map-container" />
      <div className="map-legend">
        <span className="legend-item"><span className="legend-dot marina" /> Slips</span>
        <span className="legend-item"><span className="legend-dot guest-dock" /> Guest docks</span>
        <span className="legend-item"><span className="legend-dot yacht-club" /> Yacht clubs</span>
      </div>
    </div>
  );
}
