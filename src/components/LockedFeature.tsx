import type { ReactNode } from "react";
import type { Tier } from "../lib/membership";
import { planLabel } from "../lib/plans";

// ── Locked feature ───────────────────────────────────────────────────────────
// One component for every subscription gate in SlipGo.
//
// The panel and the preview are stacked, never overlapped: an upgrade card
// floating on top of content inevitably crops it and reads as a broken modal.
// The panel states the value on its own, then the preview sits below it as a
// complete, uncropped look at the real feature, faded at the tail.

interface Props {
  /** Plan that unlocks this — drives the accent and the CTA wording. */
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
  /** Optional real UI, shown complete and lightly faded beneath the panel. */
  preview?: ReactNode;
  /** Caption above the preview. */
  previewLabel?: string;
}

function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 9V7A5 5 0 0 0 7 7v2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3ZM9 7a3 3 0 0 1 6 0v2H9Zm4 9.7V18a1 1 0 0 1-2 0v-1.3a2 2 0 1 1 2 0Z"
      />
    </svg>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M7.6 14.2 3.9 10.5l1.3-1.3 2.4 2.4 6.2-6.2 1.3 1.3z" />
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
  previewLabel = "A look inside",
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
      <section className={"locked-panel " + tier}>
        <div className="lp-main">
          <span className="lp-badge">
            <LockIcon />
            {plan}
          </span>
          <h2 className="lp-title">{title}</h2>
          <p className="lp-body">{body}</p>
          <div className="lp-actions">
            <button className={"lp-cta " + tier} onClick={onUnlock}>
              {ctaLabel}
            </button>
            <button className="lp-compare" onClick={onComparePlans}>
              Compare plans
            </button>
          </div>
        </div>

        {points && points.length > 0 && (
          <ul className="lp-points">
            {points.map((pt) => (
              <li key={pt}>
                <span className={"lp-tick " + tier}>
                  <Tick />
                </span>
                {pt}
              </li>
            ))}
          </ul>
        )}
      </section>

      {preview && (
        <div className="locked-preview-block">
          <span className="locked-preview-label">{previewLabel}</span>
          <div className="locked-preview" aria-hidden="true">
            {preview}
          </div>
        </div>
      )}
    </div>
  );
}
