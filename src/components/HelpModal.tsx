'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Terminal } from 'lucide-react';
import type { Sede } from '@/lib/sedes';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
  sede: Sede;
}

/* ── Section type for parsed content ── */
type Section =
  | { kind: 'header'; text: string }
  | { kind: 'step'; text: string; num: string }
  | { kind: 'code'; text: string }
  | { kind: 'tip'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'blank' };

function parseContent (raw: string): Section[] {
  const lines = raw.split('\n');
  const sections: Section[] = [];
  let inBanner = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip banner (==== lines and lines inside it)
    if (trimmed.startsWith('===')) {
      inBanner = !inBanner;
      continue;
    }
    if (inBanner) continue;
    if (/^ {2}CMDB SENA/.test(trimmed)) continue;
    if (/^ {2}Sede:/.test(trimmed)) continue;

    // Section header: --- TITLE ---
    if (/^---/.test(trimmed)) {
      const title = trimmed.replace(/^-{3,}\s*/, '').replace(/\s*-{3,}$/, '').trim();
      if (title) {
        sections.push({ kind: 'header', text: title });
      }
      continue;
    }

    // Blank line
    if (trimmed.length === 0) {
      sections.push({ kind: 'blank' });
      continue;
    }

    // Troubleshooting tip:   Something -> do this
    if (trimmed.includes('->')) {
      sections.push({ kind: 'tip', text: trimmed });
      continue;
    }

    // Numbered step:   1. something  or  4. something
    if (/^\d+\.\s/.test(trimmed)) {
      const [, num, ...rest] = trimmed.match(/^(\d+)\.\s+(.*)/)!;
      sections.push({ kind: 'step', text: rest.join(' '), num });
      continue;
    }

    // Code-like line (contains typical shell commands)
    if (/^ {6}(bash |cd |chmod |sudo |\.\/)/.test(line) || /^\s{2,}(bash |cd |chmod )/.test(trimmed)) {
      sections.push({ kind: 'code', text: trimmed });
      continue;
    }

    // Regular text
    sections.push({ kind: 'text', text: trimmed });
  }

  return sections;
}

export function HelpModal ({ open, onClose, sede }: HelpModalProps) {
  const [mounted, setMounted] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  // Mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset + fetch when opening
  useEffect(() => {
    if (!open) {
      setAnimIn(false);
      return;
    }

    setLoading(true);
    setError(false);
    setContent(null);

    fetch(`/api/guia-contenido?sede=${sede}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
        // Trigger entrance animation on next frame
        requestAnimationFrame(() => setAnimIn(true));
      })
      .catch(() => {
        setError(true);
        setLoading(false);
        requestAnimationFrame(() => setAnimIn(true));
      });
  }, [open, sede]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const parsed = content ? parseContent(content) : [];

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999]'
      style={{
        opacity: animIn ? 1 : 0,
        transition: 'opacity 0.35s ease-out',
      }}
    >
      {/* Blur backdrop — same as AuthGate: 8px blur + subtle tint */}
      <div
        className='absolute inset-0'
        style={{
          backgroundColor: 'rgba(0,0,0,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Content container — above the backdrop so glass transparency shows real page content */}
      <div
        className='relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6'
        onClick={handleBackdrop}
      >
        {/* ── Card wrapper — same pattern as PasswordCard ── */}
        <div
          className='w-full max-w-xl'
          style={{
            animation: animIn ? 'gate-card-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both' : 'none',
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
            {/* Grain texture — identical to PasswordCard */}
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

            {/* Top edge glow — identical to PasswordCard */}
            <div
              className='absolute top-0 left-[15%] right-[15%] h-[1px] pointer-events-none rounded-full'
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              }}
            />

            {/* ── Scrollable content area ── */}
            <div className='relative z-10 max-h-[75vh] overflow-y-auto pr-2'>
              {/* ── Header row ── */}
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
                      Mac / Linux — {sede}
                    </p>
                  </div>
                </div>

                {/* Close button */}
                <button
                  type='button'
                  onClick={onClose}
                  className='flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200'
                  style={{
                    background: 'var(--bg-hover)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-active)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                  aria-label='Cerrar'
                >
                  <X className='h-[16px] w-[16px]' strokeWidth={2} />
                </button>
              </div>

              {/* ── Content ── */}
              <div className='space-y-2'>
                {loading && (
                  <div className='flex items-center justify-center py-12'>
                    <div
                      className='h-6 w-6 rounded-full animate-spin'
                      style={{
                        border: '2px solid var(--border-default)',
                        borderTopColor: 'var(--accent)',
                      }}
                    />
                  </div>
                )}

                {error && (
                  <p className='text-sm text-center py-8' style={{ color: 'var(--text-secondary)' }}>
                    No se pudo cargar la guía para esta sede.
                  </p>
                )}

                {!loading && !error && parsed.map((section, i) => {
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
