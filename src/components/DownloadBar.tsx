'use client';

import { useSede } from '@/contexts/sede-context';
import { SEDE_LABELS } from '@/lib/sedes';
import { cn } from '@/lib/utils';

/**
 * Compact download row for inventory scripts.
 * Sits below the scanner — no dropdown, no hidden menu.
 * Each platform links directly to the API route that
 * bundles the correct files.
 */
export function DownloadBar () {
  const { sede } = useSede();

  const base = `/api/descargar-script?sede=${sede}&plataforma=`;

  const platforms: Array<{ key: string; label: string; icon: string; badge?: string }> = [
    { key: 'win', label: 'Windows', badge: '.bat + .ps1', icon: '🪟' },
    { key: 'mac', label: 'macOS', icon: '🍎' },
    { key: 'linux', label: 'Linux', icon: '🐧' },
  ];

  if (!sede) return null;

  return (
    <div
      className={cn(
        'rounded-2xl glass border-border-default',
        'flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3'
      )}
    >
      <span className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0 mr-1'>
        Scripts — {SEDE_LABELS[sede]}
      </span>

      <span className='w-px h-5 bg-border-default shrink-0' role='separator' />

      {platforms.map((p) => (
        <a
          key={p.key}
          href={`${base}${p.key}`}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold',
            'bg-surface-elevated border border-border-default',
            'hover:bg-surface-hover hover:-translate-y-0.5',
            'active:translate-y-0',
            'transition-all duration-200 ease-cinematic',
            'text-foreground no-underline'
          )}
        >
          <span className='text-sm leading-none'>{p.icon}</span>
          {p.label}
          {p.badge && (
            <span className='text-[9px] font-medium text-muted-foreground ml-0.5'>
              {p.badge}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
