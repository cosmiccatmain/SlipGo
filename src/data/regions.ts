// ── Harbor regions — the single source of truth ──────────────────────────────
// Adding a harbor means adding ONE entry here. Everything else derives from it:
//   • Region type            (keyof typeof REGIONS)
//   • estimate.ts            hub/mouth anchors, so a slip is judged against its
//                            own harbor rather than a statewide average
//   • safety.ts              the agency that will supply crime data
//   • trips.ts               the waypoint used for leg distances
//
// `hub`   = the middle of the harbor (dining//fuel/landing).
// `mouth` = the entrance to open water (or, inland, the main channel).

export interface RegionInfo {
  label: string;
  /** Broad area used for grouping in the UI. */
  area: "Southern California" | "Central Coast" | "Bay Area" | "Delta" | "North Coast" | "Sierra";
  hub: { lat: number; lon: number };
  mouth: { lat: number; lon: number };
  /** Real agency that polices the water here — the future crime-data source. */
  safetySource: string;
}

export const REGIONS = {
  // ── Southern California ───────────────────────────────────────────────────
  mdr: {
    label: "Marina del Rey",
    area: "Southern California",
    hub: { lat: 33.9759, lon: -118.4464 },
    mouth: { lat: 33.9705, lon: -118.4497 },
    safetySource: "L.A. County Sheriff — Marina del Rey Station",
  },
  "long-beach": {
    label: "Long Beach",
    area: "Southern California",
    hub: { lat: 33.757, lon: -118.15 },
    mouth: { lat: 33.744, lon: -118.117 },
    safetySource: "Long Beach Police Department",
  },
  "santa-barbara": {
    label: "Santa Barbara",
    area: "Southern California",
    hub: { lat: 34.4038, lon: -119.6908 },
    mouth: { lat: 34.401, lon: -119.6885 },
    safetySource: "Santa Barbara Police Department",
  },
  newport: {
    label: "Newport Beach",
    area: "Southern California",
    hub: { lat: 33.612, lon: -117.9 },
    mouth: { lat: 33.5936, lon: -117.8807 },
    safetySource: "Newport Beach Police Department",
  },
  ventura: {
    label: "Ventura",
    area: "Southern California",
    hub: { lat: 34.2455, lon: -119.2645 },
    mouth: { lat: 34.2402, lon: -119.2633 },
    safetySource: "Ventura Police Department",
  },
  "channel-islands": {
    label: "Channel Islands",
    area: "Southern California",
    hub: { lat: 34.167, lon: -119.226 },
    mouth: { lat: 34.155, lon: -119.222 },
    safetySource: "Oxnard PD · Channel Islands Harbor Patrol",
  },
  redondo: {
    label: "Redondo Beach",
    area: "Southern California",
    hub: { lat: 33.8465, lon: -118.3945 },
    mouth: { lat: 33.843, lon: -118.397 },
    safetySource: "Redondo Beach Police Department",
  },
  "san-pedro": {
    label: "San Pedro",
    area: "Southern California",
    hub: { lat: 33.723, lon: -118.279 },
    mouth: { lat: 33.708, lon: -118.247 },
    safetySource: "LAPD — Harbor Division",
  },
  huntington: {
    label: "Huntington Harbour",
    area: "Southern California",
    hub: { lat: 33.718, lon: -118.067 },
    mouth: { lat: 33.731, lon: -118.096 },
    safetySource: "Huntington Beach Police Department",
  },
  "dana-point": {
    label: "Dana Point",
    area: "Southern California",
    hub: { lat: 33.461, lon: -117.698 },
    mouth: { lat: 33.457, lon: -117.692 },
    safetySource: "O.C. Sheriff — Dana Point Harbor Patrol",
  },
  oceanside: {
    label: "Oceanside",
    area: "Southern California",
    hub: { lat: 33.205, lon: -117.396 },
    mouth: { lat: 33.207, lon: -117.401 },
    safetySource: "Oceanside PD — Harbor Unit",
  },
  "san-diego": {
    label: "San Diego Bay",
    area: "Southern California",
    hub: { lat: 32.72, lon: -117.21 },
    mouth: { lat: 32.687, lon: -117.227 },
    safetySource: "San Diego Harbor Police",
  },
  "mission-bay": {
    label: "Mission Bay",
    area: "Southern California",
    hub: { lat: 32.7655, lon: -117.2355 },
    mouth: { lat: 32.7565, lon: -117.2525 },
    safetySource: "San Diego Lifeguards — Boating Safety Unit",
  },
  coronado: {
    label: "Coronado",
    area: "Southern California",
    hub: { lat: 32.6785, lon: -117.1665 },
    mouth: { lat: 32.687, lon: -117.227 },
    safetySource: "San Diego Harbor Police · Coronado PD",
  },
  "chula-vista": {
    label: "Chula Vista",
    area: "Southern California",
    hub: { lat: 32.62, lon: -117.101 },
    mouth: { lat: 32.66, lon: -117.14 },
    safetySource: "San Diego Harbor Police",
  },
  catalina: {
    label: "Catalina Island",
    area: "Southern California",
    hub: { lat: 33.348, lon: -118.323 },
    mouth: { lat: 33.3495, lon: -118.32 },
    safetySource: "L.A. County Sheriff — Avalon Station",
  },

  // ── Central Coast ─────────────────────────────────────────────────────────
  "morro-bay": {
    label: "Morro Bay",
    area: "Central Coast",
    hub: { lat: 35.369, lon: -120.851 },
    mouth: { lat: 35.3655, lon: -120.8635 },
    safetySource: "Morro Bay Harbor Patrol",
  },
  avila: {
    label: "Port San Luis",
    area: "Central Coast",
    hub: { lat: 35.177, lon: -120.755 },
    mouth: { lat: 35.169, lon: -120.76 },
    safetySource: "Port San Luis Harbor Patrol",
  },
  monterey: {
    label: "Monterey",
    area: "Central Coast",
    hub: { lat: 36.605, lon: -121.891 },
    mouth: { lat: 36.609, lon: -121.888 },
    safetySource: "Monterey Harbormaster · Monterey PD",
  },
  "moss-landing": {
    label: "Moss Landing",
    area: "Central Coast",
    hub: { lat: 36.803, lon: -121.787 },
    mouth: { lat: 36.8015, lon: -121.7895 },
    safetySource: "Monterey County Sheriff — Moss Landing Harbor Patrol",
  },
  "santa-cruz": {
    label: "Santa Cruz",
    area: "Central Coast",
    hub: { lat: 36.964, lon: -122.001 },
    mouth: { lat: 36.9585, lon: -122.0005 },
    safetySource: "Santa Cruz Harbor Patrol",
  },
  "half-moon-bay": {
    label: "Half Moon Bay",
    area: "Central Coast",
    hub: { lat: 37.502, lon: -122.482 },
    mouth: { lat: 37.4955, lon: -122.4855 },
    safetySource: "San Mateo County Harbor District Patrol",
  },

  // ── Bay Area ──────────────────────────────────────────────────────────────
  "san-francisco": {
    label: "San Francisco",
    area: "Bay Area",
    hub: { lat: 37.7945, lon: -122.3985 },
    mouth: { lat: 37.8085, lon: -122.4665 },
    safetySource: "San Francisco Police Department — Marine Unit",
  },
  marin: {
    label: "Sausalito & Marin",
    area: "Bay Area",
    hub: { lat: 37.8605, lon: -122.4845 },
    mouth: { lat: 37.8265, lon: -122.4785 },
    safetySource: "Marin County Sheriff — Marine Patrol",
  },
  "east-bay": {
    label: "East Bay",
    area: "Bay Area",
    hub: { lat: 37.8265, lon: -122.29 },
    mouth: { lat: 37.8225, lon: -122.365 },
    safetySource: "Alameda County Sheriff — Marine Patrol",
  },
  peninsula: {
    label: "Peninsula",
    area: "Bay Area",
    hub: { lat: 37.6275, lon: -122.348 },
    mouth: { lat: 37.6455, lon: -122.36 },
    safetySource: "San Mateo County Sheriff — Boating Safety Unit",
  },
  "north-bay": {
    label: "Vallejo & Benicia",
    area: "Bay Area",
    hub: { lat: 38.0705, lon: -122.2115 },
    mouth: { lat: 38.06, lon: -122.26 },
    safetySource: "Solano County Sheriff — Marine Patrol",
  },

  // ── Delta & rivers ────────────────────────────────────────────────────────
  delta: {
    label: "Sacramento Delta",
    area: "Delta",
    hub: { lat: 38.14, lon: -121.64 },
    mouth: { lat: 38.06, lon: -121.84 },
    safetySource: "San Joaquin & Sacramento County Sheriff — Marine Patrol",
  },
  sacramento: {
    label: "Sacramento",
    area: "Delta",
    hub: { lat: 38.562, lon: -121.517 },
    mouth: { lat: 38.52, lon: -121.51 },
    safetySource: "Sacramento County Sheriff — Marine Enforcement",
  },
  stockton: {
    label: "Stockton",
    area: "Delta",
    hub: { lat: 37.984, lon: -121.345 },
    mouth: { lat: 38.02, lon: -121.42 },
    safetySource: "San Joaquin County Sheriff — Marine Patrol",
  },

  // ── North Coast ───────────────────────────────────────────────────────────
  "bodega-bay": {
    label: "Bodega Bay",
    area: "North Coast",
    hub: { lat: 38.332, lon: -123.057 },
    mouth: { lat: 38.3095, lon: -123.0555 },
    safetySource: "Sonoma County Sheriff — Marine Unit",
  },
  "fort-bragg": {
    label: "Fort Bragg",
    area: "North Coast",
    hub: { lat: 39.426, lon: -123.801 },
    mouth: { lat: 39.4255, lon: -123.8075 },
    safetySource: "Fort Bragg Police Department",
  },
  humboldt: {
    label: "Humboldt Bay",
    area: "North Coast",
    hub: { lat: 40.806, lon: -124.165 },
    mouth: { lat: 40.766, lon: -124.227 },
    safetySource: "Humboldt Bay Harbor District · Eureka PD",
  },
  "crescent-city": {
    label: "Crescent City",
    area: "North Coast",
    hub: { lat: 41.744, lon: -124.184 },
    mouth: { lat: 41.7395, lon: -124.1915 },
    safetySource: "Del Norte County Sheriff · Crescent City Harbor District",
  },

  // ── Sierra ────────────────────────────────────────────────────────────────
  "lake-tahoe": {
    label: "Lake Tahoe",
    area: "Sierra",
    hub: { lat: 39.0, lon: -120.07 },
    mouth: { lat: 39.0, lon: -120.07 },
    safetySource: "El Dorado & Placer County Sheriff — Lake Patrol",
  },
} as const satisfies Record<string, RegionInfo>;

export type Region = keyof typeof REGIONS;

export const REGION_KEYS = Object.keys(REGIONS) as Region[];

export function regionInfo(r: Region): RegionInfo {
  return REGIONS[r];
}
