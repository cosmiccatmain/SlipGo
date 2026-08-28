import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── /api/enrich ──────────────────────────────────────────────────────────────
// Server-side enrichment for a listing. Holds the API keys (Google Places,
// OpenAI) in environment variables so they are NEVER shipped to the browser.
//
//   GOOGLE_MAPS_API_KEY → real rating, reviews, and photos (Google Places API v1)
//   OPENAI_API_KEY      → a grounded summary + overall score of that real data
//   OPENAI_MODEL        → optional, defaults to gpt-4o-mini
//
// With no keys set, it returns { configured:{places:false, ai:false} } and the
// UI shows honest "connect a key" states — it never invents data.

interface Review {
  author: string;
  rating: number;
  text: string;
  relativeTime?: string;
}

interface PlaceInfo {
  rating: number | null;
  reviewCount: number | null;
  reviews: Review[];
  photos: string[];
  website: string | null;
}

async function fetchPlace(
  key: string,
  name: string,
  address: string,
  lat: number,
  lon: number,
): Promise<PlaceInfo | null> {
  const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.reviews,places.photos,places.websiteUri",
    },
    body: JSON.stringify({
      textQuery: `${name} ${address}`,
      maxResultCount: 1,
      locationBias: { circle: { center: { latitude: lat, longitude: lon }, radius: 4000 } },
    }),
  });
  if (!searchRes.ok) {
    // Surface *why* Google refused (bad key, referrer-restricted key used
    // server-side, Places not enabled, billing) — silently returning null here
    // is what made this impossible to diagnose from the outside.
    const body = await searchRes.text().catch(() => "");
    const reason = body.match(/"reason":\s*"([^"]+)"/)?.[1];
    throw new Error(`Places searchText ${searchRes.status}${reason ? ` — ${reason}` : ""}`);
  }
  const data = await searchRes.json();
  const place = data?.places?.[0];
  if (!place) return null;

  const reviews: Review[] = (place.reviews ?? []).slice(0, 5).map((r: any) => ({
    author: r?.authorAttribution?.displayName ?? "Google reviewer",
    rating: r?.rating ?? 0,
    text: r?.text?.text ?? r?.originalText?.text ?? "",
    relativeTime: r?.relativePublishTimeDescription,
  }));

  // Resolve up to 4 photo references to public googleusercontent URLs
  // (skipHttpRedirect returns the direct URI as JSON — no key exposed to client).
  const photoNames: string[] = (place.photos ?? []).slice(0, 4).map((p: any) => p.name);
  const photos: string[] = [];
  for (const pName of photoNames) {
    try {
      const pr = await fetch(
        `https://places.googleapis.com/v1/${pName}/media?maxWidthPx=900&skipHttpRedirect=true&key=${key}`,
      );
      if (pr.ok) {
        const pj = await pr.json();
        if (pj?.photoUri) photos.push(pj.photoUri);
      }
    } catch {
      /* skip a bad photo */
    }
  }

  return {
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    reviews,
    photos,
    website: place.websiteUri ?? null,
  };
}

async function fetchSummary(
  key: string,
  model: string,
  name: string,
  address: string,
  place: PlaceInfo | null,
): Promise<{ text: string; score: number } | null> {
  const facts = {
    name,
    address,
    googleRating: place?.rating ?? null,
    googleReviewCount: place?.reviewCount ?? null,
    reviews: (place?.reviews ?? []).map((r) => ({ rating: r.rating, text: r.text })),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You summarize a marina/boat-slip listing using ONLY the real data provided. " +
            "Never invent facts, amenities, or numbers. If the data is thin, say so plainly. " +
            'Respond as JSON: {"summary": string (max 55 words, neutral, useful to a boater), ' +
            '"score": integer 0-100 reflecting overall desirability given the data, or 50 if data is insufficient}.',
        },
        { role: "user", content: JSON.stringify(facts) },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 50)));
    const text = String(parsed.summary ?? "").trim();
    if (!text) return null;
    return { text, score };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const configured = { places: !!googleKey, ai: !!openaiKey };

  const name = String(req.query.name ?? "");
  const address = String(req.query.address ?? "");
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  let place: PlaceInfo | null = null;
  let placesError: string | null = null;
  if (googleKey && name && Number.isFinite(lat) && Number.isFinite(lon)) {
    try {
      place = await fetchPlace(googleKey, name, address, lat, lon);
    } catch (err) {
      place = null;
      placesError = err instanceof Error ? err.message : "unknown error";
    }
  }

  let summary: { text: string; score: number } | null = null;
  if (openaiKey && name) {
    try {
      summary = await fetchSummary(openaiKey, model, name, address, place);
    } catch {
      summary = null;
    }
  }

  // Cache successes at the CDN so we don't re-hit the paid APIs on every open.
  // Never cache a failure for a day: a key that gets fixed would otherwise keep
  // serving "no reviews" from the edge long after the fix landed.
  res.setHeader(
    "Cache-Control",
    placesError ? "s-maxage=60" : "s-maxage=86400, stale-while-revalidate=604800",
  );
  res.status(200).json({ configured, place, placesError, summary });
}
