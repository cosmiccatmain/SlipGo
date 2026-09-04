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
    | "Inland Lakes"
    | "Alaska"
    | "Hawaii";
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
  // ── Northeast (cont.) ─────────────────────────────────────────────────────
  "portland-me": {
    label: "Portland",
    state: "ME",
    area: "Northeast",
    hub: { lat: 43.6555, lon: -70.2475 },
    mouth: { lat: 43.6285, lon: -70.2185 },
    safetySource: "Portland Harbormaster · Portland PD",
  },
  "camden-me": {
    label: "Camden & Rockport",
    state: "ME",
    area: "Northeast",
    hub: { lat: 44.2095, lon: -69.0625 },
    mouth: { lat: 44.1995, lon: -69.0455 },
    safetySource: "Camden Harbormaster · Knox County Sheriff",
  },
  "portsmouth-nh": {
    label: "Portsmouth",
    state: "NH",
    area: "Northeast",
    hub: { lat: 43.0715, lon: -70.7345 },
    mouth: { lat: 43.0605, lon: -70.7095 },
    safetySource: "NH Marine Patrol · Portsmouth PD",
  },
  "mystic-ct": {
    label: "Mystic",
    state: "CT",
    area: "Northeast",
    hub: { lat: 41.3535, lon: -71.9665 },
    mouth: { lat: 41.3245, lon: -71.9645 },
    safetySource: "Connecticut DEEP — Marine Patrol",
  },
  "greenwich-ct": {
    label: "Greenwich & Stamford",
    state: "CT",
    area: "Northeast",
    hub: { lat: 41.0155, lon: -73.5915 },
    mouth: { lat: 40.9985, lon: -73.5845 },
    safetySource: "Greenwich Police — Marine Section",
  },
  "montauk-ny": {
    label: "Montauk",
    state: "NY",
    area: "Northeast",
    hub: { lat: 41.0715, lon: -71.9385 },
    mouth: { lat: 41.0725, lon: -71.9375 },
    safetySource: "East Hampton Town Marine Patrol",
  },
  "sag-harbor-ny": {
    label: "Sag Harbor",
    state: "NY",
    area: "Northeast",
    hub: { lat: 41.0005, lon: -72.2925 },
    mouth: { lat: 41.0155, lon: -72.2895 },
    safetySource: "Southampton Town Bay Constables",
  },
  "atlantic-city-nj": {
    label: "Atlantic City",
    state: "NJ",
    area: "Northeast",
    hub: { lat: 39.3785, lon: -74.4245 },
    mouth: { lat: 39.3555, lon: -74.4165 },
    safetySource: "New Jersey State Police — Marine Services",
  },
  "cape-may-nj": {
    label: "Cape May",
    state: "NJ",
    area: "Northeast",
    hub: { lat: 38.9445, lon: -74.8985 },
    mouth: { lat: 38.9345, lon: -74.9605 },
    safetySource: "Cape May County Sheriff — Marine Unit",
  },

  // ── Chesapeake & Potomac (cont.) ──────────────────────────────────────────
  "solomons-md": {
    label: "Solomons Island",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.3315, lon: -76.4585 },
    mouth: { lat: 38.3175, lon: -76.4405 },
    safetySource: "Maryland Natural Resources Police",
  },
  "st-michaels-md": {
    label: "St. Michaels",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 38.7855, lon: -76.2235 },
    mouth: { lat: 38.7795, lon: -76.2355 },
    safetySource: "Talbot County Sheriff · MD NRP",
  },
  "rock-hall-md": {
    label: "Rock Hall",
    state: "MD",
    area: "Chesapeake & Potomac",
    hub: { lat: 39.1385, lon: -76.2475 },
    mouth: { lat: 39.1425, lon: -76.2565 },
    safetySource: "Kent County Sheriff · MD NRP",
  },
  "norfolk-va": {
    label: "Norfolk & Hampton Roads",
    state: "VA",
    area: "Chesapeake & Potomac",
    hub: { lat: 36.8465, lon: -76.2925 },
    mouth: { lat: 36.9455, lon: -76.3315 },
    safetySource: "Norfolk Police — Marine Patrol",
  },

  // ── Southeast (cont.) ─────────────────────────────────────────────────────
  "wilmington-nc": {
    label: "Wilmington",
    state: "NC",
    area: "Southeast",
    hub: { lat: 34.2385, lon: -77.9525 },
    mouth: { lat: 33.9285, lon: -78.0195 },
    safetySource: "Wilmington Police · NC Wildlife Resources",
  },
  "beaufort-nc": {
    label: "Beaufort",
    state: "NC",
    area: "Southeast",
    hub: { lat: 34.7175, lon: -76.6635 },
    mouth: { lat: 34.6905, lon: -76.6795 },
    safetySource: "Carteret County Sheriff — Marine Unit",
  },
  "savannah-ga": {
    label: "Savannah",
    state: "GA",
    area: "Southeast",
    hub: { lat: 31.9805, lon: -81.0555 },
    mouth: { lat: 32.0315, lon: -80.8845 },
    safetySource: "Chatham County Marine Patrol",
  },
  "st-petersburg-fl": {
    label: "St. Petersburg",
    state: "FL",
    area: "Southeast",
    hub: { lat: 27.7695, lon: -82.6295 },
    mouth: { lat: 27.7195, lon: -82.6255 },
    safetySource: "St. Petersburg Police — Marine Unit",
  },
  "naples-fl": {
    label: "Naples",
    state: "FL",
    area: "Southeast",
    hub: { lat: 26.1315, lon: -81.7925 },
    mouth: { lat: 26.1305, lon: -81.8135 },
    safetySource: "Naples Police · Collier County Marine Unit",
  },
  "stuart-fl": {
    label: "Stuart",
    state: "FL",
    area: "Southeast",
    hub: { lat: 27.1965, lon: -80.2535 },
    mouth: { lat: 27.1685, lon: -80.1615 },
    safetySource: "Martin County Sheriff — Marine Unit",
  },
  "marathon-fl": {
    label: "Marathon",
    state: "FL",
    area: "Southeast",
    hub: { lat: 24.7095, lon: -81.0945 },
    mouth: { lat: 24.6985, lon: -81.0885 },
    safetySource: "Monroe County Sheriff · Florida FWC",
  },

  // ── Gulf Coast (cont.) ────────────────────────────────────────────────────
  "orange-beach-al": {
    label: "Orange Beach",
    state: "AL",
    area: "Gulf Coast",
    hub: { lat: 30.2915, lon: -87.6605 },
    mouth: { lat: 30.2735, lon: -87.5615 },
    safetySource: "Orange Beach Police — Marine Unit",
  },
  "biloxi-ms": {
    label: "Biloxi",
    state: "MS",
    area: "Gulf Coast",
    hub: { lat: 30.3925, lon: -88.8595 },
    mouth: { lat: 30.3785, lon: -88.8565 },
    safetySource: "Mississippi DMR — Marine Patrol",
  },
  "corpus-christi-tx": {
    label: "Corpus Christi",
    state: "TX",
    area: "Gulf Coast",
    hub: { lat: 27.7955, lon: -97.3895 },
    mouth: { lat: 27.8175, lon: -97.3855 },
    safetySource: "Corpus Christi Police — Marine Unit",
  },
  "port-aransas-tx": {
    label: "Port Aransas",
    state: "TX",
    area: "Gulf Coast",
    hub: { lat: 27.8285, lon: -97.0725 },
    mouth: { lat: 27.8395, lon: -97.0505 },
    safetySource: "Texas Parks & Wildlife — Game Wardens",
  },

  // ── Great Lakes (cont.) ───────────────────────────────────────────────────
  "cleveland-oh": {
    label: "Cleveland",
    state: "OH",
    area: "Great Lakes",
    hub: { lat: 41.5015, lon: -81.7095 },
    mouth: { lat: 41.5115, lon: -81.7135 },
    safetySource: "Cleveland Police — Marine Unit",
  },
  "traverse-city-mi": {
    label: "Traverse City",
    state: "MI",
    area: "Great Lakes",
    hub: { lat: 44.7695, lon: -85.6195 },
    mouth: { lat: 44.7855, lon: -85.6045 },
    safetySource: "Grand Traverse County Sheriff — Marine Division",
  },
  "sandusky-oh": {
    label: "Sandusky & Lake Erie Islands",
    state: "OH",
    area: "Great Lakes",
    hub: { lat: 41.4595, lon: -82.7095 },
    mouth: { lat: 41.4815, lon: -82.7195 },
    safetySource: "Ohio DNR — Watercraft Division",
  },
  "erie-pa": {
    label: "Erie",
    state: "PA",
    area: "Great Lakes",
    hub: { lat: 42.1385, lon: -80.0895 },
    mouth: { lat: 42.1585, lon: -80.1155 },
    safetySource: "Pennsylvania Fish & Boat Commission",
  },
  "duluth-mn": {
    label: "Duluth & Lake Superior",
    state: "MN",
    area: "Great Lakes",
    hub: { lat: 46.7565, lon: -92.0895 },
    mouth: { lat: 46.7755, lon: -92.0925 },
    safetySource: "St. Louis County Sheriff — Rescue Squad",
  },

  // ── Pacific Northwest (cont.) ─────────────────────────────────────────────
  "tacoma-wa": {
    label: "Tacoma",
    state: "WA",
    area: "Pacific Northwest",
    hub: { lat: 47.2665, lon: -122.4145 },
    mouth: { lat: 47.2915, lon: -122.4405 },
    safetySource: "Tacoma Police — Marine Services",
  },
  "friday-harbor-wa": {
    label: "Friday Harbor",
    state: "WA",
    area: "Pacific Northwest",
    hub: { lat: 48.5365, lon: -123.0135 },
    mouth: { lat: 48.5405, lon: -123.0055 },
    safetySource: "San Juan County Sheriff — Marine Patrol",
  },
  "astoria-or": {
    label: "Astoria",
    state: "OR",
    area: "Pacific Northwest",
    hub: { lat: 46.1905, lon: -123.8245 },
    mouth: { lat: 46.2385, lon: -123.9705 },
    safetySource: "Clatsop County Sheriff — Marine Patrol",
  },

  // ── Alaska ────────────────────────────────────────────────────────────────
  "juneau-ak": {
    label: "Juneau",
    state: "AK",
    area: "Alaska",
    hub: { lat: 58.3025, lon: -134.4115 },
    mouth: { lat: 58.2895, lon: -134.4055 },
    safetySource: "Juneau Police · U.S. Coast Guard Sector Juneau",
  },
  "homer-ak": {
    label: "Homer",
    state: "AK",
    area: "Alaska",
    hub: { lat: 59.6015, lon: -151.4145 },
    mouth: { lat: 59.6035, lon: -151.4235 },
    safetySource: "Homer Harbormaster · Alaska State Troopers",
  },

  // ── Hawaii ────────────────────────────────────────────────────────────────
  "honolulu-hi": {
    label: "Honolulu",
    state: "HI",
    area: "Hawaii",
    hub: { lat: 21.2865, lon: -157.8425 },
    mouth: { lat: 21.2795, lon: -157.8455 },
    safetySource: "Hawaii DLNR — Division of Boating & Ocean Recreation",
  },
  "maui-hi": {
    label: "Maui",
    state: "HI",
    area: "Hawaii",
    hub: { lat: 20.7915, lon: -156.5095 },
    mouth: { lat: 20.7885, lon: -156.5115 },
    safetySource: "Hawaii DLNR — Division of Boating & Ocean Recreation",
  },

  // ── Inland lakes (cont.) ──────────────────────────────────────────────────
  "lake-powell-az": {
    label: "Lake Powell",
    state: "AZ",
    area: "Inland Lakes",
    hub: { lat: 36.9985, lon: -111.4885 },
    mouth: { lat: 36.9375, lon: -111.4835 },
    safetySource: "NPS — Glen Canyon National Recreation Area Rangers",
  },
  "lake-norman-nc": {
    label: "Lake Norman",
    state: "NC",
    area: "Inland Lakes",
    hub: { lat: 35.4885, lon: -80.9345 },
    mouth: { lat: 35.4295, lon: -80.9515 },
    safetySource: "NC Wildlife Resources Commission",
  },
} as const satisfies Record<string, RegionInfo>;

export type Region = keyof typeof REGIONS;

export const REGION_KEYS = Object.keys(REGIONS) as Region[];

export function regionInfo(r: Region): RegionInfo {
  return REGIONS[r];
}

// ── Search text ──────────────────────────────────────────────────────────────
// Listings are searched by name/address/neighbourhood, none of which spell the
// state out: an address reads "Juneau, AK 99801", so a boater typing "Alaska"
// found nothing. Region label + state name + code join the haystack.

const STATE_NAMES: Record<string, string> = {
  AK: "Alaska", AL: "Alabama", AZ: "Arizona", CA: "California", CT: "Connecticut",
  DC: "Washington DC District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", IL: "Illinois", LA: "Louisiana", MA: "Massachusetts",
  MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  NC: "North Carolina", NH: "New Hampshire", NJ: "New Jersey", NY: "New York",
  OH: "Ohio", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", TX: "Texas", VA: "Virginia", WA: "Washington",
  WI: "Wisconsin",
};

/** Extra terms a listing in this region should match on. */
export function regionSearchText(r: Region): string {
  const info = REGIONS[r];
  return `${info.label} ${info.state} ${STATE_NAMES[info.state] ?? ""}`;
}
