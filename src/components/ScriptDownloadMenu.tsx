'use client';

import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSede } from '@/contexts/sede-context';
import { SEDE_LABELS } from '@/lib/sedes';

const PLATFORMS = [
  { id: 'win', label: 'Windows', emoji: '🪟' },
  { id: 'mac', label: 'macOS', emoji: '🍎' },
  { id: 'linux', label: 'Linux', emoji: '🐧' },
] as const;

export function ScriptDownloadMenu () {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { sede } = useSede();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside (e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
  }, [open]);

  const downloadUrl = (plataforma: string) =>
    `/api/descargar-script?sede=${sede}&plataforma=${plataforma}`;

  return (
    <div ref={wrapperRef} className='relative'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setOpen((v) => !v)}
        className={cn('rounded-xl', open && 'bg-surface-hover text-foreground')}
        title={
          sede
            ? 'Descargar scripts de inventario'
            : 'Selecciona una sede para descargar scripts'
        }
        aria-label='Descargar scripts de inventario'
        aria-expanded={open}
        aria-haspopup='menu'
        disabled={!sede}
      >
        <Download className='h-[18px] w-[18px]' />
      </Button>

      {open && sede && (
        <div
          role='menu'
          className={cn(
            'absolute right-0 top-[calc(100%+6px)] z-[60] min-w-[200px]',
            'rounded-xl border border-border-default bg-surface-elevated shadow-[var(--shadow-md)]',
            'animate-dropdown-in overflow-hidden'
          )}
        >
          <div className='px-3.5 py-2.5 border-b border-border-default'>
            <p className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
              Scripts
            </p>
            <p className='text-xs font-semibold text-foreground mt-0.5'>
              {SEDE_LABELS[sede]}
            </p>
          </div>

          <div className='p-1.5'>
            {PLATFORMS.map((platform) => (
              <a
                key={platform.id}
                href={downloadUrl(platform.id)}
                role='menuitem'
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold no-underline',
                  'text-foreground transition-all duration-200 ease-cinematic',
                  'hover:bg-surface-hover active:scale-[0.98]'
                )}
              >
                <span className='text-base leading-none w-5 text-center' aria-hidden>
                  {platform.emoji}
                </span>
                {platform.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
