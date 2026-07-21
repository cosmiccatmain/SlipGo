import { useEffect, useRef, useState } from "react";
import { events } from "../data/listings";

export type NavKey = "rent" | "buy" | "guest" | "yacht";

interface Props {
  activeNav: NavKey;
  onNav: (key: NavKey) => void;
  onSignIn: () => void;
  onToast: (msg: string) => void;
}

const NAV_ITEMS: { key: NavKey; label: string }[] = [
  { key: "rent", label: "Rent a slip" },
  { key: "buy", label: "Buy a slip" },
  { key: "guest", label: "Guest docks" },
  { key: "yacht", label: "Yacht clubs" },
];

export function Header({ activeNav, onNav, onSignIn, onToast }: Props) {
  const [eventsOpen, setEventsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eventsOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setEventsOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [eventsOpen]);

  return (
    <header className="header">
      <nav className="header-side header-left">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={"nav-link" + (activeNav === item.key ? " active" : "")}
            onClick={() => onNav(item.key)}
          >
            {item.label}
          </button>
        ))}
        <div className="nav-menu" ref={menuRef}>
          <button
            className={"nav-link nav-button" + (eventsOpen ? " open" : "")}
            onClick={() => setEventsOpen((o) => !o)}
          >
            Events <span className="chev">▾</span>
          </button>
          {eventsOpen && (
            <div className="events-menu pop-enter">
              <div className="events-menu-title">On the water in Marina del Rey</div>
              {events.map((ev) => (
                <div className="event-row" key={ev.id}>
                  <div className="event-date">
                    <span className="event-month">{ev.month}</span>
                    <span className="event-day">{ev.day}</span>
                  </div>
                  <div>
                    <div className="event-title">{ev.title}</div>
                    <div className="event-detail">{ev.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      <button className="logo" onClick={() => onNav("rent")} aria-label="BoatGoat home">
        <img src="/logo-mark.png" alt="" className="logo-mark" />
        <span className="logo-word">
          <span className="logo-boat">Boat</span><span className="logo-goat-word">Goat</span>
        </span>
      </button>

      <nav className="header-side header-right">
        <button className="nav-link" onClick={() => onToast("Listing tools are coming soon.")}>
          List your marina
        </button>
        <button className="nav-link" onClick={() => onToast("Boat loans are coming soon.")}>
          Boat loans
        </button>
        <button className="nav-link" onClick={() => onToast("Help center is coming soon.")}>
          Help
        </button>
        <button className="nav-link signin" onClick={onSignIn}>
          Sign in
        </button>
      </nav>
    </header>
  );
}
