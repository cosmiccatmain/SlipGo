import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── /api/boat-image ──────────────────────────────────────────────────────────
// Renders a clean portrait of a boat from its make/model and dimensions, using
// the OpenAI image API. Streams PNG bytes so the client can use it as a plain
// <img src> — the browser and Vercel's CDN do the caching, and no key or
// base64 payload ever reaches the browser.
//
//   OPENAI_API_KEY    → required; without it this 404s and the client falls
//                       back to the local SVG portrait.
//   OPENAI_IMAGE_MODEL → optional, defaults to gpt-image-1.
//
// IMPORTANT: every miss costs money at OpenAI. Three things keep that bounded:
//   1. The prompt is *assembled here* from validated fields — the caller can
//      never supply free-form prompt text.
//   2. Results are CDN-cached for 30 days, keyed by the query string, so a
//      given boat renders once and is then served from the edge.
//   3. Inputs are length-capped and character-filtered before use.

const ALLOWED_KINDS = new Set(["sail", "power"]);

/**
 * Model names are user text heading for a prompt, so treat them as hostile:
 * keep only characters that appear in real boat names ("Beneteau Oceanis 46.1",
 * "Grand Banks 42 Classic") and drop everything else, including the newlines
 * and punctuation used to break out of a prompt.
 */
function sanitizeModel(raw: string): string {
  return raw
    .replace(/[^A-Za-z0-9 .\-/']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function buildPrompt(model: string, lengthFt: number, kind: string): string {
  const vessel = kind === "sail" ? "sailing yacht" : "motor yacht";
  return [
    `A clean, minimal side-profile product illustration of a ${lengthFt}-foot ${vessel}`,
    `resembling a ${model}.`,
    "Flat vector style, soft even lighting, no text, no logos, no people.",
    "Pale blue calm water, plain near-white background, generous empty space around the boat.",
    "Muted navy hull, white deck, restrained palette. Centered, full vessel visible, side elevation.",
  ].join(" ");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.OPENAI_API_KEY;
  const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

  const model = sanitizeModel(String(req.query.model ?? ""));
  const lengthFt = Math.round(Number(req.query.length));
  const kind = String(req.query.kind ?? "sail");

  if (!key) {
    // No key configured — the client draws its own portrait instead.
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(404).json({ error: "Image generation is not configured." });
    return;
  }
  if (!model || !Number.isFinite(lengthFt) || lengthFt <= 0 || lengthFt > 400 || !ALLOWED_KINDS.has(kind)) {
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(400).json({ error: "A model, a length in feet, and kind=sail|power are required." });
    return;
  }

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: imageModel,
        prompt: buildPrompt(model, lengthFt, kind),
        size: "1536x1024",
        quality: "low",
        n: 1,
      }),
    });

    if (!r.ok) {
      const body = await r.text().catch(() => "");
      const reason = body.match(/"message":\s*"([^"]+)"/)?.[1];
      // Short cache on failure so a fixed key isn't shadowed by a stale error.
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(502).json({ error: `Image generation ${r.status}${reason ? ` — ${reason}` : ""}` });
      return;
    }

    const json = (await r.json()) as { data?: { b64_json?: string; url?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(502).json({ error: "Image generation returned no image." });
      return;
    }

    const png = Buffer.from(b64, "base64");
    // Deterministic for a given boat, so cache it hard at the edge.
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=2592000, max-age=86400, immutable");
    res.status(200).send(png);
  } catch (err) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(502).json({ error: err instanceof Error ? err.message : "Image generation failed." });
  }
}
