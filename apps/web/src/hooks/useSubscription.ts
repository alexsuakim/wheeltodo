"use client";

import { useApp } from "@/context/AppContext";

export function useSubscription() {
  const { isPremium, activatePremium } = useApp();
  return { isPremium, loaded: true, activate: activatePremium };
}
