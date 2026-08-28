import { useAuth } from "../lib/auth";
import { AccountMenu } from "./AccountMenu";

export type NavKey = "rent" | "buy" | "guest" | "yacht";
export type View = "search" | "trips" | "events" | "pricing" | "boats" | "settings" | "billing";

interface Props {
  activeNav: NavKey;
  onNav: (key: NavKey) => void;
  view: View;
  onView: (v: View) => void;
  onPricing: () => void;
  onSignIn: () => void;
  onToast: (msg: string) => void;
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: "rent", label: "Rent a slip" },
  { key: "buy", label: "Buy a slip" },
  { key: "guest", label: "Guest docks" },
  { key: "yacht", label: "Yacht clubs" },
];

/** Small keyhole glyph — replaces the emoji padlock the nav used to show. */
function LockGlyph() {
  return (
    <svg className="nav-lock" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17 9V7A5 5 0 0 0 7 7v2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3ZM9 7a3 3 0 0 1 6 0v2H9Zm4 9.7V18a1 1 0 0 1-2 0v-1.3a2 2 0 1 1 2 0Z"
      />
    </svg>
  );
}

export function Header({
  activeNav, onNav, view, onView, onPricing, onSignIn, onToast,
}: Props) {
  const { user } = useAuth();
  const inSearch = view === "search";
  const isLocked = !user;

  // A locked item is a doorway, not a dead end: keep it enabled so it's
  // focusable and clickable, and send the click to sign-in. `disabled` made
  // these unreachable by keyboard and killed the tooltip.
  const navClass = (active: boolean) =>
    "nav-link" + (active ? " active" : "") + (isLocked ? " locked" : "");

  const handle = (fn: () => void) => () => (isLocked ? onSignIn() : fn());

  return (
    <header className="header">
      <nav className="header-side header-left">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={navClass(inSearch && activeNav === item.key)}
            onClick={handle(() => onNav(item.key))}
            title={isLocked ? "Free — sign up to open" : undefined}
          >
            {item.label}
            {isLocked && <LockGlyph />}
          </button>
        ))}
        <button
          className={navClass(view === "trips")}
          onClick={handle(() => onView("trips"))}
          title={isLocked ? "Free — sign up to open" : undefined}
        >
          Trips
          {isLocked && <LockGlyph />}
        </button>
        <button
          className={navClass(view === "events")}
          onClick={handle(() => onView("events"))}
          title={isLocked ? "Free — sign up to open" : undefined}
        >
          Events
          {isLocked && <LockGlyph />}
        </button>
      </nav>

      <button className="logo" onClick={handle(() => onNav("rent"))} aria-label="SlipGo home">
        <img src="/logo-mark.png" alt="" className="logo-mark" />
        <span className="logo-word">
          <span className="logo-slip">Slip</span><span className="logo-go">Go</span>
          {view === "trips" && <span className="logo-trips">Trips</span>}
          {view === "events" && <span className="logo-events">Events</span>}
        </span>
      </button>

      <nav className="header-side header-right">
        <button
          className={"nav-link" + (view === "pricing" ? " active" : "")}
          onClick={onPricing}
        >
          Pricing
        </button>
        <button className="nav-link" onClick={() => onToast("Help center is coming soon.")}>
          Help
        </button>
        {user ? (
          <AccountMenu
            onBoats={() => onView("boats")}
            onSettings={() => onView("settings")}
            onBilling={() => onView("billing")}
            onToast={onToast}
          />
        ) : (
          <button className="btn-signup" onClick={onSignIn}>
            Sign up
          </button>
        )}
      </nav>
    </header>
  );
}
