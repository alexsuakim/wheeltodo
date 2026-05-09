"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AppProvider } from "@/context/AppContext";
import { AuthPage } from "@/components/auth/AuthPage";
import { AppShell, type TabId } from "@/components/layout/AppShell";
import { SpinTab } from "@/components/tabs/SpinTab";
import { TasksTab } from "@/components/tabs/TasksTab";
import { RestTab } from "@/components/tabs/RestTab";
import { HistoryTab } from "@/components/tabs/HistoryTab";
import { getSupabaseClient } from "@todo/shared";

// ─── Authenticated app ────────────────────────────────────────────────────────

function AuthenticatedApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>("spin");

  return (
    <AppProvider>
      <AppShell user={user} activeTab={activeTab} setActiveTab={setActiveTab} onSignOut={onSignOut}>
        {activeTab === "spin"    && <SpinTab onNavigateToTasks={() => setActiveTab("tasks")} />}
        {activeTab === "tasks"   && <TasksTab />}
        {activeTab === "rest"    && <RestTab />}
        {activeTab === "history" && <HistoryTab />}
      </AppShell>
    </AppProvider>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseClient> | null = null;
    try {
      supabase = getSupabaseClient();
    } catch {
      // Supabase env not configured — skip auth and go straight to app
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center">
        <span className="text-4xl text-[#aaaaaa] animate-spin inline-block">◎</span>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={() => {
          try {
            const supabase = getSupabaseClient();
            supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return <AuthenticatedApp user={user} onSignOut={() => setUser(null)} />;
}
