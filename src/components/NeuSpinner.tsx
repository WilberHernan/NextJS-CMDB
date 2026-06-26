'use client';

import { cn } from '@/lib/utils';

const SIZES = {
  sm: { box: 'w-8 h-8', ring: 'inset-[3px]', dot: 'w-[3px] h-[3px]' },
  md: { box: 'w-10 h-10', ring: 'inset-[4px]', dot: 'w-[4px] h-[4px]' },
  lg: { box: 'w-14 h-14', ring: 'inset-[5px]', dot: 'w-[5px] h-[5px]' },
} as const;

interface NeuSpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
}

/** Neumorphic orbit spinner — sized so the accent dot never clips its box */
export function NeuSpinner ({ size = 'sm', className }: NeuSpinnerProps) {
  const s = SIZES[size];

  return (
    <span
      className={cn('relative inline-flex shrink-0', s.box, className)}
      aria-hidden
    >
      <span
        className={cn(
          'absolute rounded-full shadow-neu-flat bg-surface-elevated border border-border-default',
          s.ring
        )}
      />
      <span className='absolute inset-0 animate-[neu-spin_1s_linear_infinite]'>
        <span
          className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-accent',
            s.dot
          )}
        />
      </span>
    </span>
  );
}
