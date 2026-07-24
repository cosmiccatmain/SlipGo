import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import type { Tier } from "../lib/membership";

interface Props {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

interface Plan {
  tier: Tier;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  perks: string[];
}

// Placeholder pricing — real checkout arrives when Stripe is connected.
const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Search every slip in California.",
    perks: ["All 99 listings & the map", "BoatGoat Estimate", "goaty AI summaries", "Live wind", "1 boat saved"],
  },
  {
    tier: "plus",
    name: "Plus",
    price: "$14",
    cadence: "/mo",
    blurb: "The details that decide a slip.",
    perks: [
      "Crime & Safety ratings",
      "Slip neighbors",
      "Curated Trips + slip prices",
      "Wind-timed routes",
      "3 boats saved",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    price: "$39",
    cadence: "/mo",
    blurb: "For liveaboards and long cruises.",
    perks: [
      "Everything in Plus",
      "Build custom multi-stop trips",
      "Fuel & pump-out planning",
      "Full Grand Tour routes",
      "Unlimited boats",
    ],
  },
];

export function PlansModal({ open, onClose, onToast }: Props) {
  const { tier: currentTier, chooseTier } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = async (plan: Plan) => {
    await chooseTier(plan.tier);
    onClose();
    onToast(
      plan.tier === "free"
        ? "You're on the Free plan."
        : `${plan.name} unlocked. Billing goes live when Stripe is connected.`,
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal plans-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Choose your BoatGoat plan"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <div className="modal-brand">
          <div className="modal-title">Choose your plan</div>
          <div className="modal-sub">Upgrade or downgrade any time. Free stays free.</div>
        </div>

        <div className="plan-grid">
          {PLANS.map((p) => (
            <div key={p.tier} className={"plan-card " + p.tier + (currentTier === p.tier ? " current" : "")}>
              <div className="plan-head">
                <span className={"plan-name " + p.tier}>{p.name}</span>
                {currentTier === p.tier && <span className="plan-current">Current</span>}
              </div>
              <div className="plan-price">
                {p.price}
                <small>{p.cadence}</small>
              </div>
              <p className="plan-blurb">{p.blurb}</p>
              <ul className="plan-perks">
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button
                className={"plan-cta " + p.tier}
                disabled={currentTier === p.tier}
                onClick={() => pick(p)}
              >
                {currentTier === p.tier ? "Your plan" : p.tier === "free" ? "Stay on Free" : `Get ${p.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="modal-note">
          Payments aren't live yet — selecting a paid plan unlocks it for testing until
          Stripe checkout is connected.
        </p>
      </div>
    </div>
  );
}
