'use client';

import { useRef, useCallback } from 'react';
import { SEDE_LABELS, type Sede } from '@/lib/sedes';
import { cn } from '@/lib/utils';

const BUBBLE_ITEMS: { value: Sede; label: string }[] = [
  { value: 'CCYS', label: SEDE_LABELS.CCYS },
  { value: 'REGIONAL', label: SEDE_LABELS.REGIONAL },
  { value: 'CIUDAD_JARDIN', label: SEDE_LABELS.CIUDAD_JARDIN },
];

interface BubbleListProps {
  selectedSede: Sede;
  onSelect: (sede: Sede) => void;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Rendered bubble list with keyboard navigation.
 * Extracted from SedeBubbleSelector for maintainability.
 */
export function BubbleList ({
  selectedSede,
  onSelect,
  onClose,
  returnFocusRef,
}: BubbleListProps) {
  const bubbleRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
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
        onClose();
        returnFocusRef.current?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          onSelect(BUBBLE_ITEMS[currentIndex].value);
        }
        break;
    }
  }, [onSelect, onClose, returnFocusRef]);

  return (
    <div
      data-bubble
      id='gate-sede-list'
      role='listbox'
      onKeyDown={handleKeyDown}
    >
      <div
        className='rounded-xl shadow-neu'
        style={{ background: 'var(--bg-surface)' }}
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
                onSelect(b.value);
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
  );
}
