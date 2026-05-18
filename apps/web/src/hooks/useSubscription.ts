"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wt.isPremium";

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIsPremium(localStorage.getItem(STORAGE_KEY) === "true");
    setLoaded(true);
  }, []);

  const activate = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsPremium(true);
  };

  return { isPremium, loaded, activate };
}
