// Generates clean SVG "listing photos" (data URIs) so cards always render
// crisply with zero network dependencies. Six palettes rotate across listings.

interface Palette {
  skyTop: string;
  skyBottom: string;
  sun: string;
  waterTop: string;
  waterBottom: string;
  silhouette: string;
  sail: string;
}

const palettes: Palette[] = [
  // Midday blue
  { skyTop: "#AFD9FF", skyBottom: "#EAF6FF", sun: "#FFF6C9", waterTop: "#2E7CC7", waterBottom: "#82B9E8", silhouette: "#1B2A41", sail: "#FFFFFF" },
  // Golden hour
  { skyTop: "#FFC98A", skyBottom: "#FFF1D6", sun: "#FF9D5C", waterTop: "#3E6FA3", waterBottom: "#98C0DD", silhouette: "#2C2438", sail: "#FFF4E3" },
  // Lavender dusk
  { skyTop: "#B9A6E8", skyBottom: "#FBDCE4", sun: "#FFC3A8", waterTop: "#4A5B9B", waterBottom: "#93A6DA", silhouette: "#232043", sail: "#F4EFFF" },
  // Teal morning
  { skyTop: "#C6EFE7", skyBottom: "#F2FBF8", sun: "#FFEFC2", waterTop: "#1F8FA9", waterBottom: "#7FC9D8", silhouette: "#173B44", sail: "#FFFFFF" },
  // Deep clear day
  { skyTop: "#9CCDFB", skyBottom: "#E4F2FF", sun: "#FFFAD9", waterTop: "#1E6FB8", waterBottom: "#74B2E2", silhouette: "#16324F", sail: "#F7FBFF" },
  // Sunset coral
  { skyTop: "#FFA98F", skyBottom: "#FFE4CB", sun: "#FF6B4A", waterTop: "#35608F", waterBottom: "#84AACB", silhouette: "#33222E", sail: "#FFEDE0" },
];

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

function sailboat(x: number, waterY: number, scale: number, p: Palette): string {
  const s = scale;
  const hullY = waterY + 2 * s;
  return `
  <g>
    <path d="M${x - 26 * s},${hullY} L${x + 26 * s},${hullY} L${x + 18 * s},${hullY + 10 * s} L${x - 18 * s},${hullY + 10 * s} Z" fill="${p.silhouette}"/>
    <rect x="${x - 1.2 * s}" y="${hullY - 52 * s}" width="${2.4 * s}" height="${52 * s}" fill="${p.silhouette}"/>
    <path d="M${x + 2 * s},${hullY - 50 * s} L${x + 2 * s},${hullY - 4 * s} L${x + 30 * s},${hullY - 4 * s} Z" fill="${p.sail}" stroke="${p.silhouette}" stroke-width="${0.8 * s}"/>
    <path d="M${x - 2 * s},${hullY - 44 * s} L${x - 2 * s},${hullY - 4 * s} L${x - 24 * s},${hullY - 4 * s} Z" fill="${p.sail}" stroke="${p.silhouette}" stroke-width="${0.8 * s}"/>
  </g>`;
}

function bird(x: number, y: number, s: number, color: string): string {
  return `<path d="M${x - 6 * s},${y} Q${x - 3 * s},${y - 4 * s} ${x},${y} Q${x + 3 * s},${y - 4 * s} ${x + 6 * s},${y}" fill="none" stroke="${color}" stroke-width="${1.6 * s}" stroke-linecap="round"/>`;
}

export function marinaPhoto(seed: number): string {
  const p = palettes[seed % palettes.length];
  const rnd = mulberry(seed + 7);
  const W = 400;
  const H = 267;
  const waterY = 150;

  const sunX = 70 + rnd() * 260;
  const boats: string[] = [];
  const count = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < count; i++) {
    const x = 60 + ((i + 0.2 + rnd() * 0.6) * (W - 120)) / count;
    const scale = 0.55 + rnd() * 0.75;
    boats.push(sailboat(x, waterY + 8 + rnd() * 40, scale, p));
  }

  const waves: string[] = [];
  for (let i = 0; i < 9; i++) {
    const wx = 20 + rnd() * (W - 80);
    const wy = waterY + 14 + rnd() * (H - waterY - 26);
    const len = 24 + rnd() * 44;
    waves.push(
      `<line x1="${wx}" y1="${wy}" x2="${wx + len}" y2="${wy}" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"/>`,
    );
  }

  const birds = [
    bird(60 + rnd() * 120, 40 + rnd() * 35, 1, p.silhouette),
    bird(230 + rnd() * 120, 30 + rnd() * 40, 0.8, p.silhouette),
  ];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/><stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.waterTop}"/><stop offset="1" stop-color="${p.waterBottom}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${waterY}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${52 + rnd() * 30}" r="26" fill="${p.sun}"/>
  <rect y="${waterY}" width="${W}" height="${H - waterY}" fill="url(#water)"/>
  ${waves.join("")}
  ${boats.join("")}
  ${birds.join("")}
  <rect y="${H - 12}" width="${W}" height="12" fill="${p.silhouette}" opacity="0.85"/>
  <g fill="${p.silhouette}" opacity="0.85">
    <rect x="30" y="${H - 24}" width="7" height="14" rx="2"/>
    <rect x="120" y="${H - 24}" width="7" height="14" rx="2"/>
    <rect x="250" y="${H - 24}" width="7" height="14" rx="2"/>
    <rect x="352" y="${H - 24}" width="7" height="14" rx="2"/>
  </g>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
