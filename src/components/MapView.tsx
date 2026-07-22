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
  onSelect: (id: string) => void;
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

export function MapView({ listings, hoveredId, selectedId, selectNonce, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const listingsRef = useRef<Listing[]>(listings);
  const sizedRef = useRef(false);
  hoveredRef.current = hoveredId;
  selectedRef.current = selectedId;
  listingsRef.current = listings;

  // Frame the map around exactly the listings currently shown, so the pins
  // always make it obvious which harbor each slip is in.
  const fitToListings = useCallback(() => {
    const map = mapRef.current;
    const ls = listingsRef.current;
    if (!map || ls.length === 0) return;
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
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
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
        // Defer one frame so the container has its final size before fitting
        // (avoids a transient over-zoom when the mobile map first appears).
        requestAnimationFrame(() => fitToListings());
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
          closeButton: true,
          offset: [0, -34],
          minWidth: 260,
          maxWidth: 260,
          className: "bg-popup",
        });
      marker.on("click", () => onSelect(l.id));
      markersRef.current.set(l.id, marker);
    });

    // Keep the current selection's popup open after a rebuild; otherwise the
    // visible set just changed (filter / search / region), so reframe the map.
    if (selectedRef.current) {
      markersRef.current.get(selectedRef.current)?.openPopup();
    } else if (sizedRef.current) {
      fitToListings();
    }
  }, [listings, onSelect, fitToListings]);

  // When a listing's real photo finishes loading, refresh its popup so the
  // stock illustration is replaced (even while the popup is open).
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

  // Card/pin click -> fly to it + open popup. Depends on the nonce so
  // re-selecting the same listing still re-centers and reopens.
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    const map = mapRef.current;
    if (marker && map) {
      map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 15), { duration: 0.6 });
      marker.openPopup();
    }
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
