'use client';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SedeBubbleSelector } from '@/components/SedeBubbleSelector';
import type { Sede } from '@/lib/sedes';

interface PasswordCardProps {
  password: string;
  setPassword: (v: string) => void;
  error: string;
  setError: (v: string) => void;
  submitting: boolean;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  selectedSede: Sede;
  setSelectedSede: (v: Sede) => void;
  onSubmit: (e: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Cinematic password card with sede selector and glassmorphism.
 * Sede bubble selector extracted to SedeBubbleSelector for maintainability.
 */
export function PasswordCard ({
  password,
  setPassword,
  error,
  setError,
  submitting,
  showPassword,
  setShowPassword,
  selectedSede,
  setSelectedSede,
  onSubmit,
  inputRef,
}: PasswordCardProps) {
  return (
    <div
      className='w-full max-w-sm'
      style={{
        animation: 'gate-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        className='relative rounded-[1.25rem] p-7 sm:p-8 overflow-hidden glass-card'
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

        {/* Lock icon */}
        <div
          className='mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl'
          style={{
            background: 'var(--accent-muted)',
            boxShadow: `
              inset 2px 2px 4px var(--neu-shadow-dark),
              inset -2px -2px 4px var(--neu-shadow-light)
            `,
          }}
        >
          <svg
            width='26'
            height='26'
            viewBox='0 0 24 24'
            fill='none'
            stroke='var(--accent)'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            <path d='M9 12l2 2 4-4' />
          </svg>
        </div>

        <h1
          className='text-center text-[1.15rem] font-bold tracking-[-0.02em] mb-1'
          style={{ fontFamily: 'var(--font-display), sans-serif' }}
        >
          Acceso restringido
        </h1>
        <p
          className='text-center text-sm mb-6'
          style={{ color: 'var(--text-secondary)' }}
        >
          Elegí la sede e ingresá la contraseña
        </p>

        <form onSubmit={onSubmit} noValidate>
          {/* Sede selector */}
          <SedeBubbleSelector
            selectedSede={selectedSede}
            setSelectedSede={setSelectedSede}
          />

          {/* Password */}
          <label
            className='block text-[0.65rem] font-semibold uppercase tracking-[0.13em] mb-2'
            style={{ color: 'var(--text-tertiary)' }}
            htmlFor='gate-password'
          >
            Contraseña
          </label>
          <div className='relative rounded-xl bg-surface-input border border-border-default shadow-neu-pressed transition-all duration-200 hover:border-border-hover focus-within:border-accent focus-within:shadow-[var(--focus-ring)] mb-5 overflow-hidden'>
            <input
              ref={inputRef}
              id='gate-password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              autoComplete='current-password'
              aria-describedby='gate-error'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              disabled={submitting}
              className='w-full px-4 py-[0.7rem] pr-12 text-sm bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-disabled)] disabled:opacity-50'
              style={{ fontFamily: 'var(--font-sans), sans-serif' }}
            />

            <button
              type='button'
              disabled={submitting}
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 disabled:opacity-30',
                showPassword
                  ? 'bg-accent-soft border border-border-accent shadow-neu-pressed'
                  : 'bg-accent-muted border border-border-accent shadow-neu'
              )}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword
                ? <EyeOff className='h-[18px] w-[18px] text-accent' strokeWidth={1.75} />
                : <Eye className='h-[18px] w-[18px] text-accent' strokeWidth={1.75} />}
            </button>
          </div>

          {/* Error */}
          <div
            id='gate-error'
            className='text-xs font-medium min-h-[1.25rem] transition-opacity'
            style={{
              color: 'var(--danger)',
              opacity: error ? 1 : 0,
            }}
          >
            {error || '\u00A0'}
          </div>

          {/* Enter button */}
          <button
            type='submit'
            disabled={submitting}
            className='w-full mt-1 rounded-xl px-5 py-[0.7rem] text-sm font-semibold transition-all duration-200 disabled:opacity-50 btn-lift'
            style={{
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--border-accent)',
              boxShadow: submitting
                ? 'inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)'
                : '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
            }}
          >
            {submitting ? 'Verificando\u2026' : 'Entrar'}
          </button>
        </form>

        <div
          className='mt-8 text-center text-[0.6rem] uppercase tracking-[0.15em]'
          style={{ color: 'var(--text-disabled)' }}
        >
          SENA — Gestión CMDB
        </div>
      </div>
    </div>
  );
}
