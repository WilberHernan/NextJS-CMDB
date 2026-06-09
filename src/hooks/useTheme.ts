"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("light");
  const initialized = useRef(false);

  /* ── On mount: sync with localStorage (no transition jank) ── */
  useEffect(() => {
    if (initialized.current) return;
    const saved = localStorage.getItem("cmdb-theme") as "dark" | "light" | null;
    if (saved === "dark") {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    }
    initialized.current = true;
  }, []);

  /* ── setTheme with transient transition class ─────────────── */
  const setTheme = useCallback((next: "dark" | "light") => {
    const html = document.documentElement;
    /* Enable transitions ONLY during a user-initiated toggle */
    html.classList.add("theme-transitioning");
    setThemeState(next);
    localStorage.setItem("cmdb-theme", next);
    html.classList.toggle("dark", next === "dark");
    /* Remove transition class after animations settle */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.classList.remove("theme-transitioning");
      });
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
