import type { BoatType, Dock, Marina } from "@/lib/types";

/**
 * SAMPLE DATA. Stand-in content so the Slip Neighbors and Security features
 * are exercisable end to end before the Supabase tables are populated. The
 * shapes match `supabase/migrations/0001_neighbors_and_security.sql`, so
 * swapping in the live source is a data-source change, not a UI change.
 */

export interface DockSpec extends Omit<Dock, "marinaSlug"> {
  /** Share of slips whose holder has shared a neighbor profile. */
  profileShare: number;
  /** Target share of liveaboards among those profiles. */
  liveaboardShare: number;
  /** Target dock personality, same 0..100 scale as `socialIndex`. */
  socialLean: number;
  typeWeights: Partial<Record<BoatType, number>>;
}

export interface MarinaSeed {
  marina: Marina;
  docks: DockSpec[];
}

export const MARINA_SEEDS: MarinaSeed[] = [
  {
    marina: {
      slug: "channel-islands-harbor",
      name: "Channel Islands Harbor",
      city: "Oxnard",
      state: "CA",
      waterBody: "Santa Barbara Channel",
      lat: 34.1653,
      lng: -119.2226,
      slipCount: 246,
      guestSlips: 12,
      vhfChannel: 16,
      phone: "(805) 555-0142",
      website: "https://example.com/channel-islands-harbor",
    },
    docks: [
      {
        id: "cih-a",
        name: "Dock A",
        slipCount: 84,
        slipLengthRangeFt: [28, 42],
        gated: true,
        liveaboardPermitted: false,
        monthlyRatePerFt: 12.5,
        profileShare: 0.45,
        liveaboardShare: 0.05,
        socialLean: 38,
        typeWeights: { sailboat: 5, powerboat: 3, catamaran: 1 },
      },
      {
        id: "cih-b",
        name: "Dock B",
        slipCount: 96,
        slipLengthRangeFt: [32, 50],
        gated: true,
        liveaboardPermitted: true,
        monthlyRatePerFt: 13.75,
        profileShare: 0.55,
        liveaboardShare: 0.34,
        socialLean: 72,
        typeWeights: { sailboat: 4, powerboat: 3, trawler: 2, catamaran: 1 },
      },
      {
        id: "cih-c",
        name: "Dock C",
        slipCount: 66,
        slipLengthRangeFt: [40, 65],
        gated: true,
        liveaboardPermitted: true,
        monthlyRatePerFt: 15.25,
        profileShare: 0.36,
        liveaboardShare: 0.18,
        socialLean: 55,
        typeWeights: { powerboat: 4, sportfisher: 3, trawler: 2, sailboat: 1 },
      },
    ],
  },
  {
    marina: {
      slug: "shoreline-marina-long-beach",
      name: "Shoreline Marina",
      city: "Long Beach",
      state: "CA",
      waterBody: "San Pedro Bay",
      lat: 33.7566,
      lng: -118.1929,
      slipCount: 310,
      guestSlips: 20,
      vhfChannel: 16,
      phone: "(562) 555-0188",
      website: "https://example.com/shoreline-marina",
    },
    docks: [
      {
        id: "shl-1",
        name: "Basin 1",
        slipCount: 120,
        slipLengthRangeFt: [30, 45],
        gated: true,
        liveaboardPermitted: true,
        monthlyRatePerFt: 14.0,
        profileShare: 0.5,
        liveaboardShare: 0.42,
        socialLean: 78,
        typeWeights: { sailboat: 5, powerboat: 2, catamaran: 2, trawler: 1 },
      },
      {
        id: "shl-2",
        name: "Basin 2",
        slipCount: 104,
        slipLengthRangeFt: [26, 38],
        gated: false,
        liveaboardPermitted: false,
        monthlyRatePerFt: 11.25,
        profileShare: 0.3,
        liveaboardShare: 0.04,
        socialLean: 44,
        typeWeights: { sailboat: 4, powerboat: 4, sportfisher: 1 },
      },
      {
        id: "shl-3",
        name: "Basin 3",
        slipCount: 86,
        slipLengthRangeFt: [45, 80],
        gated: true,
        liveaboardPermitted: false,
        monthlyRatePerFt: 18.5,
        profileShare: 0.28,
        liveaboardShare: 0.02,
        socialLean: 33,
        typeWeights: { powerboat: 4, sportfisher: 3, trawler: 2 },
      },
    ],
  },
  {
    marina: {
      slug: "newport-bay-anchorage",
      name: "Newport Bay Anchorage",
      city: "Newport Beach",
      state: "CA",
      waterBody: "Newport Harbor",
      lat: 33.6103,
      lng: -117.9,
      slipCount: 178,
      guestSlips: 8,
      vhfChannel: 16,
      phone: "(949) 555-0117",
      website: "https://example.com/newport-bay-anchorage",
    },
    docks: [
      {
        id: "nba-e",
        name: "Dock E",
        slipCount: 62,
        slipLengthRangeFt: [30, 44],
        gated: true,
        liveaboardPermitted: false,
        monthlyRatePerFt: 19.0,
        profileShare: 0.42,
        liveaboardShare: 0.03,
        socialLean: 61,
        typeWeights: { sailboat: 4, powerboat: 3, catamaran: 1 },
      },
      {
        id: "nba-f",
        name: "Dock F",
        slipCount: 58,
        slipLengthRangeFt: [36, 55],
        gated: true,
        liveaboardPermitted: true,
        monthlyRatePerFt: 21.5,
        profileShare: 0.48,
        liveaboardShare: 0.22,
        socialLean: 69,
        typeWeights: { powerboat: 4, sailboat: 3, trawler: 1 },
      },
      {
        id: "nba-g",
        name: "Dock G",
        slipCount: 58,
        slipLengthRangeFt: [50, 90],
        gated: true,
        liveaboardPermitted: false,
        monthlyRatePerFt: 26.0,
        profileShare: 0.24,
        liveaboardShare: 0,
        socialLean: 29,
        typeWeights: { sportfisher: 4, powerboat: 4, trawler: 1 },
      },
    ],
  },
  {
    marina: {
      slug: "shelter-island-basin",
      name: "Shelter Island Basin",
      city: "San Diego",
      state: "CA",
      waterBody: "San Diego Bay",
      lat: 32.7157,
      lng: -117.2261,
      slipCount: 264,
      guestSlips: 16,
      vhfChannel: 16,
      phone: "(619) 555-0164",
      website: "https://example.com/shelter-island-basin",
    },
    docks: [
      {
        id: "sib-n",
        name: "North Dock",
        slipCount: 92,
        slipLengthRangeFt: [30, 46],
        gated: true,
        liveaboardPermitted: true,
        monthlyRatePerFt: 15.5,
        profileShare: 0.58,
        liveaboardShare: 0.3,
        socialLean: 66,
        typeWeights: { sailboat: 5, catamaran: 2, powerboat: 2, trawler: 1 },
      },
      {
        id: "sib-s",
        name: "South Dock",
        slipCount: 88,
        slipLengthRangeFt: [28, 40],
        gated: true,
        liveaboardPermitted: false,
        monthlyRatePerFt: 13.0,
        profileShare: 0.34,
        liveaboardShare: 0.02,
        socialLean: 41,
        typeWeights: { sailboat: 4, powerboat: 3 },
      },
      {
        id: "sib-t",
        name: "Transient Dock",
        slipCount: 84,
        slipLengthRangeFt: [35, 70],
        gated: false,
        liveaboardPermitted: false,
        monthlyRatePerFt: 17.25,
        profileShare: 0.15,
        liveaboardShare: 0.05,
        socialLean: 52,
        typeWeights: { trawler: 3, sailboat: 3, powerboat: 3, catamaran: 1 },
      },
    ],
  },
];

export function docksFor(slug: string): Dock[] {
  const seed = MARINA_SEEDS.find((entry) => entry.marina.slug === slug);
  if (!seed) return [];
  return seed.docks.map((spec) => ({
    id: spec.id,
    marinaSlug: slug,
    name: spec.name,
    slipCount: spec.slipCount,
    slipLengthRangeFt: spec.slipLengthRangeFt,
    gated: spec.gated,
    liveaboardPermitted: spec.liveaboardPermitted,
    monthlyRatePerFt: spec.monthlyRatePerFt,
  }));
}
