'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { SEDE_LABELS, type Sede } from '@/lib/sedes';
import { cn } from '@/lib/utils';

/* ── Static bubble items ── */
const BUBBLE_ITEMS: { value: Sede; label: string }[] = [
  { value: 'CCYS', label: SEDE_LABELS.CCYS },
  { value: 'REGIONAL', label: SEDE_LABELS.REGIONAL },
  { value: 'CIUDAD_JARDIN', label: SEDE_LABELS.CIUDAD_JARDIN },
];

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
 * Extracted from AuthGate for maintainability.
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
  /* ── Cinematic bubble selector ── */
  const [bubblesOpen, setBubblesOpen] = useState(false);
  const [exiting, setExiting] = useState<string | null>(null);
  const [pendingBubbleFocus, setPendingBubbleFocus] = useState<'first' | 'last' | null>(null);
  const bubbleTriggerRef = useRef<HTMLDivElement>(null);
  const sedeButtonRef = useRef<HTMLButtonElement>(null);
  const bubbleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [bubblePos, setBubblePos] = useState({
    triggerLeft: 0,
    triggerTop: 0,
    triggerWidth: 0,
    triggerHeight: 0,
  });

  const openBubbles = useCallback(() => {
    const tr = bubbleTriggerRef.current?.getBoundingClientRect();
    if (tr) {
      setBubblePos({
        triggerLeft: tr.left,
        triggerTop: tr.top,
        triggerWidth: tr.width,
        triggerHeight: tr.height,
      });
    }
    setBubblesOpen(true);
  }, []);

  const selectBubble = useCallback(
    (sede: Sede) => {
      setSelectedSede(sede);
      setExiting('__all__');
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setExiting(null);
        setBubblesOpen(false);
      }, 300);
    },
    [setSelectedSede]
  );

  // Click-outside: close bubbles when clicking anywhere that isn't a bubble or the trigger
  useEffect(() => {
    if (!bubblesOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        bubbleTriggerRef.current &&
        !bubbleTriggerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('[data-bubble]')
      ) {
        setExiting('__all__');
        setTimeout(() => {
          setExiting(null);
          setBubblesOpen(false);
        }, 300);
      }
    };
    const timer = setTimeout(
      () => document.addEventListener('click', handleClick),
      100
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [bubblesOpen]);

  // Cleanup bubble close timer on unmount
  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!bubblesOpen || !pendingBubbleFocus) return;
    const refs = bubbleRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    if (refs.length === 0) return;
    if (pendingBubbleFocus === 'first') {
      refs[0]?.focus();
    } else {
      refs[refs.length - 1]?.focus();
    }
    setPendingBubbleFocus(null);
  }, [bubblesOpen, pendingBubbleFocus]);

  const closeBubbles = () => {
    setExiting('__all__');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setExiting(null);
      setBubblesOpen(false);
    }, 300);
  };

  const handleSedeKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!bubblesOpen) {
          openBubbles();
          setPendingBubbleFocus('first');
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!bubblesOpen) {
          openBubbles();
          setPendingBubbleFocus('last');
        }
        break;
      case 'Escape':
        if (bubblesOpen) {
          e.preventDefault();
          closeBubbles();
        }
        break;
    }
  };

  const handleBubbleListKeyDown = (e: React.KeyboardEvent) => {
    const refs = bubbleRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    if (refs.length === 0) return;
    const currentIndex = refs.findIndex((el) => el === document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        {
          const next = currentIndex === -1 ? 0 : (currentIndex + 1) % refs.length;
          refs[next]?.focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        {
          const prev =
            currentIndex === -1
              ? refs.length - 1
              : (currentIndex - 1 + refs.length) % refs.length;
          refs[prev]?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeBubbles();
        sedeButtonRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          selectBubble(BUBBLE_ITEMS[currentIndex].value);
        }
        break;
    }
  };

  return (
    <div
      ref={cardRef}
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
          {/* ── Sede selector — cinematic floating bubbles ── */}
          <label
            htmlFor='gate-sede'
            className='block text-[0.65rem] font-semibold uppercase tracking-[0.13em] mb-2'
            style={{ color: 'var(--text-tertiary)' }}
          >
            Sede
          </label>
          <div ref={bubbleTriggerRef} className='mb-5'>
            <button
              ref={sedeButtonRef}
              id='gate-sede'
              type='button'
              onClick={openBubbles}
              onKeyDown={handleSedeKeyDown}
              aria-haspopup='listbox'
              aria-expanded={bubblesOpen}
              aria-controls={bubblesOpen ? 'gate-sede-list' : undefined}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-xl bg-surface-input px-4 py-3 text-sm text-left text-foreground',
                'border border-border-default shadow-neu-pressed',
                'transition-all duration-200 ease-cinematic outline-none font-sans',
                'hover:border-border-hover',
                'focus-visible:border-accent focus-visible:shadow-[var(--focus-ring)]',
                bubblesOpen && 'border-accent shadow-[var(--focus-ring)]'
              )}
            >
              <span
                className={cn(
                  'truncate',
                  !selectedSede && 'text-muted-foreground'
                )}
              >
                {selectedSede
                  ? SEDE_LABELS[selectedSede]
                  : 'Seleccione sede'}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                  bubblesOpen && 'rotate-180 text-accent'
                )}
              />
            </button>
          </div>

          {/* ── Sede dropdown (portal a document.body) ── */}
          {bubblesOpen &&
            createPortal(
              <div
                className='fixed inset-0 pointer-events-none'
                style={{ zIndex: 'var(--z-bubble)' }}
              >
                <div
                  data-bubble
                  id='gate-sede-list'
                  role='listbox'
                  onKeyDown={handleBubbleListKeyDown}
                  style={{
                    position: 'absolute',
                    top: bubblePos.triggerTop + bubblePos.triggerHeight + 6,
                    left: bubblePos.triggerLeft,
                    width: bubblePos.triggerWidth,
                  }}
                  className={cn(
                    'pointer-events-auto',
                    exiting === '__all__'
                      ? 'animate-bubble-out'
                      : 'animate-bubble-in'
                  )}
                >
                  <div
                    className='rounded-xl shadow-neu'
                    style={{
                      background: 'var(--bg-surface)',
                    }}
                  >
                    {BUBBLE_ITEMS.map((b, i) => {
                      const isSelected = selectedSede === b.value;
                      return (
                        <button
                          key={b.value}
                          ref={(el) => {
                            bubbleRefs.current[i] = el;
                          }}
                          type='button'
                          role='option'
                          aria-selected={isSelected}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectBubble(b.value);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-3 text-sm transition-colors duration-100',
                            isSelected
                              ? 'font-semibold'
                              : 'font-medium hover:bg-[var(--bg-hover)]',
                            i === 0 && 'rounded-t-xl',
                            i === BUBBLE_ITEMS.length - 1 && 'rounded-b-xl'
                          )}
                          style={{
                            color: isSelected
                              ? 'var(--accent)'
                              : 'var(--text-primary)',
                            fontFamily: 'var(--font-sans), sans-serif',
                          }}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className='flex items-center justify-center shrink-0'
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 7,
                                background: 'var(--accent-muted)',
                                boxShadow: `
                                  inset 1.5px 1.5px 3px var(--neu-shadow-dark),
                                  inset -1.5px -1.5px 3px var(--neu-shadow-light)
                                `,
                              }}
                            >
                              {isSelected && (
                                <svg
                                  width='13'
                                  height='13'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='var(--accent)'
                                  strokeWidth='3.5'
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                >
                                  <polyline points='20 6 9 17 4 12' />
                                </svg>
                              )}
                            </div>
                            <span>{b.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>,
              document.body
            )}

          {/* ── Password ── */}
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

          {/* ── Error ── */}
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

          {/* ── Enter button ── */}
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
