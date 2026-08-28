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
| `GOOGLE_SEARCH_CX` | Programmable Search Engine id for boat photos | Boat cards show the drawn placeholder |
| `GOOGLE_SEARCH_API_KEY` | Key for the Custom Search API | Falls back to `GOOGLE_MAPS_API_KEY` |
| `OPENAI_API_KEY` | Grounded listing summaries | Listings show no AI summary |
| `OPENAI_MODEL` | Override the summary model | Defaults to `gpt-4o-mini` |

A server key must have **Application restrictions: None**. Server requests send
no `Referer` header, so a website-restricted key returns
`API_KEY_HTTP_REFERRER_BLOCKED` on every call.

## Boat photos

Boat cards show a real photograph of the make/model the owner entered, found
through the Google Custom Search JSON API in image mode (`api/boat-photo.ts`)
and credited back to the page it came from.

To enable it:

1. Create a search engine at <https://programmablesearchengine.google.com/> —
   turn **Image search** on and **Search the entire web** on.
2. Copy its **Search engine ID** into `GOOGLE_SEARCH_CX` in Vercel.
3. Enable the **Custom Search API** on whichever key you point at it.

Custom Search allows 100 queries/day free, then bills per thousand. Results are
CDN-cached per model for 30 days and de-duplicated in the browser, so a given
model costs one query however many boats reference it.

**These are third-party images.** They are hotlinked, not copied, and each
carries a visible credit linking to its source page, but they are not licensed
to SlipGo. Before this is a commercial product, either license the imagery, let
owners upload their own photo, or fall back to the drawn placeholder.

Without a model, without configuration, or when nothing is found, the card
shows the placeholder from `src/lib/boatArt.ts` — an SVG drawn from the boat's
real length and rig, never presented as a photograph of the boat.

## Map

The map is Leaflet with Google's Map Tiles API (2D raster tiles) as the
basemap. Google issues a short-lived session token that carries the custom
style; `src/lib/googleTiles.ts` mints and caches it, and `MapView` swaps the
Esri fallback out once Google's first tiles paint.
