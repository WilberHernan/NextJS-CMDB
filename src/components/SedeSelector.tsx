'use client';

import { useCallback } from 'react';
import { type Sede } from '@/lib/sedes';

interface SedeSelectorProps {
  onSelect: (sede: Sede) => void;
}

const SEDE_INFO: { id: Sede; label: string; desc: string }[] = [
  {
    id: 'CCYS',
    label: 'CCYS',
    desc: 'Centro de Comercio y Servicios',
  },
  {
    id: 'REGIONAL',
    label: 'REGIONAL',
    desc: 'Sede Regional Cauca',
  },
  {
    id: 'CIUDAD_JARDIN',
    label: 'CIUDAD JARDIN',
    desc: 'Sede Ciudad Jardín',
  },
];

export function SedeSelector ({ onSelect }: SedeSelectorProps) {
  return (
    <div
      className='w-full max-w-sm'
      style={{
        animation: 'gate-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        className='relative rounded-[1.25rem] p-7 sm:p-8 overflow-hidden'
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(32px) saturate(160%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: '1px solid var(--glass-border)',
          boxShadow: `
            4px 4px 16px var(--neu-shadow-dark),
            -4px -4px 16px var(--neu-shadow-light),
            0 1px 0 0 var(--glass-highlight) inset,
            0 0 0 1px rgba(255,255,255,0.03) inset
          `,
        }}
      >
        {/* Grain texture */}
        <div
          className='absolute inset-0 pointer-events-none rounded-[inherit]'
          style={{
            opacity: 0.035,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            backgroundSize: '180px 180px',
            mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
          }}
        />

        {/* Top edge glow */}
        <div
          className='absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full'
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />

        {/* Header */}
        <div className='text-center mb-6'>
          <h1
            className='text-[1.15rem] font-bold tracking-[-0.02em] mb-1'
            style={{ fontFamily: 'var(--font-display), sans-serif' }}
          >
            Seleccionar sede
          </h1>
          <p
            className='text-sm'
            style={{ color: 'var(--text-secondary)' }}
          >
            ¿Con qué sede querés trabajar?
          </p>
        </div>

        {/* Sede buttons */}
        <div className='flex flex-col gap-3'>
          {SEDE_INFO.map((sede) => (
            <SedeButton
              key={sede.id}
              label={sede.label}
              desc={sede.desc}
              onClick={() => onSelect(sede.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          className='mt-6 text-center text-[0.6rem] uppercase tracking-[0.15em]'
          style={{ color: 'var(--text-disabled)' }}
        >
          SENA — Gestión CMDB
        </div>
      </div>
    </div>
  );
}

function SedeButton ({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
}) {
  const handleClick = useCallback(() => onClick(), [onClick]);

  return (
    <button
      type='button'
      onClick={handleClick}
      className='w-full text-left rounded-xl px-5 py-3.5 transition-all duration-200'
      style={{
        background: 'var(--accent-muted)',
        border: '1px solid var(--border-accent)',
        boxShadow:
          '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.boxShadow =
          'inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.boxShadow =
          '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)';
      }}
    >
      <div
        className='text-sm font-semibold'
        style={{ color: 'var(--accent)' }}
      >
        {label}
      </div>
      <div
        className='text-[0.6875rem] mt-0.5'
        style={{ color: 'var(--text-tertiary)' }}
      >
        {desc}
      </div>
    </button>
  );
}
