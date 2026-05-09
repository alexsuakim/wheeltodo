"use client";

import { useState } from "react";
import { RotateCcw, Timer, Moon, ChevronRight } from "lucide-react";

const STEPS = [
  {
    Icon: RotateCcw,
    color: "#FF5C4D",
    title: "Add tasks to your wheel",
    body: "Head to the Tasks tab and add the things you need to get done. Each task goes on the wheel.",
  },
  {
    Icon: Timer,
    color: "#FF9B50",
    title: "Spin to stay focused",
    body: "Hit Spin and the wheel picks a task for you. Start a focus session to track your time and build your streak.",
  },
  {
    Icon: Moon,
    color: "#A78BFA",
    title: "Rest days count too",
    body: "Switch to Rest Mode on days you need a break. Completing rest activities protects your streak so momentum never breaks.",
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-end md:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${current.color}20` }}
        >
          <current.Icon size={32} strokeWidth={1.8} style={{ color: current.color }} />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#111111]">{current.title}</h2>
          <p className="text-sm text-[#aaaaaa] leading-relaxed">{current.body}</p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? 24 : 8,
                backgroundColor: i === step ? "#111111" : "#e0e0e0",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
            className="w-full bg-[#111111] text-white font-semibold text-base rounded-full py-3.5 hover:bg-[#333333] active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            {isLast ? "Get started" : "Next"}
            {!isLast && <ChevronRight size={16} strokeWidth={2.5} />}
          </button>
          {!isLast && (
            <button
              onClick={onDone}
              className="text-sm text-[#aaaaaa] py-2 hover:text-[#111111] transition"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
