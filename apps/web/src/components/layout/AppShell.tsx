"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw, ListTodo, Moon, BarChart2, LogOut, User, X, Flame, Minus, Plus, Trophy, Clock, Zap } from "lucide-react";
import { getSupabaseClient } from "@todo/shared";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useApp, type RestGoalTier, REST_GOAL_MINUTES } from "@/context/AppContext";
import { ACHIEVEMENT_DEFS, getUnlockedTierIds } from "@/utils/achievements";

export type TabId = "spin" | "tasks" | "rest" | "history";

const NAV_ITEMS: {
  id: TabId;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}[] = [
  { id: "spin",    label: "Spin",    Icon: RotateCcw },
  { id: "tasks",   label: "Tasks",   Icon: ListTodo  },
  { id: "rest",    label: "Rest",    Icon: Moon      },
  { id: "history", label: "History", Icon: BarChart2 },
];

interface AppShellProps {
  children: ReactNode;
  user: SupabaseUser | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  onSignOut: () => void;
}

export function AppShell({ children, user, activeTab, setActiveTab, onSignOut }: AppShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { streak } = useApp();

  async function handleSignOut() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // ignore if supabase not configured
    }
    onSignOut();
  }

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#E8E5E0] shrink-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-[#E8E5E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-base select-none">
              ◎
            </div>
            <span className="font-bold text-[#2A2520] text-base tracking-tight">Wheel Todo</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-[#FAF7F2] text-[#2A2520]"
                  : "text-[#aaaaaa] hover:text-[#2A2520] hover:bg-[#f7f6f3]"
              }`}
            >
              <Icon size={17} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              {label}
            </button>
          ))}
          {/* Streak badge */}
          {streak > 0 && (
            <button
              onClick={() => setActiveTab("history")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#E59880] hover:bg-[#fff0ee] transition-colors"
            >
              <Flame size={17} strokeWidth={2} />
              {streak}-day streak
            </button>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#E8E5E0] px-3 py-4">
          <button
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#aaaaaa] hover:text-[#2A2520] hover:bg-[#f7f6f3] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center shrink-0">
              <User size={14} strokeWidth={1.8} />
            </div>
            <span className="truncate flex-1 text-left text-xs">
              {user?.email ?? "Account"}
            </span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 pt-4 pb-2 shrink-0 bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">◎</span>
            <span className="font-bold text-[#2A2520] text-sm">Wheel Todo</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <button
                onClick={() => setActiveTab("history")}
                className="flex items-center gap-1 bg-white border border-[#E8E5E0] rounded-full px-2.5 py-1"
              >
                <Flame size={12} strokeWidth={2} className="text-[#E59880]" />
                <span className="text-xs font-bold text-[#E59880]">{streak}</span>
              </button>
            )}
            <button
              onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full bg-white border border-[#E8E5E0] flex items-center justify-center"
            >
              <User size={14} strokeWidth={1.8} className="text-[#aaaaaa]" />
            </button>
          </div>
        </header>

        {/* Page */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* ── Mobile bottom nav ──────────────────────────── */}
        <nav className="md:hidden flex border-t border-[#E8E5E0] bg-white shrink-0 safe-area-bottom">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
            >
              <Icon
                size={20}
                strokeWidth={activeTab === id ? 2.2 : 1.8}
                className={activeTab === id ? "text-[#E59880]" : "text-[#aaaaaa]"}
              />
              <span
                className={`text-[10px] font-semibold ${
                  activeTab === id ? "text-[#E59880]" : "text-[#aaaaaa]"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </nav>
      </main>

      {/* ── Profile modal ─────────────────────────────── */}
      {profileOpen && (
        <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSignOut={handleSignOut} />
      )}
    </div>
  );
}

// ─── Stepper helper ───────────────────────────────────────────────────────────

function Stepper({ value, min, max, step = 1, onChange, format }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center disabled:opacity-30 hover:bg-[#e8e5e0] transition-colors"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="w-14 text-center text-base font-bold text-[#2A2520]">
        {format ? format(value) : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center disabled:opacity-30 hover:bg-[#e8e5e0] transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Profile modal ────────────────────────────────────────────────────────────

interface ProfileModalProps {
  user: SupabaseUser | null;
  onClose: () => void;
  onSignOut: () => void;
}

const TIMER_STEPS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120];

type LucideIconComp = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const ACHIEVEMENT_ICON_MAP: Record<string, LucideIconComp> = {
  Flame: Flame,
  Trophy: Trophy,
  Clock: Clock,
  Zap: Zap,
  Moon: Moon,
  RotateCcw: RotateCcw,
};

const REST_TIERS: { id: RestGoalTier; label: string; description: string }[] = [
  { id: "easy",       label: "Easy",       description: `${REST_GOAL_MINUTES.easy} min`      },
  { id: "standard",   label: "Standard",   description: `${REST_GOAL_MINUTES.standard} min`  },
  { id: "dedicated",  label: "Dedicated",  description: `${REST_GOAL_MINUTES.dedicated} min` },
];

function ProfileModal({ user, onClose, onSignOut }: ProfileModalProps) {
  const {
    dailyGoal, setDailyGoal,
    defaultTimerMinutes, setDefaultTimerMinutes,
    restGoalTier, setRestGoalTier,
    categories, addCategory, removeCategory,
    completedTasks,
    achievementValues,
  } = useApp();

  const unlockedIds = getUnlockedTierIds(achievementValues);

  const [tab, setTab] = useState<"account" | "settings">("account");
  const [displayName, setDisplayName] = useState(
    (user?.user_metadata?.display_name as string | undefined) ?? ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newCat, setNewCat] = useState("");

  // Stats
  const totalHours = completedTasks.reduce((s, t) => s + t.minutesActual, 0) / 60;
  const onTimePct = completedTasks.length > 0
    ? Math.round((completedTasks.filter((t) => t.minutesActual <= t.minutesEstimated).length / completedTasks.length) * 100)
    : 0;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const supabase = getSupabaseClient();
      const updates: Parameters<typeof supabase.auth.updateUser>[0] = {};
      if (displayName.trim()) updates.data = { display_name: displayName.trim() };
      if (newPassword.length >= 6) updates.password = newPassword;
      if (!updates.data && !updates.password) { setMessage("No changes to save."); return; }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) { setMessage(error.message); } else { setMessage("Saved!"); setNewPassword(""); }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function stepTimer(dir: 1 | -1) {
    const idx = TIMER_STEPS.indexOf(defaultTimerMinutes);
    const nextIdx = idx === -1
      ? (dir === 1 ? 0 : TIMER_STEPS.length - 1)
      : Math.max(0, Math.min(TIMER_STEPS.length - 1, idx + dir));
    setDefaultTimerMinutes(TIMER_STEPS[nextIdx]);
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <h2 className="text-lg font-bold text-[#2A2520]">Profile</h2>
          <button onClick={onClose} className="text-[#aaaaaa] hover:text-[#2A2520] transition-colors">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mt-4 bg-[#FAF7F2] rounded-xl p-1">
          {(["account", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
                tab === t ? "bg-white text-[#2A2520] shadow-sm" : "text-[#aaaaaa]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4 space-y-4">
          {tab === "account" ? (
            <>
              {/* Stats row */}
              <div className="bg-[#f7f6f3] rounded-2xl flex py-4">
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-xl font-bold text-[#2A2520]">{completedTasks.length}</span>
                  <span className="text-xs text-[#aaaaaa]">Tasks done</span>
                </div>
                <div className="w-px bg-[#e8e8e8]" />
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-xl font-bold text-[#2A2520]">{totalHours.toFixed(1)}h</span>
                  <span className="text-xs text-[#aaaaaa]">Focused</span>
                </div>
                <div className="w-px bg-[#e8e8e8]" />
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-xl font-bold text-[#2A2520]">{onTimePct}%</span>
                  <span className="text-xs text-[#aaaaaa]">On time</span>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <p className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide mb-3">Achievements</p>
                <div className="space-y-2">
                  {ACHIEVEMENT_DEFS.map((def) => {
                    const val = achievementValues[def.key];
                    const AchievIcon = ACHIEVEMENT_ICON_MAP[def.iconName];
                    const unlockedCount = def.tiers.filter((t) => unlockedIds.includes(t.id)).length;
                    return (
                      <div key={def.key} className="bg-[#f7f6f3] rounded-2xl p-3.5">
                        <div className="flex items-center gap-3 mb-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: def.color + "30" }}
                          >
                            {AchievIcon && (
                              <span style={{ color: def.color }}>
                                <AchievIcon size={16} strokeWidth={2} />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2A2520] leading-tight">{def.label}</p>
                            <p className="text-xs text-[#aaaaaa] leading-tight">{def.description(val)}</p>
                          </div>
                          <span className="text-xs font-semibold text-[#aaaaaa] shrink-0">
                            {unlockedCount}/{def.tiers.length}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {def.tiers.map((tier) => {
                            const isUnlocked = unlockedIds.includes(tier.id);
                            return (
                              <div key={tier.id} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: isUnlocked ? def.color : "#D1D0CD" }}
                                />
                                <span
                                  className="text-[9px] text-center leading-tight font-medium"
                                  style={{ color: isUnlocked ? "#2A2520" : "#aaaaaa" }}
                                >
                                  {tier.badge}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {user ? (
                <>
                  <p className="text-sm text-[#aaaaaa] truncate">{user.email}</p>
                  <form onSubmit={handleSave} className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide block mb-1.5">Display name</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-[#f7f6f3] rounded-xl px-4 py-3 text-sm text-[#2A2520] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#2A2520]/20 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide block mb-1.5">New password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full bg-[#f7f6f3] rounded-xl px-4 py-3 text-sm text-[#2A2520] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#2A2520]/20 transition"
                      />
                    </div>
                    {message && (
                      <p className={`text-sm ${message === "Saved!" ? "text-green-600" : "text-red-600"}`}>{message}</p>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-[#2A2520] text-white font-semibold text-sm rounded-full py-3 hover:bg-[#333333] transition disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </form>
                </>
              ) : (
                <p className="text-sm text-[#aaaaaa]">Running without an account. Add Supabase credentials to enable sign-in.</p>
              )}

              <button
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 text-sm text-[#aaaaaa] hover:text-[#E59880] transition-colors py-2"
              >
                <LogOut size={15} strokeWidth={2} />
                Sign out
              </button>
            </>
          ) : (
            <>
              {/* Default timer */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-[#2A2520]">Default timer</p>
                  <p className="text-xs text-[#aaaaaa]">Pre-filled when adding tasks</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepTimer(-1)}
                    disabled={defaultTimerMinutes <= TIMER_STEPS[0]}
                    className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center disabled:opacity-30 hover:bg-[#e8e5e0] transition-colors"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="w-14 text-center text-base font-bold text-[#2A2520]">{defaultTimerMinutes}m</span>
                  <button
                    type="button"
                    onClick={() => stepTimer(1)}
                    disabled={defaultTimerMinutes >= TIMER_STEPS[TIMER_STEPS.length - 1]}
                    className="w-8 h-8 rounded-full bg-[#FAF7F2] flex items-center justify-center disabled:opacity-30 hover:bg-[#e8e5e0] transition-colors"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <div className="h-px bg-[#f0f0f0]" />

              {/* Daily goal */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-[#2A2520]">Daily goal</p>
                  <p className="text-xs text-[#aaaaaa]">Tasks to complete each day</p>
                </div>
                <Stepper value={dailyGoal} min={1} max={20} onChange={setDailyGoal} />
              </div>

              <div className="h-px bg-[#f0f0f0]" />

              {/* Rest goal tier */}
              <div>
                <p className="text-sm font-semibold text-[#2A2520] mb-2">Rest goal</p>
                <div className="flex gap-2">
                  {REST_TIERS.map(({ id, label, description }) => (
                    <button
                      key={id}
                      onClick={() => setRestGoalTier(id)}
                      className={`flex-1 rounded-xl py-2.5 flex flex-col items-center gap-0.5 border-2 transition-colors ${
                        restGoalTier === id
                          ? "border-[#2A2520] bg-[#f7f6f3]"
                          : "border-transparent bg-[#f7f6f3] hover:border-[#e0e0e0]"
                      }`}
                    >
                      <span className={`text-xs font-bold ${restGoalTier === id ? "text-[#2A2520]" : "text-[#aaaaaa]"}`}>{label}</span>
                      <span className="text-xs text-[#aaaaaa]">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#f0f0f0]" />

              {/* Task labels */}
              <div>
                <p className="text-sm font-semibold text-[#2A2520] mb-2">Task labels</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map((cat) => (
                    <div key={cat} className="flex items-center gap-1 bg-[#FAF7F2] rounded-full px-3 py-1.5">
                      <span className="text-xs font-medium text-[#2A2520]">{cat}</span>
                      <button
                        onClick={() => removeCategory(cat)}
                        className="text-[#aaaaaa] hover:text-[#E59880] transition-colors ml-0.5"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="New label…"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCat.trim()) {
                        addCategory(newCat.trim());
                        setNewCat("");
                      }
                    }}
                    maxLength={30}
                    className="flex-1 bg-[#f7f6f3] rounded-xl px-4 py-2.5 text-sm text-[#2A2520] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#2A2520]/20 transition"
                  />
                  <button
                    onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat(""); } }}
                    disabled={!newCat.trim()}
                    className="w-10 h-10 rounded-xl bg-[#2A2520] flex items-center justify-center disabled:opacity-30 transition-opacity"
                  >
                    <Plus size={16} strokeWidth={2.5} className="text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
