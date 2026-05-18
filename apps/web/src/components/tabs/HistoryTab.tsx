"use client";

import { useState } from "react";
import { Flame, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Moon, Target, CircleCheck } from "lucide-react";
import { useApp, type CompletedTask } from "@/context/AppContext";

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

// ─── Streak explanation accordion ────────────────────────────────────────────

function StreakAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)' }}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
        <HelpCircle size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>How do streaks work?</span>
        {open
          ? <ChevronUp size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={15} strokeWidth={2} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed space-y-2" style={{ color: 'var(--text-muted)' }}>
          <p>
            Your streak counts consecutive days where you either completed a task <strong style={{ color: 'var(--text-primary)' }}>or</strong> hit your Rest Mode goal.
          </p>
          <p>Rest days protect your streak — so taking a break never breaks your momentum.</p>
        </div>
      )}
    </div>
  );
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onUntick }: { task: CompletedTask; onUntick: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2" style={{ background: 'var(--bg-card)' }}>
      <button onClick={onUntick}>
        <CircleCheck size={20} strokeWidth={2.5} className="shrink-0" style={{ color: 'var(--success)' }} />
      </button>
      <span className="flex-1 text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.taskName}</span>
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{task.minutesEstimated}m</span>
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.color }} />
    </div>
  );
}

// ─── Main HistoryTab ──────────────────────────────────────────────────────────

export function HistoryTab() {
  const {
    completedTasks, completedRestDays, partialRestDays, uncompleteTask,
    streak, bestStreak, restStreak, bestRestStreak,
  } = useApp();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [weekOffset, setWeekOffset] = useState(0);

  const baseWeekStart = (() => {
    const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const d = new Date(today);
    d.setDate(today.getDate() - daysFromMonday);
    return d;
  })();

  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(baseWeekStart.getDate() + weekOffset * 7);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekActivity = weekDays.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const hasTask = completedTasks.some((t) => { const d = new Date(t.completedAt); return d >= day && d < next; });
    const hasRest = completedRestDays.some((d) => { const rd = new Date(d); return rd >= day && rd < next; });
    const partial = partialRestDays.find((d) => { const rd = new Date(d.date); return rd >= day && rd < next; });
    return { hasTask, hasRest, partialPct: partial?.pct ?? null };
  });

  const nextMilestone = MILESTONES.find((m) => m > streak) ?? null;
  const daysToMilestone = nextMilestone !== null ? nextMilestone - streak : null;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayTasks = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const yesterdayTasks = completedTasks.filter((t) => {
    const d = new Date(t.completedAt); d.setHours(0, 0, 0, 0);
    return d.getTime() === yesterday.getTime();
  });

  const weekLabel = weekOffset === 0
    ? "This Week"
    : weekOffset === -1
    ? "Last Week"
    : `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Your progress.</h1>
        <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>Look how far you've come.</p>
      </div>

      <StreakAccordion />

      {/* Lifetime stats */}
      <div className="rounded-2xl flex py-5" style={{ background: 'var(--bg-card)' }}>
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedTasks.length}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tasks Done</span>
        </div>
        <div className="w-px" style={{ background: 'var(--border)' }} />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{streak}</span>
          <div className="flex items-center gap-1">
            <Flame size={11} strokeWidth={2} style={{ color: 'var(--accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Streak</span>
          </div>
        </div>
        <div className="w-px" style={{ background: 'var(--border)' }} />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{restStreak}</span>
          <div className="flex items-center gap-1">
            <Moon size={11} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rest</span>
          </div>
        </div>
        <div className="w-px" style={{ background: 'var(--border)' }} />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{bestStreak}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Best</span>
        </div>
      </div>

      {/* Week selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-lg transition-colors"
          >
            <ChevronLeft size={17} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
          </button>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight size={17} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="rounded-2xl px-3 py-5 flex justify-between" style={{ background: 'var(--bg-card)' }}>
          {weekDays.map((day, i) => {
            const isToday = day.getTime() === today.getTime();
            const isFuture = day > today;
            const { hasTask, hasRest, partialPct } = weekActivity[i];
            const active = hasTask || hasRest;
            const isRestOnly = !hasTask && hasRest;
            const isPartial = !active && partialPct !== null;
            const dayName = ["M", "T", "W", "T", "F", "S", "S"][i];

            const bubbleBg = isToday && active ? 'var(--accent)'
              : isToday ? 'transparent'
              : active && isRestOnly ? 'var(--primary)'
              : active ? 'var(--text-primary)'
              : isPartial ? 'var(--bg-track)'
              : isFuture ? 'var(--bg-subtle)'
              : 'var(--bg-track)';

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: bubbleBg,
                    border: isToday && !active ? '2px solid var(--accent)' : 'none',
                  }}
                >
                  {isRestOnly && !isToday && (
                    <Moon size={12} strokeWidth={2} className="text-white" />
                  )}
                  {isPartial && (
                    <Moon size={12} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                <span
                  className="text-xs"
                  style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isToday ? 600 : 400 }}
                >
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next milestone */}
      <div className="rounded-2xl flex items-center gap-3 px-4 py-4" style={{ background: 'var(--bg-card)' }}>
        <Target size={26} strokeWidth={1.8} className="shrink-0" style={{ color: 'var(--accent)' }} />
        <div className="flex-1">
          {streak === 0 ? (
            <>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Start your streak</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Complete a task today to begin!</p>
            </>
          ) : daysToMilestone !== null ? (
            <>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {daysToMilestone} more day{daysToMilestone !== 1 ? "s" : ""} to {nextMilestone}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Keep going — you're on a roll</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>365 days — legendary!</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>You've hit every milestone. Incredible.</p>
            </>
          )}
        </div>
      </div>

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Today</p>
          {todayTasks.map((t) => (
            <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
          ))}
        </div>
      )}

      {/* Yesterday's tasks */}
      {yesterdayTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Yesterday</p>
          {yesterdayTasks.map((t) => (
            <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
          ))}
        </div>
      )}

      {completedTasks.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          No completed tasks yet.
          <br />
          Spin the wheel to get started!
        </p>
      )}
    </div>
  );
}
