'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors and shows a fallback instead of a white screen.
 * Logs the error to console for debugging.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor (props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError (error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch (error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render (): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className='flex min-h-screen items-center justify-center bg-surface-base p-8'>
          <div className='max-w-md text-center'>
            <div
              className='mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl'
              style={{
                background: 'var(--danger-soft)',
                boxShadow:
                  'inset 2px 2px 4px var(--neu-shadow-dark), inset -2px -2px 4px var(--neu-shadow-light)',
              }}
            >
              <svg
                width='28'
                height='28'
                viewBox='0 0 24 24'
                fill='none'
                stroke='var(--danger)'
                strokeWidth='1.75'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
            </div>
            <h1
              className='text-xl font-bold mb-2'
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Algo salió mal
            </h1>
            <p className='text-sm text-muted-foreground mb-6 text-balance'>
              Ocurrió un error inesperado. Recargá la página para intentar de
              nuevo.
            </p>
            <button
              type='button'
              onClick={() => window.location.reload()}
              className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold'
              style={{
                background: 'var(--accent-muted)',
                color: 'var(--accent)',
                border: '1px solid var(--border-accent)',
                boxShadow:
                  '2px 2px 6px var(--neu-shadow-dark), -2px -2px 6px var(--neu-shadow-light)',
              }}
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
