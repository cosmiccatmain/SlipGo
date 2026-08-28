import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, fetchProfile, saveTier } from "./supabase";
import { getTier as getLocalTier, setTier as setLocalTier, type Tier } from "./membership";
import { listBoats, type Boat } from "./boats";

// ── Auth + membership state ──────────────────────────────────────────────────
// Signed in  → tier comes from the user's `profiles` row (source of truth).
// Signed out → tier falls back to localStorage so the app is still explorable.

/**
 * The plans popup should appear once per account, the first time they land
 * authenticated. Signup alone isn't a reliable trigger: with Supabase's
 * "Confirm email" enabled, sign-up returns no session — the user confirms by
 * email and arrives via sign-in instead.
 */
const PLANS_SEEN_PREFIX = "slipgo.plansSeen.";

function hasSeenPlans(userId: string): boolean {
  try {
    return !!localStorage.getItem(PLANS_SEEN_PREFIX + userId);
  } catch {
    return true;
  }
}

function markPlansSeen(userId: string) {
  try {
    localStorage.setItem(PLANS_SEEN_PREFIX + userId, "1");
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: User | null;
  tier: Tier;
  /** The signed-in user's fleet (empty when signed out). */
  boats: Boat[];
  refreshBoats: () => Promise<void>;
  loading: boolean;
  /** True on a user's first authenticated visit, so the app shows the plans popup. */
  justSignedUp: boolean;
  clearJustSignedUp: () => void;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsEmailConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  chooseTier: (tier: Tier) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTierState] = useState<Tier>(() => getLocalTier());
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [boats, setBoats] = useState<Boat[]>([]);

  const applySession = useCallback(async (session: Session | null) => {
    const u = session?.user ?? null;
    setUser(u);
    if (u) {
      const profile = await fetchProfile(u.id);
      setTierState(profile?.tier ?? "free");
      setBoats(await listBoats(u.id));
      if (!hasSeenPlans(u.id)) setJustSignedUp(true);
    } else {
      setTierState(getLocalTier());
      setBoats([]);
    }
  }, []);

  const refreshBoats = useCallback(async () => {
    if (!user) return setBoats([]);
    setBoats(await listBoats(user.id));
  }, [user]);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      await applySession(data.session);
      if (alive) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Projects with "Confirm email" enabled return a user but no session.
    if (!data.session) return { needsEmailConfirm: true };
    return {}; // applySession shows the plans popup for a first-time account
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setBoats([]);
    setTierState(getLocalTier());
  }, []);

  const chooseTier = useCallback(
    async (next: Tier) => {
      setTierState(next);
      setLocalTier(next);
      if (user) await saveTier(user.id, next);
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      tier,
      boats,
      refreshBoats,
      loading,
      justSignedUp,
      clearJustSignedUp: () => {
        if (user) markPlansSeen(user.id);
        setJustSignedUp(false);
      },
      signUp,
      signIn,
      signOut,
      chooseTier,
    }),
    [user, tier, boats, refreshBoats, loading, justSignedUp, signUp, signIn, signOut, chooseTier],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Convenience for components that only care about the membership tier. */
export function useTier(): Tier {
  return useAuth().tier;
}
