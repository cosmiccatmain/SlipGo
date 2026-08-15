import type { ReactNode } from "react";
import type { Tier } from "../lib/membership";
import { planLabel } from "../lib/plans";

// ── Locked feature ───────────────────────────────────────────────────────────
// The single component for every subscription-gated surface in SlipGo. It never
// hides what is behind the lock: the caller passes a real preview, we fade it
// gently (no heavy blur, no full-screen interruption) and put a readable card
// beside it that says what you get, which plan unlocks it, and how to do that.

interface Props {
  /** Plan that unlocks this — drives the badge colour and the CTA wording. */
  tier: Exclude<Tier, "free">;
  /** Benefit-led headline, e.g. "Keep every boating trip in one place". */
  title: string;
  /** One or two sentences on what the feature actually gives you. */
  body: string;
  /** Optional short list of concrete things the plan unlocks here. */
  points?: string[];
  /** Primary button label, e.g. "Unlock Trips". */
  ctaLabel: string;
  onUnlock: () => void;
  onComparePlans: () => void;
  /** Compact treatment for locks that sit inside a sidebar section. */
  variant?: "card" | "inline";
  /** Optional real UI, shown lightly faded above the card. */
  preview?: ReactNode;
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 9V7A5 5 0 0 0 7 7v2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3ZM9 7a3 3 0 0 1 6 0v2H9Zm4 9.7V18a1 1 0 0 1-2 0v-1.3a2 2 0 1 1 2 0Z"
      />
    </svg>
  );
}

export function LockedFeature({
  tier,
  title,
  body,
  points,
  ctaLabel,
  onUnlock,
  onComparePlans,
  variant = "card",
  preview,
}: Props) {
  const plan = planLabel(tier);

  if (variant === "inline") {
    return (
      <div className={"locked-inline " + tier}>
        <span className="locked-badge">
          <LockIcon size={11} />
          {plan}
        </span>
        <p className="locked-inline-body">{body}</p>
        <div className="locked-inline-actions">
          <button className={"locked-cta " + tier} onClick={onUnlock}>
            {ctaLabel}
          </button>
          <button className="locked-compare" onClick={onComparePlans}>
            Compare plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="locked-wrap">
      {preview && (
        <div className="locked-preview" aria-hidden="true">
          {preview}
        </div>
      )}
      <div className={"locked-card " + tier}>
        <span className="locked-badge">
          <LockIcon />
          {plan}
        </span>
        <h3 className="locked-title">{title}</h3>
        <p className="locked-body">{body}</p>
        {points && points.length > 0 && (
          <ul className="locked-points">
            {points.map((pt) => (
              <li key={pt}>
                <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
                  <path fill="currentColor" d="M7.6 14.2 3.9 10.5l1.3-1.3 2.4 2.4 6.2-6.2 1.3 1.3z" />
                </svg>
                {pt}
              </li>
            ))}
          </ul>
        )}
        <div className="locked-actions">
          <button className={"locked-cta " + tier} onClick={onUnlock}>
            {ctaLabel}
          </button>
          <button className="locked-compare" onClick={onComparePlans}>
            Compare plans
          </button>
        </div>
      </div>
    </div>
  );
}
