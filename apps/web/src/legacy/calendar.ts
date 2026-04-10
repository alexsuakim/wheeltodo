import type { DayRecord, Task } from "./types";

const DB_NAME = "wheelTodoDB";
const DB_VERSION = 1;
const DB_STORE_DAYS = "days";

const MIN_MINUTES = 1;
const MAX_MINUTES = 480;

type DbState = {
  db: IDBDatabase | null;
  dbReady: Promise<IDBDatabase> | null;
};

function clampMinutes(m: number, fallback = 25) {
  if (!Number.isFinite(m)) return fallback;
  const r = Math.round(m);
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, r));
}

function minutesToMs(minutes: number) {
  return clampMinutes(minutes) * 60 * 1000;
}

function newId() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function toDateKeyFromInput(val: string | null) {
  if (!val || typeof val !== "string") return null;
  const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function dateKeyToDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function normalizeTaskMaybe(raw: unknown): Task | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    return { id: newId(), text: t, minutes: 25 };
  }
  if (typeof raw === "object") {
    const r = raw as Partial<Task>;
    if (typeof r.text !== "string") return null;
    return {
      id: typeof r.id === "string" ? r.id : newId(),
      text: r.text.trim(),
      minutes: clampMinutes(Number(r.minutes)),
      completedAt: typeof r.completedAt === "number" ? r.completedAt : undefined,
      elapsedMs: typeof r.elapsedMs === "number" ? r.elapsedMs : undefined,
      remainingMs: typeof r.remainingMs === "number" ? r.remainingMs : undefined,
      runningAtCompletion: typeof r.runningAtCompletion === "boolean" ? r.runningAtCompletion : undefined,
    };
  }
  return null;
}

function openDb(state: DbState): Promise<IDBDatabase> {
  if (state.dbReady) return state.dbReady;
  state.dbReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(DB_STORE_DAYS)) {
        database.createObjectStore(DB_STORE_DAYS, { keyPath: "dateKey" });
      }
    };
    req.onsuccess = () => {
      state.db = req.result;
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
  return state.dbReady;
}

async function loadDayData(state: DbState, dateKey: string): Promise<DayRecord> {
  const database = await openDb(state);
  return await new Promise((resolve, reject) => {
    const tx = database.transaction([DB_STORE_DAYS], "readonly");
    const store = tx.objectStore(DB_STORE_DAYS);
    const getReq = store.get(dateKey);
    getReq.onsuccess = () => {
      const res = getReq.result as unknown;
      if (res && typeof res === "object") {
        const r = res as Partial<DayRecord>;
        resolve({
          dateKey,
          tasks: Array.isArray(r.tasks) ? (r.tasks.map(normalizeTaskMaybe).filter(Boolean) as Task[]) : [],
          doneTasks: Array.isArray(r.doneTasks) ? (r.doneTasks.map(normalizeTaskMaybe).filter(Boolean) as Task[]) : [],
        });
        return;
      }
      resolve({ dateKey, tasks: [], doneTasks: [] });
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function saveDayData(state: DbState, dateKey: string, tasks: Task[], doneTasks: Task[]) {
  const database = await openDb(state);
  return await new Promise<boolean>((resolve, reject) => {
    const tx = database.transaction([DB_STORE_DAYS], "readwrite");
    const store = tx.objectStore(DB_STORE_DAYS);
    store.put({ dateKey, tasks, doneTasks });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

const THEME_STORAGE_KEY = "wheelTodoApp.theme";
function preferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function setTheme(theme: string) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("theme-dark", isDark);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = isDark ? "Light" : "Dark";
}

export function initCalendar() {
  const w = window as unknown as { __wheelTodoCalendarInited?: boolean };
  if (w.__wheelTodoCalendarInited) return;
  w.__wheelTodoCalendarInited = true;

  const dateInput = document.getElementById("cal-date") as HTMLInputElement | null;
  const prevBtn = document.getElementById("cal-prev-btn") as HTMLButtonElement | null;
  const nextBtn = document.getElementById("cal-next-btn") as HTMLButtonElement | null;
  const summaryEl = document.getElementById("cal-summary") as HTMLElement | null;

  const plannedList = document.getElementById("cal-planned-list") as HTMLUListElement | null;
  const plannedEmpty = document.getElementById("cal-planned-empty") as HTMLElement | null;
  const doneList = document.getElementById("cal-done-list") as HTMLUListElement | null;
  const doneEmpty = document.getElementById("cal-done-empty") as HTMLElement | null;

  const plannedForm = document.getElementById("cal-add-planned-form") as HTMLFormElement | null;
  const plannedTextInput = document.getElementById("cal-planned-text") as HTMLInputElement | null;
  const plannedMinsInput = document.getElementById("cal-planned-mins") as HTMLInputElement | null;

  const doneForm = document.getElementById("cal-add-done-form") as HTMLFormElement | null;
  const doneTextInput = document.getElementById("cal-done-text") as HTMLInputElement | null;
  const doneEstMinsInput = document.getElementById("cal-done-est-mins") as HTMLInputElement | null;
  const doneTakenMinsInput = document.getElementById("cal-done-taken-mins") as HTMLInputElement | null;

  if (
    !dateInput ||
    !prevBtn ||
    !nextBtn ||
    !summaryEl ||
    !plannedList ||
    !plannedEmpty ||
    !doneList ||
    !doneEmpty ||
    !plannedForm ||
    !plannedTextInput ||
    !plannedMinsInput ||
    !doneForm ||
    !doneTextInput ||
    !doneEstMinsInput ||
    !doneTakenMinsInput
  ) {
    return;
  }

  // From here on, all required DOM elements are present.
  const plannedListEl = plannedList;
  const plannedEmptyEl = plannedEmpty;
  const doneListEl = doneList;
  const doneEmptyEl = doneEmpty;
  const summaryElEl = summaryEl;

  const dbState: DbState = { db: null, dbReady: null };

  function summarize(tasks: Task[], doneTasks: Task[]) {
    const plannedMs = tasks.reduce((sum, t) => sum + minutesToMs(t.minutes), 0);
    const doneMs = doneTasks.reduce((sum, t) => {
      if (typeof t.elapsedMs === "number" && Number.isFinite(t.elapsedMs)) return sum + Math.max(0, t.elapsedMs);
      const total = minutesToMs(t.minutes);
      if (typeof t.remainingMs === "number" && Number.isFinite(t.remainingMs)) return sum + Math.max(0, total - t.remainingMs);
      return sum + total;
    }, 0);
    const total = plannedMs + doneMs;
    const percent = total > 0 ? (doneMs / total) * 100 : 0;
    const percentInt = Math.round(Math.max(0, Math.min(100, percent)));
    return `${Math.round(doneMs / 60000)} min done · ${Math.round(plannedMs / 60000)} min planned · ${percentInt}% time progress`;
  }

  async function renderSelectedDate(dateKey: string) {
    const day = await loadDayData(dbState, dateKey);

    plannedListEl.innerHTML = "";
    doneListEl.innerHTML = "";

    const planned = day.tasks.slice().sort((a, b) => a.text.localeCompare(b.text));
    const done = day.doneTasks.slice().sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

    plannedEmptyEl.hidden = planned.length !== 0;
    doneEmptyEl.hidden = done.length !== 0;

    for (const task of planned) {
      const li = document.createElement("li");
      li.className = "task-item";
      const body = document.createElement("div");
      body.className = "task-item-body";
      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = task.text;
      const meta = document.createElement("span");
      meta.className = "task-item-mins";
      meta.textContent = `${clampMinutes(task.minutes)} min`;
      body.append(title, meta);
      li.append(body);
      plannedListEl.appendChild(li);
    }

    for (const task of done) {
      const li = document.createElement("li");
      li.className = "task-item";
      const body = document.createElement("div");
      body.className = "task-item-body";
      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = task.text;
      const meta = document.createElement("span");
      meta.className = "task-item-mins";
      const elapsedMs =
        typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)
          ? Math.max(0, task.elapsedMs)
          : minutesToMs(task.minutes);
      meta.textContent = `Took ${formatTime(elapsedMs)}`;
      body.append(title, meta);
      li.append(body);
      doneListEl.appendChild(li);
    }

    summaryElEl.textContent = summarize(planned, done);
  }

  // Theme
  setTheme(preferredTheme());
  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const current = document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setTheme(next);
  });

  // Init with today's date
  const today = localDayKey(new Date());
  dateInput.value = today;
  void renderSelectedDate(today);

  prevBtn.addEventListener("click", () => {
    const key = toDateKeyFromInput(dateInput.value) ?? localDayKey(new Date());
    const d = dateKeyToDate(key);
    d.setDate(d.getDate() - 1);
    dateInput.value = localDayKey(d);
    void renderSelectedDate(dateInput.value);
  });
  nextBtn.addEventListener("click", () => {
    const key = toDateKeyFromInput(dateInput.value) ?? localDayKey(new Date());
    const d = dateKeyToDate(key);
    d.setDate(d.getDate() + 1);
    dateInput.value = localDayKey(d);
    void renderSelectedDate(dateInput.value);
  });
  dateInput.addEventListener("change", () => {
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    void renderSelectedDate(key);
  });

  plannedForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    const text = plannedTextInput.value.trim();
    if (!text) return;
    const mins = clampMinutes(parseInt(plannedMinsInput.value, 10));
    const day = await loadDayData(dbState, key);
    day.tasks.push({ id: newId(), text, minutes: mins });
    await saveDayData(dbState, key, day.tasks, day.doneTasks);
    plannedTextInput.value = "";
    plannedMinsInput.value = "25";
    await renderSelectedDate(key);
  });

  doneForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    const text = doneTextInput.value.trim();
    if (!text) return;
    const est = clampMinutes(parseInt(doneEstMinsInput.value, 10));
    const taken = clampMinutes(parseInt(doneTakenMinsInput.value, 10), est);
    const completedAt = new Date(`${key}T12:00:00`).getTime();
    const day = await loadDayData(dbState, key);
    day.doneTasks.push({
      id: newId(),
      text,
      minutes: est,
      completedAt,
      elapsedMs: minutesToMs(taken),
      remainingMs: 0,
      runningAtCompletion: false,
    });
    await saveDayData(dbState, key, day.tasks, day.doneTasks);
    doneTextInput.value = "";
    doneEstMinsInput.value = "25";
    doneTakenMinsInput.value = "25";
    await renderSelectedDate(key);
  });
}

