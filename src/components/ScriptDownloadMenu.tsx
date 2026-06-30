'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Download, Monitor, Apple, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSede } from '@/contexts/sede-context';

const PLATFORMS = [
  { id: 'win', label: 'Windows', Icon: Monitor },
  { id: 'mac', label: 'macOS', Icon: Apple },
  { id: 'linux', label: 'Linux', Icon: Terminal },
] as const;

export function ScriptDownloadMenu () {
  const [open, setOpen] = useState(false);
  const [anchorPos, setAnchorPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const { sede } = useSede();

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setAnchorPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
  }, []);

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

  const downloadUrl = (plataforma: string) =>
    `/api/descargar-script?sede=${sede}&plataforma=${plataforma}`;

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) updatePosition();
      return next;
    });
  };

  return (
    <div ref={wrapperRef} className='relative'>
      <Button
        ref={buttonRef}
        variant='ghost'
        size='icon'
        onClick={handleToggle}
        className={cn('rounded-xl', open && 'bg-surface-hover text-foreground')}
        title={
          sede
            ? 'Descargar scripts de inventario'
            : 'Selecciona una sede para descargar scripts'
        }
        aria-label='Descargar scripts de inventario'
        aria-expanded={open}
        aria-haspopup='menu'
        aria-controls={open ? panelId : undefined}
        disabled={!sede}
      >
        <Download className='h-[18px] w-[18px]' />
      </Button>

      {mounted && open && sede && anchorPos && createPortal(
        <div
          id={panelId}
          role='menu'
          aria-label='Plataformas de descarga'
          style={{
            position: 'fixed',
            top: anchorPos.top,
            right: anchorPos.right,
            zIndex: 1000,
          }}
          className={cn(
            'w-[11.5rem] pointer-events-auto p-2',
            'rounded-xl bg-surface-elevated border border-border-default shadow-neu-flat',
            'animate-dropdown-in overscroll-contain'
          )}
        >
          {PLATFORMS.map((platform) => (
            <a
              key={platform.id}
              href={downloadUrl(platform.id)}
              role='menuitem'
              onClick={() => setOpen(false)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline',
                'text-muted-foreground transition-all duration-150',
                'hover:bg-surface-hover hover:text-foreground',
                'hover:shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px_4px_var(--neu-shadow-light)]',
                'mb-0.5 last:mb-0 active:scale-[0.98]'
              )}
            >
              <platform.Icon className='h-4 w-4 shrink-0 text-muted-foreground' />
              {platform.label}
            </a>
          ))}

        </div>,
        document.body
      )}
    </div>
  );
}
