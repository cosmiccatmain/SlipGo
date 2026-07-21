import { useEffect, useRef, useState } from "react";
import { events } from "../data/listings";

export function Header() {
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
        <a className="nav-link active" href="#">Rent a slip</a>
        <a className="nav-link" href="#">Buy a slip</a>
        <a className="nav-link" href="#">Guest docks</a>
        <a className="nav-link" href="#">Yacht clubs</a>
        <div className="nav-menu" ref={menuRef}>
          <button
            className={"nav-link nav-button" + (eventsOpen ? " open" : "")}
            onClick={() => setEventsOpen((o) => !o)}
          >
            Events
          </button>
          {eventsOpen && (
            <div className="events-menu">
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

      <a className="logo" href="#" aria-label="BoatGoat home">
        <span className="logo-goat" aria-hidden="true">🐐</span>
        <span className="logo-word">BoatGoat</span>
      </a>

      <nav className="header-side header-right">
        <a className="nav-link" href="#">List your marina</a>
        <a className="nav-link" href="#">Boat loans</a>
        <a className="nav-link" href="#">Help</a>
        <a className="nav-link signin" href="#">Sign in</a>
      </nav>
    </header>
  );
}
