'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

type SelectOption = string | { value: string; label: string };

interface CustomSelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
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
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<'first' | 'last' | 'selected' | null>(null);
  const [pos, setPos] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const items = useMemo(() => normalizeOptions(options), [options]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(items.length * 48 + 72, 300);
    setOpenUp(spaceBelow < estimatedHeight);
    setPos({
      top: rect.bottom + 8,
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
      width: rect.width,
    });
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    function handleClickOutside (e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        document.getElementById(listId)?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [listId]);

  useEffect(() => {
    if (!open || !pendingFocus) return;
    const refs = optionRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    if (refs.length === 0) return;

    let targetIndex = 0;
    if (pendingFocus === 'last') {
      targetIndex = refs.length - 1;
    } else if (pendingFocus === 'selected') {
      const selectedIdx = items.findIndex((i) => i.value === value);
      targetIndex = selectedIdx >= 0 ? selectedIdx : 0;
    }
    refs[targetIndex]?.focus();
    setPendingFocus(null);
  }, [open, pendingFocus, items, value]);

  const openList = useCallback(
    (focusTarget: 'first' | 'last' | 'selected' = 'selected') => {
      updatePosition();
      setOpen(true);
      setPendingFocus(focusTarget);
    },
    [updatePosition]
  );

  const closeList = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const toggleOpen = useCallback(() => {
    if (open) {
      setOpen(false);
    } else {
      openList('selected');
    }
  }, [open, openList]);

  const handleSelect = useCallback(
    (optValue: string) => {
      onChange(optValue);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openList('first');
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openList('last');
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          closeList();
        }
        break;
      case ' ':
        e.preventDefault();
        toggleOpen();
        break;
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    const refs = optionRefs.current.filter(
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
      case 'Home':
        e.preventDefault();
        refs[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        refs[refs.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        closeList();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentIndex >= 0) {
          handleSelect(items[currentIndex].value);
        }
        break;
    }
  };

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
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
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

      {mounted && open && pos && createPortal(
        <div
          id={listId}
          ref={listRef}
          role='listbox'
          onKeyDown={handleListKeyDown}
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            ...(openUp ? { bottom: pos.bottom } : { top: pos.top }),
            zIndex: 'var(--z-dropdown)',
          }}
          className={cn(
            'rounded-xl bg-surface-elevated border border-border-default shadow-neu-flat',
            'p-2 max-h-[300px] overflow-y-auto overscroll-contain',
            'animate-dropdown-in'
          )}
        >
          {items.map((item, index) => (
            <button
              key={item.value}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              type='button'
              role='option'
              aria-selected={item.value === value}
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
        </div>,
        document.body
      )}
    </div>
  );
}
