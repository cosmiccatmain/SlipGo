// Clean SVG boat portraits (data URIs) in the same house style as the marina
// illustrations. Used as the instant, zero-cost artwork for every boat, and as
// the fallback whenever the AI render is unavailable.
//
// The silhouette is driven by the boat's own numbers — a 30 ft sloop and a
// 60 ft motoryacht come out visibly different — so the picture always says
// something true about the boat even before any AI is involved.

export type BoatKind = "sail" | "power";

interface Palette {
  skyTop: string;
  skyBottom: string;
  waterTop: string;
  waterBottom: string;
  hull: string;
  deck: string;
  trim: string;
}

const PALETTES: Palette[] = [
  { skyTop: "#dceafa", skyBottom: "#f4f9ff", waterTop: "#cfe1f4", waterBottom: "#eaf3fb", hull: "#16324f", deck: "#ffffff", trim: "#1466c4" },
  { skyTop: "#dff0ec", skyBottom: "#f5fbf9", waterTop: "#cde7e0", waterBottom: "#edf8f5", hull: "#173b44", deck: "#ffffff", trim: "#2fa98a" },
  { skyTop: "#e6e6f7", skyBottom: "#f7f7fe", waterTop: "#d8dcf0", waterBottom: "#f0f2fb", hull: "#232043", deck: "#ffffff", trim: "#5a6ac4" },
  { skyTop: "#fbe9dd", skyBottom: "#fff8f3", waterTop: "#f0dccd", waterBottom: "#fdf3ec", hull: "#33222e", deck: "#ffffff", trim: "#b06a12" },
];

/** Stable palette per boat so a boat's card doesn't change colour on reload. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function sailRig(cx: number, deckY: number, len: number, mastH: number, p: Palette): string {
  const bow = cx + len / 2;
  const stern = cx - len / 2;
  return `
    <path d="M${stern},${deckY} L${bow},${deckY} L${bow - len * 0.1},${deckY + 16} L${stern + len * 0.14},${deckY + 16} Z" fill="${p.hull}"/>
    <rect x="${cx - 1.5}" y="${deckY - mastH}" width="3" height="${mastH}" fill="${p.hull}"/>
    <path d="M${cx + 3},${deckY - mastH + 6} L${cx + 3},${deckY - 4} L${cx + len * 0.36},${deckY - 4} Z" fill="${p.deck}" stroke="${p.hull}" stroke-width="1.6"/>
    <path d="M${cx - 3},${deckY - mastH * 0.82} L${cx - 3},${deckY - 4} L${cx - len * 0.3},${deckY - 4} Z" fill="${p.deck}" stroke="${p.hull}" stroke-width="1.6"/>
    <rect x="${stern + len * 0.2}" y="${deckY - 3}" width="${len * 0.2}" height="3" rx="1.5" fill="${p.trim}"/>`;
}

function powerRig(cx: number, deckY: number, len: number, p: Palette): string {
  const bow = cx + len / 2;
  const stern = cx - len / 2;
  const cabinW = len * 0.42;
  return `
    <path d="M${stern},${deckY} L${bow},${deckY} L${bow - len * 0.12},${deckY + 18} L${stern + len * 0.1},${deckY + 18} Z" fill="${p.hull}"/>
    <path d="M${cx - cabinW / 2},${deckY} L${cx - cabinW / 2 + 6},${deckY - 22} L${cx + cabinW / 2 - 10},${deckY - 22} L${cx + cabinW / 2},${deckY} Z" fill="${p.deck}" stroke="${p.hull}" stroke-width="1.6"/>
    <path d="M${cx - cabinW / 2 + 10},${deckY - 18} L${cx - cabinW / 2 + 13},${deckY - 6} L${cx + cabinW / 2 - 12},${deckY - 6} L${cx + cabinW / 2 - 14},${deckY - 18} Z" fill="${p.trim}" opacity="0.35"/>
    <rect x="${cx - cabinW / 2 + 4}" y="${deckY - 34}" width="3" height="12" fill="${p.hull}"/>
    <rect x="${stern + len * 0.16}" y="${deckY - 3}" width="${len * 0.22}" height="3" rx="1.5" fill="${p.trim}"/>`;
}

/**
 * A portrait of one boat. `key` is anything stable per boat (its id or name) —
 * it only picks the palette.
 */
export function boatPortrait(key: string, lengthFt: number, kind: BoatKind): string {
  const p = PALETTES[hash(key) % PALETTES.length];
  const W = 480;
  const H = 300;
  const waterY = 196;

  // Map 20–90 ft onto the drawable width so scale reads as length.
  const t = Math.max(0, Math.min(1, (lengthFt - 20) / 70));
  const len = 150 + t * 280;
  const mastH = 80 + t * 120;
  const cx = W / 2;

  const boat = kind === "sail" ? sailRig(cx, waterY, len, mastH, p) : powerRig(cx, waterY, len, p);

  const ripples = [0.34, 0.52, 0.7, 0.86]
    .map((_, i) => {
      const y = waterY + 16 + i * 18;
      const w = len * (0.62 - i * 0.1);
      return `<line x1="${cx - w / 2}" y1="${y}" x2="${cx + w / 2}" y2="${y}" stroke="#ffffff" stroke-opacity="${0.75 - i * 0.14}" stroke-width="3" stroke-linecap="round"/>`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/></linearGradient>
    <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.waterTop}"/><stop offset="1" stop-color="${p.waterBottom}"/></linearGradient>
  </defs>
  <rect width="${W}" height="${waterY}" fill="url(#s)"/>
  <rect y="${waterY}" width="${W}" height="${H - waterY}" fill="url(#w)"/>
  ${boat}
  ${ripples}
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * URL of the AI-rendered portrait for a boat with a known make/model. Returns
 * null when there's no model to render — the caller then uses boatPortrait().
 *
 * The endpoint streams a PNG, so this can go straight into an <img src>: the
 * browser and the CDN handle caching, and nothing extra ships to the client.
 */
export function boatImageUrl(model: string | null, lengthFt: number, kind: BoatKind): string | null {
  const m = (model ?? "").trim();
  if (!m) return null;
  const params = new URLSearchParams({ model: m, length: String(lengthFt), kind });
  return `/api/boat-image?${params.toString()}`;
}
