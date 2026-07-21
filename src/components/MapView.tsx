import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Listing } from "../data/listings";
import { marinaPhoto } from "../lib/photos";

const HARBOR_CENTER: [number, number] = [33.9762, -118.4505];
const HARBOR_ZOOM = 15;

interface Props {
  listings: Listing[];
  hoveredId: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function popupHtml(l: Listing): string {
  return `
    <div class="map-popup">
      <img src="${marinaPhoto(l.photoSeed)}" alt="" />
      <div class="map-popup-body">
        <div class="map-popup-price">${l.priceLabel}</div>
        <div class="map-popup-name">${l.name}</div>
        <div class="map-popup-meta">${
          l.type === "yacht-club"
            ? `${l.rateNote} · up to ${l.maxLengthFt} ft`
            : `${l.slipsOpen} slips open · up to ${l.maxLengthFt} ft`
        }</div>
      </div>
    </div>`;
}

export function MapView({ listings, hoveredId, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

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

    // The container can be 0x0 on first paint (stylesheet loads async in dev),
    // so recenter once real size arrives and on any later layout change.
    let sized = false;
    const ro = new ResizeObserver(() => {
      const el = containerRef.current;
      if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;
      map.invalidateSize();
      if (!sized) {
        sized = true;
        map.setView(HARBOR_CENTER, HARBOR_ZOOM);
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
      const icon = L.divIcon({
        className: "pin-anchor",
        html: `<div class="price-pin ${l.type}">${l.pinLabel}</div>`,
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
  }, [listings, onSelect]);

  // Card hover -> grow the matching pin.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()?.querySelector(".price-pin");
      if (!el) return;
      el.classList.toggle("hot", id === hoveredId);
      marker.setZIndexOffset(id === hoveredId ? 1000 : 0);
    });
  }, [hoveredId]);

  // Card click -> pan + open popup.
  useEffect(() => {
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    const map = mapRef.current;
    if (marker && map) {
      map.panTo(marker.getLatLng(), { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

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
