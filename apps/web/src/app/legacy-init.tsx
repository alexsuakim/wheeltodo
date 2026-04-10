"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@todo/shared";

export function LegacyWheelTodoInit() {
  useEffect(() => {
    let cancelled = false;
    // Initialize Supabase early so auth/session is ready.
    try {
      getSupabaseClient();
    } catch {
      // Missing env is fine during initial setup.
    }
    void import("../legacy/wheelTodo").then((m) => {
      if (cancelled) return;
      m.initWheelTodo();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

export function LegacyCalendarInit() {
  useEffect(() => {
    let cancelled = false;
    void import("../legacy/calendar").then((m) => {
      if (cancelled) return;
      m.initCalendar();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

