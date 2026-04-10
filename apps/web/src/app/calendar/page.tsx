import { LegacyCalendarInit } from "../legacy-init";

export default function CalendarPage() {
  return (
    <>
      <div className="app">
        <header className="header">
          <h1>Calendar</h1>
          <p className="tagline">Plan tasks for future days and track what you completed.</p>

          <button type="button" className="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            Light
          </button>
        </header>

        <main className="calendar-main">
          <section className="panel calendar-controls" aria-label="Calendar controls">
            <h2>Pick a date</h2>

            <div className="calendar-date-row">
              <button type="button" className="btn btn-ghost calendar-nav-btn" id="cal-prev-btn">
                Prev
              </button>
              <input type="date" id="cal-date" className="calendar-date-input" />
              <button type="button" className="btn btn-ghost calendar-nav-btn" id="cal-next-btn">
                Next
              </button>
            </div>

            <div className="calendar-summary" id="cal-summary"></div>
            <div className="calendar-note">
              Actions edit this day only. Previous days remain in history.
            </div>
          </section>

          <section className="panel calendar-col">
            <h2>Planned (To-do)</h2>
            <ul className="task-list" id="cal-planned-list" aria-live="polite"></ul>
            <p className="empty-hint" id="cal-planned-empty" hidden>No planned tasks for this day.</p>

            <div className="calendar-form">
              <h3 className="calendar-form-title">Add planned task</h3>
              <form id="cal-add-planned-form" autoComplete="off">
                <input
                  id="cal-planned-text"
                  type="text"
                  maxLength={120}
                  placeholder="Task name"
                  required
                />
                <input id="cal-planned-mins" type="number" min={1} max={480} step={1} defaultValue={25} required />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
            </div>
          </section>

          <section className="panel calendar-col">
            <h2>Completed (Done)</h2>
            <ul className="task-list" id="cal-done-list" aria-live="polite"></ul>
            <p className="empty-hint" id="cal-done-empty" hidden>No completed tasks for this day.</p>

            <div className="calendar-form">
              <h3 className="calendar-form-title">Add completed task</h3>
              <form id="cal-add-done-form" autoComplete="off">
                <input id="cal-done-text" type="text" maxLength={120} placeholder="Task name" required />
                <input id="cal-done-est-mins" type="number" min={1} max={480} step={1} defaultValue={25} required />
                <input
                  id="cal-done-taken-mins"
                  type="number"
                  min={0}
                  max={480}
                  step={1}
                  defaultValue={25}
                  required
                />
                <button type="submit" className="btn btn-accent">Add</button>
              </form>
            </div>
          </section>
        </main>
      </div>

      <LegacyCalendarInit />
    </>
  );
}

