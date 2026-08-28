import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { planLabel } from "../lib/plans";

interface Props {
  onBoats: () => void;
  onSettings: () => void;
  onBilling: () => void;
  onToast: (msg: string) => void;
}

/** Two initials from an email, e.g. alex.j@… → AJ. */
function initials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_+]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "?";
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d={d} />
    </svg>
  );
}

const BOAT_D = "M4 17h16l-2 4H6l-2-4Zm2-2 1-5h10l1 5H6Zm5-7V3l6 3-6 2Z";
const GEAR_D =
  "M12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5Zm7.4-2.6.1-.9-.1-.9 1.9-1.5-1.9-3.3-2.3.8a7.4 7.4 0 0 0-1.5-.9L15.2 4h-3.8l-.4 2.2a7.4 7.4 0 0 0-1.5.9l-2.3-.8-1.9 3.3L7.2 11l-.1.9.1.9-1.9 1.5 1.9 3.3 2.3-.8c.5.4 1 .7 1.5.9l.4 2.3h3.8l.4-2.3c.5-.2 1-.5 1.5-.9l2.3.8 1.9-3.3Z";
const CARD_D = "M3 6h18a1 1 0 0 1 1 1v2H2V7a1 1 0 0 1 1-1Zm-1 5h20v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-6Zm3 4h5v2H5v-2Z";
const OUT_D = "M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v-2H5V5h5V3Zm6.2 4.6-1.4 1.4 2 2H8v2h8.8l-2 2 1.4 1.4L21 12l-4.8-4.4Z";

export function AccountMenu({ onBoats, onSettings, onBilling, onToast }: Props) {
  const { user, tier, boats, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape — a menu that traps you is worse
  // than no menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const email = user.email ?? "";

  const go = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="account-menu" ref={wrapRef}>
      <button
        className={"avatar-btn" + (open ? " open" : "")}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        title={email}
      >
        <span className={"avatar " + tier}>{initials(email)}</span>
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="ad-head">
            <span className={"avatar lg " + tier}>{initials(email)}</span>
            <div className="ad-id">
              <span className="ad-email" title={email}>{email}</span>
              <span className={"ad-plan " + tier}>{planLabel(tier)} plan</span>
            </div>
          </div>

          <div className="ad-group">
            <button role="menuitem" className="ad-item" onClick={go(onBoats)}>
              <Icon d={BOAT_D} />
              <span>Your boats</span>
              <span className="ad-count">{boats.length}</span>
            </button>
            <button role="menuitem" className="ad-item" onClick={go(onSettings)}>
              <Icon d={GEAR_D} />
              <span>Settings</span>
            </button>
            <button role="menuitem" className="ad-item" onClick={go(onBilling)}>
              <Icon d={CARD_D} />
              <span>Plan &amp; billing</span>
            </button>
          </div>

          <div className="ad-group">
            <button
              role="menuitem"
              className="ad-item danger"
              onClick={go(async () => {
                await signOut();
                onToast("Signed out.");
              })}
            >
              <Icon d={OUT_D} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
