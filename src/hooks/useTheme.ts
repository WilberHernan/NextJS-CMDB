'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTheme () {
  const [theme, setThemeState] = useState<'dark' | 'light'>('light');
  const initialized = useRef(false);
  const transitioningRef = useRef(false);

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
   *  Usa el centro del botón toggle como origen del circle
   *  clip-path reveal. Si una transición ya está en curso
   *  (usuario clickeó rápido) saltea la animación y hace el
   *  toggle directo — evita que el browser descarte el efecto
   *  dejando un cambio seco e inconsistente.                    */
  const setTheme = useCallback((next: 'dark' | 'light') => {
    const html = document.documentElement;
    const isDark = next === 'dark';

    setThemeState(next);
    localStorage.setItem('cmdb-theme', next);

    if (document.startViewTransition && !transitioningRef.current) {
      const { x, y } = getToggleOrigin();

      transitioningRef.current = true;

      const transition = document.startViewTransition(() => {
        html.classList.toggle('dark', isDark);
      });

      /* Animar el circle clip-path desde el toggle */
      transition.ready
        .then(() => {
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
        })
        .catch(() => {
          /* Transición saltada: el DOM ya cambió en el callback,
           * solo perdemos la animación. No es error. */
        });

      /* Liberar el guard cuando termine (éxito o fracaso) */
      transition.finished
        .catch(() => {})
        .finally(() => {
          transitioningRef.current = false;
        });
    } else {
      /* Fallback: sin View Transitions, o ya hay una en curso */
      html.classList.toggle('dark', isDark);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
