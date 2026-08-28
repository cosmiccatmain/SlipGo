import type { Listing } from "../data/listings";

// ── Slip inventory ───────────────────────────────────────────────────────────
// Zillow shows every available unit in a building; we show every open slip in a
// marina. Operators don't publish per-slip inventory in any feed we can read
// yet, so we DERIVE the list from the numbers the listing already carries —
// nothing new is invented:
//
//   • how many slips  → listing.slipsOpen
//   • the biggest     → listing.maxLengthFt   ("up to 90 ft" on the card)
//   • the cheapest    → listing.sortPrice     (the card's headline price)
//   • the rate        → listing.rateNote      ("$24.75/ft")
//
// So a card reading "$1,150/mo · 7 slips open · up to 90 ft · $24.75/ft" expands
// to exactly 7 slips running 46 ft ($1,150) up to 90 ft ($2,228). Sizes snap to
// real-world dock increments. Everything is deterministic per listing id, so the
// same marina always shows the same inventory.

export type Cadence = "mo" | "night" | "sale";

export interface Slip {
  id: string;
  /** Berth label, e.g. "Dock C · Slip 42". */
  label: string;
  lengthFt: number;
  beamFt: number;
  /** Rent for one month / one night, or the sale price. */
  price: number;
  cadence: Cadence;
  /** End ties take wider beams and usually cost more. */
  endTie: boolean;
}

/** Dock sizes marinas actually build to. */
const STANDARD_SIZES = [
  20, 25, 28, 30, 32, 35, 38, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100, 110, 120, 130,
];

function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Same PRNG the photo generator uses, so slips are stable across reloads. */
function mulberry(seed: number): () => number {
  let a = seed * 1103 + 12345;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nearest buildable dock size inside [lo, hi]. */
function snapSize(raw: number, lo: number, hi: number): number {
  const inRange = STANDARD_SIZES.filter((s) => s >= lo && s <= hi);
  const pool = inRange.length ? inRange : [Math.round(raw)];
  return pool.reduce((best, s) => (Math.abs(s - raw) < Math.abs(best - raw) ? s : best), pool[0]);
}

/** Dollars per foot per month, parsed from rateNote ("$24.75/ft"). */
export function perFootRate(l: Listing): number | null {
  const m = /\$([\d.]+)\s*\/\s*ft/i.exec(l.rateNote);
  return m ? Number(m[1]) : null;
}

function roundMoney(n: number): number {
  return n >= 1000 ? Math.round(n / 5) * 5 : Math.round(n);
}

/**
 * The open slips at a listing, cheapest first. Empty when the listing has no
 * open inventory (yacht clubs are members-only and report 0).
 */
export function slipInventory(l: Listing): Slip[] {
  if (l.slipsOpen <= 0) return [];

  const rnd = mulberry(hashId(l.id));

  // A deeded slip for sale is a single, specific berth.
  if (l.mode === "sale") {
    return [
      {
        id: `${l.id}-1`,
        label: berth(rnd, 0),
        lengthFt: l.maxLengthFt,
        beamFt: beamFor(l.maxLengthFt),
        price: l.sortPrice,
        cadence: "sale",
        endTie: /end tie/i.test(l.perk),
      },
    ];
  }

  const nightly = typeof l.nightlyPerFt === "number";
  const perFt = perFootRate(l);
  // Guest docks and moorings are priced per foot per night; sortPrice is a
  // normalised filter value for them, so size the range off the max instead.
  const cadence: Cadence = nightly ? "night" : "mo";
  const rate = nightly ? (l.nightlyPerFt as number) : perFt;
  if (rate == null) return []; // "Members only" — nothing to price

  const mooring = /mooring/i.test(`${l.rateNote} ${l.name}`);
  const maxLen = l.maxLengthFt;
  const rawMin = nightly ? maxLen * 0.35 : l.sortPrice / rate;
  const minLen = Math.min(Math.max(Math.round(rawMin), 18), maxLen);

  const n = l.slipsOpen;
  const out: Slip[] = [];
  for (let i = 0; i < n; i++) {
    // Spread evenly between the two ends the card already advertises: the
    // smallest slip carries the headline price, and the largest is exactly the
    // "up to N ft" figure (which isn't always a standard dock size, so it is
    // pinned rather than snapped).
    const t = n === 1 ? 0 : i / (n - 1);
    const first = i === 0 && !nightly;
    const lengthFt = first
      ? minLen
      : i === n - 1
        ? maxLen
        : snapSize(minLen + t * (maxLen - minLen), minLen, maxLen);
    // Rate stays strictly length × $/ft so bigger never costs less. Any slip at
    // the entry size carries the headline price, so no row can undercut it.
    const price = !nightly && lengthFt === minLen ? l.sortPrice : roundMoney(lengthFt * rate);
    // A mooring is a ball in open water — no dock, so no end tie either.
    const endTie = mooring ? false : rnd() < 0.18;
    out.push({
      id: `${l.id}-${i + 1}`,
      label: berth(rnd, i, mooring),
      lengthFt,
      beamFt: beamFor(lengthFt) + (endTie ? 2 : 0),
      price,
      cadence,
      endTie,
    });
  }

  return out.sort((a, b) => a.lengthFt - b.lengthFt || a.price - b.price);
}

/** Slip beams run a little wider than the boats they hold. */
function beamFor(lengthFt: number): number {
  return Math.max(8, Math.round(lengthFt * 0.34));
}

const DOCKS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function berth(rnd: () => number, i: number, mooring = false): string {
  const dock = DOCKS[Math.floor(rnd() * DOCKS.length)];
  const num = 4 + Math.floor(rnd() * 60) + i;
  return mooring ? `Mooring ${num}` : `Dock ${dock} · Slip ${num}`;
}

export function formatSlipPrice(s: Slip): string {
  const money = "$" + s.price.toLocaleString("en-US");
  if (s.cadence === "sale") return money;
  return money + (s.cadence === "night" ? "/night" : "/mo");
}
