import { useAuth } from "../lib/auth";

export type NavKey = "rent" | "buy" | "guest" | "yacht";
export type View = "search" | "trips" | "events" | "pricing";

interface Props {
  activeNav: NavKey;
  onNav: (key: NavKey) => void;
  view: View;
  onView: (v: View) => void;
  onPricing: () => void;
  onBoats: () => void;
  onSignIn: () => void;
  onToast: (msg: string) => void;
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: "rent", label: "Rent a slip" },
  { key: "buy", label: "Buy a slip" },
  { key: "guest", label: "Guest docks" },
  { key: "yacht", label: "Yacht clubs" },
];

export function Header({ activeNav, onNav, view, onView, onPricing, onBoats, onSignIn, onToast }: Props) {
  const { user, tier, signOut } = useAuth();
  const inSearch = view === "search";
  const isLocked = !user;

  const handleLockedClick = () => {
    onSignIn();
  };

  return (
    <header className="header">
      <nav className="header-side header-left">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={"nav-link" + (inSearch && activeNav === item.key ? " active" : "") + (isLocked ? " locked" : "")}
            onClick={() => isLocked ? handleLockedClick() : onNav(item.key)}
            title={isLocked ? "Sign up to unlock" : ""}
            disabled={isLocked}
          >
            {item.label}
            {isLocked && <span className="lock-icon" aria-hidden="true">🔒</span>}
          </button>
        ))}
        <button
          className={"nav-link" + (view === "trips" ? " active" : "") + (isLocked ? " locked" : "")}
          onClick={() => isLocked ? handleLockedClick() : onView("trips")}
          title={isLocked ? "Sign up to unlock" : ""}
          disabled={isLocked}
        >
          Trips
          {isLocked && <span className="lock-icon" aria-hidden="true">🔒</span>}
        </button>
        <button
          className={"nav-link" + (view === "events" ? " active" : "") + (isLocked ? " locked" : "")}
          onClick={() => isLocked ? handleLockedClick() : onView("events")}
          title={isLocked ? "Sign up to unlock" : ""}
          disabled={isLocked}
        >
          Events
          {isLocked && <span className="lock-icon" aria-hidden="true">🔒</span>}
        </button>
      </nav>

      <button className="logo" onClick={() => !isLocked && onNav("rent")} aria-label="SlipGo home">
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
        <button
          className="nav-link"
          onClick={() => onToast("Help center is coming soon.")}
        >
          Help
        </button>
        {user ? (
          <div className="account-wrap">
            <button className="nav-link" onClick={onBoats}>
              My boats
            </button>
            <span className="account-email" title={user.email ?? ""}>
              {user.email}
            </span>
            {tier !== "free" && <span className={"tier-chip " + tier}>{tier}</span>}
            <button
              className="nav-link signin"
              onClick={async () => {
                await signOut();
                onToast("Signed out.");
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button className="nav-link signin" onClick={onSignIn}>
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}
