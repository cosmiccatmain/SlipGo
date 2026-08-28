import { useAuth } from "../lib/auth";
import { PLANS, planFor, planLabel } from "../lib/plans";
import { boatLimitLabel } from "../lib/boats";
import { TIER_RANK, type Tier } from "../lib/membership";

interface Props {
  onToast: (msg: string) => void;
  onPricing: () => void;
  onBoats: () => void;
  onSignIn: () => void;
}

function SignedOut({ title, onSignIn }: { title: string; onSignIn: () => void }) {
  return (
    <div className="page-wrap">
      <div className="page-head"><h1>{title}</h1></div>
      <div className="empty-state">
        <p>Sign in to manage your account.</p>
        <button className="btn-primary" onClick={onSignIn}>Sign in</button>
      </div>
    </div>
  );
}

export function SettingsView({ onToast, onBoats, onSignIn }: Props) {
  const { user, tier, boats, signOut } = useAuth();
  if (!user) return <SignedOut title="Settings" onSignIn={onSignIn} />;

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>Your account details and what's saved to it.</p>
        </div>
      </div>

      <section className="settings-card">
        <h2>Account</h2>
        <div className="setting-row">
          <div><b>Email</b><span>Used to sign in and to reach you about your slips.</span></div>
          <div className="setting-value">{user.email}</div>
        </div>
        <div className="setting-row">
          <div><b>Plan</b><span>Sets which features are unlocked on your account.</span></div>
          <div className="setting-value">
            <span className={"tier-chip " + tier}>{planFor(tier).name}</span>
          </div>
        </div>
        <div className="setting-row">
          <div><b>Boats saved</b><span>Your plan includes {boatLimitLabel(tier)}.</span></div>
          <div className="setting-value">
            {boats.length}
            <button className="link-btn" onClick={onBoats}>Manage</button>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h2>Session</h2>
        <div className="setting-row">
          <div><b>Sign out</b><span>Ends this session on this device.</span></div>
          <button
            className="btn-ghost"
            onClick={async () => {
              await signOut();
              onToast("Signed out.");
            }}
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}

export function BillingView({ onToast, onPricing, onSignIn }: Props) {
  const { user, tier, chooseTier } = useAuth();
  if (!user) return <SignedOut title="Plan & billing" onSignIn={onSignIn} />;

  const current = planFor(tier);

  const switchTo = async (next: Tier) => {
    if (next === tier) return;
    await chooseTier(next);
    onToast(`You're on ${planLabel(next)}.`);
  };

  return (
    <div className="page-wrap">
      <div className="page-head">
        <div>
          <h1>Plan &amp; billing</h1>
          <p>What you're on today, and what each plan unlocks.</p>
        </div>
      </div>

      <section className={"current-plan " + tier}>
        <div>
          <span className="cp-label">Current plan</span>
          <h2>{planLabel(tier)}</h2>
          <p>{current.blurb}</p>
        </div>
        <div className="cp-price">
          <b>{current.price}</b>
          <span>{current.cadence}</span>
        </div>
      </section>

      {/* No payment processor is wired up yet, so say so rather than dressing
          this page with invoices and card details that don't exist. */}
      <div className="billing-note">
        <b>Payment isn't connected yet.</b>
        <span>
          Switching plans here changes your account immediately and charges nothing.
          When card billing goes live, your current plan carries over.
        </span>
      </div>

      <div className="plan-switch">
        {PLANS.map((p) => {
          const isCurrent = p.tier === tier;
          // Downgrades stay understated — a blue "Switch to Free" button reads
          // as the recommended action, which is the opposite of the truth.
          const isUpgrade = TIER_RANK[p.tier] > TIER_RANK[tier];
          return (
            <article key={p.tier} className={"switch-card " + p.tier + (isCurrent ? " current" : "")}>
              <div className="sc-head">
                <h3>{p.name}</h3>
                <div className="sc-price"><b>{p.price}</b><span>{p.cadence}</span></div>
              </div>
              <p className="sc-blurb">{p.blurb}</p>
              <ul className="sc-perks">
                {p.perks.map((perk) => <li key={perk}>{perk}</li>)}
              </ul>
              <button
                className={isUpgrade ? "btn-primary" : "btn-ghost"}
                disabled={isCurrent}
                onClick={() => switchTo(p.tier)}
              >
                {isCurrent ? "Current plan" : isUpgrade ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
              </button>
            </article>
          );
        })}
      </div>

      <button className="link-btn center" onClick={onPricing}>
        See the full feature comparison
      </button>
    </div>
  );
}
