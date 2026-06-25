'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  formControlBase,
  formControlOpen,
  formOptionClasses,
  formOptionSelectedClasses,
  formPanelClasses,
} from '@/lib/form-styles';

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
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const items = useMemo(() => normalizeOptions(options), [options]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const panelHeight = Math.min(items.length * 44 + 12, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < panelHeight + 16;

    setPanelPos({
      top: openAbove ? rect.top - panelHeight - 8 : rect.bottom + 8,
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
    if (!open) return;

    function handleClickOutside (e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapperRef.current?.contains(target) ||
        document.getElementById(panelId)?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleEscape (e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, panelId]);

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

  const toggleOpen = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (next) updatePosition();
      return next;
    });
  }, [updatePosition]);

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
          formControlBase,
          'items-center justify-between gap-2 text-left cursor-pointer',
          open && formControlOpen
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

      {mounted && open && panelPos && createPortal(
        <div
          id={panelId}
          role='listbox'
          style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            zIndex: 1000,
          }}
          className={formPanelClasses}
        >
          {items.map((item) => (
            <button
              key={item.value}
              type='button'
              role='option'
              aria-selected={item.value === value}
              onClick={() => handleSelect(item.value)}
              className={cn(
                formOptionClasses,
                item.value === value && formOptionSelectedClasses
              )}
            >
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
