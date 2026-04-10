import type { DayRecord, Task } from "./types";

const LEGACY_STORAGE_KEY = "wheelTodoApp.v1";
const DB_NAME = "wheelTodoDB";
const DB_VERSION = 1;
const DB_STORE_DAYS = "days";
const DEFAULT_MINUTES = 25;
const MIN_MINUTES = 1;
const MAX_MINUTES = 480;

const WHEEL_COLORS = [
  "#5b8def",
  "#6ee7b7",
  "#c4b5fd",
  "#fbbf24",
  "#f472b6",
  "#67e8f9",
  "#a3e635",
  "#fb923c",
  "#94a3b8",
  "#f87171",
];

function clampMinutes(m: number) {
  if (!Number.isFinite(m)) return DEFAULT_MINUTES;
  const r = Math.round(m);
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, r));
}

function minutesToMs(minutes: number) {
  return clampMinutes(minutes) * 60 * 1000;
}

function newId() {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function localDayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeTask(raw: unknown): Task | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    return { id: newId(), text: t, minutes: DEFAULT_MINUTES };
  }
  if (raw && typeof raw === "object") {
    const r = raw as Partial<Task>;
    if (typeof r.text !== "string") return null;
    const t = r.text.trim();
    if (!t) return null;
    return {
      id: typeof r.id === "string" ? r.id : newId(),
      text: t,
      minutes: clampMinutes(Number(r.minutes)),
      completedAt: typeof r.completedAt === "number" ? r.completedAt : undefined,
      elapsedMs: typeof r.elapsedMs === "number" ? r.elapsedMs : undefined,
      remainingMs: typeof r.remainingMs === "number" ? r.remainingMs : undefined,
      runningAtCompletion: typeof r.runningAtCompletion === "boolean" ? r.runningAtCompletion : undefined,
    };
  }
  return null;
}

function taskText(task: Task) {
  return task.text;
}

function taskMinutes(task: Task) {
  return clampMinutes(Number(task.minutes));
}

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type DbState = {
  db: IDBDatabase | null;
  dbReady: Promise<IDBDatabase> | null;
};

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

async function loadDayData(state: DbState, key: string): Promise<DayRecord> {
  const database = await openDb(state);
  return await new Promise((resolve, reject) => {
    const tx = database.transaction([DB_STORE_DAYS], "readonly");
    const store = tx.objectStore(DB_STORE_DAYS);
    const getReq = store.get(key);
    getReq.onsuccess = () => {
      const res = getReq.result as unknown;
      if (res && typeof res === "object") {
        const r = res as Partial<DayRecord>;
        resolve({
          dateKey: typeof r.dateKey === "string" ? r.dateKey : key,
          tasks: Array.isArray(r.tasks) ? r.tasks.map(normalizeTask).filter(Boolean) as Task[] : [],
          doneTasks: Array.isArray(r.doneTasks) ? r.doneTasks.map(normalizeTask).filter(Boolean) as Task[] : [],
        });
        return;
      }
      resolve({ dateKey: key, tasks: [], doneTasks: [] });
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

async function saveDayData(state: DbState, key: string, tasks: Task[], doneTasks: Task[]) {
  const database = await openDb(state);
  return await new Promise<boolean>((resolve, reject) => {
    const tx = database.transaction([DB_STORE_DAYS], "readwrite");
    const store = tx.objectStore(DB_STORE_DAYS);
    store.put({ dateKey: key, tasks, doneTasks });
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

export function initWheelTodo() {
  // Avoid double-init during Fast Refresh
  const w = window as unknown as { __wheelTodoInited?: boolean };
  if (w.__wheelTodoInited) return;
  w.__wheelTodoInited = true;

  const taskForm = document.getElementById("task-form") as HTMLFormElement | null;
  const taskInput = document.getElementById("task-input") as HTMLInputElement | null;
  const durationInput = document.getElementById("duration-input") as HTMLInputElement | null;
  const taskList = document.getElementById("task-list") as HTMLUListElement | null;
  const emptyHint = document.getElementById("empty-hint") as HTMLElement | null;
  const doneList = document.getElementById("done-list") as HTMLUListElement | null;
  const doneEmpty = document.getElementById("done-empty") as HTMLElement | null;
  const clearTasksBtn = document.getElementById("clear-tasks") as HTMLButtonElement | null;

  const spinBtn = document.getElementById("spin-btn") as HTMLButtonElement | null;
  const wheelOpenBtn = document.getElementById("wheel-open-btn") as HTMLButtonElement | null;
  const wheelModal = document.getElementById("wheel-modal") as HTMLElement | null;
  const wheelCloseBtn = document.getElementById("wheel-close-btn") as HTMLButtonElement | null;

  const resultModal = document.getElementById("result-modal") as HTMLElement | null;
  const resultTask = document.getElementById("result-task") as HTMLElement | null;
  const resultDuration = document.getElementById("result-duration") as HTMLElement | null;
  const modalStart = document.getElementById("modal-start") as HTMLButtonElement | null;

  const canvas = document.getElementById("wheel") as HTMLCanvasElement | null;
  const ctx = canvas?.getContext("2d") ?? null;
  const miniCanvas = document.getElementById("mini-wheel") as HTMLCanvasElement | null;
  const miniCtx = miniCanvas?.getContext("2d") ?? null;

  const pomoIdle = document.getElementById("pomo-idle") as HTMLElement | null;
  const pomoActive = document.getElementById("pomo-active") as HTMLElement | null;
  const pomoTaskName = document.getElementById("pomo-task-name") as HTMLElement | null;
  const pomoPlanned = document.getElementById("pomo-planned") as HTMLElement | null;
  const pomoTime = document.getElementById("pomo-time") as HTMLElement | null;
  const pomoToggle = document.getElementById("pomo-toggle") as HTMLButtonElement | null;
  const pomoDoneBtn = document.getElementById("pomo-done-btn") as HTMLButtonElement | null;
  const pomoReset = document.getElementById("pomo-reset") as HTMLButtonElement | null;
  const pomoDone = document.getElementById("pomo-done") as HTMLElement | null;

  const productivityMinutes = document.getElementById("productivity-minutes") as HTMLElement | null;
  const productivityPercent = document.getElementById("productivity-percent") as HTMLElement | null;
  const productivityTimeBar = document.getElementById("productivity-bar-time") as HTMLElement | null;
  const productivityTimeBarFill = document.getElementById("productivity-bar-time-fill") as HTMLElement | null;
  const productivityTasksBar = document.getElementById("productivity-bar-tasks") as HTMLElement | null;
  const productivityTasksBarFill = document.getElementById("productivity-bar-tasks-fill") as HTMLElement | null;
  const productivityTaskMeta = document.getElementById("productivity-task-meta") as HTMLElement | null;
  const productivityTimeOnbar = document.getElementById("productivity-time-onbar") as HTMLElement | null;
  const productivityTimeSpentEl = document.getElementById("productivity-time-spent") as HTMLElement | null;
  const productivityTimeLeftEl = document.getElementById("productivity-time-left") as HTMLElement | null;
  const productivityModeTimeBtn = document.getElementById("productivity-mode-time") as HTMLButtonElement | null;
  const productivityModeTasksBtn = document.getElementById("productivity-mode-tasks") as HTMLButtonElement | null;

  if (
    !taskForm ||
    !taskInput ||
    !durationInput ||
    !taskList ||
    !emptyHint ||
    !doneList ||
    !doneEmpty ||
    !clearTasksBtn ||
    !spinBtn ||
    !wheelModal ||
    !canvas ||
    !ctx ||
    !resultModal ||
    !resultTask ||
    !resultDuration ||
    !modalStart ||
    !pomoIdle ||
    !pomoActive ||
    !pomoTaskName ||
    !pomoPlanned ||
    !pomoTime ||
    !pomoToggle ||
    !pomoDoneBtn ||
    !pomoReset ||
    !pomoDone ||
    !productivityMinutes ||
    !productivityPercent ||
    !productivityTimeBar ||
    !productivityTimeBarFill ||
    !productivityTasksBar ||
    !productivityTasksBarFill ||
    !productivityTaskMeta ||
    !productivityTimeOnbar ||
    !productivityTimeSpentEl ||
    !productivityTimeLeftEl ||
    !productivityModeTimeBtn ||
    !productivityModeTasksBtn
  ) {
    // Markup not present (e.g., navigating away)
    return;
  }

  // From here on, all required DOM elements are present.
  const canvasEl = canvas;
  const ctxEl = ctx;
  const miniCanvasEl = miniCanvas;
  const miniCtxEl = miniCtx;
  const spinBtnEl = spinBtn;
  const wheelModalEl = wheelModal;
  const wheelOpenBtnEl = wheelOpenBtn;
  const taskListEl = taskList;
  const emptyHintEl = emptyHint;
  const clearTasksBtnEl = clearTasksBtn;
  const doneListEl = doneList;
  const doneEmptyEl = doneEmpty;
  const resultModalEl = resultModal;
  const resultTaskEl = resultTask;
  const resultDurationEl = resultDuration;
  const modalStartEl = modalStart;

  const productivityMinutesEl = productivityMinutes;
  const productivityPercentEl = productivityPercent;
  const productivityTimeBarEl = productivityTimeBar;
  const productivityTimeBarFillEl = productivityTimeBarFill;
  const productivityTasksBarEl = productivityTasksBar;
  const productivityTasksBarFillEl = productivityTasksBarFill;
  const productivityTaskMetaEl = productivityTaskMeta;
  const productivityTimeOnbarEl = productivityTimeOnbar;
  const productivityTimeSpentElEl = productivityTimeSpentEl;
  const productivityTimeLeftElEl = productivityTimeLeftEl;

  const MINI_SIZE = 92;
  let tasks: Task[] = [];
  let doneTasks: Task[] = [];
  let wheelRotation = 0;
  let spinning = false;
  let selectedIndex: number | null = null;
  let editingTaskId: string | null = null;
  let editingDoneTaskId: string | null = null;

  let pomoDurationMs = DEFAULT_MINUTES * 60 * 1000;
  let pomoRemainingMs = pomoDurationMs;
  let pomoRunning = false;
  let pomoIntervalId: number | null = null;
  let pomoTask = "";
  let pomoTaskId: string | null = null;
  let pomoSessionFinished = false;

  const dbState: DbState = { db: null, dbReady: null };
  let todayKey: string | null = null;
  let saveQueue: Promise<unknown> = Promise.resolve();

  function resizeMiniWheel() {
    if (!miniCanvasEl || !miniCtxEl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    miniCanvasEl.width = MINI_SIZE * dpr;
    miniCanvasEl.height = MINI_SIZE * dpr;
    miniCanvasEl.style.width = `${MINI_SIZE}px`;
    miniCanvasEl.style.height = `${MINI_SIZE}px`;
    miniCtxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMiniWheel();
  }

  function elapsedMsForDoneTask(task: Task) {
    if (typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)) return Math.max(0, task.elapsedMs);
    const totalMs = minutesToMs(taskMinutes(task));
    if (typeof task.remainingMs === "number" && Number.isFinite(task.remainingMs)) {
      return Math.max(0, totalMs - task.remainingMs);
    }
    return totalMs;
  }

  function isDoneTaskForToday(task: Task) {
    if (typeof task.completedAt !== "number" || !Number.isFinite(task.completedAt)) return true;
    const d = new Date(task.completedAt);
    return localDayKey(d) === localDayKey();
  }

  let productivityMode: "time" | "tasks" = "time";
  let lastProd = {
    timePercentInt: 0,
    taskPercentInt: 0,
  };

  function applyProductivityModeUI() {
    const showTime = productivityMode === "time";
    productivityTimeBarEl.hidden = !showTime;
    productivityTasksBarEl.hidden = showTime;
    productivityMinutesEl.hidden = !showTime;
    productivityTaskMetaEl.hidden = showTime;
    productivityTimeOnbarEl.hidden = !showTime;
    productivityPercentEl.textContent = `${showTime ? lastProd.timePercentInt : lastProd.taskPercentInt}%`;
  }

  function updateProductivityUI() {
    const doneToday = doneTasks.filter(isDoneTaskForToday);
    const doneActualMs = doneToday.reduce((sum, t) => sum + elapsedMsForDoneTask(t), 0);
    const remainingEstimatedMs = tasks.reduce((sum, t) => sum + minutesToMs(taskMinutes(t)), 0);

    const totalMsTime = doneActualMs + remainingEstimatedMs;
    const percentTime = totalMsTime > 0 ? (doneActualMs / totalMsTime) * 100 : 0;
    const clampedTime = Math.max(0, Math.min(100, percentTime));
    const timePercentInt = Math.round(clampedTime);

    const doneCountToday = doneToday.length;
    const totalTasksCountToday = tasks.length + doneCountToday;
    const percentTasks = totalTasksCountToday > 0 ? (doneCountToday / totalTasksCountToday) * 100 : 0;
    const clampedTasks = Math.max(0, Math.min(100, percentTasks));
    const taskPercentInt = Math.round(clampedTasks);

    productivityMinutesEl.textContent = `${Math.round(totalMsTime / 60000)} min`;
    productivityTaskMetaEl.textContent =
      totalTasksCountToday > 0 ? `${doneCountToday}/${totalTasksCountToday} tasks done` : "No tasks today";

    productivityTimeBarFillEl.style.width = `${clampedTime}%`;
    productivityTasksBarFillEl.style.width = `${clampedTasks}%`;

    productivityTimeBarEl.setAttribute("aria-valuenow", String(timePercentInt));
    productivityTasksBarEl.setAttribute("aria-valuenow", String(taskPercentInt));

    productivityTimeSpentElEl.textContent = `${Math.round(doneActualMs / 60000)} min spent`;
    productivityTimeLeftElEl.textContent = `${Math.max(0, Math.round(remainingEstimatedMs / 60000))} min left`;

    lastProd = { timePercentInt, taskPercentInt };
    applyProductivityModeUI();
  }

  function saveTasks() {
    if (!todayKey) return;
    const key = todayKey;
    const nextTasks = tasks.slice();
    const nextDone = doneTasks.slice();
    saveQueue = saveQueue.then(() => saveDayData(dbState, key, nextTasks, nextDone)).catch(() => {});
  }

  function drawWheel() {
    const w = 320;
    const h = 320;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 8;

    ctxEl.clearRect(0, 0, w, h);
    ctxEl.save();
    ctxEl.translate(cx, cy);
    ctxEl.rotate(wheelRotation);

    const n = tasks.length;
    if (n === 0) {
      ctxEl.beginPath();
      ctxEl.arc(0, 0, r, 0, Math.PI * 2);
      ctxEl.fillStyle = cssVar("--wheel-empty-bg");
      ctxEl.fill();
      ctxEl.restore();
      return;
    }

    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const start = i * slice - Math.PI / 2;
      const end = start + slice;
      ctxEl.beginPath();
      ctxEl.moveTo(0, 0);
      ctxEl.arc(0, 0, r, start, end);
      ctxEl.closePath();
      ctxEl.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctxEl.fill();
      ctxEl.strokeStyle = cssVar("--wheel-slice-stroke");
      ctxEl.lineWidth = 1;
      ctxEl.stroke();
    }

    ctxEl.fillStyle = cssVar("--wheel-center-bg");
    ctxEl.beginPath();
    ctxEl.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctxEl.fill();

    ctxEl.textAlign = "center";
    ctxEl.textBaseline = "middle";
    const fontSize = n > 8 ? 10 : n > 5 ? 11 : 12;
    ctxEl.font = `600 ${fontSize}px "DM Sans", sans-serif`;

    for (let i = 0; i < n; i++) {
      const mid = i * slice + slice / 2 - Math.PI / 2;
      const labelR = r * 0.62;
      const x = Math.cos(mid) * labelR;
      const y = Math.sin(mid) * labelR;
      ctxEl.save();
      ctxEl.translate(x, y);
      ctxEl.rotate(mid + Math.PI / 2);
      let text = taskText(tasks[i]);
      const maxChars = n > 6 ? 14 : 18;
      if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
      ctxEl.fillStyle = cssVar("--wheel-label-fill");
      ctxEl.fillText(text, 0, 0);
      ctxEl.restore();
    }

    ctxEl.restore();
  }

  function drawMiniWheel() {
    if (!miniCanvasEl || !miniCtxEl) return;
    const w = MINI_SIZE;
    const h = MINI_SIZE;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 5;

    const n = tasks.length;
    miniCtxEl.clearRect(0, 0, w, h);
    miniCtxEl.save();
    miniCtxEl.translate(cx, cy);

    if (n === 0) {
      miniCtxEl.beginPath();
      miniCtxEl.arc(0, 0, r, 0, Math.PI * 2);
      miniCtxEl.fillStyle = cssVar("--wheel-empty-bg");
      miniCtxEl.fill();
      miniCtxEl.restore();
      return;
    }

    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const start = i * slice - Math.PI / 2;
      const end = start + slice;
      miniCtxEl.beginPath();
      miniCtxEl.moveTo(0, 0);
      miniCtxEl.arc(0, 0, r, start, end);
      miniCtxEl.closePath();
      miniCtxEl.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      miniCtxEl.fill();
      miniCtxEl.strokeStyle = cssVar("--wheel-slice-stroke");
      miniCtxEl.lineWidth = 1;
      miniCtxEl.stroke();
    }

    miniCtxEl.fillStyle = cssVar("--wheel-center-bg");
    miniCtxEl.beginPath();
    miniCtxEl.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    miniCtxEl.fill();

    miniCtxEl.restore();
  }

  function updateSpinState() {
    spinBtnEl.disabled = tasks.length === 0 || spinning || pomoRunning || editingTaskId !== null || editingDoneTaskId !== null;
  }

  function renderTaskList() {
    taskListEl.innerHTML = "";
    for (const task of tasks) {
      const li = document.createElement("li");
      li.className = "task-item";
      const body = document.createElement("div");
      body.className = "task-item-body";
      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = task.text;
      const meta = document.createElement("span");
      meta.className = "task-item-mins";
      meta.textContent = `${taskMinutes(task)} min`;
      body.append(title, meta);
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "task-remove";
      rm.textContent = "×";
      rm.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTaskList();
        drawWheel();
        drawMiniWheel();
        updateSpinState();
      });
      li.append(body, rm);
      taskListEl.appendChild(li);
    }
    emptyHintEl.hidden = tasks.length > 0;
    clearTasksBtnEl.hidden = tasks.length === 0;
    updateProductivityUI();
    drawMiniWheel();
  }

  function renderDoneList() {
    doneListEl.innerHTML = "";
    if (doneTasks.length === 0) {
      doneEmptyEl.hidden = false;
      return;
    }
    doneEmptyEl.hidden = true;
    for (const task of doneTasks) {
      const li = document.createElement("li");
      li.className = "task-item";
      const body = document.createElement("div");
      body.className = "task-item-body";
      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = task.text;
      const meta = document.createElement("span");
      meta.className = "task-item-mins";
      meta.textContent = `Took ${formatTime(elapsedMsForDoneTask(task))}`;
      body.append(title, meta);
      li.append(body);
      doneListEl.appendChild(li);
    }
    updateProductivityUI();
  }

  function formatTime(ms: number) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 320;
    canvasEl.width = size * dpr;
    canvasEl.height = size * dpr;
    canvasEl.style.width = `${size}px`;
    canvasEl.style.height = `${size}px`;
    ctxEl.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel();
    drawMiniWheel();
  }

  function showResult(task: Task) {
    resultTaskEl.textContent = task.text;
    resultDurationEl.textContent = `${taskMinutes(task)}-minute focus session`;
    resultModalEl.hidden = false;
    wheelModalEl.hidden = true;
    modalStartEl.focus();
  }

  function hideResult() {
    resultModalEl.hidden = true;
  }

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function normalizeAngle(a: number) {
    const t = a % (Math.PI * 2);
    return t < 0 ? t + Math.PI * 2 : t;
  }

  function spinWheel() {
    if (tasks.length === 0 || spinning) return;
    spinning = true;
    updateSpinState();
    selectedIndex = Math.floor(Math.random() * tasks.length);
    const slice = (Math.PI * 2) / tasks.length;
    const endNorm = normalizeAngle(-(selectedIndex + 0.5) * slice);
    const startNorm = normalizeAngle(wheelRotation);
    let delta = endNorm - startNorm;
    if (delta < 0) delta += Math.PI * 2;
    const extraSpins = 5 + Math.floor(Math.random() * 4);
    const totalDelta = extraSpins * Math.PI * 2 + delta;
    const startRot = wheelRotation;
    const targetAngle = startRot + totalDelta;
    const animDelta = targetAngle - startRot;
    const duration = 3200 + Math.random() * 800;
    const start = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      wheelRotation = startRot + animDelta * e;
      drawWheel();
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        wheelRotation = targetAngle;
        drawWheel();
        spinning = false;
        updateSpinState();
        if (selectedIndex != null) showResult(tasks[selectedIndex]);
      }
    };
    requestAnimationFrame(frame);
  }

  // Theme setup
  setTheme(preferredTheme());
  const themeToggleBtn = document.getElementById("theme-toggle");
  themeToggleBtn?.addEventListener("click", () => {
    const current = document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    setTheme(next);
    resizeCanvas();
    resizeMiniWheel();
  });

  // Modal open/close
  wheelOpenBtn?.addEventListener("click", () => {
    wheelModalEl.hidden = false;
    resizeCanvas();
    updateSpinState();
    if (!spinBtnEl.disabled) spinBtnEl.focus();
  });
  wheelCloseBtn?.addEventListener("click", () => {
    wheelModalEl.hidden = true;
    wheelOpenBtnEl?.focus();
  });

  // Form handlers
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = taskInput.value.trim();
    if (!v) return;
    const mins = clampMinutes(parseInt(durationInput.value, 10));
    tasks.push({ id: newId(), text: v, minutes: mins });
    taskInput.value = "";
    durationInput.value = String(DEFAULT_MINUTES);
    saveTasks();
    renderTaskList();
    drawWheel();
    updateSpinState();
    taskInput.focus();
  });
  clearTasksBtnEl.addEventListener("click", () => {
    if (tasks.length === 0) return;
    tasks = [];
    saveTasks();
    renderTaskList();
    drawWheel();
    updateSpinState();
  });
  spinBtnEl.addEventListener("click", spinWheel);

  modalStartEl.addEventListener("click", () => {
    if (selectedIndex == null || !tasks[selectedIndex]) return;
    hideResult();
    // Minimal TS port keeps legacy UI; Pomodoro logic will be reintroduced next.
    // For now, just close the modal.
  });

  resultModalEl.addEventListener("click", (e) => {
    if (e.target === resultModalEl) hideResult();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!wheelModal.hidden) {
      wheelModal.hidden = true;
      wheelOpenBtn?.focus();
      return;
    }
    if (!resultModalEl.hidden) hideResult();
  });

  productivityModeTimeBtn.addEventListener("click", () => {
    productivityMode = "time";
    productivityModeTimeBtn.classList.add("productivity-mode-btn--active");
    productivityModeTasksBtn.classList.remove("productivity-mode-btn--active");
    applyProductivityModeUI();
  });
  productivityModeTasksBtn.addEventListener("click", () => {
    productivityMode = "tasks";
    productivityModeTasksBtn.classList.add("productivity-mode-btn--active");
    productivityModeTimeBtn.classList.remove("productivity-mode-btn--active");
    applyProductivityModeUI();
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    resizeMiniWheel();
  });

  // Load initial state
  (async () => {
    todayKey = localDayKey(new Date());
    const day = await loadDayData(dbState, todayKey);

    // One-time migration from localStorage (legacy)
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const dayEmpty = day.tasks.length === 0 && day.doneTasks.length === 0;
    if (dayEmpty && legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw) as { tasks?: unknown[] };
        const legacyTasks = Array.isArray(legacy.tasks) ? legacy.tasks : [];
        tasks = legacyTasks.map(normalizeTask).filter(Boolean) as Task[];
        doneTasks = [];
        await saveDayData(dbState, todayKey, tasks, doneTasks);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        tasks = day.tasks;
        doneTasks = day.doneTasks;
      }
    } else {
      tasks = day.tasks;
      doneTasks = day.doneTasks;
    }

    renderTaskList();
    renderDoneList();
    resizeCanvas();
    resizeMiniWheel();
    updateSpinState();
  })().catch(() => {
    // ignore
  });
}

