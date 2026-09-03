import { useAuth } from "../lib/auth";
import { TIER_RANK, type Tier } from "../lib/membership";
import { COMPARISON, PLANS, planLabel, type Plan } from "../lib/plans";
import { allListings } from "../data/listings";

interface Props {
  onToast: (msg: string) => void;
}

function Check() {
  return (
    <svg className="pc-check" viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.6 14.2 3.9 10.5l1.3-1.3 2.4 2.4 6.2-6.2 1.3 1.3z"
      />
    </svg>
  );
}

function Dash() {
  return <span className="pc-dash" aria-hidden="true">—</span>;
}

/** Current / upgrade / downgrade all read differently at a glance. */
function ctaFor(plan: Plan, current: Tier): { label: string; kind: "current" | "up" | "down" } {
  if (plan.tier === current) return { label: "Your current plan", kind: "current" };
  if (TIER_RANK[plan.tier] > TIER_RANK[current]) {
    return { label: `Upgrade to ${plan.name}`, kind: "up" };
  }
  return { label: plan.tier === "free" ? "Switch to Free" : `Switch to ${plan.name}`, kind: "down" };
}

export function PricingView({ onToast }: Props) {
  const { tier, chooseTier } = useAuth();

  const pick = async (plan: Plan) => {
    if (plan.tier === tier) return;
    const upgrading = TIER_RANK[plan.tier] > TIER_RANK[tier];
    await chooseTier(plan.tier);
    onToast(
      plan.tier === "free"
        ? "You're on the Free plan."
        : upgrading
          ? `${planLabel(plan.tier)} unlocked.`
          : `Switched to ${planLabel(plan.tier)}.`,
    );
  };

  return (
    <div className="pricing-view">
      <header className="pricing-hero">
        <span className="pricing-eyebrow">Plans</span>
        <h1>Find your slip. Then plan the whole season.</h1>
        <p>
          Every plan searches all {allListings.length} listings. Upgrade when you want the
          detail behind a slip, or the routes between them.
        </p>
        <p className="pricing-billing-note">
          Billed monthly. You're on <b>{planLabel(tier)}</b> — switch any time.
        </p>
      </header>

      <div className="plan-cards">
        {PLANS.map((p) => {
          const cta = ctaFor(p, tier);
          const isCurrent = cta.kind === "current";
          return (
            <section
              key={p.tier}
              className={
                "pc " + p.tier + (p.popular ? " pc--popular" : "") + (isCurrent ? " pc--current" : "")
              }
              aria-label={`${p.name} plan`}
            >
              <div className="pc-flags">
                {p.popular && <span className="pc-popular">Most popular</span>}
                {isCurrent && <span className="pc-current-flag">Current</span>}
              </div>

              <h2 className={"pc-name " + p.tier}>{p.name}</h2>
              <div className="pc-price">
                {p.price}
                <small>{p.cadence}</small>
              </div>
              <p className="pc-blurb">{p.blurb}</p>
              <p className="pc-audience">{p.audience}</p>

              <ul className="pc-perks">
                {p.perks.map((perk) => (
                  <li key={perk}>
                    <Check />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                className={"pc-cta " + p.tier + " is-" + cta.kind}
                disabled={isCurrent}
                onClick={() => pick(p)}
              >
                {cta.label}
              </button>
            </section>
          );
        })}
      </div>

      <section className="compare" aria-label="Plan comparison">
        <h2>Compare every feature</h2>
        <p className="compare-sub">
          What each plan includes, and what the paid tiers add.
        </p>

        <div className="compare-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                {PLANS.map((p) => (
                  <th scope="col" key={p.tier} className={p.tier}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label}>
                  <th scope="row">
                    <span className="compare-label">{row.label}</span>
                    <span className="compare-detail">{row.detail}</span>
                  </th>
                  {PLANS.map((p) => {
                    const v = row.values[p.tier];
                    return (
                      <td key={p.tier} className={p.tier === tier ? "is-current-col" : undefined}>
                        {typeof v === "string" ? (
                          <span className="compare-text">{v}</span>
                        ) : v ? (
                          <span className={"compare-yes " + p.tier}>
                            <Check />
                          </span>
                        ) : (
                          <Dash />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="pricing-foot">
        Checkout isn't connected yet — choosing a paid plan unlocks it for testing
        until billing goes live.
      </p>
    </div>
  );
}
