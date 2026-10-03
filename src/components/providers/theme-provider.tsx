"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const hydrated = useSettingsStore((s) => s._hydrated);

  useEffect(() => {
    // Until settings load, keep what the <head> theme script applied
    // (applying the default here would flash the wrong theme)
    if (!hydrated) return;
    const root = document.documentElement;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage unavailable (private mode): the theme still applies below
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) =>
        root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    root.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  return <>{children}</>;
}
