import { LegacyWheelTodoInit } from "./legacy-init";

export default function Home() {
  return (
    <>
      {/* Legacy app markup (migrated from index.html) */}
      <div className="app">
        <header className="header">
          <h1>Wheel Todo</h1>
          <p className="tagline">Add tasks, spin the wheel, focus with Pomodoro.</p>

          <button type="button" className="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
            Light
          </button>

          <a href="/calendar" className="calendar-open-btn" aria-label="Open calendar">Calendar</a>

          <button
            type="button"
            className="wheel-open-btn"
            id="wheel-open-btn"
            aria-label="Open wheel"
            data-tip="don't know where to start? select a random task by spinning the wheel!"
          >
            <canvas id="mini-wheel" width={92} height={92} aria-hidden="true"></canvas>
            <div className="wheel-mini-pointer" aria-hidden="true"></div>
          </button>
        </header>

        <main className="main">
          <section className="panel tasks-panel" aria-labelledby="tasks-heading">
            <h2 id="tasks-heading">Today’s tasks</h2>
            <form className="task-form" id="task-form" autoComplete="off">
              <div className="task-form-grow">
                <label className="sr-only" htmlFor="task-input">New task</label>
                <input
                  id="task-input"
                  type="text"
                  placeholder="What needs doing?"
                  maxLength={120}
                  required
                />
              </div>
              <div className="duration-field">
                <label className="sr-only" htmlFor="duration-input">Minutes to complete</label>
                <input
                  id="duration-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={480}
                  step={1}
                  defaultValue={25}
                  placeholder="Min"
                  required
                  aria-describedby="duration-hint"
                />
              </div>
              <button type="submit" className="btn btn-primary">Add</button>
              <p className="duration-hint" id="duration-hint">Estimated minutes for this task (used as the focus timer).</p>
            </form>
            <ul className="task-list" id="task-list" aria-live="polite"></ul>
            <p className="empty-hint" id="empty-hint">Add at least one task to spin the wheel.</p>
            <button type="button" className="btn btn-ghost" id="clear-tasks" hidden>
              Clear all tasks
            </button>

            <h2 id="done-heading">Done</h2>
            <ul className="task-list done-list" id="done-list" aria-live="polite"></ul>
            <p className="empty-hint" id="done-empty" hidden>
              Completed tasks will appear here.
            </p>
          </section>

          <div className="right-col">
            <section className="panel pomodoro-panel" aria-labelledby="pomo-heading">
              <h2 id="pomo-heading">Pomodoro</h2>
              <div className="pomo-idle" id="pomo-idle">
                <p className="pomo-placeholder">Spin the wheel to pick a task and start focusing.</p>
              </div>
              <div className="pomo-active" id="pomo-active" hidden>
                <p className="pomo-task-label">Working on</p>
                <p className="pomo-task-name" id="pomo-task-name"></p>
                <p className="pomo-planned" id="pomo-planned" hidden></p>
                <div className="pomo-time" id="pomo-time">00:00</div>
                <div className="pomo-controls">
                  <button type="button" className="btn btn-primary" id="pomo-toggle">Pause</button>
                  <button type="button" className="btn btn-done" id="pomo-done-btn" hidden>Done</button>
                  <button type="button" className="btn btn-ghost" id="pomo-reset">Reset</button>
                </div>
                <p className="pomo-done" id="pomo-done" hidden>Session complete. Nice work.</p>
              </div>
            </section>

            <section className="panel productivity-panel" aria-label="Daily productivity">
              <div className="productivity-widget" id="productivity-widget" aria-label="Daily productivity">
                <div className="productivity-title-row">
                  <div className="productivity-title">Daily productivity</div>
                  <div className="productivity-mode">
                    <button
                      type="button"
                      className="productivity-mode-btn productivity-mode-btn--active"
                      id="productivity-mode-time"
                    >
                      Time
                    </button>
                    <button type="button" className="productivity-mode-btn" id="productivity-mode-tasks">
                      Tasks
                    </button>
                  </div>
                </div>

                <div className="productivity-meta">
                  <div className="productivity-minutes" id="productivity-minutes">0 min</div>
                  <div className="productivity-task-meta" id="productivity-task-meta" hidden></div>
                </div>

                <div
                  className="productivity-bar"
                  id="productivity-bar-time"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                >
                  <div className="productivity-bar-fill" id="productivity-bar-time-fill"></div>
                  <div className="productivity-time-onbar" id="productivity-time-onbar" aria-hidden="true">
                    <span className="productivity-time-spent" id="productivity-time-spent">0 min spent</span>
                    <span className="productivity-time-sep"> · </span>
                    <span className="productivity-time-left" id="productivity-time-left">0 min left</span>
                  </div>
                </div>
                <div
                  className="productivity-bar"
                  id="productivity-bar-tasks"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                  hidden
                >
                  <div className="productivity-bar-fill" id="productivity-bar-tasks-fill"></div>
                </div>

                <div className="productivity-percent" id="productivity-percent">0%</div>
              </div>
            </section>
          </div>
        </main>

        <footer className="footer">
          <span>Focus timer matches each task’s estimated minutes · Tasks saved in this browser</span>
        </footer>
      </div>

      <div className="modal-overlay" id="result-modal" hidden role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div className="modal">
          <h3 id="result-title">You got</h3>
          <p className="modal-task" id="result-task"></p>
          <p className="modal-meta" id="result-duration"></p>
          <button type="button" className="btn btn-accent" id="modal-start">Start Pomodoro</button>
        </div>
      </div>

      <div
        className="wheel-modal-overlay"
        id="wheel-modal"
        hidden
        role="dialog"
        aria-modal="true"
        aria-labelledby="wheel-modal-title"
      >
        <div className="wheel-modal">
          <div className="wheel-modal-head">
            <h2 id="wheel-modal-title">Spin</h2>
            <button type="button" className="btn btn-ghost" id="wheel-close-btn" aria-label="Close wheel">
              ✕
            </button>
          </div>

          <div className="wheel-wrap wheel-wrap--modal">
            <canvas id="wheel" width={320} height={320} aria-hidden="true"></canvas>
            <div className="wheel-pointer" aria-hidden="true"></div>
          </div>

          <button type="button" className="btn btn-accent btn-spin" id="spin-btn" disabled>
            Spin the wheel
          </button>
        </div>
      </div>

      <canvas id="fireworks" className="fireworks-canvas" aria-hidden="true"></canvas>

      {/* Load legacy behavior */}
      <LegacyWheelTodoInit />
    </>
  );
}
