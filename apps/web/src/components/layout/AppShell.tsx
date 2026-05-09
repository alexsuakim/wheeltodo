"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw, ListTodo, Moon, BarChart2, LogOut, User, X } from "lucide-react";
import { getSupabaseClient } from "@todo/shared";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
    <div className="flex h-screen bg-[#f2f0eb] overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-[#E8E5E0] shrink-0">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-[#E8E5E0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#f2f0eb] rounded-xl flex items-center justify-center text-base select-none">
              ◎
            </div>
            <span className="font-bold text-[#111111] text-base tracking-tight">Wheel Todo</span>
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
                  ? "bg-[#f2f0eb] text-[#111111]"
                  : "text-[#aaaaaa] hover:text-[#111111] hover:bg-[#f7f6f3]"
              }`}
            >
              <Icon size={17} strokeWidth={activeTab === id ? 2.2 : 1.8} />
              {label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#E8E5E0] px-3 py-4">
          <button
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#aaaaaa] hover:text-[#111111] hover:bg-[#f7f6f3] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#f2f0eb] flex items-center justify-center shrink-0">
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
        <header className="md:hidden flex items-center justify-between px-4 pt-4 pb-2 shrink-0 bg-[#f2f0eb]">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">◎</span>
            <span className="font-bold text-[#111111] text-sm">Wheel Todo</span>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-white border border-[#E8E5E0] flex items-center justify-center"
          >
            <User size={14} strokeWidth={1.8} className="text-[#aaaaaa]" />
          </button>
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
                className={activeTab === id ? "text-[#FF5C4D]" : "text-[#aaaaaa]"}
              />
              <span
                className={`text-[10px] font-semibold ${
                  activeTab === id ? "text-[#FF5C4D]" : "text-[#aaaaaa]"
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

// ─── Profile modal ────────────────────────────────────────────────────────────

interface ProfileModalProps {
  user: SupabaseUser | null;
  onClose: () => void;
  onSignOut: () => void;
}

function ProfileModal({ user, onClose, onSignOut }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    (user?.user_metadata?.display_name as string | undefined) ?? ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const supabase = getSupabaseClient();
      const updates: Parameters<typeof supabase.auth.updateUser>[0] = {};
      if (displayName.trim()) updates.data = { display_name: displayName.trim() };
      if (newPassword.length >= 6) updates.password = newPassword;
      if (!updates.data && !updates.password) {
        setMessage("No changes to save.");
        return;
      }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) { setMessage(error.message); } else { setMessage("Saved!"); setNewPassword(""); }
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#111111]">Account</h2>
          <button onClick={onClose} className="text-[#aaaaaa] hover:text-[#111111] transition-colors">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <p className="text-sm text-[#aaaaaa] mb-4 truncate">{user?.email}</p>

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide block mb-1.5">
              Display name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#f7f6f3] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#aaaaaa] uppercase tracking-wide block mb-1.5">
              New password
            </label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-[#f7f6f3] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
            />
          </div>

          {message && (
            <p className={`text-sm ${message === "Saved!" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#111111] text-white font-semibold text-sm rounded-full py-3 hover:bg-[#333333] transition disabled:opacity-50 mt-1"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 text-sm text-[#aaaaaa] hover:text-[#FF5C4D] transition-colors mt-4 py-2"
        >
          <LogOut size={15} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );
}
