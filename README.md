# 🐐 BoatGoat

Zillow-style search for boat slips, marinas, and yacht clubs.
MVP focused on **Marina del Rey, CA**.

## What's here

- **Accurate interactive map** — Leaflet + CARTO/OpenStreetMap tiles of the
  real Marina del Rey harbor. Listing coordinates were derived from an
  OpenStreetMap export of the harbor, so pins sit in their actual basins.
- **17 sample listings** — real marina, guest-dock, and yacht-club names with
  illustrative pricing (`src/data/listings.ts`).
- **Zillow-style UI** — top nav, search + filter pills (type / price / slip
  length), two-column card grid, price-pin map markers, hover sync between
  cards and pins, click-to-popup mini cards, and an Events dropdown.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

## Stack

Vite · React 19 · TypeScript · Leaflet · hand-rolled CSS (no UI framework).

## Next ideas

- Listing detail pages (photos, amenity list, slip-size price table)
- Real data ingestion + Supabase backend
- Saved searches / favorites persistence
- More harbors (Long Beach, Newport, San Diego)
