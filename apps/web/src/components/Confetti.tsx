"use client";

import { useEffect, useState } from "react";

const COLORS = ["#FF5C4D", "#FF9B50", "#4ECDC4", "#FFE66D", "#A78BFA", "#F9A8D4"];

interface Particle {
  id: number;
  left: number;
  top: number;
  cx: number;
  cy: number;
  cr: string;
  color: string;
  size: number;
  delay: number;
  round: boolean;
}

interface ConfettiProps {
  active: boolean;
  onDone?: () => void;
}

export function Confetti({ active, onDone }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;

    const n = 48;
    const created: Particle[] = Array.from({ length: n }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const dist = 80 + Math.random() * 220;
      return {
        id: i,
        left: 40 + Math.random() * 20,   // % — start near centre-ish
        top:  30 + Math.random() * 20,
        cx: Math.cos(angle) * dist,
        cy: Math.sin(angle) * dist + 60,  // bias downward
        cr: `${(Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360)}deg`,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 7,
        delay: Math.random() * 200,
        round: Math.random() > 0.5,
      };
    });
    setParticles(created);

    const timer = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, 1800);

    return () => clearTimeout(timer);
  }, [active, onDone]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute confetti-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.round ? "50%" : "2px",
            backgroundColor: p.color,
            animationDelay: `${p.delay}ms`,
            "--cx": `${p.cx}px`,
            "--cy": `${p.cy}px`,
            "--cr": p.cr,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
