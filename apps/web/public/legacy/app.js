(function () {
  "use strict";

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

  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const durationInput = document.getElementById("duration-input");
  const taskList = document.getElementById("task-list");
  const emptyHint = document.getElementById("empty-hint");
  const doneList = document.getElementById("done-list");
  const doneEmpty = document.getElementById("done-empty");
  const productivityMinutes = document.getElementById("productivity-minutes");
  const productivityPercent = document.getElementById("productivity-percent");
  const productivityTimeBar = document.getElementById("productivity-bar-time");
  const productivityTimeBarFill = document.getElementById("productivity-bar-time-fill");
  const productivityTasksBar = document.getElementById("productivity-bar-tasks");
  const productivityTasksBarFill = document.getElementById("productivity-bar-tasks-fill");
  const productivityTaskMeta = document.getElementById("productivity-task-meta");
  const productivityTimeOnbar = document.getElementById("productivity-time-onbar");
  const productivityTimeSpentEl = document.getElementById("productivity-time-spent");
  const productivityTimeLeftEl = document.getElementById("productivity-time-left");
  const productivityModeTimeBtn = document.getElementById("productivity-mode-time");
  const productivityModeTasksBtn = document.getElementById("productivity-mode-tasks");
  const themeToggleBtn = document.getElementById("theme-toggle");
  const wheelOpenBtn = document.getElementById("wheel-open-btn");
  const wheelModal = document.getElementById("wheel-modal");
  const wheelCloseBtn = document.getElementById("wheel-close-btn");
  const clearTasksBtn = document.getElementById("clear-tasks");
  const spinBtn = document.getElementById("spin-btn");
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const miniCanvas = document.getElementById("mini-wheel");
  const miniCtx = miniCanvas ? miniCanvas.getContext("2d") : null;
  const MINI_SIZE = 92;

  let db = null;
  let dbReady = null;
  let todayKey = null;
  let saveQueue = Promise.resolve();

  const pomoIdle = document.getElementById("pomo-idle");
  const pomoActive = document.getElementById("pomo-active");
  const pomoTaskName = document.getElementById("pomo-task-name");
  const pomoPlanned = document.getElementById("pomo-planned");
  const pomoTime = document.getElementById("pomo-time");
  const pomoToggle = document.getElementById("pomo-toggle");
  const pomoDoneBtn = document.getElementById("pomo-done-btn");
  const pomoReset = document.getElementById("pomo-reset");
  const pomoDone = document.getElementById("pomo-done");

  const resultModal = document.getElementById("result-modal");
  const resultTask = document.getElementById("result-task");
  const resultDuration = document.getElementById("result-duration");
  const modalStart = document.getElementById("modal-start");

  let tasks = [];
  let doneTasks = [];
  let wheelRotation = 0;
  let spinning = false;
  let selectedIndex = null;
  let editingTaskId = null;
  let editingDoneTaskId = null;

  let pomoDurationMs = DEFAULT_MINUTES * 60 * 1000;
  let pomoRemainingMs = pomoDurationMs;
  let pomoRunning = false;
  let pomoIntervalId = null;
  let pomoTask = "";
  let pomoTaskId = null;
  let pomoSessionFinished = false;
  let fireworksGen = 0;

  const THEME_STORAGE_KEY = "wheelTodoApp.theme";
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

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const current = document.documentElement.classList.contains("theme-dark") ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      setTheme(next);
      resizeCanvas();
      resizeMiniWheel();
    });
  }

  if (wheelOpenBtn) {
    wheelOpenBtn.addEventListener("click", () => {
      if (!wheelModal) return;
      wheelModal.hidden = false;
      resizeCanvas();
      updateSpinState();
      // Put focus on the primary action for keyboard users.
      if (spinBtn && !spinBtn.disabled) spinBtn.focus();
    });
  }

  if (wheelCloseBtn && wheelModal) {
    wheelCloseBtn.addEventListener("click", () => {
      wheelModal.hidden = true;
      wheelOpenBtn && wheelOpenBtn.focus && wheelOpenBtn.focus();
    });
  }

  function clampMinutes(m) {
    if (!Number.isFinite(m)) return DEFAULT_MINUTES;
    const r = Math.round(m);
    return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, r));
  }

  function newId() {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeTask(raw) {
    if (typeof raw === "string") {
      const t = raw.trim();
      if (!t) return null;
      return { id: newId(), text: t, minutes: DEFAULT_MINUTES };
    }
    if (raw && typeof raw === "object" && typeof raw.text === "string") {
      const t = raw.text.trim();
      if (!t) return null;
      const completedAt =
        typeof raw.completedAt === "number" && Number.isFinite(raw.completedAt) ? raw.completedAt : undefined;
      const elapsedMs =
        typeof raw.elapsedMs === "number" && Number.isFinite(raw.elapsedMs) ? raw.elapsedMs : undefined;
      const remainingMs =
        typeof raw.remainingMs === "number" && Number.isFinite(raw.remainingMs) ? raw.remainingMs : undefined;
      const runningAtCompletion =
        typeof raw.runningAtCompletion === "boolean" ? raw.runningAtCompletion : undefined;
      return {
        id: typeof raw.id === "string" ? raw.id : newId(),
        text: t,
        minutes: clampMinutes(Number(raw.minutes)),
        completedAt,
        elapsedMs,
        remainingMs,
        runningAtCompletion,
      };
    }
    return null;
  }

  function taskText(task) {
    return typeof task === "string" ? task : task.text;
  }

  function taskMinutes(task) {
    if (typeof task === "string") return DEFAULT_MINUTES;
    return clampMinutes(Number(task.minutes));
  }

  function minutesToMs(minutes) {
    return clampMinutes(minutes) * 60 * 1000;
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function resizeMiniWheel() {
    if (!miniCanvas || !miniCtx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    miniCanvas.width = MINI_SIZE * dpr;
    miniCanvas.height = MINI_SIZE * dpr;
    miniCanvas.style.width = `${MINI_SIZE}px`;
    miniCanvas.style.height = `${MINI_SIZE}px`;
    miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMiniWheel();
  }

  function localDayKey(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function elapsedMsForDoneTask(task) {
    if (!task) return 0;

    if (typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)) {
      return Math.max(0, task.elapsedMs);
    }

    const totalMs = minutesToMs(taskMinutes(task));
    if (typeof task.remainingMs === "number" && Number.isFinite(task.remainingMs)) {
      return Math.max(0, totalMs - task.remainingMs);
    }

    return totalMs;
  }

  function isDoneTaskForToday(task) {
    if (!task || typeof task.completedAt !== "number" || !Number.isFinite(task.completedAt)) return true;
    const d = new Date(task.completedAt);
    return localDayKey(d) === localDayKey();
  }

  let productivityMode = "time";
  let lastProd = {
    timePercentInt: 0,
    taskPercentInt: 0,
    totalTimeMinRounded: 0,
    doneCountToday: 0,
    totalTasksCountToday: 0,
  };

  function applyProductivityModeUI() {
    if (!productivityTimeBar || !productivityTasksBar) return;
    const showTime = productivityMode === "time";

    productivityTimeBar.hidden = !showTime;
    productivityTasksBar.hidden = showTime;

    if (productivityMinutes) productivityMinutes.hidden = !showTime;
    if (productivityTaskMeta) productivityTaskMeta.hidden = showTime;
    if (productivityTimeOnbar) productivityTimeOnbar.hidden = !showTime;

    if (productivityPercent) {
      const v = showTime ? lastProd.timePercentInt : lastProd.taskPercentInt;
      productivityPercent.textContent = `${v}%`;
    }
  }

  function updateProductivityUI() {
    if (
      !productivityMinutes ||
      !productivityPercent ||
      !productivityTimeBarFill ||
      !productivityTasksBarFill ||
      !productivityTimeBar ||
      !productivityTasksBar
    )
      return;

    const doneToday = doneTasks.filter(isDoneTaskForToday);
    const doneActualMs = doneToday.reduce((sum, t) => sum + elapsedMsForDoneTask(t), 0);

    const remainingEstimatedMs = tasks.reduce((sum, t) => sum + minutesToMs(taskMinutes(t)), 0);

    const totalMsTime = doneActualMs + remainingEstimatedMs;
    const percentTime = totalMsTime > 0 ? (doneActualMs / totalMsTime) * 100 : 0;
    const clampedTime = Math.max(0, Math.min(100, percentTime));
    const timePercentInt = Math.round(clampedTime);

    const doneCountToday = doneToday.length;
    const totalTasksCountToday = tasks.length + doneCountToday;
    const percentTasks =
      totalTasksCountToday > 0 ? (doneCountToday / totalTasksCountToday) * 100 : 0;
    const clampedTasks = Math.max(0, Math.min(100, percentTasks));
    const taskPercentInt = Math.round(clampedTasks);

    productivityMinutes.textContent = `${Math.round(totalMsTime / 60000)} min`;
    if (productivityTaskMeta) {
      productivityTaskMeta.textContent =
        totalTasksCountToday > 0
          ? `${doneCountToday}/${totalTasksCountToday} tasks done`
          : `No tasks today`;
    }

    productivityTimeBarFill.style.width = `${clampedTime}%`;
    productivityTasksBarFill.style.width = `${clampedTasks}%`;

    productivityTimeBar.setAttribute("aria-valuenow", String(timePercentInt));
    productivityTasksBar.setAttribute("aria-valuenow", String(taskPercentInt));

    if (productivityTimeSpentEl && productivityTimeLeftEl) {
      const spentMin = Math.round(doneActualMs / 60000);
      const leftMin = Math.max(0, Math.round(remainingEstimatedMs / 60000));
      productivityTimeSpentEl.textContent = `${spentMin} min spent`;
      productivityTimeLeftEl.textContent = `${leftMin} min left`;
    }

    lastProd = {
      timePercentInt,
      taskPercentInt,
      totalTimeMinRounded: Math.round(totalMsTime / 60000),
      doneCountToday,
      totalTasksCountToday,
    };

    applyProductivityModeUI();
  }

  if (productivityModeTimeBtn && productivityModeTasksBtn) {
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

  async function loadDayData(key) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([DB_STORE_DAYS], "readonly");
      const store = tx.objectStore(DB_STORE_DAYS);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const res = getReq.result;
        resolve(
          res && typeof res === "object"
            ? res
            : { dateKey: key, tasks: [], doneTasks: [] }
        );
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async function saveDayData(key) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const tx = database.transaction([DB_STORE_DAYS], "readwrite");
      const store = tx.objectStore(DB_STORE_DAYS);
      store.put({ dateKey: key, tasks, doneTasks });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function loadTasks() {
    todayKey = localDayKey(new Date());
    const day = await loadDayData(todayKey);

    // Migration: bring legacy localStorage data into today's record once.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    const hasLegacy = Boolean(legacyRaw);

    const dayEmpty = (!day.tasks || day.tasks.length === 0) && (!day.doneTasks || day.doneTasks.length === 0);
    if (dayEmpty && hasLegacy) {
      try {
        const legacy = JSON.parse(legacyRaw);
        const legacyTasks = Array.isArray(legacy.tasks) ? legacy.tasks : [];
        tasks = legacyTasks.map(normalizeTask).filter(Boolean);
        doneTasks = [];
        await saveDayData(todayKey);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return tasks;
      } catch {
        // If migration fails, just fall back to DB contents.
      }
    }

    tasks = Array.isArray(day.tasks) ? day.tasks.map(normalizeTask).filter(Boolean) : [];
    doneTasks = Array.isArray(day.doneTasks) ? day.doneTasks.map(normalizeTask).filter(Boolean) : [];
    return tasks;
  }

  function saveTasks() {
    if (!todayKey) return;
    saveQueue = saveQueue
      .then(() => saveDayData(todayKey))
      .catch(() => {});
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWheel();
    drawMiniWheel();
  }

  function drawWheel() {
    const w = 320;
    const h = 320;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 8;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(wheelRotation);

    const n = tasks.length;
    if (n === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = cssVar("--wheel-empty-bg");
      ctx.fill();
      ctx.restore();
      return;
    }

    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const start = i * slice - Math.PI / 2;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, start, end);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = cssVar("--wheel-slice-stroke");
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = cssVar("--wheel-center-bg");
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const fontSize = n > 8 ? 10 : n > 5 ? 11 : 12;
    ctx.font = `600 ${fontSize}px "DM Sans", sans-serif`;

    for (let i = 0; i < n; i++) {
      const mid = i * slice + slice / 2 - Math.PI / 2;
      const labelR = r * 0.62;
      const x = Math.cos(mid) * labelR;
      const y = Math.sin(mid) * labelR;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(mid + Math.PI / 2);
      let text = taskText(tasks[i]);
      const maxChars = n > 6 ? 14 : 18;
      if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
      ctx.fillStyle = cssVar("--wheel-label-fill");
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawMiniWheel() {
    if (!miniCanvas || !miniCtx) return;
    const w = MINI_SIZE;
    const h = MINI_SIZE;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 5;

    const n = tasks.length;
    miniCtx.clearRect(0, 0, w, h);
    miniCtx.save();
    miniCtx.translate(cx, cy);
    miniCtx.rotate(0);

    if (n === 0) {
      miniCtx.beginPath();
      miniCtx.arc(0, 0, r, 0, Math.PI * 2);
      miniCtx.fillStyle = cssVar("--wheel-empty-bg");
      miniCtx.fill();
      miniCtx.restore();
      return;
    }

    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const start = i * slice - Math.PI / 2;
      const end = start + slice;
      miniCtx.beginPath();
      miniCtx.moveTo(0, 0);
      miniCtx.arc(0, 0, r, start, end);
      miniCtx.closePath();
      miniCtx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      miniCtx.fill();
      miniCtx.strokeStyle = cssVar("--wheel-slice-stroke");
      miniCtx.lineWidth = 1;
      miniCtx.stroke();
    }

    miniCtx.fillStyle = cssVar("--wheel-center-bg");
    miniCtx.beginPath();
    miniCtx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    miniCtx.fill();

    // Labels become unreadable when there are many tasks; only show when small.
    if (n <= 8) {
      miniCtx.textAlign = "center";
      miniCtx.textBaseline = "middle";
      const fontSize = n > 6 ? 7 : 8;
      miniCtx.font = `600 ${fontSize}px "DM Sans", sans-serif`;
      for (let i = 0; i < n; i++) {
        const mid = i * slice + slice / 2 - Math.PI / 2;
        const labelR = r * 0.66;
        const x = Math.cos(mid) * labelR;
        const y = Math.sin(mid) * labelR;
        miniCtx.save();
        miniCtx.translate(x, y);
        miniCtx.rotate(mid + Math.PI / 2);
        let text = taskText(tasks[i]);
        const maxChars = n > 6 ? 10 : 12;
        if (text.length > maxChars) text = text.slice(0, maxChars - 1) + "…";
        miniCtx.fillStyle = cssVar("--wheel-label-fill");
        miniCtx.fillText(text, 0, 0);
        miniCtx.restore();
      }
    }

    miniCtx.restore();
  }

  function renderTaskList() {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      const text = taskText(task);
      const mins = taskMinutes(task);
      const li = document.createElement("li");
      li.className = "task-item";
      const body = document.createElement("div");
      body.className = "task-item-body";

      if (editingTaskId === task.id) {
        const titleInput = document.createElement("input");
        titleInput.type = "text";
        titleInput.value = text;
        titleInput.maxLength = 120;
        titleInput.required = true;
        titleInput.className = "task-inline-edit-input";

        const minsInput = document.createElement("input");
        minsInput.type = "number";
        minsInput.value = String(mins);
        minsInput.min = "1";
        minsInput.max = "480";
        minsInput.step = "1";
        minsInput.inputMode = "numeric";
        minsInput.required = true;
        minsInput.className = "task-inline-edit-input";

        const actions = document.createElement("div");
        actions.className = "task-edit-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn btn-primary task-mini-btn";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-ghost task-mini-btn";
        cancelBtn.textContent = "Cancel";

        function commit() {
          const newText = titleInput.value.trim();
          if (!newText) return;
          const newMins = clampMinutes(parseInt(minsInput.value, 10));
          tasks = tasks.map((t) =>
            t.id === task.id ? { ...t, text: newText, minutes: newMins } : t
          );
          saveTasks();
          editingTaskId = null;
          renderTaskList();
          drawWheel();
          updateSpinState();
        }

        saveBtn.addEventListener("click", commit);
        cancelBtn.addEventListener("click", () => {
          editingTaskId = null;
          renderTaskList();
          updateSpinState();
        });

        const onKeyDown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            editingTaskId = null;
            renderTaskList();
            updateSpinState();
          }
        };

        titleInput.addEventListener("keydown", onKeyDown);
        minsInput.addEventListener("keydown", onKeyDown);

        body.append(titleInput, minsInput);
        actions.append(saveBtn, cancelBtn);
        li.append(body, actions);
        taskList.appendChild(li);
      } else {
        const title = document.createElement("span");
        title.className = "task-item-title task-editable";
        title.textContent = text;
        title.setAttribute("role", "button");
        title.tabIndex = 0;

        const meta = document.createElement("span");
        meta.className = "task-item-mins task-editable";
        meta.textContent = `${mins} min`;
        meta.setAttribute("role", "button");
        meta.tabIndex = 0;

        const startEdit = () => {
          if (spinning || pomoRunning) return;
          if (editingTaskId === task.id) return;
          editingTaskId = task.id;
          renderTaskList();
          updateSpinState();
        };

        title.addEventListener("click", startEdit);
        meta.addEventListener("click", startEdit);
        title.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") startEdit();
        });
        meta.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") startEdit();
        });

        body.append(title, meta);

        const startNowBtn = document.createElement("button");
        startNowBtn.type = "button";
        startNowBtn.className = "task-start";
        startNowBtn.setAttribute("aria-label", `Start ${text} now`);
        startNowBtn.textContent = "▶";
        startNowBtn.addEventListener("click", () => {
          if (spinning || pomoRunning) return;
          selectedIndex = null;
          startPomodoroForTask(task);
        });

        const doneNowBtn = document.createElement("button");
        doneNowBtn.type = "button";
        doneNowBtn.className = "task-done-now";
        doneNowBtn.setAttribute("aria-label", `Mark ${text} done now`);
        doneNowBtn.textContent = "✓";
        doneNowBtn.addEventListener("click", () => {
          if (spinning || pomoRunning) return;
          completeTaskFromToDo(task);
        });

        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "task-remove";
        rm.setAttribute("aria-label", `Remove ${text}`);
        rm.textContent = "×";
        rm.addEventListener("click", () => {
          tasks = tasks.filter((t) => t.id !== task.id);
          saveTasks();
          renderTaskList();
          drawWheel();
          updateSpinState();
          drawMiniWheel();
        });
        li.append(body, startNowBtn, doneNowBtn, rm);
        taskList.appendChild(li);
      }
    });

    emptyHint.hidden = tasks.length > 0;
    clearTasksBtn.hidden = tasks.length === 0;
    updateProductivityUI();
    drawMiniWheel();
  }

  function renderDoneList() {
    doneList.innerHTML = "";
    if (doneTasks.length === 0) {
      doneEmpty.hidden = false;
      return;
    }

    doneEmpty.hidden = true;

    function elapsedForDone(task) {
      if (typeof task.elapsedMs === "number" && Number.isFinite(task.elapsedMs)) return Math.max(0, task.elapsedMs);
      if (typeof task.remainingMs === "number" && Number.isFinite(task.remainingMs)) {
        return Math.max(0, minutesToMs(taskMinutes(task)) - task.remainingMs);
      }
      return minutesToMs(taskMinutes(task));
    }

    doneTasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";

      const body = document.createElement("div");
      body.className = "task-item-body";

      const title = document.createElement("span");
      title.className = "task-item-title";
      title.textContent = taskText(task);

      if (editingDoneTaskId === task.id) {
        const minutesToUse = Math.max(
          1,
          Math.round(elapsedForDone(task) / 60000)
        );

        const minsInput = document.createElement("input");
        minsInput.type = "number";
        minsInput.min = "1";
        minsInput.max = "480";
        minsInput.step = "1";
        minsInput.inputMode = "numeric";
        minsInput.required = true;
        minsInput.className = "task-inline-edit-input";
        minsInput.value = String(minutesToUse);

        const actions = document.createElement("div");
        actions.className = "task-edit-actions";

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "btn btn-primary task-mini-btn";
        saveBtn.textContent = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "btn btn-ghost task-mini-btn";
        cancelBtn.textContent = "Cancel";

        function commit() {
          const newMins = clampMinutes(parseInt(minsInput.value, 10));
          const durationMs = minutesToMs(taskMinutes(task));
          const newElapsedMs = minutesToMs(newMins);
          const newRemainingMs = Math.max(0, durationMs - newElapsedMs);
          const prevRunning = task.runningAtCompletion === true;
          const newRunningAtCompletion = prevRunning && newRemainingMs > 0;

          doneTasks = doneTasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  elapsedMs: newElapsedMs,
                  remainingMs: newRemainingMs,
                  runningAtCompletion: newRunningAtCompletion,
                }
              : t
          );
          saveTasks();
          editingDoneTaskId = null;
          renderDoneList();
        }

        saveBtn.addEventListener("click", commit);
        cancelBtn.addEventListener("click", () => {
          editingDoneTaskId = null;
          renderDoneList();
        });

        const onKeyDown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            editingDoneTaskId = null;
            renderDoneList();
          }
        };

        minsInput.addEventListener("keydown", onKeyDown);

        body.append(title, minsInput, actions);

        actions.append(saveBtn, cancelBtn);
      } else {
        const meta = document.createElement("span");
        meta.className = "task-item-mins task-editable";
        meta.textContent = `Took ${formatTime(elapsedForDone(task))}`;
        meta.setAttribute("role", "button");
        meta.tabIndex = 0;

        const startEdit = () => {
          if (spinning || pomoRunning || editingTaskId !== null) return;
          editingDoneTaskId = task.id;
          renderDoneList();
        };

        meta.addEventListener("click", startEdit);
        meta.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") startEdit();
        });

        body.append(title, meta);
      }

      const rev = document.createElement("button");
      rev.type = "button";
      rev.className = "task-revert";
      rev.setAttribute("aria-label", `Revert ${taskText(task)}`);
      rev.textContent = "↩";
      rev.addEventListener("click", () => {
        editingDoneTaskId = null;
        revertDoneTask(task);
      });

      li.append(body, rev);
      doneList.appendChild(li);
    });

    updateProductivityUI();
  }

  function updateSpinState() {
    spinBtn.disabled = tasks.length === 0 || spinning || pomoRunning || editingTaskId !== null || editingDoneTaskId !== null;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function normalizeAngle(a) {
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

    function frame(now) {
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
        showResult(tasks[selectedIndex]);
      }
    }
    requestAnimationFrame(frame);
  }

  function showResult(task) {
    const text = taskText(task);
    const mins = taskMinutes(task);
    resultTask.textContent = text;
    resultDuration.textContent = `${mins}-minute focus session`;
    resultModal.hidden = false;
    if (wheelModal) wheelModal.hidden = true;
    modalStart.focus();
  }

  function hideResult() {
    resultModal.hidden = true;
  }

  function stopPomoInterval() {
    if (pomoIntervalId) {
      clearInterval(pomoIntervalId);
      pomoIntervalId = null;
    }
  }

  function updateDoneButton() {
    const show =
      Boolean(pomoTask) && !pomoSessionFinished && pomoRemainingMs > 0;
    pomoDoneBtn.hidden = !show;
  }

  function playFireworks() {
    const c = document.getElementById("fireworks");
    if (!c) return;
    const fctx = c.getContext("2d");
    fireworksGen += 1;
    const myGen = fireworksGen;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = Math.max(1, Math.floor(w * dpr));
    c.height = Math.max(1, Math.floor(h * dpr));
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;

    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, c.width, c.height);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    c.classList.add("fireworks-canvas--visible");

    const colors = WHEEL_COLORS.concat(["#fde047", "#f8fafc", "#38bdf8"]);
    const particles = [];
    const rockets = [];

    function spawnRocket() {
      rockets.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: h + 8,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -(11 + Math.random() * 6),
        targetY: h * (0.12 + Math.random() * 0.38),
        color: colors[(Math.random() * colors.length) | 0],
      });
    }

    function explode(x, y, color) {
      const count = 55 + ((Math.random() * 45) | 0);
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 2.2 + Math.random() * 7;
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 1,
          decay: 0.01 + Math.random() * 0.022,
          color: Math.random() < 0.45 ? color : colors[(Math.random() * colors.length) | 0],
          g: 0.07 + Math.random() * 0.05,
        });
      }
    }

    let last = performance.now();
    let spawnT = last;
    const t0 = last;
    const stopSpawnAt = t0 + 2400;

    function frame(now) {
      if (myGen !== fireworksGen) return;

      const dt = Math.min(40, now - last);
      last = now;
      const k = dt / 16.67;

      fctx.fillStyle = "rgba(15, 18, 25, 0.2)";
      fctx.fillRect(0, 0, w, h);

      if (now < stopSpawnAt && now - spawnT > 260) {
        spawnRocket();
        spawnT = now;
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx * k;
        r.y += r.vy * k;
        r.vy += 0.14 * k;
        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
          continue;
        }
        if (r.y > h + 40) {
          rockets.splice(i, 1);
          continue;
        }
        fctx.beginPath();
        fctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        fctx.fillStyle = r.color;
        fctx.shadowColor = r.color;
        fctx.shadowBlur = 10;
        fctx.fill();
        fctx.shadowBlur = 0;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.vy += p.g * k;
        p.life -= p.decay * k;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        fctx.globalAlpha = Math.min(1, p.life);
        fctx.beginPath();
        fctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        fctx.fillStyle = p.color;
        fctx.fill();
        fctx.globalAlpha = 1;
      }

      const stillGoing =
        now < stopSpawnAt + 2000 || rockets.length > 0 || particles.length > 0;
      if (stillGoing) {
        requestAnimationFrame(frame);
      } else if (myGen === fireworksGen) {
        c.classList.remove("fireworks-canvas--visible");
        fctx.setTransform(1, 0, 0, 1, 0, 0);
        fctx.clearRect(0, 0, c.width, c.height);
      }
    }

    spawnRocket();
    requestAnimationFrame(frame);
  }

  function completePomodoroSession({ early = false } = {}) {
    if (!pomoTask || pomoSessionFinished) return;
    pomoSessionFinished = true;

    // Move finished task from the to-do list into the done list (and out of the wheel).
    const remainingAtCompletion = pomoRemainingMs;
    const elapsedAtCompletion = Math.max(0, pomoDurationMs - remainingAtCompletion);
    const runningAtCompletion = pomoRunning && remainingAtCompletion > 0;
    const completedAt = Date.now();

    if (pomoTaskId) {
      const idx = tasks.findIndex((t) => t.id === pomoTaskId);
      if (idx !== -1) {
        const finishedTask = tasks[idx];
        const finishedWithCompletion = {
          ...finishedTask,
          completedAt,
          elapsedMs: elapsedAtCompletion,
          remainingMs: remainingAtCompletion,
          runningAtCompletion,
        };
        tasks = tasks.filter((t) => t.id !== pomoTaskId);
        doneTasks.push(finishedWithCompletion);
        saveTasks();
        renderTaskList();
        renderDoneList();
        drawWheel();
        updateSpinState();
        selectedIndex = null;
      }
    }

    stopPomoInterval();
    pomoRunning = false;
    pomoRemainingMs = 0;
    updatePomoDisplay();
    pomoToggle.textContent = "Resume";
    pomoToggle.disabled = true;
    pomoReset.disabled = true;
    pomoDone.textContent = early
      ? "Task finished early. Nice work."
      : "Session complete. Nice work.";
    pomoDone.hidden = false;
    pomoDoneBtn.hidden = true;
    playFireworks();
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(early ? "Task done" : "Pomodoro complete", {
          body: `Finished: ${pomoTask}`,
        });
      }
    } catch {
      /* ignore */
    }
  }

  function clearFireworks() {
    fireworksGen += 1; // invalidate any in-flight animation
    const c = document.getElementById("fireworks");
    if (!c) return;
    c.classList.remove("fireworks-canvas--visible");
    try {
      const fctx = c.getContext("2d");
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.clearRect(0, 0, c.width, c.height);
    } catch {
      /* ignore */
    }
  }

  function completeTaskFromToDo(task) {
    if (!task || !task.id) return;
    if (pomoRunning || spinning || editingTaskId !== null || editingDoneTaskId !== null) return;

    const completedAt = Date.now();
    const durationMs = minutesToMs(taskMinutes(task));

    const doneTask = {
      ...task,
      completedAt,
      elapsedMs: durationMs,
      remainingMs: 0,
      runningAtCompletion: false,
    };

    tasks = tasks.filter((t) => t.id !== task.id);
    doneTasks.push(doneTask);

    saveTasks();
    renderTaskList();
    renderDoneList();
    drawWheel();
    updateSpinState();
    selectedIndex = null;

    playFireworks();
  }

  function revertDoneTask(doneTask) {
    if (!doneTask || !doneTask.id) return;

    // Stop any running timer and restore state from when the task was completed.
    stopPomoInterval();
    clearFireworks();

    pomoSessionFinished = false;
    pomoDone.hidden = true;
    resultModal.hidden = true;

    const minutes = taskMinutes(doneTask);
    const restoredDurationMs = minutesToMs(minutes);
    const restoredRemainingMs =
      typeof doneTask.remainingMs === "number" && Number.isFinite(doneTask.remainingMs)
        ? Math.max(0, doneTask.remainingMs)
        : typeof doneTask.elapsedMs === "number" && Number.isFinite(doneTask.elapsedMs)
          ? Math.max(0, restoredDurationMs - doneTask.elapsedMs)
          : restoredDurationMs;

    // Only restore running state if there was still time left when Done was pressed.
    const restoredRunning =
      doneTask.runningAtCompletion === true && restoredRemainingMs > 0;

    // Move the task back to the to-do list (and thus back onto the wheel).
    doneTasks = doneTasks.filter((t) => t.id !== doneTask.id);
    tasks = tasks.concat([{ id: doneTask.id, text: doneTask.text, minutes }]);
    saveTasks();

    renderTaskList();
    renderDoneList();
    drawWheel();
    updateSpinState();
    selectedIndex = null;

    pomoTask = doneTask.text;
    pomoTaskId = doneTask.id;
    pomoDurationMs = restoredDurationMs;
    pomoRemainingMs = restoredRemainingMs;
    pomoRunning = restoredRunning;

    // Re-enable session controls and refresh the Pomodoro UI.
    pomoToggle.disabled = false;
    pomoReset.disabled = false;
    showPomoUI();

    if (pomoRunning) {
      stopPomoInterval();
      pomoIntervalId = setInterval(tickPomo, 250);
    }
  }

  function formatTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }

  function updatePomoDisplay() {
    pomoTime.textContent = formatTime(pomoRemainingMs);
  }

  function showPomoUI() {
    pomoIdle.hidden = true;
    pomoActive.hidden = false;
    pomoDone.hidden = true;
    pomoTaskName.textContent = pomoTask;
    const plannedMin = Math.round(pomoDurationMs / 60000);
    pomoPlanned.textContent = `Timer: ${plannedMin} min`;
    pomoPlanned.hidden = false;
    updatePomoDisplay();
    pomoToggle.textContent = pomoRunning ? "Pause" : "Resume";
    pomoToggle.disabled = false;
    pomoReset.disabled = false;
    updateDoneButton();
  }

  function startPomodoroForTask(task) {
    const text = taskText(task);
    const mins = taskMinutes(task);
    hideResult();
    pomoSessionFinished = false;
    pomoTask = text;
    pomoTaskId = task && typeof task === "object" ? task.id : null;
    pomoDurationMs = minutesToMs(mins);
    pomoRemainingMs = pomoDurationMs;
    pomoRunning = true;
    showPomoUI();
    stopPomoInterval();
    pomoIntervalId = setInterval(tickPomo, 250);
  }

  function tickPomo() {
    if (!pomoRunning) return;
    pomoRemainingMs -= 250;
    if (pomoRemainingMs <= 0) {
      pomoRemainingMs = 0;
      completePomodoroSession({ early: false });
      return;
    }
    updatePomoDisplay();
  }

  function togglePomo() {
    if (pomoRemainingMs <= 0) {
      pomoRemainingMs = pomoDurationMs;
      pomoDone.hidden = true;
      pomoSessionFinished = false;
    }
    pomoRunning = !pomoRunning;
    pomoToggle.textContent = pomoRunning ? "Pause" : "Resume";
    if (pomoRunning && !pomoIntervalId) {
      pomoIntervalId = setInterval(tickPomo, 250);
    }
    if (!pomoRunning) stopPomoInterval();
    updateDoneButton();
  }

  function resetPomo() {
    stopPomoInterval();
    pomoRunning = false;
    pomoRemainingMs = pomoDurationMs;
    pomoSessionFinished = false;
    pomoDone.hidden = true;
    updatePomoDisplay();
    pomoToggle.textContent = "Start";
    updateDoneButton();
  }

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

  clearTasksBtn.addEventListener("click", () => {
    if (tasks.length === 0) return;
    tasks = [];
    saveTasks();
    renderTaskList();
    drawWheel();
    updateSpinState();
  });

  spinBtn.addEventListener("click", spinWheel);

  modalStart.addEventListener("click", () => {
    if (selectedIndex == null || !tasks[selectedIndex]) return;
    startPomodoroForTask(tasks[selectedIndex]);
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  });

  resultModal.addEventListener("click", (e) => {
    if (e.target === resultModal) hideResult();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (wheelModal && !wheelModal.hidden) {
      wheelModal.hidden = true;
      wheelOpenBtn && wheelOpenBtn.focus && wheelOpenBtn.focus();
      return;
    }
    if (!resultModal.hidden) hideResult();
  });

  pomoToggle.addEventListener("click", () => {
    if (!pomoTask) return;
    if (pomoRemainingMs <= 0 && !pomoRunning) {
      pomoRemainingMs = pomoDurationMs;
      pomoDone.hidden = true;
      pomoSessionFinished = false;
      pomoRunning = true;
      pomoToggle.textContent = "Pause";
      stopPomoInterval();
      pomoIntervalId = setInterval(tickPomo, 250);
      updateDoneButton();
      return;
    }
    togglePomo();
  });

  pomoDoneBtn.addEventListener("click", () => {
    completePomodoroSession({ early: true });
  });

  pomoReset.addEventListener("click", () => {
    if (!pomoTask) return;
    resetPomo();
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
    resizeMiniWheel();
  });

  async function init() {
    try {
      tasks = await loadTasks();
    } catch {
      tasks = [];
      doneTasks = [];
    }
    setTheme(preferredTheme());
    renderTaskList();
    renderDoneList();
    resizeCanvas();
    resizeMiniWheel();
    updateSpinState();
  }

  init();
})();

