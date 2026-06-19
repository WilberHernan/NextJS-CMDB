'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTheme () {
  const [theme, setThemeState] = useState<'dark' | 'light'>('light');
  const initialized = useRef(false);

  /* ── On mount: sync with localStorage (no transition jank) ── */
  useEffect(() => {
    if (initialized.current) return;
    const saved = localStorage.getItem('cmdb-theme') as 'dark' | 'light' | null;
    if (saved === 'dark') {
      setThemeState('dark');
      document.documentElement.classList.add('dark');
    }
    initialized.current = true;
  }, []);

  /* ── Resolve circle-reveal origin from toggle button ──────── */
  function getToggleOrigin (): { x: number; y: number } {
    const el = document.querySelector<HTMLElement>('[data-theme-toggle]');
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  /* ── setTheme with View Transitions API (circle reveal) ─────
   *  Descubre el botón toggle en el DOM y usa su centro como
   *  origen del circle clip-path reveal. Falls back a toggle
   *  directo si el browser no soporta View Transitions.            */
  const setTheme = useCallback((next: 'dark' | 'light') => {
    const html = document.documentElement;
    const isDark = next === 'dark';

    setThemeState(next);
    localStorage.setItem('cmdb-theme', next);

    if (document.startViewTransition) {
      const { x, y } = getToggleOrigin();

      const transition = document.startViewTransition(() => {
        html.classList.toggle('dark', isDark);
      });

      /* Esperar a que los pseudo-elementos estén listos para animar */
      transition.ready.then(() => {
        const endRadius = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        );
        html.animate(
          {
            clipPath: [
              `circle(0 at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 600,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      });
    } else {
      /* Fallback: Safari <18, older browsers */
      html.classList.toggle('dark', isDark);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
