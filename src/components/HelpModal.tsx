'use client';

import { useEffect, useRef, useState, useCallback, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Terminal } from 'lucide-react';
import type { Sede } from '@/lib/sedes';
import { SEDE_LABELS } from '@/lib/sedes';
import { getHelpSections } from '@/lib/help-guide';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  sede: Sede;
}

const EXIT_MS = 500;

const CARD_IN = '0.5s cubic-bezier(0.16, 1, 0.3, 1)';
const CARD_OUT = '0.35s cubic-bezier(0.4, 0, 0.2, 1)';

export function HelpModal ({ open, onClose, sede }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);
  const [animIn, setAnimIn] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sections = getHelpSections(sede);

  useEffect(() => {
    setMounted(true);
    return () => clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (open) {
      clearTimeout(closeTimer.current);
      setVisible(true);
      requestAnimationFrame(() => setAnimIn(true));
    } else {
      setAnimIn(false);
      closeTimer.current = setTimeout(() => setVisible(false), EXIT_MS);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const onBackdrop = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[var(--z-modal)]'
      style={{
        opacity: animIn ? 1 : 0,
        transition: `opacity ${animIn ? '0.25s' : '0.3s'} ease`,
      }}
    >
      <div
        className='absolute inset-0'
        style={{
          backgroundColor: 'rgba(0,0,0,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      <div
        className='relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6'
        onClick={onBackdrop}
      >
        <div
          className='w-full max-w-xl'
          style={{
            opacity: animIn ? 1 : 0,
            transform: animIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
            transition: `all ${animIn ? CARD_IN : CARD_OUT}`,
            willChange: 'transform, opacity',
          }}
        >
          <div
            className='relative rounded-[1.25rem] p-7 sm:p-8 overflow-hidden glass-card'
          >
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

            <div
              className='absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full'
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              }}
            />

            <div className='relative z-10 max-h-[75vh] overflow-y-auto pr-2'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div
                    className='flex h-9 w-9 items-center justify-center rounded-lg'
                    style={{
                      background: 'var(--accent-muted)',
                      boxShadow: `
                        inset 1.5px 1.5px 3px var(--neu-shadow-dark),
                        inset -1.5px -1.5px 3px var(--neu-shadow-light)
                      `,
                    }}
                  >
                    <Terminal className='h-[18px] w-[18px]' style={{ color: 'var(--accent)' }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2
                      className='text-base font-bold tracking-[-0.02em]'
                      style={{ fontFamily: 'var(--font-display), sans-serif' }}
                    >
                      Uso de los scripts
                    </h2>
                    <p className='text-[0.6rem] uppercase tracking-[0.15em]' style={{ color: 'var(--text-tertiary)' }}>
                      Windows / Mac / Linux — {SEDE_LABELS[sede]}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  onClick={onClose}
                  className='flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:brightness-125'
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  aria-label='Cerrar'
                >
                  <X className='h-[16px] w-[16px]' strokeWidth={2} />
                </button>
              </div>

              <div className='space-y-2'>
                {sections.map((section, i) => {
                  switch (section.kind) {
                    case 'header':
                      return (
                        <h3
                          key={i}
                          className='text-[0.8rem] font-bold uppercase tracking-[0.18em] pt-4 pb-1'
                          style={{
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-display), sans-serif',
                          }}
                        >
                          {section.text}
                        </h3>
                      );

                    case 'step':
                      return (
                        <div key={i} className='flex items-start gap-2 pl-1'>
                          <span
                            className='inline-flex items-center justify-center shrink-0 mt-0.5 w-[18px] h-[18px] rounded-md text-[0.6rem] font-bold'
                            style={{
                              background: 'var(--accent-muted)',
                              color: 'var(--accent)',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                          >
                            {section.num}
                          </span>
                          <p className='text-sm leading-relaxed' style={{ color: 'var(--text-secondary)' }}>
                            {section.text}
                          </p>
                        </div>
                      );

                    case 'code':
                      return (
                        <code
                          key={i}
                          className='block text-[0.8rem] px-3 py-1.5 rounded-lg'
                          style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-mono, "Cascadia Code", "Fira Code", monospace)',
                          }}
                        >
                          {section.text}
                        </code>
                      );

                    case 'tip':
                      return (
                        <p
                          key={i}
                          className='text-sm leading-relaxed pl-3 border-l-2'
                          style={{
                            color: 'var(--text-secondary)',
                            borderColor: 'var(--accent-soft)',
                          }}
                        >
                          {section.text.split('->').map((part, j) =>
                            j === 0 ? (
                              <span key={j}>{part.trim()}</span>
                            ) : (
                              <span key={j} className='block mt-0.5 font-semibold' style={{ color: 'var(--text-primary)' }}>
                                → {part.trim()}
                              </span>
                            )
                          )}
                        </p>
                      );

                    case 'blank':
                      return <div key={i} className='h-1' />;

                    default:
                      return (
                        <p key={i} className='text-sm leading-relaxed' style={{ color: 'var(--text-secondary)' }}>
                          {section.text}
                        </p>
                      );
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
