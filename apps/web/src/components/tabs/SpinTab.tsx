"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Flame, Target } from "lucide-react";
import { useApp, type Task } from "@/context/AppContext";

// ─── Wheel colors matching the mobile app ────────────────────────────────────

const WHEEL_COLORS = ["#FF5C4D", "#FF9B50", "#4ECDC4", "#FFE66D", "#A78BFA", "#F9A8D4"];

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function SpinFaqAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
      >
        <HelpCircle size={15} strokeWidth={2} className="text-[#FF5C4D] shrink-0" />
        <span className="flex-1 text-sm font-bold text-[#111111]">How do I use the wheel?</span>
        {open
          ? <ChevronUp size={15} strokeWidth={2} className="text-[#aaaaaa] shrink-0" />
          : <ChevronDown size={15} strokeWidth={2} className="text-[#aaaaaa] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[#aaaaaa] leading-relaxed">
          Click a slice to pick a task, or hit <strong className="text-[#111111]">Spin</strong> to get a random one. Then start a focus session to track your time.
        </div>
      )}
    </div>
  );
}

// ─── SVG Wheel ────────────────────────────────────────────────────────────────

interface WheelProps {
  tasks: Task[];
  rotation: number;
  spinning: boolean;
  onSliceClick: (task: Task) => void;
}

function SpinWheel({ tasks, rotation, spinning, onSliceClick }: WheelProps) {
  const SIZE = 320;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = CX - 10;

  if (tasks.length === 0) {
    return (
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block">
        <circle cx={CX} cy={CY} r={R} fill="#f0f0f0" />
        <circle cx={CX} cy={CY} r={R * 0.15} fill="white" />
      </svg>
    );
  }

  const n = tasks.length;
  const sliceAngle = (2 * Math.PI) / n;

  const slices = tasks.map((task, i) => {
    const startAngle = i * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const pathD = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midAngle = startAngle + sliceAngle / 2;
    const labelR = R * 0.62;
    const labelX = CX + labelR * Math.cos(midAngle);
    const labelY = CY + labelR * Math.sin(midAngle);
    const labelRotation = (midAngle * 180) / Math.PI + 90;

    const maxChars = n > 6 ? 12 : 16;
    const labelText = task.name.length > maxChars ? task.name.slice(0, maxChars - 1) + "…" : task.name;

    return { task, pathD, labelX, labelY, labelRotation, labelText, color: WHEEL_COLORS[i % WHEEL_COLORS.length] };
  });

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="block"
      style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? "none" : undefined }}
    >
      {slices.map(({ task, pathD, labelX, labelY, labelRotation, labelText, color }) => (
        <g key={task.id}>
          <path
            d={pathD}
            fill={color}
            stroke="white"
            strokeWidth={1.5}
            className={!spinning ? "cursor-pointer" : ""}
            onClick={() => { if (!spinning) onSliceClick(task); }}
          />
          <text
            x={labelX}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${labelRotation}, ${labelX}, ${labelY})`}
            fontSize={n > 8 ? 10 : n > 5 ? 11 : 12}
            fontWeight="600"
            fontFamily="var(--font-dm-sans), system-ui, sans-serif"
            fill="rgba(255,255,255,0.95)"
            className="pointer-events-none select-none"
          >
            {labelText}
          </text>
        </g>
      ))}
      {/* Center circle */}
      <circle cx={CX} cy={CY} r={R * 0.12} fill="white" />
    </svg>
  );
}

// ─── Week activity bubbles ────────────────────────────────────────────────────

function WeekBubbles() {
  const { completedTasks, completedRestDays } = useApp();
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);

  const days = DAY_LABELS.map((label, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const active =
      completedTasks.some((t) => { const d = new Date(t.completedAt); return d >= day && d < next; }) ||
      completedRestDays.some((d) => d >= day && d < next);
    const isToday = day.getTime() === today.getTime();
    const isFuture = day > today;
    return { label, active, isToday, isFuture };
  });

  return (
    <div className="flex gap-1.5 mt-2">
      {days.map((day, i) => (
        <div
          key={i}
          className={`flex-1 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
            day.isToday
              ? "bg-[#FF5C4D] text-white"
              : day.active
              ? "bg-[#111111] text-white"
              : day.isFuture
              ? "bg-[#EEEBE6] text-[#cccccc]"
              : "bg-[#E0DDD8] text-[#BCBAB6]"
          }`}
        >
          {day.label}
        </div>
      ))}
    </div>
  );
}

// ─── Result sheet ─────────────────────────────────────────────────────────────

interface ResultSheetProps {
  task: Task;
  onStartFocus: () => void;
  onDismiss: () => void;
}

function ResultSheet({ task, onStartFocus, onDismiss }: ResultSheetProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end md:items-center justify-center" onClick={onDismiss}>
      <div
        className="bg-white w-full max-w-sm rounded-t-3xl md:rounded-2xl p-7 shadow-2xl flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full bg-[#e0e0e0] mb-3 md:hidden" />
        <div
          className="w-10 h-10 rounded-full mb-1"
          style={{ backgroundColor: WHEEL_COLORS[0] }}
        />
        <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider">You got</p>
        <p className="text-2xl font-bold text-[#111111] text-center">{task.name}</p>
        <p className="text-sm text-[#aaaaaa]">{task.minutes}-minute focus session</p>
        <button
          onClick={onStartFocus}
          className="w-full bg-[#111111] text-white font-semibold text-base rounded-full py-3.5 mt-2 hover:bg-[#333333] active:scale-[0.98] transition"
        >
          Start Focus
        </button>
        <button
          onClick={onDismiss}
          className="w-full text-[#aaaaaa] font-medium text-base py-2 hover:text-[#111111] transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Main SpinTab ─────────────────────────────────────────────────────────────

interface SpinTabProps {
  onNavigateToTasks: () => void;
}

export function SpinTab({ onNavigateToTasks }: SpinTabProps) {
  const { tasks, startPomodoro, streak, incrementSpinCount, dailyGoal, completedTasks } = useApp();

  const todayDone = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return completedTasks.filter((t) => { const d = new Date(t.completedAt); d.setHours(0,0,0,0); return d.getTime() === today.getTime(); }).length;
  })();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<Task | null>(null);
  const rotationRef = useRef(0);

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  const spinWheel = useCallback(() => {
    if (tasks.length === 0 || spinning) return;
    setSpinning(true);
    const selectedIndex = Math.floor(Math.random() * tasks.length);
    const sliceAngle = 360 / tasks.length;
    const targetSliceCenter = -(selectedIndex + 0.5) * sliceAngle;
    const normalizedTarget = ((targetSliceCenter % 360) + 360) % 360;
    const currentNorm = ((rotationRef.current % 360) + 360) % 360;
    let delta = normalizedTarget - currentNorm;
    if (delta < 0) delta += 360;
    const extraSpins = (5 + Math.floor(Math.random() * 4)) * 360;
    const totalDelta = extraSpins + delta;
    const startRot = rotationRef.current;
    const targetRot = startRot + totalDelta;
    const duration = 3200 + Math.random() * 800;
    const startTime = performance.now();

    const frame = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(t);
      const current = startRot + totalDelta * eased;
      rotationRef.current = current;
      setRotation(current);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        rotationRef.current = targetRot;
        setRotation(targetRot);
        setSpinning(false);
        setPicked(tasks[selectedIndex]);
        incrementSpinCount();
      }
    };
    requestAnimationFrame(frame);
  }, [tasks, spinning, incrementSpinCount]);

  function handleSliceClick(task: Task) {
    if (!spinning) setPicked(task);
  }

  function handleStartFocus() {
    if (!picked) return;
    startPomodoro(picked);
    setPicked(null);
    onNavigateToTasks();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#111111]">Not sure where to start?</h1>
        <p className="text-2xl font-bold text-[#FF5C4D]">Spin the wheel.</p>
      </div>

      {/* FAQ */}
      <SpinFaqAccordion />

      {/* Week bubbles + streak */}
      <div className="bg-white rounded-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide">This week</span>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-xs font-semibold text-[#FF5C4D]">
              <Flame size={12} strokeWidth={2} />
              {streak}-day streak
            </div>
          )}
        </div>
        <WeekBubbles />
      </div>

      {/* Wheel + Spin button */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl flex flex-col items-center py-12 px-6 gap-3 text-center">
          <span className="text-5xl text-[#cccccc]">◎</span>
          <p className="text-lg font-bold text-[#111111]">Your wheel is empty</p>
          <p className="text-sm text-[#aaaaaa]">Add tasks to start spinning.</p>
          <button
            onClick={onNavigateToTasks}
            className="mt-2 bg-[#111111] text-white font-semibold text-sm rounded-full px-6 py-2.5 hover:bg-[#333333] transition"
          >
            Add tasks
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl flex flex-col items-center py-6 px-6 gap-5">
          <div className="relative w-[320px] h-[320px]">
            {/* Pointer — sits at the top, pointing down into the wheel */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0"
              style={{
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "22px solid #111111",
              }}
            />
            <SpinWheel
              tasks={tasks}
              rotation={rotation}
              spinning={spinning}
              onSliceClick={handleSliceClick}
            />
          </div>
          {/* Daily goal */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-[#aaaaaa]">
            <span className="font-semibold text-[#111111]">{todayDone}</span>
            <span>/</span>
            <span>{dailyGoal}</span>
            <span>tasks today</span>
          </div>
          <button
            onClick={spinWheel}
            disabled={spinning || tasks.length === 0}
            className="w-full max-w-xs bg-[#FF5C4D] text-white font-semibold text-base rounded-full py-3.5 hover:bg-[#e04f41] active:scale-[0.98] transition disabled:opacity-40"
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </button>
        </div>
      )}

      {/* Next milestone */}
      {streak > 0 && (
        <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-4">
          <Target size={24} strokeWidth={1.8} className="text-[#FF5C4D] shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#111111]">
              {[7, 14, 21, 30, 60, 90].find((m) => m > streak) != null
                ? `${([7, 14, 21, 30, 60, 90].find((m) => m > streak)! - streak)} day${[7, 14, 21, 30, 60, 90].find((m) => m > streak)! - streak !== 1 ? "s" : ""} to ${[7, 14, 21, 30, 60, 90].find((m) => m > streak)}-day milestone`
                : "Legendary streak! Keep going."}
            </p>
            <p className="text-xs text-[#aaaaaa] mt-0.5">You're on a roll</p>
          </div>
        </div>
      )}

      {picked && (
        <ResultSheet task={picked} onStartFocus={handleStartFocus} onDismiss={() => setPicked(null)} />
      )}
    </div>
  );
}
