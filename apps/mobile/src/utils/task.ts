export const DEFAULT_MINUTES = 25;

export function clampMinutes(m: number): number {
  if (!Number.isFinite(m)) return DEFAULT_MINUTES;
  return Math.max(1, Math.min(480, Math.round(m)));
}

export function newId(): string {
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
