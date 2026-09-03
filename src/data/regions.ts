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
  /** USPS code for the state this harbor sits in — safety.ts fetches per state. */
  state: string;
  /** Broad area used for grouping in the UI. */
  area:
    | "Southern California"
    | "Central Coast"
    | "Bay Area"
    | "Delta"
    | "North Coast"
    | "Sierra"
    | "Chesapeake & Potomac"
    | "Northeast"
    | "Southeast"
    | "Gulf Coast"
    | "Great Lakes"
    | "Pacific Northwest"
    | "Inland Lakes";
  hub: { lat: number; lon: number };
  mouth: { lat: number; lon: number };
  /** Real agency that polices the water here — the future crime-data source. */
  safetySource: string;
}

export const REGIONS = {
  // ── Southern California ───────────────────────────────────────────────────
  mdr: {
    label: "Marina del Rey",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.9759, lon: -118.4464 },
    mouth: { lat: 33.9705, lon: -118.4497 },
    safetySource: "L.A. County Sheriff — Marina del Rey Station",
  },
  "long-beach": {
    label: "Long Beach",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.757, lon: -118.15 },
    mouth: { lat: 33.744, lon: -118.117 },
    safetySource: "Long Beach Police Department",
  },
  "santa-barbara": {
    label: "Santa Barbara",
    state: "CA",
    area: "Southern California",
    hub: { lat: 34.4038, lon: -119.6908 },
    mouth: { lat: 34.401, lon: -119.6885 },
    safetySource: "Santa Barbara Police Department",
  },
  newport: {
    label: "Newport Beach",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.612, lon: -117.9 },
    mouth: { lat: 33.5936, lon: -117.8807 },
    safetySource: "Newport Beach Police Department",
  },
  ventura: {
    label: "Ventura",
    state: "CA",
    area: "Southern California",
    hub: { lat: 34.2455, lon: -119.2645 },
    mouth: { lat: 34.2402, lon: -119.2633 },
    safetySource: "Ventura Police Department",
  },
  "channel-islands": {
    label: "Channel Islands",
    state: "CA",
    area: "Southern California",
    hub: { lat: 34.167, lon: -119.226 },
    mouth: { lat: 34.155, lon: -119.222 },
    safetySource: "Oxnard PD · Channel Islands Harbor Patrol",
  },
  redondo: {
    label: "Redondo Beach",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.8465, lon: -118.3945 },
    mouth: { lat: 33.843, lon: -118.397 },
    safetySource: "Redondo Beach Police Department",
  },
  "san-pedro": {
    label: "San Pedro",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.723, lon: -118.279 },
    mouth: { lat: 33.708, lon: -118.247 },
    safetySource: "LAPD — Harbor Division",
  },
  huntington: {
    label: "Huntington Harbour",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.718, lon: -118.067 },
    mouth: { lat: 33.731, lon: -118.096 },
    safetySource: "Huntington Beach Police Department",
  },
  "dana-point": {
    label: "Dana Point",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.461, lon: -117.698 },
    mouth: { lat: 33.457, lon: -117.692 },
    safetySource: "O.C. Sheriff — Dana Point Harbor Patrol",
  },
  oceanside: {
    label: "Oceanside",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.205, lon: -117.396 },
    mouth: { lat: 33.207, lon: -117.401 },
    safetySource: "Oceanside PD — Harbor Unit",
  },
  "san-diego": {
    label: "San Diego Bay",
    state: "CA",
    area: "Southern California",
    hub: { lat: 32.72, lon: -117.21 },
    mouth: { lat: 32.687, lon: -117.227 },
    safetySource: "San Diego Harbor Police",
  },
  "mission-bay": {
    label: "Mission Bay",
    state: "CA",
    area: "Southern California",
    hub: { lat: 32.7655, lon: -117.2355 },
    mouth: { lat: 32.7565, lon: -117.2525 },
    safetySource: "San Diego Lifeguards — Boating Safety Unit",
  },
  coronado: {
    label: "Coronado",
    state: "CA",
    area: "Southern California",
    hub: { lat: 32.6785, lon: -117.1665 },
    mouth: { lat: 32.687, lon: -117.227 },
    safetySource: "San Diego Harbor Police · Coronado PD",
  },
  "chula-vista": {
    label: "Chula Vista",
    state: "CA",
    area: "Southern California",
    hub: { lat: 32.62, lon: -117.101 },
    mouth: { lat: 32.66, lon: -117.14 },
    safetySource: "San Diego Harbor Police",
  },
  catalina: {
    label: "Catalina Island",
    state: "CA",
    area: "Southern California",
    hub: { lat: 33.348, lon: -118.323 },
    mouth: { lat: 33.3495, lon: -118.32 },
    safetySource: "L.A. County Sheriff — Avalon Station",
  },

  // ── Central Coast ─────────────────────────────────────────────────────────
  "morro-bay": {
    label: "Morro Bay",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 35.369, lon: -120.851 },
    mouth: { lat: 35.3655, lon: -120.8635 },
    safetySource: "Morro Bay Harbor Patrol",
  },
  avila: {
    label: "Port San Luis",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 35.177, lon: -120.755 },
    mouth: { lat: 35.169, lon: -120.76 },
    safetySource: "Port San Luis Harbor Patrol",
  },
  monterey: {
    label: "Monterey",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 36.605, lon: -121.891 },
    mouth: { lat: 36.609, lon: -121.888 },
    safetySource: "Monterey Harbormaster · Monterey PD",
  },
  "moss-landing": {
    label: "Moss Landing",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 36.803, lon: -121.787 },
    mouth: { lat: 36.8015, lon: -121.7895 },
    safetySource: "Monterey County Sheriff — Moss Landing Harbor Patrol",
  },
  "santa-cruz": {
    label: "Santa Cruz",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 36.964, lon: -122.001 },
    mouth: { lat: 36.9585, lon: -122.0005 },
    safetySource: "Santa Cruz Harbor Patrol",
  },
  "half-moon-bay": {
    label: "Half Moon Bay",
    state: "CA",
    area: "Central Coast",
    hub: { lat: 37.502, lon: -122.482 },
    mouth: { lat: 37.4955, lon: -122.4855 },
    safetySource: "San Mateo County Harbor District Patrol",
  },

  // ── Bay Area ──────────────────────────────────────────────────────────────
  "san-francisco": {
    label: "San Francisco",
    state: "CA",
    area: "Bay Area",
    hub: { lat: 37.7945, lon: -122.3985 },
    mouth: { lat: 37.8085, lon: -122.4665 },
    safetySource: "San Francisco Police Department — Marine Unit",
  },
  marin: {
    label: "Sausalito & Marin",
    state: "CA",
    area: "Bay Area",
    hub: { lat: 37.8605, lon: -122.4845 },
    mouth: { lat: 37.8265, lon: -122.4785 },
    safetySource: "Marin County Sheriff — Marine Patrol",
  },
  "east-bay": {
    label: "East Bay",
    state: "CA",
    area: "Bay Area",
    hub: { lat: 37.8265, lon: -122.29 },
    mouth: { lat: 37.8225, lon: -122.365 },
    safetySource: "Alameda County Sheriff — Marine Patrol",
  },
  peninsula: {
    label: "Peninsula",
    state: "CA",
    area: "Bay Area",
    hub: { lat: 37.6275, lon: -122.348 },
    mouth: { lat: 37.6455, lon: -122.36 },
    safetySource: "San Mateo County Sheriff — Boating Safety Unit",
  },
  "north-bay": {
    label: "Vallejo & Benicia",
    state: "CA",
    area: "Bay Area",
    hub: { lat: 38.0705, lon: -122.2115 },
    mouth: { lat: 38.06, lon: -122.26 },
    safetySource: "Solano County Sheriff — Marine Patrol",
  },

  // ── Delta & rivers ────────────────────────────────────────────────────────
  delta: {
    label: "Sacramento Delta",
    state: "CA",
    area: "Delta",
    hub: { lat: 38.14, lon: -121.64 },
    mouth: { lat: 38.06, lon: -121.84 },
    safetySource: "San Joaquin & Sacramento County Sheriff — Marine Patrol",
  },
  sacramento: {
    label: "Sacramento",
    state: "CA",
    area: "Delta",
    hub: { lat: 38.562, lon: -121.517 },
    mouth: { lat: 38.52, lon: -121.51 },
    safetySource: "Sacramento County Sheriff — Marine Enforcement",
  },
  stockton: {
    label: "Stockton",
    state: "CA",
    area: "Delta",
    hub: { lat: 37.984, lon: -121.345 },
    mouth: { lat: 38.02, lon: -121.42 },
    safetySource: "San Joaquin County Sheriff — Marine Patrol",
  },

  // ── North Coast ───────────────────────────────────────────────────────────
  "bodega-bay": {
    label: "Bodega Bay",
    state: "CA",
    area: "North Coast",
    hub: { lat: 38.332, lon: -123.057 },
    mouth: { lat: 38.3095, lon: -123.0555 },
    safetySource: "Sonoma County Sheriff — Marine Unit",
  },
  "fort-bragg": {
    label: "Fort Bragg",
    state: "CA",
    area: "North Coast",
    hub: { lat: 39.426, lon: -123.801 },
    mouth: { lat: 39.4255, lon: -123.8075 },
    safetySource: "Fort Bragg Police Department",
  },
  humboldt: {
    label: "Humboldt Bay",
    state: "CA",
    area: "North Coast",
    hub: { lat: 40.806, lon: -124.165 },
    mouth: { lat: 40.766, lon: -124.227 },
    safetySource: "Humboldt Bay Harbor District · Eureka PD",
  },
  "crescent-city": {
    label: "Crescent City",
    state: "CA",
    area: "North Coast",
    hub: { lat: 41.744, lon: -124.184 },
    mouth: { lat: 41.7395, lon: -124.1915 },
    safetySource: "Del Norte County Sheriff · Crescent City Harbor District",
  },

  // ── Sierra ────────────────────────────────────────────────────────────────
  "lake-tahoe": {
    label: "Lake Tahoe",
    state: "CA",
    area: "Sierra",
    hub: { lat: 39.0, lon: -120.07 },
    mouth: { lat: 39.0, lon: -120.07 },
    safetySource: "El Dorado & Placer County Sheriff — Lake Patrol",
  },
  // ── Chesapeake & Potomac ──────────────────────────────────────────────────
  "washington-dc": {
    label: "Washington, DC",
    state: "DC",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.8765, lon: -77.0215 },
    mouth: { lat: 38.8605, lon: -77.0215 },
    safetySource: "DC Metropolitan Police — Harbor Patrol",
  },
  alexandria: {
    label: "Alexandria",
    state: "VA",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.8035, lon: -77.0405 },
    mouth: { lat: 38.7895, lon: -77.0365 },
    safetySource: "Alexandria Police · U.S. Park Police Marine Unit",
  },
  "national-harbor": {
    label: "National Harbor",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.7835, lon: -77.0165 },
    mouth: { lat: 38.7905, lon: -77.0245 },
    safetySource: "Prince George's County Police — Marine Unit",
  },
  occoquan: {
    label: "Occoquan & Woodbridge",
    state: "VA",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.6555, lon: -77.2455 },
    mouth: { lat: 38.6725, lon: -77.2255 },
    safetySource: "Prince William County Police — Marine Unit",
  },
  annapolis: {
    label: "Annapolis",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.9755, lon: -76.4835 },
    mouth: { lat: 38.9685, lon: -76.4665 },
    safetySource: "Annapolis PD · Maryland Natural Resources Police",
  },
  baltimore: {
    label: "Baltimore",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 39.2805, lon: -76.6015 },
    mouth: { lat: 39.2665, lon: -76.5795 },
    safetySource: "Baltimore Police — Marine Unit",
  },

  // ── Northeast ─────────────────────────────────────────────────────────────
  boston: {
    label: "Boston",
    state: "MA",
    area: "Northeast",
    hub: { lat: 42.3585, lon: -71.0455 },
    mouth: { lat: 42.3405, lon: -70.9905 },
    safetySource: "Boston Police — Harbor Patrol Unit",
  },
  "newport-ri": {
    label: "Newport",
    state: "RI",
    area: "Northeast",
    hub: { lat: 41.4845, lon: -71.3175 },
    mouth: { lat: 41.4705, lon: -71.3285 },
    safetySource: "Newport Police — Harbor Patrol",
  },
  "new-york": {
    label: "New York Harbor",
    state: "NY",
    area: "Northeast",
    hub: { lat: 40.7125, lon: -74.0175 },
    mouth: { lat: 40.6605, lon: -74.0525 },
    safetySource: "NYPD Harbor Unit",
  },

  // ── Southeast ─────────────────────────────────────────────────────────────
  charleston: {
    label: "Charleston",
    state: "SC",
    area: "Southeast",
    hub: { lat: 32.7825, lon: -79.9515 },
    mouth: { lat: 32.7505, lon: -79.8865 },
    safetySource: "Charleston Police — Harbor Patrol",
  },
  jacksonville: {
    label: "Jacksonville",
    state: "FL",
    area: "Southeast",
    hub: { lat: 30.2855, lon: -81.7085 },
    mouth: { lat: 30.3995, lon: -81.4015 },
    safetySource: "Jacksonville Sheriff's Office — Marine Unit",
  },
  miami: {
    label: "Miami",
    state: "FL",
    area: "Southeast",
    hub: { lat: 25.7785, lon: -80.1755 },
    mouth: { lat: 25.7655, lon: -80.1305 },
    safetySource: "Miami Police — Marine Patrol",
  },
  "fort-lauderdale": {
    label: "Fort Lauderdale",
    state: "FL",
    area: "Southeast",
    hub: { lat: 26.1175, lon: -80.1105 },
    mouth: { lat: 26.0925, lon: -80.1055 },
    safetySource: "Fort Lauderdale Police — Marine Unit",
  },
  "key-west": {
    label: "Key West",
    state: "FL",
    area: "Southeast",
    hub: { lat: 24.5665, lon: -81.8045 },
    mouth: { lat: 24.5525, lon: -81.8085 },
    safetySource: "Key West Police · Florida FWC",
  },
  tampa: {
    label: "Tampa Bay",
    state: "FL",
    area: "Southeast",
    hub: { lat: 27.9395, lon: -82.4485 },
    mouth: { lat: 27.8605, lon: -82.5505 },
    safetySource: "Tampa Police — Marine Unit",
  },

  // ── Gulf Coast ────────────────────────────────────────────────────────────
  "new-orleans": {
    label: "New Orleans",
    state: "LA",
    area: "Gulf Coast",
    hub: { lat: 30.0325, lon: -90.0475 },
    mouth: { lat: 30.0455, lon: -90.0475 },
    safetySource: "New Orleans Police — Harbor Patrol",
  },
  galveston: {
    label: "Galveston",
    state: "TX",
    area: "Gulf Coast",
    hub: { lat: 29.3095, lon: -94.7935 },
    mouth: { lat: 29.3395, lon: -94.7715 },
    safetySource: "Galveston Police — Marine Division",
  },
  kemah: {
    label: "Kemah & Clear Lake",
    state: "TX",
    area: "Gulf Coast",
    hub: { lat: 29.5455, lon: -95.0195 },
    mouth: { lat: 29.5375, lon: -94.9855 },
    safetySource: "Kemah PD · Harris County Sheriff — Marine Unit",
  },
  pensacola: {
    label: "Pensacola",
    state: "FL",
    area: "Gulf Coast",
    hub: { lat: 30.4045, lon: -87.2125 },
    mouth: { lat: 30.3345, lon: -87.3115 },
    safetySource: "Pensacola Police · Escambia County Marine Unit",
  },

  // ── Great Lakes ───────────────────────────────────────────────────────────
  chicago: {
    label: "Chicago",
    state: "IL",
    area: "Great Lakes",
    hub: { lat: 41.8655, lon: -87.6095 },
    mouth: { lat: 41.8885, lon: -87.5905 },
    safetySource: "Chicago Police — Marine Unit",
  },
  milwaukee: {
    label: "Milwaukee",
    state: "WI",
    area: "Great Lakes",
    hub: { lat: 43.0455, lon: -87.8845 },
    mouth: { lat: 43.0265, lon: -87.8815 },
    safetySource: "Milwaukee County Sheriff — Marine Unit",
  },
  detroit: {
    label: "Detroit & Lake St. Clair",
    state: "MI",
    area: "Great Lakes",
    hub: { lat: 42.4895, lon: -82.8825 },
    mouth: { lat: 42.4595, lon: -82.8555 },
    safetySource: "Michigan DNR · St. Clair Shores Police Marine Unit",
  },

  // ── Pacific Northwest ─────────────────────────────────────────────────────
  seattle: {
    label: "Seattle",
    state: "WA",
    area: "Pacific Northwest",
    hub: { lat: 47.6805, lon: -122.4055 },
    mouth: { lat: 47.6625, lon: -122.4105 },
    safetySource: "Seattle Police — Harbor Patrol",
  },
  bellingham: {
    label: "Bellingham",
    state: "WA",
    area: "Pacific Northwest",
    hub: { lat: 48.7495, lon: -122.5045 },
    mouth: { lat: 48.7355, lon: -122.5245 },
    safetySource: "Whatcom County Sheriff — Marine Patrol",
  },
  anacortes: {
    label: "Anacortes",
    state: "WA",
    area: "Pacific Northwest",
    hub: { lat: 48.5165, lon: -122.6055 },
    mouth: { lat: 48.5065, lon: -122.6255 },
    safetySource: "Skagit County Sheriff — Marine Patrol",
  },
  "portland-or": {
    label: "Portland",
    state: "OR",
    area: "Pacific Northwest",
    hub: { lat: 45.5095, lon: -122.6715 },
    mouth: { lat: 45.6195, lon: -122.7625 },
    safetySource: "Multnomah County Sheriff — River Patrol",
  },

  // ── Inland lakes ──────────────────────────────────────────────────────────
  "lake-travis": {
    label: "Lake Travis",
    state: "TX",
    area: "Inland Lakes",
    hub: { lat: 30.3975, lon: -97.9285 },
    mouth: { lat: 30.3905, lon: -97.9075 },
    safetySource: "Travis County Sheriff — Lake Patrol",
  },
} as const satisfies Record<string, RegionInfo>;

export type Region = keyof typeof REGIONS;

export const REGION_KEYS = Object.keys(REGIONS) as Region[];

export function regionInfo(r: Region): RegionInfo {
  return REGIONS[r];
}
