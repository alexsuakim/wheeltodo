(function () {
  "use strict";

  const DB_NAME = "wheelTodoDB";
  const DB_VERSION = 1;
  const DB_STORE_DAYS = "days";

  const LEGACY_STORAGE_KEY = "wheelTodoApp.v1";

  const MIN_MINUTES = 1;
  const MAX_MINUTES = 480;

  const taskFormPlanned = document.getElementById("cal-add-planned-form");
  const plannedTextInput = document.getElementById("cal-planned-text");
  const plannedMinsInput = document.getElementById("cal-planned-mins");

  const taskFormDone = document.getElementById("cal-add-done-form");
  const doneTextInput = document.getElementById("cal-done-text");
  const doneEstMinsInput = document.getElementById("cal-done-est-mins");
  const doneTakenMinsInput = document.getElementById("cal-done-taken-mins");

  const plannedList = document.getElementById("cal-planned-list");
  const plannedEmpty = document.getElementById("cal-planned-empty");
  const doneList = document.getElementById("cal-done-list");
  const doneEmpty = document.getElementById("cal-done-empty");

  const dateInput = document.getElementById("cal-date");
  const prevBtn = document.getElementById("cal-prev-btn");
  const nextBtn = document.getElementById("cal-next-btn");
  const summaryEl = document.getElementById("cal-summary");

  const themeToggleBtn = document.getElementById("theme-toggle");
  const THEME_STORAGE_KEY = "wheelTodoApp.theme";

  const calendarColEls = document.querySelectorAll(".calendar-col");

  let db = null;
  let dbReady = null;

  function clampMinutes(m, fallback = 25) {
    if (!Number.isFinite(m)) return fallback;
    const r = Math.round(m);
    return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, r));
  }

  function minutesToMs(minutes) {
    return clampMinutes(minutes) * 60 * 1000;
  }

  function newId() {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  function toDateKeyFromInput(val) {
    // val comes like "YYYY-MM-DD"
    if (!val || typeof val !== "string") return null;
    const m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return `${m[1]}-${m[2]}-${m[3]}`;
  }

  function dateKeyToDate(dateKey) {
    const [y, m, d] = dateKey.split("-").map((x) => parseInt(x, 10));
    return new Date(y, m - 1, d);
  }

  function localDayKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function preferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("theme-dark", isDark);
    if (themeToggleBtn) themeToggleBtn.textContent = isDark ? "Light" : "Dark";
  }

  function openDb() {
    if (dbReady) return dbReady;
    dbReady = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(DB_STORE_DAYS)) {
          database.createObjectStore(DB_STORE_DAYS, { keyPath: "dateKey" });
        }
      };
      req.onsuccess = () => {
        db = req.result;
        resolve(db);
      };
      req.onerror = () => reject(req.error);
    });
    return dbReady;
  }

  async function loadDayData(dateKey) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([DB_STORE_DAYS], "readonly");
      const store = tx.objectStore(DB_STORE_DAYS);
      const getReq = store.get(dateKey);
      getReq.onsuccess = () => {
        const res = getReq.result;
        resolve(
          res && typeof res === "object"
            ? res
            : { dateKey, tasks: [], doneTasks: [] }
        );
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async function saveDayData(dateKey, nextTasks, nextDoneTasks) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([DB_STORE_DAYS], "readwrite");
      const store = tx.objectStore(DB_STORE_DAYS);
      store.put({ dateKey, tasks: nextTasks, doneTasks: nextDoneTasks });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  function normalizeTaskMaybe(raw) {
    if (!raw) return null;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (!t) return null;
      return { id: newId(), text: t, minutes: 25 };
    }
    if (typeof raw === "object" && typeof raw.text === "string") {
      return {
        id: typeof raw.id === "string" ? raw.id : newId(),
        text: raw.text.trim(),
        minutes: clampMinutes(Number(raw.minutes)),
        completedAt: typeof raw.completedAt === "number" ? raw.completedAt : undefined,
        elapsedMs: typeof raw.elapsedMs === "number" ? raw.elapsedMs : undefined,
        remainingMs: typeof raw.remainingMs === "number" ? raw.remainingMs : undefined,
        runningAtCompletion:
          typeof raw.runningAtCompletion === "boolean" ? raw.runningAtCompletion : undefined,
      };
    }
    return null;
  }

  function getEmptyOrNormalizedTasks(tasks, doneTasks) {
    const t = Array.isArray(tasks) ? tasks.map(normalizeTaskMaybe).filter(Boolean) : [];
    const d = Array.isArray(doneTasks) ? doneTasks.map(normalizeTaskMaybe).filter(Boolean) : [];
    // done tasks should have completedAt; we keep them anyway.
    return { tasks: t, doneTasks: d };
  }

  function summarize(dateKey, tasks, doneTasks) {
    const plannedMs = tasks.reduce((sum, t) => sum + minutesToMs(t.minutes), 0);
    const doneMs = doneTasks.reduce((sum, t) => {
      if (typeof t.elapsedMs === "number" && Number.isFinite(t.elapsedMs)) return sum + Math.max(0, t.elapsedMs);
      // Fallback: if remainingMs present, derive elapsed.
      const total = minutesToMs(t.minutes);
      if (typeof t.remainingMs === "number" && Number.isFinite(t.remainingMs)) {
        return sum + Math.max(0, total - t.remainingMs);
      }
      return sum + total;
    }, 0);

    const total = plannedMs + doneMs;
    const percent = total > 0 ? (doneMs / total) * 100 : 0;
    const percentInt = Math.round(Math.max(0, Math.min(100, percent)));

    const plannedMin = Math.round(plannedMs / 60000);
    const doneMin = Math.round(doneMs / 60000);
    return `${doneMin} min done · ${plannedMin} min planned · ${percentInt}% time progress`;
  }

  function render(dateKey, { tasks, doneTasks }) {
    plannedList.innerHTML = "";
    doneList.innerHTML = "";

    const planned = tasks.slice().sort((a, b) => a.text.localeCompare(b.text));
    const done = doneTasks.slice().sort((a, b) => {
      // Prefer completedAt ordering, fall back to text.
      const av = typeof a.completedAt === "number" ? a.completedAt : 0;
      const bv = typeof b.completedAt === "number" ? b.completedAt : 0;
      if (bv !== av) return bv - av;
      return a.text.localeCompare(b.text);
    });

    plannedEmpty.hidden = planned.length !== 0;
    doneEmpty.hidden = done.length !== 0;

    planned.forEach((task) => {
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

      const completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.className = "task-done-now";
      completeBtn.textContent = "✓";
      completeBtn.setAttribute("aria-label", `Mark completed: ${task.text}`);
      completeBtn.addEventListener("click", () => {
        const takenStr = window.prompt("Minutes taken (actual)?", String(task.minutes));
        if (takenStr == null) return;
        const taken = clampMinutes(parseInt(takenStr, 10), task.minutes);
        markPlannedAsDone(dateKey, task.id, taken);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "task-remove";
      delBtn.textContent = "×";
      delBtn.setAttribute("aria-label", `Delete planned task: ${task.text}`);
      delBtn.addEventListener("click", () => {
        deletePlannedTask(dateKey, task.id);
      });

      li.append(body, completeBtn, delBtn);
      plannedList.appendChild(li);
    });

    done.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";

      const body = document.createElement("div");
      body.className = "task-item-body";

      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = task.text;

      const meta = document.createElement("span");
      meta.className = "task-item-mins";

      const elapsedMs = (() => {
        if (typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)) return Math.max(0, task.elapsedMs);
        const total = minutesToMs(task.minutes);
        if (typeof task.remainingMs === "number" && Number.isFinite(task.remainingMs)) {
          return Math.max(0, total - task.remainingMs);
        }
        return total;
      })();

      meta.textContent = `Took ${formatTime(elapsedMs)}`;

      body.append(title, meta);

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "task-start";
      editBtn.textContent = "⟲";
      editBtn.setAttribute("aria-label", `Edit minutes taken: ${task.text}`);
      editBtn.addEventListener("click", () => {
        const curMin = Math.max(0, Math.round(elapsedMs / 60000));
        const takenStr = window.prompt("Minutes taken (actual)?", String(curMin));
        if (takenStr == null) return;
        const taken = clampMinutes(parseInt(takenStr, 10), curMin);
        editDoneTaskElapsed(dateKey, task.id, taken);
      });

      const revertBtn = document.createElement("button");
      revertBtn.type = "button";
      revertBtn.className = "task-revert";
      revertBtn.textContent = "↩";
      revertBtn.setAttribute("aria-label", `Revert to planned: ${task.text}`);
      revertBtn.addEventListener("click", () => {
        revertDoneToPlanned(dateKey, task.id);
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "task-remove";
      delBtn.textContent = "×";
      delBtn.setAttribute("aria-label", `Delete completed task: ${task.text}`);
      delBtn.addEventListener("click", () => {
        deleteDoneTask(dateKey, task.id);
      });

      li.append(body, revertBtn, editBtn, delBtn);
      doneList.appendChild(li);
    });

    summaryEl.textContent = summarize(dateKey, planned, done);
  }

  async function getCurrentDay(dateKey) {
    const day = await loadDayData(dateKey);
    return getEmptyOrNormalizedTasks(day.tasks, day.doneTasks);
  }

  async function refreshForSelectedDate() {
    const key = toDateKeyFromInput(dateInput.value) || localDayKey(new Date());
    renderSelectedDate(key);
  }

  async function renderSelectedDate(dateKey) {
    const data = await getCurrentDay(dateKey);
    render(dateKey, data);
  }

  async function deletePlannedTask(dateKey, taskId) {
    const day = await getCurrentDay(dateKey);
    const nextTasks = day.tasks.filter((t) => t.id !== taskId);
    await saveDayData(dateKey, nextTasks, day.doneTasks);
    renderSelectedDate(dateKey);
  }

  async function markPlannedAsDone(dateKey, taskId, takenMinutes) {
    const day = await getCurrentDay(dateKey);
    const task = day.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completedAt = new Date(`${dateKey}T12:00:00`).getTime();
    const doneTask = {
      ...task,
      completedAt,
      elapsedMs: minutesToMs(takenMinutes),
      remainingMs: 0,
      runningAtCompletion: false,
    };
    const nextTasks = day.tasks.filter((t) => t.id !== taskId);
    const nextDone = day.doneTasks.concat(doneTask);
    await saveDayData(dateKey, nextTasks, nextDone);
    renderSelectedDate(dateKey);
  }

  async function deleteDoneTask(dateKey, taskId) {
    const day = await getCurrentDay(dateKey);
    const nextDone = day.doneTasks.filter((t) => t.id !== taskId);
    await saveDayData(dateKey, day.tasks, nextDone);
    renderSelectedDate(dateKey);
  }

  async function editDoneTaskElapsed(dateKey, taskId, takenMinutes) {
    const day = await getCurrentDay(dateKey);
    const nextDone = day.doneTasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        elapsedMs: minutesToMs(takenMinutes),
        remainingMs: 0,
        runningAtCompletion: false,
      };
    });
    await saveDayData(dateKey, day.tasks, nextDone);
    renderSelectedDate(dateKey);
  }

  async function revertDoneToPlanned(dateKey, doneId) {
    const day = await getCurrentDay(dateKey);
    const doneTask = day.doneTasks.find((t) => t.id === doneId);
    if (!doneTask) return;
    const nextDone = day.doneTasks.filter((t) => t.id !== doneId);
    const plannedTask = {
      id: doneTask.id,
      text: doneTask.text,
      minutes: clampMinutes(Number(doneTask.minutes)),
    };
    const nextTasks = day.tasks.concat(plannedTask);
    await saveDayData(dateKey, nextTasks, nextDone);
    renderSelectedDate(dateKey);
  }

  async function addPlannedTask(dateKey, text, minutes) {
    const day = await getCurrentDay(dateKey);
    day.tasks.push({ id: newId(), text: text.trim(), minutes: clampMinutes(minutes) });
    await saveDayData(dateKey, day.tasks, day.doneTasks);
    renderSelectedDate(dateKey);
  }

  async function addDoneTask(dateKey, text, estMinutes, takenMinutes) {
    const day = await getCurrentDay(dateKey);
    const completedAt = new Date(`${dateKey}T12:00:00`).getTime();
    day.doneTasks.push({
      id: newId(),
      text: text.trim(),
      minutes: clampMinutes(estMinutes),
      completedAt,
      elapsedMs: minutesToMs(takenMinutes),
      remainingMs: 0,
      runningAtCompletion: false,
    });
    await saveDayData(dateKey, day.tasks, day.doneTasks);
    renderSelectedDate(dateKey);
  }

  taskFormPlanned.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    const text = plannedTextInput.value.trim();
    if (!text) return;
    const mins = clampMinutes(parseInt(plannedMinsInput.value, 10));
    await addPlannedTask(key, text, mins);
    plannedTextInput.value = "";
    plannedMinsInput.value = "25";
  });

  taskFormDone.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    const text = doneTextInput.value.trim();
    if (!text) return;
    const est = clampMinutes(parseInt(doneEstMinsInput.value, 10));
    const taken = clampMinutes(parseInt(doneTakenMinsInput.value, 10), est);
    await addDoneTask(key, text, est, taken);
    doneTextInput.value = "";
    doneEstMinsInput.value = "25";
    doneTakenMinsInput.value = "25";
  });

  prevBtn.addEventListener("click", () => {
    const key = toDateKeyFromInput(dateInput.value) || localDayKey(new Date());
    const d = dateKeyToDate(key);
    d.setDate(d.getDate() - 1);
    dateInput.value = localDayKey(d);
    renderSelectedDate(dateInput.value);
  });

  nextBtn.addEventListener("click", () => {
    const key = toDateKeyFromInput(dateInput.value) || localDayKey(new Date());
    const d = dateKeyToDate(key);
    d.setDate(d.getDate() + 1);
    dateInput.value = localDayKey(d);
    renderSelectedDate(dateInput.value);
  });

  dateInput.addEventListener("change", () => {
    const key = toDateKeyFromInput(dateInput.value);
    if (!key) return;
    renderSelectedDate(key);
  });

  if (themeToggleBtn) {
    setTheme(preferredTheme());
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      setTheme(next);
    });
  }

  // Init with today's date.
  const today = localDayKey(new Date());
  dateInput.value = today;
  renderSelectedDate(today);
})();

