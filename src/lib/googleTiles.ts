/**
 * Google Map Tiles API (2D raster tiles) for the Leaflet map.
 *
 * Google's raster tiles are only licensed through the Map Tiles API, which
 * hands out a short-lived session token first and then serves tiles keyed to
 * it. Scraping mt0.google.com/vt tiles directly violates the terms, so we do
 * the session dance properly here.
 *
 * No key configured (or the request fails) -> callers fall back to Esri.
 */

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const SESSION_ENDPOINT = "https://tile.googleapis.com/v1/createSession";
const CACHE_KEY = "slipgo.gmap.session";

/**
 * Whitened roadmap styling, tuned to the app shell: white roads on a near-white
 * landscape, --border-light strokes, --muted labels, and a soft blue for water
 * so the harbour still reads. POI clutter is off so the price pins own the map.
 */
const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f7f9fb" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5a6b7b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e9edf1" }],
  },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#edf3ee" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#f2f5f8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e9edf1" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#dfe5ea" }],
  },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#dce9f6" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8aa4bd" }],
  },
];

interface CachedSession {
  session: string;
  /** ms epoch */
  expiry: number;
}

export function hasGoogleKey(): boolean {
  return Boolean(KEY);
}

function readCache(): string | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedSession;
    // Drop it a minute early so a token can't expire mid-pan.
    if (cached.expiry - 60_000 < Date.now()) return null;
    return cached.session;
  } catch {
    return null;
  }
}

function writeCache(session: string, expirySeconds: string) {
  try {
    const expiry = Number(expirySeconds) * 1000;
    if (!Number.isFinite(expiry)) return;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ session, expiry } satisfies CachedSession));
  } catch {
    /* private mode — just re-request next load */
  }
}

let inFlight: Promise<string | null> | null = null;

/** Session token for the styled roadmap, or null when unavailable. */
export function getGoogleSession(): Promise<string | null> {
  if (!KEY) return Promise.resolve(null);
  const cached = readCache();
  if (cached) return Promise.resolve(cached);
  if (inFlight) return inFlight;

  inFlight = fetch(`${SESSION_ENDPOINT}?key=${encodeURIComponent(KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mapType: "roadmap",
      language: "en-US",
      region: "US",
      imageFormat: "png",
      // 2x tiles render at 512px into a 256px slot — sharp on retina.
      scale: "scaleFactor2x",
      highDpi: true,
      styles: MAP_STYLE,
    }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`createSession ${res.status}`);
      const json = (await res.json()) as { session: string; expiry: string };
      writeCache(json.session, json.expiry);
      return json.session;
    })
    .catch((err) => {
      console.warn("[map] Google tiles unavailable, using fallback basemap:", err);
      return null;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function googleTileUrl(session: string): string {
  return `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session}&key=${KEY}`;
}
