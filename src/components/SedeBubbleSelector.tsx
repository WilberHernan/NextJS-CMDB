'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { SEDE_LABELS, type Sede } from '@/lib/sedes';
import { cn } from '@/lib/utils';
import { BubbleList } from '@/components/BubbleList';

interface SedeBubbleSelectorProps {
  selectedSede: Sede;
  setSelectedSede: (v: Sede) => void;
}

/**
 * Cinematic floating-bubble sede selector with full keyboard navigation.
 * Bubble list rendering extracted to BubbleList for maintainability.
 */
export function SedeBubbleSelector ({
  selectedSede,
  setSelectedSede,
}: SedeBubbleSelectorProps) {
  const [bubblesOpen, setBubblesOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [pendingBubbleFocus, setPendingBubbleFocus] = useState<'first' | 'last' | null>(null);
  const bubbleTriggerRef = useRef<HTMLDivElement>(null);
  const sedeButtonRef = useRef<HTMLButtonElement>(null);
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
      setExiting(true);
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = setTimeout(() => {
        setExiting(false);
        setBubblesOpen(false);
      }, 300);
    },
    [setSelectedSede]
  );

  const closeBubbles = useCallback(() => {
    setExiting(true);
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setExiting(false);
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
        closeBubbles();
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
  }, [bubblesOpen, closeBubbles]);

  // Cleanup bubble close timer on unmount
  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  // Focus first/last bubble when opened via keyboard
  useEffect(() => {
    if (!bubblesOpen || !pendingBubbleFocus) return;
    const list = document.getElementById('gate-sede-list');
    if (!list) return;
    const buttons = list.querySelectorAll<HTMLButtonElement>('button[role="option"]');
    if (buttons.length === 0) return;
    if (pendingBubbleFocus === 'first') {
      buttons[0]?.focus();
    } else {
      buttons[buttons.length - 1]?.focus();
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
              style={{
                position: 'absolute',
                top: bubblePos.triggerTop + bubblePos.triggerHeight + 6,
                left: bubblePos.triggerLeft,
                width: bubblePos.triggerWidth,
              }}
              className={cn(
                'pointer-events-auto',
                exiting ? 'animate-bubble-out' : 'animate-bubble-in'
              )}
            >
              <BubbleList
                selectedSede={selectedSede}
                onSelect={selectBubble}
                onClose={closeBubbles}
                returnFocusRef={sedeButtonRef}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
