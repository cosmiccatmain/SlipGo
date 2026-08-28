# SlipGo

## Environment variables

Create a `.env.local` in the project root (it is git-ignored). Both keys are
optional — the app degrades gracefully without them.

| Variable | Purpose | Without it |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Styled Google basemap via the Map Tiles API | Falls back to the Esri Light Gray basemap |
| `VITE_FBI_CRIME_API_KEY` | FBI Crime Data Explorer safety scores | Uses `DEMO_KEY` (30 requests/hour) |

```
VITE_GOOGLE_MAPS_API_KEY=your-key-here
```

Vite only exposes variables prefixed with `VITE_`, and they are **bundled into
the client**, so restrict the Google key by HTTP referrer in Google Cloud
Console and enable only the **Map Tiles API** on it.

For deploys, add the same variables in Vercel under Settings → Environment
Variables, then redeploy.

## Map

The map is Leaflet with Google's Map Tiles API (2D raster tiles) as the
basemap. Google issues a short-lived session token that carries the custom
style; `src/lib/googleTiles.ts` mints and caches it, and `MapView` swaps the
Esri fallback out once Google's first tiles paint.
