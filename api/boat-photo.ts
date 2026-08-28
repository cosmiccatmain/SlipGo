import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── /api/boat-photo ──────────────────────────────────────────────────────────
// Finds a real photograph of a boat model using the Google Custom Search JSON
// API in image mode. Returns the image URL plus where it came from, so the UI
// can credit and link the source.
//
//   GOOGLE_SEARCH_CX      → required. The Programmable Search Engine id.
//   GOOGLE_SEARCH_API_KEY → optional. Falls back to GOOGLE_MAPS_API_KEY, which
//                           is already the unrestricted server-side key.
//
// The key must have NO application restriction (a server sends no referrer) and
// must allow the Custom Search API.
//
// Cost: 100 queries/day free, then billed per thousand. Results are CDN-cached
// for 30 days per model, so a given boat costs one query and then nothing.

interface Photo {
  url: string;
  width: number;
  height: number;
  /** Page the image sits on — shown as the credit link. */
  sourcePage: string;
  /** Human-readable host, e.g. "yachtworld.com". */
  sourceName: string;
  title: string;
}

/** Model names are user text; keep only what appears in real boat names. */
function sanitizeModel(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 .\-/']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  const model = sanitizeModel(String(req.query.model ?? ""));
  const kind = String(req.query.kind ?? "") === "power" ? "yacht" : "sailboat";

  if (!key || !cx) {
    // Not configured — the client draws its placeholder instead. Reported
    // explicitly so it's distinguishable from "no photo exists".
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({ configured: false, photo: null });
    return;
  }
  if (!model) {
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(400).json({ configured: true, photo: null, error: "A model is required." });
    return;
  }

  const params = new URLSearchParams({
    key,
    cx,
    q: `${model} ${kind}`,
    searchType: "image",
    num: "5",
    imgSize: "large",
    imgType: "photo",
    safe: "active",
  });

  try {
    const r = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      const reason = body.match(/"reason":\s*"([^"]+)"/)?.[1];
      // Short cache on failure so a fixed key isn't shadowed by a stale error.
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json({
        configured: true,
        photo: null,
        error: `Image search ${r.status}${reason ? ` — ${reason}` : ""}`,
      });
      return;
    }

    const json = (await r.json()) as {
      items?: { link?: string; title?: string; image?: { width?: number; height?: number; contextLink?: string } }[];
    };

    // Prefer a landscape result — the card slot is 8:5, so a tall portrait
    // crops badly and usually shows a mast rather than a boat.
    const candidates = (json.items ?? []).filter((i) => i.link && i.image?.width && i.image?.height);
    const landscape = candidates.find((i) => (i.image!.width ?? 0) >= (i.image!.height ?? 0) * 1.2);
    const pick = landscape ?? candidates[0];

    if (!pick) {
      res.setHeader("Cache-Control", "public, s-maxage=86400");
      res.status(200).json({ configured: true, photo: null });
      return;
    }

    const photo: Photo = {
      url: pick.link!,
      width: pick.image!.width ?? 0,
      height: pick.image!.height ?? 0,
      sourcePage: pick.image!.contextLink ?? pick.link!,
      sourceName: hostOf(pick.image!.contextLink ?? pick.link!),
      title: pick.title ?? model,
    };

    // Stable for a given model, so cache hard and keep the query count down.
    res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=604800");
    res.status(200).json({ configured: true, photo });
  } catch (err) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({
      configured: true,
      photo: null,
      error: err instanceof Error ? err.message : "Image search failed.",
    });
  }
}
