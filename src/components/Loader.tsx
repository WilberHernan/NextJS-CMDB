'use client';

import { cn } from '@/lib/utils';
import { NeuSpinner } from '@/components/NeuSpinner';

interface LoaderProps {
  message?: string;
  className?: string;
}

export function Loader ({
  message = 'Buscando en la base de datos...',
  className,
}: LoaderProps) {
  return (
    <div
      role='status'
      aria-live='polite'
      aria-busy='true'
      className={cn(
        'flex items-center justify-center gap-3 py-2 text-sm text-muted-foreground font-medium animate-fade-in-up',
        className
      )}
    >
      <NeuSpinner size='sm' />
      <span>{message}</span>
    </div>
  );
}
