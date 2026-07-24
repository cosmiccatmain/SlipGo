import { createClient } from "@supabase/supabase-js";
import type { Tier } from "./membership";

// ── Supabase client ──────────────────────────────────────────────────────────
// The publishable key is designed to ship in the browser: it only grants what
// Row Level Security allows, and every `profiles` policy is scoped to
// auth.uid(). Never put the service-role key here.

const SUPABASE_URL = "https://fcvcynugbydttykxpnpt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9GXohehmyxq_SsrOi3ZPeA_kOAw2m7U";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export interface Profile {
  id: string;
  email: string | null;
  tier: Tier;
}

/** Read the signed-in user's profile row (created by a DB trigger on signup). */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, tier")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

/** Persist a membership tier change for the signed-in user. */
export async function saveTier(userId: string, tier: Tier): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ tier, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return !error;
}
