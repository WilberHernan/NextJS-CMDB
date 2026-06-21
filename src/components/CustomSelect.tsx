'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

type SelectOption = string | { value: string; label: string };

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  /** Apple-style floating panel to the right of the trigger */
  floating?: boolean;
}

function normalizeOptions (options: SelectOption[]): { value: string; label: string }[] {
  return options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
}

export function CustomSelect ({
  options,
  value,
  placeholder = 'Seleccione...',
  onChange,
  className,
  floating,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const items = useMemo(() => normalizeOptions(options), [options]);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    function handleClickOutside (e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Recalculate floating position on scroll / resize when open
  useEffect(() => {
    if (!floating || !open) return;
    const updatePos = () => {
      if (!buttonRef.current) return;
      const r = buttonRef.current.getBoundingClientRect();
      const panelWidth = 200;
      const gap = 8;
      const spaceRight = window.innerWidth - r.right;
      const left = spaceRight >= panelWidth + gap
        ? r.right + gap
        : Math.max(8, r.left - panelWidth - gap);
      setPanelPos({ top: r.top, left });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [floating, open]);

  const toggleOpen = useCallback(() => {
    if (!floating && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedHeight = Math.min(items.length * 48 + 72, 300);
      setOpenUp(spaceBelow < estimatedHeight);
    }
    setOpen((prev) => !prev);
  }, [items.length, floating]);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setOpen(false);
    },
    [onChange]
  );

  const displayLabel = useMemo(() => {
    if (!value) return null;
    const match = items.find((i) => i.value === value);
    return match ? match.label : value;
  }, [value, items]);

  return (
    <div
      ref={wrapperRef}
      className={cn('group relative w-full', className)}
    >
      <button
        ref={buttonRef}
        type='button'
        onClick={toggleOpen}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl bg-surface-input px-4 py-3 text-sm text-left text-foreground relative',
          'border border-border-default shadow-neu-pressed',
          'transition-all duration-200 ease-cinematic outline-none font-sans',
          'hover:border-border-hover',
          'focus-visible:border-accent focus-visible:shadow-[var(--focus-ring)]',
          open && 'border-accent shadow-[var(--focus-ring)]'
        )}
      >
        <span className={cn('truncate', !value && 'text-muted-foreground')}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180 text-accent'
          )}
        />
      </button>

      {open && !floating && (
        <div
          className={cn(
            'absolute left-0 right-0 z-50',
            openUp
              ? 'bottom-[calc(100%+8px)]'
              : 'top-[calc(100%+8px)]',
            'rounded-xl bg-surface-elevated border border-border-default shadow-neu-flat',
            'p-2 max-h-[300px] overflow-y-auto',
            'overscroll-contain'
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type='button'
              onClick={() => handleSelect(item.value)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-left',
                'transition-all duration-150',
                'text-muted-foreground',
                'hover:bg-surface-hover hover:text-foreground',
                'hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]',
                'mb-0.5 last:mb-0',
                item.value === value &&
                  'bg-accent-soft text-accent font-semibold border border-border-accent'
              )}
            >
              <Check
                className={cn(
                  'h-4 w-4 shrink-0 transition-opacity',
                  item.value === value ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {open && floating && panelPos && (
        <div
          style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 100000,
          }}
          className={cn(
            'min-w-[180px] rounded-2xl p-1.5',
            'bg-surface-elevated',
            'shadow-neu-flat',
            'border border-border-default',
            'animate-scale-in origin-top-left',
            'overflow-y-auto max-h-[280px] overscroll-contain'
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type='button'
              onClick={() => handleSelect(item.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm text-left',
                'transition-all duration-100 font-sans tracking-tight',
                'text-muted-foreground',
                'hover:bg-surface-hover',
                item.value === value &&
                  'text-foreground font-medium'
              )}
            >
              <span>{item.label}</span>
              {item.value === value && (
                <span className='text-[10px] opacity-40 dark:opacity-50 ml-3'>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
