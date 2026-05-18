"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Timer, Plus, Trash2 } from "lucide-react";
import { useApp, COLORS, type Task } from "@/context/AppContext";
import { Confetti } from "@/components/Confetti";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMmSs(seconds: number) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function TasksFaqAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
        <HelpCircle size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>How do tasks work?</span>
        {open
          ? <ChevronUp size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Click the timer icon to start a focus session. Click the task name to edit it. Use the bin icon to delete.
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit Task Modal ──────────────────────────────────────────────────────

interface TaskModalProps {
  task?: Task;
  categories: string[];
  onAdd: (name: string, mins: number, color: string, category: string) => void;
  onSave: (id: string, name: string, mins: number, color: string, category: string) => void;
  onClose: () => void;
  onAddCategory: (cat: string) => void;
}

function TaskModal({ task, categories, onAdd, onSave, onClose, onAddCategory }: TaskModalProps) {
  const { defaultTimerMinutes } = useApp();
  const isEdit = !!task;
  const defaultMins = task?.minutes ?? defaultTimerMinutes;
  const [name, setName] = useState(task?.name ?? "");
  const [hours, setHours] = useState(Math.floor(defaultMins / 60));
  const [mins, setMins] = useState(defaultMins % 60);
  const [color, setColor] = useState(task?.color ?? COLORS[0]);
  const [category, setCategory] = useState(task?.category ?? "");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    const total = Math.max(1, hours * 60 + mins);
    if (isEdit && task) {
      onSave(task.id, v, total, color, category);
    } else {
      onAdd(v, total, color, category);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl md:rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full mb-5 mx-auto md:hidden" style={{ background: 'var(--border)' }} />
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{isEdit ? "Edit task" : "Add task"}</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{isEdit ? "Update the details below." : "What needs doing?"}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            placeholder="Task name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-base focus:outline-none transition"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Colour</p>
            <div className="flex gap-2.5">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-[color:var(--text-primary)] scale-110" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Duration</p>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, Math.min(8, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={8}
                  className="w-20 rounded-xl px-3 py-3 text-2xl font-bold text-center focus:outline-none transition"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>hours</span>
              </div>
              <span className="text-2xl font-bold mb-4" style={{ color: 'var(--text-muted)' }}>:</span>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  value={mins}
                  onChange={(e) => setMins(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={59}
                  className="w-20 rounded-xl px-3 py-3 text-2xl font-bold text-center focus:outline-none transition"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
                <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>mins</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(category === cat ? "" : cat)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{
                    background: category === cat ? 'var(--text-primary)' : 'var(--bg-track)',
                    color: category === cat ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {cat}
                </button>
              ))}
              {addingCat ? (
                <input
                  autoFocus
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCat.trim()) {
                      onAddCategory(newCat.trim());
                      setCategory(newCat.trim());
                      setNewCat("");
                      setAddingCat(false);
                    } else if (e.key === "Escape") {
                      setAddingCat(false);
                    }
                  }}
                  onBlur={() => { setNewCat(""); setAddingCat(false); }}
                  placeholder="Label…"
                  className="px-3 py-1.5 rounded-full text-sm focus:outline-none w-24"
                  style={{ background: 'var(--bg-track)' }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingCat(true)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={{ background: 'var(--bg-track)', color: 'var(--accent)' }}
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white font-semibold text-base rounded-full py-3.5 active:scale-[0.98] transition mt-1"
            style={{ background: 'var(--text-primary)' }}
          >
            {isEdit ? "Save changes" : "Add task"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  isActive: boolean;
  displayTime: string;
  onFocus: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

function TaskRow({ task, isActive, displayTime, onFocus, onComplete, onDelete, onEdit }: TaskRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-opacity ${isActive ? "opacity-60" : ""}`}
      style={{ background: 'var(--bg-card)' }}
    >
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
      <div className="flex-1 min-w-0">
        <button
          onClick={onEdit}
          className="text-base font-medium text-left truncate w-full transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          {task.name}
        </button>
        {task.category && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.category}</p>
        )}
      </div>
      <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>{displayTime}</span>
      <button
        onClick={onFocus}
        title="Start focus session"
        className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0"
      >
        <Timer size={18} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
      </button>
      <button
        onClick={onComplete}
        title="Mark done"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-green-50 transition-colors shrink-0"
      >
        <span className="text-sm font-bold text-green-600">✓</span>
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-50 transition-colors shrink-0"
      >
        <Trash2 size={15} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  );
}

// ─── Focus card ───────────────────────────────────────────────────────────────

function FocusCard({ onComplete }: { onComplete: () => void }) {
  const { pomodoroSession, pausePomodoro, resumePomodoro, completePomodoro, tickPomodoro, tasks } = useApp();
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [pomodoroSession?.taskId]);

  useEffect(() => {
    if (!pomodoroSession?.isRunning) return;
    const id = setInterval(tickPomodoro, 1000);
    return () => clearInterval(id);
  }, [pomodoroSession?.isRunning, tickPomodoro]);

  useEffect(() => {
    if (pomodoroSession?.remainingSeconds === 0 && !completedRef.current) {
      completedRef.current = true;
      completePomodoro();
      onComplete();
    }
  }, [pomodoroSession?.remainingSeconds, completePomodoro, onComplete]);

  if (!pomodoroSession) return null;

  const activeTask = tasks.find((t) => t.id === pomodoroSession.taskId);
  const progress = (pomodoroSession.totalSeconds - pomodoroSession.remainingSeconds) / pomodoroSession.totalSeconds;

  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--text-primary)' }}>
      <div className="flex items-center gap-2 mb-1">
        {activeTask && (
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeTask.color }} />
        )}
        <p className="text-base font-semibold text-white truncate flex-1">{pomodoroSession.taskName}</p>
        <button
          onClick={() => { if (!completedRef.current) { completedRef.current = true; completePomodoro(); onComplete(); } }}
          className="text-xs font-semibold text-white/60 hover:text-white bg-white/10 rounded-full px-3 py-1 transition-colors shrink-0"
        >
          Done ✓
        </button>
      </div>
      {activeTask?.category && (
        <span className="inline-block bg-white/10 text-white/70 text-xs font-semibold rounded-full px-3 py-1 mb-3">
          {activeTask.category}
        </span>
      )}
      <p className="text-5xl font-light text-white mt-2 mb-3 tabular-nums">
        {formatMmSs(pomodoroSession.remainingSeconds)}
      </p>
      <div className="h-0.5 bg-white/20 rounded-full mb-4">
        <div
          className="h-0.5 rounded-full transition-all"
          style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--accent)' }}
        />
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={pomodoroSession.isRunning ? pausePomodoro : resumePomodoro}
          className="flex-1 h-11 bg-white/10 text-white font-medium text-sm rounded-full hover:bg-white/20 transition-colors"
        >
          {pomodoroSession.isRunning ? "Pause" : "Resume"}
        </button>
      </div>
    </div>
  );
}

// ─── Main TasksTab ────────────────────────────────────────────────────────────

export function TasksTab() {
  const {
    tasks, addTask, updateTask, deleteTask, completeTask, startPomodoro,
    pomodoroSession, taskProgress, completedTasks, dailyGoal, categories, addCategory,
  } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confetti, setConfetti] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCompleted = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const totalMinutesDone = todayCompleted.reduce((s, t) => s + t.minutesActual, 0);
  const goalPct = dailyGoal > 0 ? Math.min(Math.round((todayCompleted.length / dailyGoal) * 100), 100) : 0;

  function handleAdd(name: string, mins: number, color: string, category: string) {
    addTask({ name, minutes: mins, color, icon: "BookOpen", category });
  }

  function handleSave(id: string, name: string, mins: number, color: string, category: string) {
    updateTask(id, { name, minutes: mins, color, category });
    setEditingTask(null);
  }

  function handleFocus(task: Task) {
    if (pomodoroSession && pomodoroSession.taskId !== task.id) {
      if (!window.confirm(`Switch focus from "${pomodoroSession.taskName}" to "${task.name}"?`)) return;
    }
    startPomodoro(task);
  }

  function handleDone(task: Task) {
    const remaining = taskProgress[task.id];
    const minutesActual = remaining !== undefined
      ? Math.max(1, Math.ceil((task.minutes * 60 - remaining) / 60))
      : task.minutes;
    completeTask(task.id, minutesActual);
    deleteTask(task.id);
    setConfetti(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your tasks are set.</h1>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Time to get to work.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="w-11 h-11 rounded-full text-white text-2xl flex items-center justify-center active:scale-95 transition shrink-0 leading-none"
          style={{ background: 'var(--text-primary)' }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* FAQ */}
      <TasksFaqAccordion />

      {/* Stats */}
      {todayCompleted.length > 0 && (
        <div className="rounded-2xl flex py-5" style={{ background: 'var(--bg-card)' }}>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalMinutesDone}m</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Done</span>
          </div>
          <div className="w-px" style={{ background: 'var(--border)' }} />
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{todayCompleted.length}/{dailyGoal}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tasks</span>
          </div>
          <div className="w-px" style={{ background: 'var(--border)' }} />
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{goalPct}%</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Goal</span>
          </div>
        </div>
      )}

      {/* Confetti */}
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      {/* Focus card */}
      <FocusCard onComplete={() => setConfetti(true)} />

      {/* Task list */}
      {tasks.length > 0 && (
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Today's tasks</p>
      )}
      <div className="space-y-2">
        {tasks.map((task) => {
          const isActive = pomodoroSession?.taskId === task.id;
          const displayTime = taskProgress[task.id] != null
            ? formatMmSs(taskProgress[task.id])
            : `${task.minutes}m`;
          return (
            <TaskRow
              key={task.id}
              task={task}
              isActive={isActive}
              displayTime={displayTime}
              onFocus={() => handleFocus(task)}
              onComplete={() => handleDone(task)}
              onDelete={() => deleteTask(task.id)}
              onEdit={() => setEditingTask(task)}
            />
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>
            No tasks yet.{" "}
            <button onClick={() => setModalOpen(true)} className="font-semibold hover:underline" style={{ color: 'var(--text-primary)' }}>
              Add one
            </button>
            .
          </div>
        )}
      </div>

      {(modalOpen || editingTask) && (
        <TaskModal
          task={editingTask ?? undefined}
          categories={categories}
          onAdd={handleAdd}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingTask(null); }}
          onAddCategory={addCategory}
        />
      )}
    </div>
  );
}
