"use client";

import { useState } from "react";
import { Flame, HelpCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Moon, Target, CircleCheck } from "lucide-react";
import { useApp, type CompletedTask } from "@/context/AppContext";

const MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

// ─── Streak explanation accordion ────────────────────────────────────────────

function StreakAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
        <HelpCircle size={15} strokeWidth={2} className="text-[#E59880] shrink-0" />
        <span className="flex-1 text-sm font-bold text-[#2A2520]">How do streaks work?</span>
        {open
          ? <ChevronUp size={15} strokeWidth={2} className="text-[#aaaaaa] shrink-0" />
          : <ChevronDown size={15} strokeWidth={2} className="text-[#aaaaaa] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[#aaaaaa] leading-relaxed space-y-2">
          <p>
            Your streak counts consecutive days where you either completed a task <strong className="text-[#2A2520]">or</strong> hit your Rest Mode goal.
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
    <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 mb-2">
      <button onClick={onUntick}>
        <CircleCheck size={20} strokeWidth={2.5} className="text-[#22a722] shrink-0" />
      </button>
      <span className="flex-1 text-base font-medium text-[#2A2520] truncate">{task.taskName}</span>
      <span className="text-sm text-[#aaaaaa]">{task.minutesEstimated}m</span>
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
        <h1 className="text-2xl font-bold text-[#2A2520]">Your progress.</h1>
        <p className="text-2xl font-bold text-[#E59880]">Look how far you've come.</p>
      </div>

      <StreakAccordion />

      {/* Lifetime stats */}
      <div className="bg-white rounded-2xl flex py-5">
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-[#2A2520]">{completedTasks.length}</span>
          <span className="text-xs text-[#aaaaaa]">Tasks Done</span>
        </div>
        <div className="w-px bg-[#e8e8e8]" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-[#E59880]">{streak}</span>
          <div className="flex items-center gap-1">
            <Flame size={11} strokeWidth={2} className="text-[#E59880]" />
            <span className="text-xs text-[#aaaaaa]">Streak</span>
          </div>
        </div>
        <div className="w-px bg-[#e8e8e8]" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-[#2A2520]">{restStreak}</span>
          <div className="flex items-center gap-1">
            <Moon size={11} strokeWidth={2} className="text-[#aaaaaa]" />
            <span className="text-xs text-[#aaaaaa]">Rest</span>
          </div>
        </div>
        <div className="w-px bg-[#e8e8e8]" />
        <div className="flex-1 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-[#2A2520]">{bestStreak}</span>
          <span className="text-xs text-[#aaaaaa]">Best</span>
        </div>
      </div>

      {/* Week selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors"
          >
            <ChevronLeft size={17} strokeWidth={2} className="text-[#aaaaaa]" />
          </button>
          <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
            disabled={weekOffset >= 0}
            className="p-1.5 rounded-lg hover:bg-[#f0f0f0] transition-colors disabled:opacity-30"
          >
            <ChevronRight size={17} strokeWidth={2} className="text-[#aaaaaa]" />
          </button>
        </div>

        <div className="bg-white rounded-2xl px-3 py-5 flex justify-between">
          {weekDays.map((day, i) => {
            const isToday = day.getTime() === today.getTime();
            const isFuture = day > today;
            const { hasTask, hasRest, partialPct } = weekActivity[i];
            const active = hasTask || hasRest;
            const isRestOnly = !hasTask && hasRest;
            const isPartial = !active && partialPct !== null;
            const dayName = ["M", "T", "W", "T", "F", "S", "S"][i];

            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isToday && active ? "bg-[#E59880]"
                    : isToday ? "border-2 border-[#E59880] bg-transparent"
                    : active && isRestOnly ? "bg-[#ADA8CC]"
                    : active ? "bg-[#2A2520]"
                    : isPartial ? "bg-[#e8e8e8]"
                    : isFuture ? "bg-[#f5f5f5]"
                    : "bg-[#f0f0f0]"
                  }`}
                >
                  {isRestOnly && !isToday && (
                    <Moon size={12} strokeWidth={2} className="text-white" />
                  )}
                  {isPartial && (
                    <Moon size={12} strokeWidth={2} className="text-[#aaaaaa]" />
                  )}
                </div>
                <span className={`text-xs ${isToday ? "text-[#E59880] font-semibold" : "text-[#aaaaaa]"}`}>
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next milestone */}
      <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-4">
        <Target size={26} strokeWidth={1.8} className="text-[#E59880] shrink-0" />
        <div className="flex-1">
          {streak === 0 ? (
            <>
              <p className="text-sm font-bold text-[#2A2520]">Start your streak</p>
              <p className="text-xs text-[#aaaaaa] mt-0.5">Complete a task today to begin!</p>
            </>
          ) : daysToMilestone !== null ? (
            <>
              <p className="text-sm font-bold text-[#2A2520]">
                {daysToMilestone} more day{daysToMilestone !== 1 ? "s" : ""} to {nextMilestone}
              </p>
              <p className="text-xs text-[#aaaaaa] mt-0.5">Keep going — you're on a roll</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-[#2A2520]">365 days — legendary!</p>
              <p className="text-xs text-[#aaaaaa] mt-0.5">You've hit every milestone. Incredible.</p>
            </>
          )}
        </div>
      </div>

      {/* Today's tasks */}
      {todayTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide mb-2">Today</p>
          {todayTasks.map((t) => (
            <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
          ))}
        </div>
      )}

      {/* Yesterday's tasks */}
      {yesterdayTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide mb-2">Yesterday</p>
          {yesterdayTasks.map((t) => (
            <TaskCard key={t.id} task={t} onUntick={() => uncompleteTask(t.id)} />
          ))}
        </div>
      )}

      {completedTasks.length === 0 && (
        <p className="text-center text-sm text-[#aaaaaa] py-8">
          No completed tasks yet.
          <br />
          Spin the wheel to get started!
        </p>
      )}
    </div>
  );
}
