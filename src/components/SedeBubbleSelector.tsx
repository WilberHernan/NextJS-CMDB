'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { SEDE_LABELS, type Sede } from '@/lib/sedes';
import { cn } from '@/lib/utils';

const BUBBLE_ITEMS: { value: Sede; label: string }[] = [
  { value: 'CCYS', label: SEDE_LABELS.CCYS },
  { value: 'REGIONAL', label: SEDE_LABELS.REGIONAL },
  { value: 'CIUDAD_JARDIN', label: SEDE_LABELS.CIUDAD_JARDIN },
];

interface SedeBubbleSelectorProps {
  selectedSede: Sede;
  setSelectedSede: (v: Sede) => void;
}

/**
 * Cinematic floating-bubble sede selector with full keyboard navigation.
 * Extracted from PasswordCard for maintainability.
 */
export function SedeBubbleSelector ({
  selectedSede,
  setSelectedSede,
}: SedeBubbleSelectorProps) {
  const [bubblesOpen, setBubblesOpen] = useState(false);
  const [exiting, setExiting] = useState<string | null>(null);
  const [pendingBubbleFocus, setPendingBubbleFocus] = useState<'first' | 'last' | null>(null);
  const bubbleTriggerRef = useRef<HTMLDivElement>(null);
  const sedeButtonRef = useRef<HTMLButtonElement>(null);
  const bubbleRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  const closeBubbles = useCallback(() => {
    setExiting('__all__');
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setExiting(null);
      setBubblesOpen(false);
    }, 300);
  }, []);

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
    <>
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

      {/* Sede dropdown (portal to document.body) */}
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
    </>
  );
}
