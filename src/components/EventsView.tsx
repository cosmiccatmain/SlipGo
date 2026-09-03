import { events } from "../data/listings";

// SlipGo Events — what's happening on the water, harbor by harbor.
// Event names are set in cursive black (see .event-name in styles.css).

export function EventsView() {
  return (
    <div className="events-view">
      <header className="events-hero">
        <h1>
          SlipGo <span className="events-script">Events</span>
        </h1>
        <p>
          Parades, races and festivals across the harbors we cover — plan a
          slip around the ones worth showing up for.
        </p>
      </header>

      <div className="event-list">
        {events.map((ev) => (
          <article className="event-card" key={ev.id}>
            <div className="event-date-block">
              <span className="event-month">{ev.month}</span>
              <span className="event-day">{ev.day}</span>
            </div>
            <div className="event-body">
              <h2 className="event-name">{ev.title}</h2>
              <p className="event-meta">{ev.detail}</p>
              {ev.harbor && <span className="event-harbor">{ev.harbor}</span>}
            </div>
          </article>
        ))}
      </div>

      <p className="events-foot">
        Dates are illustrative sample data for the MVP — event calendars get wired to
        each harbor's official schedule next.
      </p>
    </div>
  );
}
