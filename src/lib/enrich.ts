import { useEffect, useState } from "react";
import type { Listing } from "../data/listings";

// ── Listing enrichment ───────────────────────────────────────────────────────
// Real data, fetched at view time:
//   • Wind      → Open-Meteo (keyless, called directly from the browser)
//   • Reviews / photos / AI summary → our own /api/enrich serverless function,
//     which holds the Google + OpenAI keys server-side. When those keys aren't
//     configured, the endpoint reports it and the UI degrades honestly.
// Nothing here fabricates data: a field is either real or shown as unavailable.

export interface WindInfo {
  avgKnots: number;
  peakKnots: number;
  /** Compass label the wind blows FROM, e.g. "WSW". */
  direction: string;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

export interface PlaceInfo {
  rating: number | null;
  reviewCount: number | null;
  reviews: Review[];
  /** Proxied photo URLs (served through /api/photo so the key stays hidden). */
  photos: string[];
}

export interface AiSummary {
  text: string;
  /** 0–100 overall score grounded in the fetched data. */
  score: number;
}

export interface ServerEnrichment {
  configured: { places: boolean; ai: boolean };
  place: PlaceInfo | null;
  summary: AiSummary | null;
}

const COMPASS = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function compass(deg: number): string {
  return COMPASS[Math.round(deg / 22.5) % 16];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

export async function fetchWind(lat: number, lon: number, signal?: AbortSignal): Promise<WindInfo | null> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat}&longitude=${lon}` +
    "&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
    "&wind_speed_unit=kn&past_days=31&forecast_days=1&timezone=America%2FLos_Angeles";

  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  const data = await res.json();
  const speeds: number[] = data?.hourly?.wind_speed_10m ?? [];
  const dirs: number[] = data?.hourly?.wind_direction_10m ?? [];
  const gusts: number[] = data?.hourly?.wind_gusts_10m ?? [];
  if (speeds.length === 0) return null;

  const valid = speeds.filter((s) => typeof s === "number");
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;

  const gustSorted = gusts.filter((g) => typeof g === "number").sort((a, b) => a - b);
  const peak = percentile(gustSorted, 95) || Math.max(...valid);

  // Speed-weighted mean of the wind-direction vectors → prevailing direction.
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < dirs.length; i++) {
    const d = dirs[i];
    const w = speeds[i];
    if (typeof d !== "number" || typeof w !== "number") continue;
    const rad = (d * Math.PI) / 180;
    sx += Math.sin(rad) * w;
    sy += Math.cos(rad) * w;
  }
  let meanDeg = (Math.atan2(sx, sy) * 180) / Math.PI;
  if (meanDeg < 0) meanDeg += 360;

  return {
    avgKnots: Math.round(avg),
    peakKnots: Math.round(peak),
    direction: compass(meanDeg),
  };
}

async function fetchServerEnrichment(l: Listing): Promise<ServerEnrichment | null> {
  const params = new URLSearchParams({
    id: l.id,
    name: l.name,
    address: l.address,
    lat: String(l.lat),
    lon: String(l.lon),
  });
  try {
    const res = await fetch(`/api/enrich?${params.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as ServerEnrichment;
  } catch {
    // No serverless backend reachable (e.g. plain `vite dev`) — degrade quietly.
    return null;
  }
}

// ── Cross-listing caches ─────────────────────────────────────────────────────
// Enrichment is expensive (paid Google/OpenAI calls) and shared, so we cache it
// per listing id for the session and de-dupe in-flight requests. Prefetching on
// hover means the detail view usually opens with real photos already decoded —
// no stock-image flash while the network catches up.
const serverCache = new Map<string, ServerEnrichment>();
const serverInflight = new Map<string, Promise<ServerEnrichment | null>>();
const windCache = new Map<string, WindInfo>();

// Listeners fired when a listing's server enrichment finishes caching, so views
// built from a string (e.g. the Leaflet map popup) can swap in the real photo.
type ReadyListener = (id: string) => void;
const readyListeners = new Set<ReadyListener>();

export function onEnrichmentReady(fn: ReadyListener): () => void {
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}

/** The best cached photo URL for a listing, or null if none is loaded yet. */
export function getCachedPhoto(id: string): string | null {
  return serverCache.get(id)?.place?.photos?.[0] ?? null;
}

function preloadImage(url?: string | null) {
  if (!url || typeof Image === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

/** Fetch (or reuse) server enrichment, caching the result and warming the hero photo. */
function loadServer(l: Listing): Promise<ServerEnrichment | null> {
  const hit = serverCache.get(l.id);
  if (hit) return Promise.resolve(hit);
  let inflight = serverInflight.get(l.id);
  if (!inflight) {
    inflight = fetchServerEnrichment(l)
      .then((res) => {
        if (res) {
          serverCache.set(l.id, res);
          res.place?.photos?.forEach(preloadImage);
          if (res.place?.photos?.length) readyListeners.forEach((fn) => fn(l.id));
        }
        serverInflight.delete(l.id);
        return res;
      })
      .catch(() => {
        serverInflight.delete(l.id);
        return null;
      });
    serverInflight.set(l.id, inflight);
  }
  return inflight;
}

/** Warm caches for a listing the user is likely about to open (e.g. on hover). */
export function prefetchEnrichment(l: Listing) {
  loadServer(l);
  if (!windCache.has(l.id)) {
    fetchWind(l.lat, l.lon)
      .then((w) => {
        if (w) windCache.set(l.id, w);
      })
      .catch(() => {});
  }
}

export interface EnrichmentState {
  windLoading: boolean;
  wind: WindInfo | null;
  serverLoading: boolean;
  server: ServerEnrichment | null;
}

export function useEnrichment(listing: Listing): EnrichmentState {
  // Seed synchronously from cache so a prefetched listing opens with zero flash.
  const [state, setState] = useState<EnrichmentState>(() => {
    const cw = windCache.get(listing.id) ?? null;
    const cs = serverCache.get(listing.id) ?? null;
    return { windLoading: !cw, wind: cw, serverLoading: !cs, server: cs };
  });

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const cw = windCache.get(listing.id) ?? null;
    const cs = serverCache.get(listing.id) ?? null;
    setState({ windLoading: !cw, wind: cw, serverLoading: !cs, server: cs });

    if (!cw) {
      fetchWind(listing.lat, listing.lon, ctrl.signal)
        .then((wind) => {
          if (wind) windCache.set(listing.id, wind);
          if (alive) setState((s) => ({ ...s, wind, windLoading: false }));
        })
        .catch(() => alive && setState((s) => ({ ...s, windLoading: false })));
    }

    if (!cs) {
      loadServer(listing).then((server) => {
        if (alive) setState((s) => ({ ...s, server, serverLoading: false }));
      });
    }

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [listing.id, listing.lat, listing.lon]);

  return state;
}
