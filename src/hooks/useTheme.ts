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
   *  clip-path reveal. Previene dos bugs comunes:
   *
   *  1. FLASH: inyecta un <style> con clip-path ANTES de la
   *     transición para que ::view-transition-new(root) nazca ya
   *     clipado. Sin esto, WAAPI arranca 1 frame después y se ve
   *     la snapshot completa sin clip por un frame → parpadeo.
   *
   *  2. GUARD ATASCADO: la promise transition.finished puede no
   *     resolverse si el browser interrumpe la transición (cambio
   *     de pestaña, etc.). Un setTimeout de seguridad libera el
   *     guard a los 2s y evita que la animación se pierda para
   *     siempre.                                                   */
  const setTheme = useCallback((next: 'dark' | 'light') => {
    const html = document.documentElement;
    const isDark = next === 'dark';

    setThemeState(next);
    localStorage.setItem('cmdb-theme', next);

    if (document.startViewTransition && !transitioningRef.current) {
      const { x, y } = getToggleOrigin();
      const endRadius = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y)
      );

      /* Inyectar clip-path pre-set para evitar el flash de 1 frame.
       * El pseudo-elemento nace con este clip y luego WAAPI lo
       * anima desde el mismo valor — no hay salto visual.          */
      const preClip = document.createElement('style');
      preClip.textContent = `
        ::view-transition-new(root) {
          clip-path: circle(0 at ${x}px ${y}px);
        }
      `;
      document.head.appendChild(preClip);

      transitioningRef.current = true;

      /* Timeout de seguridad: si transition.finished nunca se
       * resuelve (cambio de pestaña, browser interrupt), este
       * timeout libera el guard a los 2s.                         */
      const guardTimeout = setTimeout(() => {
        transitioningRef.current = false;
      }, 2_000);

      const transition = document.startViewTransition(() => {
        html.classList.toggle('dark', isDark);
      });

      /* WAAPI anima desde el clip-path pre-set hasta cubrir todo */
      transition.ready
        .then(() => {
          html.animate(
            {
              clipPath: [
                /* Coincide con el preClip CSS → sin salto visual */
                `circle(0 at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 600,
              easing: 'ease-in-out',
              fill: 'forwards',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          /* Transición saltada: el DOM ya cambió en el callback,
           * solo perdemos la animación. No es error. */
        });

      /* Limpieza: remover el style inyectado y liberar el guard */
      transition.finished
        .catch(() => {})
        .finally(() => {
          preClip.remove();
          clearTimeout(guardTimeout);
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
