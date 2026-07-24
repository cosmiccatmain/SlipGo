import type { VercelRequest, VercelResponse } from "@vercel/node";

// ── /api/trip-summary ────────────────────────────────────────────────────────
// A short, grounded briefing for a BoatGoat Trips itinerary. Uses only the real
// route/wind figures the client computed — the model is told never to invent
// conditions. Key stays server-side (OPENAI_API_KEY); returns
// { configured, summary } and degrades honestly when unset.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const configured = !!key;

  const name = String(req.query.name ?? "");
  const route = String(req.query.route ?? "");
  const nm = String(req.query.nm ?? "");
  const hours = String(req.query.hours ?? "");
  const nights = String(req.query.nights ?? "");
  const wind = String(req.query.wind ?? "");

  if (!configured || !name) {
    res.setHeader("Cache-Control", "s-maxage=300");
    res.status(200).json({ configured, summary: null });
    return;
  }

  try {
    const facts = {
      trip: name,
      route,
      distanceNauticalMiles: nm,
      hoursUnderway: hours,
      nightsAshore: nights,
      currentAverageWindKnots: wind || "unknown",
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 160,
        messages: [
          {
            role: "system",
            content:
              "You brief a boater on a Southern California cruising itinerary using ONLY the " +
              "figures provided. Never invent marinas, weather, hazards, or numbers. 2 sentences, " +
              "max 50 words, practical and warm. Mention the current wind only if a number is given " +
              "and say what it means for the passage (easy, breezy, plan around it).",
          },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
    });

    if (!r.ok) {
      res.setHeader("Cache-Control", "s-maxage=60");
      res.status(200).json({ configured, summary: null });
      return;
    }

    const data = await r.json();
    const summary = String(data?.choices?.[0]?.message?.content ?? "").trim() || null;

    // Wind moves, so cache for an hour rather than a day.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ configured, summary });
  } catch {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ configured, summary: null });
  }
}
