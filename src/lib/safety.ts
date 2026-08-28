import { useEffect, useState } from "react";
import type { Listing } from "../data/listings";
import { REGIONS } from "../data/regions";

// ── Safety / crime rating ─────────────────────────────────────────────────────
// Real data: FBI Crime Data Explorer (UCR) statewide estimates for California,
// fetched keyless via api.usa.gov's public DEMO_KEY — same access model as the
// wind data (no secret to hide, called directly from the browser; CORS is open
// since the FBI's own web explorer is a browser client of this same endpoint).
//
// This is a STATEWIDE trend, not a per-harbor figure: no free, nationally
// consistent API reports crime at harbor-patrol granularity across the ~30
// agencies in REGIONS (city PDs, county sheriffs, harbor patrols each run
// their own systems), so the UI says so plainly rather than implying local
// precision. `source`/`note` reflect that honestly. Swap in a real per-harbor
// feed later and only `loadStatewide` needs to change — the ready/score/grade
// contract the UI reads is already in place.

export interface SafetyInfo {
  ready: boolean;
  score: number | null;
  grade: string | null;
  source: string;
  note: string;
}

// Public demo key for api.data.gov-hosted APIs (rate-limited: 30/hr, 50/day).
// Get a free key at https://api.data.gov/signup and set VITE_FBI_CRIME_API_KEY
// to raise the limit before relying on this under real traffic.
const FBI_API_KEY = import.meta.env.VITE_FBI_CRIME_API_KEY || "DEMO_KEY";
const FBI_ESTIMATES_URL = `https://api.usa.gov/crime/nibrs/v1/estimates/states/CA?api_key=${FBI_API_KEY}`;

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// Higher violent-crime rate per 100k people → lower score. Calibrated against
// the range U.S. states have actually reported in recent UCR data (roughly
// 100–700 per 100k), clamped so a bad fetch/parse can't hand back 0 or 100.
function scoreFromViolentRate(ratePer100k: number): number {
  const score = 100 - (ratePer100k / 700) * 100;
  return Math.max(1, Math.min(99, Math.round(score)));
}

interface StatewideResult {
  score: number;
  grade: string;
  year: number;
}

// undefined = not fetched yet, null = fetch failed/unavailable
let cached: StatewideResult | null | undefined;
let inflight: Promise<StatewideResult | null> | null = null;

async function loadStatewide(): Promise<StatewideResult | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(FBI_ESTIMATES_URL);
      if (!res.ok) {
        cached = null;
        return cached;
      }
      const data = await res.json();
      const results: any[] = data?.results ?? [];
      if (!results.length) {
        cached = null;
        return cached;
      }
      const latest = results.reduce((a, b) => (Number(b.year) > Number(a.year) ? b : a));
      const population = Number(latest.population);
      const violentCrime = Number(latest.violent_crime);
      if (!population || !Number.isFinite(violentCrime)) {
        cached = null;
        return cached;
      }
      const ratePer100k = (violentCrime / population) * 100000;
      const score = scoreFromViolentRate(ratePer100k);
      cached = { score, grade: scoreToGrade(score), year: Number(latest.year) };
      return cached;
    } catch {
      cached = null;
      return cached;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useSafety(listing: Listing): SafetyInfo {
  const source = REGIONS[listing.region].safetySource;
  const [state, setState] = useState<StatewideResult | null | undefined>(cached);

  useEffect(() => {
    let alive = true;
    loadStatewide().then((r) => {
      if (alive) setState(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!state) {
    return {
      ready: false,
      score: null,
      grade: null,
      source,
      note: "Crime & safety data source in progress.",
    };
  }

  return {
    ready: true,
    score: state.score,
    grade: state.grade,
    source: `FBI Crime Data Explorer — California statewide, ${state.year}`,
    note: `Statewide trend from FBI UCR data, not specific to ${source}'s beat — a per-harbor feed is next.`,
  };
}
