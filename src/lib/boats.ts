import { supabase } from "./supabase";
import type { Tier } from "./membership";
import type { BoatKind } from "./boatArt";

// ── Your fleet ───────────────────────────────────────────────────────────────
// A boat drives Trips: its LOA sets slip cost and its cruise speed sets timing.
// Boats are NEVER used to filter search results — a 30-footer's owner is often
// shopping a 45 ft slip on purpose (room to grow, a tender, a future boat).

export interface Boat {
  id: string;
  /** What the owner calls her, e.g. "Second Wind". */
  name: string;
  /** Make and model, e.g. "Catalina 42" — drives the generated artwork. */
  model: string | null;
  kind: BoatKind;
  lengthFt: number;
  beamFt: number | null;
  draftFt: number | null;
  cruiseKts: number;
}

/** How many boats each tier can save — a concrete reason to upgrade. */
export const BOAT_LIMIT: Record<Tier, number> = { free: 1, plus: 3, pro: Infinity };

export function boatLimitLabel(tier: Tier): string {
  const n = BOAT_LIMIT[tier];
  return n === Infinity ? "unlimited boats" : n === 1 ? "1 boat" : `${n} boats`;
}

interface BoatRow {
  id: string;
  name: string;
  model: string | null;
  kind: string | null;
  length_ft: number | string;
  beam_ft: number | string | null;
  draft_ft: number | string | null;
  cruise_kts: number | string;
}

function fromRow(r: BoatRow): Boat {
  return {
    id: r.id,
    name: r.name,
    model: r.model ?? null,
    kind: r.kind === "power" ? "power" : "sail",
    lengthFt: Number(r.length_ft),
    beamFt: r.beam_ft === null ? null : Number(r.beam_ft),
    draftFt: r.draft_ft === null ? null : Number(r.draft_ft),
    cruiseKts: Number(r.cruise_kts),
  };
}

export async function listBoats(userId: string): Promise<Boat[]> {
  const { data, error } = await supabase
    .from("boats")
    .select("id, name, model, kind, length_ft, beam_ft, draft_ft, cruise_kts")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as BoatRow[]).map(fromRow);
}

export async function addBoat(
  userId: string,
  b: Omit<Boat, "id">,
): Promise<{ boat?: Boat; error?: string }> {
  const { data, error } = await supabase
    .from("boats")
    .insert({
      user_id: userId,
      name: b.name,
      model: b.model,
      kind: b.kind,
      length_ft: b.lengthFt,
      beam_ft: b.beamFt,
      draft_ft: b.draftFt,
      cruise_kts: b.cruiseKts,
    })
    .select("id, name, model, kind, length_ft, beam_ft, draft_ft, cruise_kts")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not save that boat." };
  return { boat: fromRow(data as BoatRow) };
}

export async function deleteBoat(id: string): Promise<boolean> {
  const { error } = await supabase.from("boats").delete().eq("id", id);
  return !error;
}

/**
 * How a listing suits a boat. Purely informational — we surface it as a badge
 * and never remove listings from results because of it.
 */
export type Fit = "fits" | "tight" | "too-small" | "roomy";

export function slipFit(slipMaxFt: number, boatLoaFt: number): Fit {
  if (slipMaxFt < boatLoaFt) return "too-small";
  const slack = slipMaxFt - boatLoaFt;
  if (slack <= 2) return "tight";
  if (slack >= 12) return "roomy";
  return "fits";
}

export const FIT_LABEL: Record<Fit, string> = {
  fits: "Fits your boat",
  tight: "Tight fit",
  "too-small": "Shorter than your boat",
  roomy: "Room to spare",
};
