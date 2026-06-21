'use client';

export default function Error ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className='min-h-screen bg-surface-base flex items-center justify-center p-8'>
      <div className='max-w-md w-full text-center space-y-6'>
        <div className='w-16 h-16 mx-auto rounded-full bg-danger-soft flex items-center justify-center'>
          <span className='text-2xl text-danger'>!</span>
        </div>
        <h1 className='text-2xl font-display font-semibold text-foreground'>
          Algo salió mal
        </h1>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          Ocurrió un error inesperado. No te preocupes, tus datos están seguros.
          {error.digest && (
            <span className='block mt-2 text-xs text-muted-foreground/60'>
              Código: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          className='inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors'
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
