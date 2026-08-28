# SlipGo

## Environment variables

Client keys go in `.env.local` (git-ignored); server keys are set in Vercel
under Settings → Environment Variables. Every key is optional — each feature
degrades to a stated fallback without it.

### Client (bundled into the browser — must be referrer-restricted)

| Variable | Purpose | Without it |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Styled Google basemap via the Map Tiles API | Falls back to the Esri Light Gray basemap |
| `VITE_FBI_CRIME_API_KEY` | FBI Crime Data Explorer safety scores | Uses `DEMO_KEY` (30 requests/hour) |

Vite only exposes `VITE_`-prefixed variables, and it inlines them into the
bundle at **build time** — so changing one in Vercel needs a redeploy, not just
a save. Restrict this key by HTTP referrer and allow only the Map Tiles API.

### Server (never reaches the browser — must have NO application restriction)

| Variable | Purpose | Without it |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Google Places: real ratings, reviews, photos | Listings show no reviews |
| `OPENAI_API_KEY` | Grounded listing summaries | Listings show no AI summary |
| `OPENAI_MODEL` | Override the summary model | Defaults to `gpt-4o-mini` |

A server key must have **Application restrictions: None**. Server requests send
no `Referer` header, so a website-restricted key returns
`API_KEY_HTTP_REFERRER_BLOCKED` on every call.

## Boat photos

A boat card shows one image and one only: a photo its owner uploaded. Nothing
is searched for, generated, or borrowed — the pattern MarineTraffic and
FlightAware use, where the person who owns the photo supplies it.

Uploads go to the public `boat-photos` Supabase Storage bucket at
`<user_id>/<boat_id>.jpg`. Storage RLS keys on that first path segment, so a
user can only write inside their own folder; reads are public. The bucket caps
uploads at 5 MB and to JPEG/PNG/WebP — server-side, because the client checks
are bypassable.

`src/lib/boatPhotos.ts` downscales to 1400px and re-encodes as JPEG before
upload. That also strips EXIF, which matters here: phone photos carry GPS, and
a boat photo's location is where the boat lives.

Until a photo is uploaded the card shows the drawn placeholder from
`src/lib/boatArt.ts` — an SVG built from the boat's real length and rig, and
plainly an illustration rather than a photograph.

## Map

The map is Leaflet with Google's Map Tiles API (2D raster tiles) as the
basemap. Google issues a short-lived session token that carries the custom
style; `src/lib/googleTiles.ts` mints and caches it, and `MapView` swaps the
Esri fallback out once Google's first tiles paint.
