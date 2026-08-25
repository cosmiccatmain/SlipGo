import type { IncidentType, NeighborTrait, OnboardFrequency } from "./types";

export function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const TRAIT_LABEL: Record<NeighborTrait, string> = {
  quiet: "Quiet",
  social: "Social",
  "pet-aboard": "Dog aboard",
  "kids-aboard": "Kids aboard",
  handy: "Handy",
  racer: "Races",
  angler: "Fishes",
  cruiser: "Cruises",
  "watches-boats": "Watches boats",
  "shares-tools": "Shares tools",
};

export const FREQUENCY_LABEL: Record<OnboardFrequency, string> = {
  daily: "Aboard most days",
  weekly: "Most weekends",
  monthly: "A few times a month",
  seasonal: "Seasonally",
};

export const INCIDENT_LABEL: Record<IncidentType, string> = {
  "outboard-theft": "Outboard theft",
  "dinghy-theft": "Dinghy theft",
  "electronics-theft": "Electronics theft",
  "fuel-theft": "Fuel theft",
  vandalism: "Vandalism",
  trespass: "Trespass",
  "vessel-break-in": "Vessel break-in",
  "dock-fire": "Dock fire",
};

export function formatTenure(months: number): string {
  if (months < 12) return `${Math.round(months)} mo`;
  const years = months / 12;
  return `${years >= 10 ? Math.round(years) : Math.round(years * 10) / 10} yr`;
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const percent = (share: number) => `${Math.round(share * 100)}%`;
