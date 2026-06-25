import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-xl border border-border-default bg-surface-input px-4 py-3 text-sm text-foreground',
          'placeholder:text-muted-foreground-60',
          'shadow-neu-pressed',
          'hover:border-border-hover',
          'focus:border-accent focus:shadow-[var(--focus-ring)] focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          'font-sans',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
