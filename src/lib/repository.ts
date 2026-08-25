import { MARINA_SEEDS, docksFor } from "@/data/marinas";
import { generateNeighbors } from "@/data/profiles";
import { securityProfileFor } from "@/data/security";
import { computeNeighborhoodStats } from "./neighbors";
import type {
  Dock,
  DockNeighborhood,
  Marina,
  NeighborProfile,
  SecurityIncident,
  SecurityProfile,
} from "./types";

/**
 * Everything the Slip Neighbors and Security pages need. Two implementations:
 * the seeded sample data below, and a PostgREST reader for the Supabase
 * project. The Supabase reader is used only when both env vars are present,
 * and falls back to seed data if a request fails, so a database hiccup
 * degrades the page instead of breaking it.
 */
export interface SlipGoDataSource {
  listMarinas(): Promise<Marina[]>;
  getMarina(slug: string): Promise<Marina | null>;
  getNeighborhoods(slug: string): Promise<DockNeighborhood[]>;
  getSecurityProfile(slug: string): Promise<SecurityProfile | null>;
}

/** Private profiles never leave the database row they live in. */
const isShared = (profile: NeighborProfile) => profile.visibility !== "private";

export function buildNeighborhoods(
  docks: Dock[],
  profilesByDock: Map<string, NeighborProfile[]>,
): DockNeighborhood[] {
  return docks.map((dock) => {
    const neighbors = (profilesByDock.get(dock.id) ?? []).filter(isShared);
    return { dock, neighbors, stats: computeNeighborhoodStats(dock, neighbors) };
  });
}

export const seedSource: SlipGoDataSource = {
  async listMarinas() {
    return MARINA_SEEDS.map((entry) => entry.marina);
  },

  async getMarina(slug) {
    return MARINA_SEEDS.find((entry) => entry.marina.slug === slug)?.marina ?? null;
  },

  async getNeighborhoods(slug) {
    const seed = MARINA_SEEDS.find((entry) => entry.marina.slug === slug);
    if (!seed) return [];
    const profilesByDock = new Map<string, NeighborProfile[]>(
      seed.docks.map((spec) => [spec.id, generateNeighbors(spec, slug)]),
    );
    return buildNeighborhoods(docksFor(slug), profilesByDock);
  },

  async getSecurityProfile(slug) {
    return securityProfileFor(slug);
  },
};

/* ------------------------------------------------------------------ */
/* Supabase (PostgREST) source                                         */
/* ------------------------------------------------------------------ */

interface SupabaseConfig {
  url: string;
  key: string;
}

function supabaseConfig(): SupabaseConfig | null {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function query<T>(
  config: SupabaseConfig,
  path: string,
): Promise<T[]> {
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`PostgREST ${path} responded ${response.status}`);
  }
  return (await response.json()) as T[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toMarina = (row: any): Marina => ({
  slug: row.slug,
  name: row.name,
  city: row.city,
  state: row.state,
  waterBody: row.water_body,
  lat: Number(row.lat),
  lng: Number(row.lng),
  slipCount: Number(row.slip_count),
  guestSlips: Number(row.guest_slips ?? 0),
  vhfChannel: Number(row.vhf_channel ?? 16),
  phone: row.phone ?? "",
  website: row.website ?? "",
});

const toDock = (row: any): Dock => ({
  id: row.id,
  marinaSlug: row.marina_slug,
  name: row.name,
  slipCount: Number(row.slip_count),
  slipLengthRangeFt: [
    Number(row.slip_length_min_ft),
    Number(row.slip_length_max_ft),
  ],
  gated: Boolean(row.gated),
  liveaboardPermitted: Boolean(row.liveaboard_permitted),
  monthlyRatePerFt: Number(row.monthly_rate_per_ft),
});

const toProfile = (row: any): NeighborProfile => ({
  id: row.id,
  dockId: row.dock_id,
  slipNumber: row.slip_number,
  displayName: row.display_name,
  boatName: row.boat_name,
  boatType: row.boat_type,
  boatLengthFt: Number(row.boat_length_ft),
  liveaboard: Boolean(row.liveaboard),
  onboardFrequency: row.onboard_frequency,
  tenureMonths: Number(row.tenure_months),
  traits: row.traits ?? [],
  verified: Boolean(row.verified),
  visibility: row.visibility,
});

const toIncident = (row: any): SecurityIncident => ({
  id: row.id,
  marinaSlug: row.marina_slug,
  dockId: row.dock_id,
  occurredOn: row.occurred_on,
  type: row.type,
  severity: row.severity,
  resolved: Boolean(row.resolved),
  source: row.source,
  summary: row.summary ?? "",
});

const toSecurityProfile = (row: any, incidents: SecurityIncident[]): SecurityProfile => ({
  marinaSlug: row.marina_slug,
  slipCount: Number(row.slip_count),
  gatedDocks: Boolean(row.gated_docks),
  keyAccess: row.key_access,
  cameraCount: Number(row.camera_count ?? 0),
  cameraCoverage: row.camera_coverage,
  lighting: row.lighting,
  patrol: row.patrol,
  staffedHoursPerDay: Number(row.staffed_hours_per_day ?? 0),
  harborPatrolResponseMin:
    row.harbor_patrol_response_min === null
      ? null
      : Number(row.harbor_patrol_response_min),
  fireStandpipes: Boolean(row.fire_standpipes),
  extinguishersOnDock: Boolean(row.extinguishers_on_dock),
  meetsNfpa303: Boolean(row.meets_nfpa_303),
  liveaboardWatchProgram: Boolean(row.liveaboard_watch_program),
  incidents,
  lastAuditOn: row.last_audit_on ?? null,
  updatedOn: row.updated_on,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

function supabaseSource(config: SupabaseConfig): SlipGoDataSource {
  return {
    async listMarinas() {
      const rows = await query<unknown>(config, "marinas?select=*&order=name");
      return rows.map(toMarina);
    },

    async getMarina(slug) {
      const rows = await query<unknown>(
        config,
        `marinas?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      );
      return rows.length > 0 ? toMarina(rows[0]) : null;
    },

    async getNeighborhoods(slug) {
      const dockRows = await query<unknown>(
        config,
        `docks?select=*&marina_slug=eq.${encodeURIComponent(slug)}&order=name`,
      );
      const docks = dockRows.map(toDock);
      if (docks.length === 0) return [];

      const dockList = docks.map((dock) => `"${dock.id}"`).join(",");
      const profileRows = await query<unknown>(
        config,
        `neighbor_profiles?select=*&dock_id=in.(${encodeURIComponent(dockList)})&visibility=neq.private`,
      );

      const byDock = new Map<string, NeighborProfile[]>();
      for (const profile of profileRows.map(toProfile)) {
        const bucket = byDock.get(profile.dockId) ?? [];
        bucket.push(profile);
        byDock.set(profile.dockId, bucket);
      }
      return buildNeighborhoods(docks, byDock);
    },

    async getSecurityProfile(slug) {
      const encoded = encodeURIComponent(slug);
      const [profileRows, incidentRows] = await Promise.all([
        query<unknown>(
          config,
          `security_profiles?select=*&marina_slug=eq.${encoded}&limit=1`,
        ),
        query<unknown>(
          config,
          `security_incidents?select=*&marina_slug=eq.${encoded}&order=occurred_on.desc`,
        ),
      ]);
      if (profileRows.length === 0) return null;
      return toSecurityProfile(profileRows[0], incidentRows.map(toIncident));
    },
  };
}

/** Wraps a source so any failure falls back to the seeded sample data. */
function withFallback(
  primary: SlipGoDataSource,
  fallback: SlipGoDataSource,
): SlipGoDataSource {
  const guard = <K extends keyof SlipGoDataSource>(method: K) =>
    (async (...args: Parameters<SlipGoDataSource[K]>) => {
      try {
        // @ts-expect-error — arguments are forwarded verbatim to the same method.
        return await primary[method](...args);
      } catch (error) {
        console.warn(
          `[slipgo] Supabase read failed for ${String(method)}; serving sample data.`,
          error,
        );
        // @ts-expect-error — same signature as the primary method.
        return fallback[method](...args);
      }
    }) as SlipGoDataSource[K];

  return {
    listMarinas: guard("listMarinas"),
    getMarina: guard("getMarina"),
    getNeighborhoods: guard("getNeighborhoods"),
    getSecurityProfile: guard("getSecurityProfile"),
  };
}

export function getDataSource(): SlipGoDataSource {
  const config = supabaseConfig();
  return config ? withFallback(supabaseSource(config), seedSource) : seedSource;
}

export const isUsingSampleData = () => supabaseConfig() === null;
