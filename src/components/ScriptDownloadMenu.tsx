'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSede } from '@/contexts/sede-context';

const PLATFORMS = [
  { id: 'win', label: 'Windows' },
  { id: 'mac', label: 'macOS' },
  { id: 'linux', label: 'Linux' },
] as const;

const PILL_STAGGER_MS = 60;

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
      top: rect.bottom + 10,
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
        className={cn(
          'rounded-xl transition-all duration-200',
          open && 'bg-accent-soft text-accent shadow-[var(--focus-ring)]'
        )}
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
          className='flex flex-col items-end gap-2 pointer-events-auto'
        >
          {PLATFORMS.map((platform, index) => (
            <a
              key={platform.id}
              href={downloadUrl(platform.id)}
              role='menuitem'
              onClick={() => setOpen(false)}
              style={{ animationDelay: `${index * PILL_STAGGER_MS}ms` }}
              className={cn(
                'animate-pill-float-in',
                'inline-flex items-center justify-center min-w-[7.5rem]',
                'px-4 py-2 rounded-full',
                'glass border border-border-default shadow-neu',
                'text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground font-mono',
                'no-underline whitespace-nowrap',
                'transition-[transform,box-shadow,border-color,color,background] duration-200 ease-cinematic',
                'hover:border-border-accent hover:bg-accent-soft hover:text-accent hover:-translate-y-0.5 hover:shadow-neu-flat',
                'active:translate-y-0 active:scale-[0.97]'
              )}
            >
              {platform.label}
            </a>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
