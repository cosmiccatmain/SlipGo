import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import { allListings, REGIONS, type Listing, type Region } from "../data/listings";
import { marinaPhoto } from "../lib/photos";
import { getEstimate, formatEstimate } from "../lib/estimate";
import { getCachedPhoto, onEnrichmentReady, prefetchEnrichment } from "../lib/enrich";

const HARBOR_CENTER: [number, number] = [33.9762, -118.4505];
const HARBOR_ZOOM = 15;
// Below this zoom the coast-wide view collapses each harbor into one landmark
// circle; at or above it we show the individual price pins.
const CLUSTER_ZOOM = 12;

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

function clusterHtml(region: Region, count: number): string {
  const meta = REGIONS[region];
  const photo = getCachedPhoto(meta.flagshipId) ?? marinaPhoto(meta.photoSeed);
  const label = `${count} slip${count === 1 ? "" : "s"}`;
  return `
    <div class="region-cluster" style="background-image:url('${photo}')">
      <span class="region-scrim"></span>
      <span class="region-label">${meta.label}</span>
      <span class="region-count">${label}</span>
    </div>`;
}

export function MapView({ listings, hoveredId, selectedId, selectNonce, onOpen }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const pinMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const modeRef = useRef<"pins" | "clusters" | null>(null);
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
    if (ls.length === 1) {
      map.setView([ls[0].lat, ls[0].lon], 15);
      return;
    }
    const bounds = L.latLngBounds(ls.map((l) => [l.lat, l.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 15 });
  }, []);

  // Render either individual price pins or the region landmark circles,
  // depending on the current zoom.
  const render = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    pinMarkersRef.current.forEach((m) => m.remove());
    pinMarkersRef.current.clear();
    clusterMarkersRef.current.forEach((m) => m.remove());
    clusterMarkersRef.current = [];

    const ls = listingsRef.current;
    const mode = map.getZoom() < CLUSTER_ZOOM ? "clusters" : "pins";
    modeRef.current = mode;

    if (mode === "clusters") {
      const counts = new Map<Region, number>();
      ls.forEach((l) => counts.set(l.region, (counts.get(l.region) ?? 0) + 1));
      counts.forEach((count, region) => {
        const meta = REGIONS[region];
        const icon = L.divIcon({
          className: "cluster-anchor",
          html: clusterHtml(region, count),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker(meta.center, { icon, riseOnHover: true }).addTo(map);
        marker.on("click", () =>
          map.flyTo(meta.center, CLUSTER_ZOOM + 2, { duration: 0.7 }),
        );
        clusterMarkersRef.current.push(marker);
      });
      return;
    }

    ls.forEach((l) => {
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
      pinMarkersRef.current.set(l.id, marker);
    });
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

    // Swap pins <-> clusters when a zoom change crosses the threshold.
    map.on("zoomend", () => {
      const nextMode = map.getZoom() < CLUSTER_ZOOM ? "clusters" : "pins";
      if (nextMode !== modeRef.current) render();
    });

    // The container can be 0x0 on first paint / when hidden behind the mobile
    // toggle. Fit to the listings once real size arrives, invalidate afterwards.
    const ro = new ResizeObserver(() => {
      const el = containerRef.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      map.invalidateSize();
      if (!sizedRef.current) {
        sizedRef.current = true;
        // Defer one frame so the container has its final size before fitting.
        requestAnimationFrame(() => {
          fitToListings();
          render();
        });
      }
    });
    ro.observe(containerRef.current);

    // Warm each region's flagship photo so the landmark circles show real
    // imagery (cheap: one prefetch per region).
    Object.values(REGIONS).forEach((meta) => {
      const flagship = allListings.find((l) => l.id === meta.flagshipId);
      if (flagship) prefetchEnrichment(flagship);
    });

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [fitToListings, render]);

  // Rebuild the active layer whenever the filtered set changes, then reframe
  // (unless a selection popup should stay open).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    render();
    if (!selectedRef.current && sizedRef.current) fitToListings();
  }, [listings, render, fitToListings]);

  // When a listing's real photo loads, refresh the popup (pins) or the region
  // circles (clusters) so the illustration is replaced.
  useEffect(() => {
    return onEnrichmentReady((id) => {
      if (modeRef.current === "clusters") {
        render();
        return;
      }
      const marker = pinMarkersRef.current.get(id);
      const l = listingsRef.current.find((x) => x.id === id);
      if (marker && l) marker.setPopupContent(popupHtml(l));
    });
  }, [render]);

  // Card hover -> grow the matching pin (pins mode only).
  useEffect(() => {
    pinMarkersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector(".price-pin");
      if (!el) return;
      el.classList.toggle("hot", id === hoveredId);
      marker.setZIndexOffset(id === hoveredId ? 1000 : 0);
    });
  }, [hoveredId]);

  // Card/pin selection -> fly to the listing (zooming in past the cluster
  // threshold so its pin is visible). Depends on the nonce so re-selecting the
  // same listing still re-centers.
  useEffect(() => {
    if (!selectedId) return;
    const map = mapRef.current;
    const l = listingsRef.current.find((x) => x.id === selectedId);
    if (map && l) {
      map.flyTo([l.lat, l.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
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
