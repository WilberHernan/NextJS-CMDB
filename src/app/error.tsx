'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function Error ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center p-4 sm:p-8'>
      <div
        className='w-full max-w-sm'
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Glass card ── */}
        <div
          className='relative rounded-[1.25rem] p-7 sm:p-8 overflow-hidden'
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            border: '1px solid var(--glass-border)',
            boxShadow: `
              4px 4px 16px var(--neu-shadow-dark),
              -4px -4px 16px var(--neu-shadow-light),
              0 1px 0 0 var(--glass-highlight) inset,
              0 0 0 1px rgba(255,255,255,0.03) inset
            `,
          }}
        >
          {/* Grain texture */}
          <div
            className='absolute inset-0 pointer-events-none rounded-[inherit]'
            style={{
              opacity: 0.035,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              backgroundSize: '180px 180px',
              mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
            }}
          />

          {/* Top edge glow */}
          <div
            className='absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full'
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
            }}
          />

          {/* ── Icon: danger inside neumorphic pressed well ── */}
          <div
            className='mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl'
            style={{
              background: 'var(--danger-soft)',
              boxShadow: `
                inset 2px 2px 4px var(--neu-shadow-dark),
                inset -2px -2px 4px var(--neu-shadow-light)
              `,
            }}
          >
            <AlertTriangle
              className='h-7 w-7'
              strokeWidth={1.75}
              style={{ color: 'var(--danger)' }}
            />
          </div>

          {/* ── Title ── */}
          <h1
            className='text-center text-[1.15rem] font-bold tracking-[-0.02em] mb-1'
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Algo salió mal
          </h1>

          {/* ── Message ── */}
          <p
            className='text-center text-sm leading-relaxed mb-6'
            style={{ color: 'var(--text-secondary)' }}
          >
            Ocurrió un error inesperado. No te preocupes,{' '}
            <span style={{ color: 'var(--accent)' }}>tus datos están seguros</span>.
          </p>

          {/* ── Error digest ── */}
          {error.digest && (
            <div className='text-center mb-6'>
              <span
                className='inline-block text-[0.6rem] uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg'
                style={{
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  fontFamily: 'var(--font-sans), sans-serif',
                }}
              >
                Código: {error.digest}
              </span>
            </div>
          )}

          {/* ── Retry button (neumorphic, matches app style) ── */}
          <button
            type='button'
            onClick={reset}
            className='w-full rounded-xl px-5 py-[0.7rem] text-sm font-semibold transition-all duration-200 ease-cinematic outline-none font-sans flex items-center justify-center gap-2'
            style={{
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-accent)',
              boxShadow:
                '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow =
                '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow =
                '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)';
            }}
          >
            <RotateCcw className='h-[18px] w-[18px]' strokeWidth={2} />
            Intentar de nuevo
          </button>

          {/* ── Footer ── */}
          <div
            className='mt-8 text-center text-[0.6rem] uppercase tracking-[0.15em]'
            style={{ color: 'var(--text-disabled)' }}
          >
            CMDB SENA — Cauca 2026
          </div>
        </div>
      </div>
    </div>
  );
}
